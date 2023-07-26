---
layout: post

# 标题配置
title: git rebase 命令

# 时间配置
date: 2022-01-22

# 大类配置
categories: Git

# 小类配置
tag: Git

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..
---

* content
{:toc}


# git rebase—合并分支&变基

git rebase主要有两个功能：

- 变基：也可称作分支合并
- 合并多个commit：将多个commit合并为一个commit

 

## git rebase \<base> \<feature> 变基

参考：[合理使用git rebase命令修整commit历史——知乎](https://zhuanlan.zhihu.com/p/584512501) 

命令：git rebase \<baseBranch> \<featureBranch>

说明：把分支featureBranch（做功能开发的分支）的提交重新变基到baseBranch（通常是maser分支）上。featureBranch如果省略则 表示当前分支。

<br/>

当执行rebase操作时，git会从两个分支的共同祖先开始提取待变基分支featureBranch上的修改，然后将待变基分支指向基分支baseBranch的最新提交，最后将刚才featureBranch提取的修改应用到基分支baseBranch的最新提交的后面。

<br/>

如下，在主分支master基础上：

```txt
     E---F---G branch_1
    /
A---B---C---D   maser(remote)
       \
        H---I---J  branch_2
```

甲同学基于commit B拉取分支branch_1并开发新功能；

乙同学基于commit C拉取分支branch_2并开发新功能；

主分支的最近提交已经到了D。

这个时候我们希望甲同学和乙同学的分支最终和master主分支合并后，提交记录看起像是这个样子：

```txt
A---B---C---D---E'---F'---G'---H'---I'---J'  maser(remote)
```

那么应该怎么操作？

甲同学应该执行：

```txt
$ git checkout branch_1
$ git rebase master
           E'---F'---G' branch_1
          /
A---B---C---D   maser(local)
然后git push到远程分支，master变为：
A---B---C---D---E'---F'---G'   maser(remote)
```

之后乙同学应该执行：

```txt
$ git checkout branch_2
$ git rebase master
A---B---C---D--- E'---F'---G'   maser(local)
                     \
                      H'---I'---J'  branch_2
然后git push到远程分支，master变为：
A---B---C---D---E'---F'---G'---H'---I'---J'---K'   maser(remote)
```

或者分别执行：

```txt
甲：git rebase master branch_1 && git push origin
乙：git rebase master branch_2 && git push origin
```

## git rebase -i 合并commit

命令：git rebase -i [startPonit] [endPoint]

说明：[startpoint] [endpoint]指定了一个前开后闭区间（即不包含startPonit的commit），如果不指定[endpoint]，则该区间的终点默认是当前分支HEAD所指向的commit(注：该区间指定的是一个的区间)。

<br/>

参数：

-i, --interactive  表示使用“交互式”的方法修改。

<br/>

示例：将branch_1分支的多个commit合并

```txt
     E---F---G---H---I---J branch_1
    /
A---B---C---D   maser(local)
```

场景：如上在branch_1中，提交了大量commit，如果直接rebase或merge到master的话，可能很多commit都会与最新master D提交有冲突。为了方便，我只想解一次冲突，所以就需要在合入到master分支前将branch_1中的多个commit合并。

<br/>

合并branch_1的E~J的commit，以下两个命令均可：

```txt
git rebase -i commit_E commit_J
git rebase -i HEAD~5
```

注：需要用到交互模式，使用方式见后续详述。

```txt
     K'  branch_1
    /
A---B---C---D   master(local)
(K'为合并后的commit)

然后再git rebase master，就只用解决一次冲突了，最后变成：
           K'  branch_1
          /
A---B---C---D   master(local)
```

注：HEAD仍处于branch_1分支的最后一次提交，不会切到master分支，master分支不变。

<br/>

最后执行git push origin master，同步到远端mater(remote)分支。

## git rebase -i HEAD~x 合并commit

说明：合并最近x次的提交，x是一个数字1、2、3…

```txt
# 合并最近5次的commit
git rebase -i HEAD~5
```

注：HEAD~0表示当前commit，HEAD~1表示上一个commit。

## git rebase --continue 

说明：解决冲突后执行该命令。

在rebase的过程中，有时也会有conflict，这时Git会停止rebase并让用户去解决冲突，解决完冲突后，用git add命令去更新这些内容，然后不用执行git commit，直接执行git rebase --continue，这样git就会继续执行rebase。



## git rebase --skip

说明：则会将引起冲突的commits丢弃掉（慎用！！）



## git rebase --abort

说明：放弃合并，回到rebase操作之前的状态

## -i交互模式使用方式

| 参数 | 缩写 | 作用 |
| ---- | ---- | ---- |
| pick   | p    | 保留该commit |
| reword | r    | 保留该commit，但需要修改该commit的注释 |
| edit   | e    | 保留该commit, 但我要停下来修改该提交(不仅仅修改注释) |
| squash | s    | 将该commit合并到前一个commit |
| fixup  | f    | 将该commit合并到前一个commit，但不要保留该提交的注释信息 |
| exec   | x    | 执行shell命令 |
| drop   | d    | 丢弃该commit |

## git rebase注意事项

通常执行rebase的分支都应该在自己的本地分支，千万不要在与其他人共享的远程分支上使用rebase。因为远程分支不只有你在进行开发，如果git rebase可能会导致提交记录的丢失。

```txt
git rebase前的远程仓库分支情况：
     E  branch_1
    /
A---B---C---D   master

git rebase后变为：
           E'  branch_1
          /
A---B---C---D   master

但是如果有同事也在branch_1上进行开发，则他的分支依然是：
     E  branch_1
    /
A---B---C---D   master
```

那么当他 push到远程master的时候，就会有丢失提交记录。这就是为什么我们经常听到有人说 git rebase 是一个危险命令，因为它改变了历史，我们应该谨慎使用。

 

所以本地分支合并时推荐使用git rebase，其它远程的共享分支合并时推荐使用git merge。git merge和git rebase的显著区别是，git merge不会修改git的提交记录，而git rebase会。

## rebase与merge区别

主要是应用场景不同，最后作用的分支也不同。

git merge通常是将开发分支的修改应用到主分支；

git rebase则是将主分支的修改应用到开发分支。

 

(1)   git merge

=这种合并是将两个分支的历史合并到一起，通常是将开发分支（即被合并分支）合并到主分支中，开发分支（如下branch_1）不会被更改，它会比对双方不同的文件缓存下来，生成一个commit。

优点：安全，开发分支不会被修改；

缺点：生成一个merge的commit，会污染提交历史，在回看项目时会增加理解项目历史的难度；

用途：一般用于公共的master主分支；

<br/>

如将branch_1合并到master中：

```txt
     E---F---G  branch_1
    /
A---B---C---D   master(local)

git checkout mater
git merge branch_1

会生成一个新的commit H：
     E---F---G  branch_1
    /       \
A---B---C---D----H   master(local)
```

<br/>

(2)   git rebase

通常是将主分支的改变应用到开发分支，对开发分支来说，会修改提交历史。

优点：项目历史会非常整洁；

缺点：安全性和可跟踪下较差，你将无法知晓你这次合并做了哪些修改，绝不要在公共分支上使用；

用途：自己本身独立使用的分支

<br/>

如将branch_1变基后再合并到master中：

```txt
     E---F---G  branch_1
    /
A---B---C---D   master(local)

git rebase master branch_1
之前的E---F---G提交不存在
           E'---F'---G'  branch_1
          /
A---B---C---D          master(local)

push到远程分支后master为：
           E'---F'---G'  branch_1
          /
A---B---C---D---E'---F'---G'   master(remote)
```

