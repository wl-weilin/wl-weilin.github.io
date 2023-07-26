---
layout: post

# 标题配置
title: git checkout 命令

# 时间配置
date: 2022-01-10

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


# git checkout—检出到工作目录

说明：从本地仓库中检出分支到工作目录。

 

 

## git checkout localBranch 检出分支

命令：git checkout localBranch

说明：将本地分支localBranch检出，前提是被检出的分支localBranch已存在。

 

 

## git checkout -b 新建分支并检出

命令：git checkout -b newBranch existingBranch

说明：新建本地分支newBranch并检出，该分支来自existingBranch。

 

## git checkout otherBranch file 检出文件

命令：git checkout otherBranch fileName

说明：将其它分支的文件检出到当前分支的暂存区（已默认执行git add）。

 

## git checkout --patch 交互界面合并

命令：git checkout --patch otherBranch fileName

说明：比较两个分支间的差异内容，并提供交互式的界面来选择进一步的操作，会询问是否将此模块的代码加入到当前分支的暂存区。

```txt
# 选择处理方式：将此块应用于索引和工作树（输入 `y` ，按回车）
(1/3) Apply this hunk to index and worktree [y,n,q,a,d,j,J,g,/,s,e,?]?
```

<br/>

各个字符代表命令如下：

```txt
y - 存储这个模块
n - 不存储这个模块
q - 离开，不存储这个模块和其他模块
a - 存储这个模块和这个文件后面的模块
d - 不存储这个模块和这个文件后面的模块
g - 选择一个模块
/ - 通过正则查找模块
j - 不确定是否存储这个模块，看下一个不确定的模块
J - 不确定是否存储这个模块，看下一个模块
k - 不确定是否存储这个模块，看上一个不确定的模块
K -不确定是否存储这个模块，看上一个模块
s - 把当前的模块分成更小的模块s
e - 手动编辑当前的模块
? - 输出帮助信息
```

