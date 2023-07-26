---
layout: post

# 标题配置
title: git branch 命令

# 时间配置
date: 2022-01-08

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


## git branch 查看本地分支

说明：列出本地已经存在的分支，并且在当前分支的前面用"*"标记

![image-20230727003608582](/wl-docs/Git/git-branch-1.png)

## git branch -a/-r 查看分支

说明：查看分支

注：在Ubuntu中，红色表示远程分支。

<br/>

(1)   git branch -a

说明：显示本地和远程仓库的所有分支。

绿色的表示本地分支，红色的表示远程分支，其中红色的分支中有一个有个箭头指向某个分支，当前本地分支就是从那个有箭头的分支下git pull下来的。

![image-20230727003659754](/wl-docs/Git/git-branch-2.png)

<br/>

(2)   git branch -r

说明：同--remotes，查看远程仓库的所有分支

## git branch newBranch 新建分支

命令：git branch newBranch baseBranch

说明：创建一个分支名为newBranch的分支，该分支基于baseBranch，但当前分支不会自动切换到新创建的分支。如果省略baseBranch，则默认为HEAD。

![image-20230727003734542](/wl-docs/Git/git-branch-3.png)

## git branch -b newBranch 新建分支并切换

命令：git branch -b newBranch

说明：创建一个分支名为newBranch的分支，并自动切换到新创建的分支。

## git branch -v 查看最后一次提交

说明：同--verbose，查看各个分支的最后一次的提交信息，列出分支名，Hash值，以及提交注释。

![image-20230727003757586](/wl-docs/Git/git-branch-4.png)

## git branch -m 修改分支名

命令：git branch -m <old_name> <new_name>

说明：修改本地分支名称

 

## git branch -d 删除分支

命令：git branch -d <branchName>

说明：这是一个安全的操作，因为当分支中含有未合并的变更时，Git会阻止这一次删除操作。

 

## git branch -D 强制删除分支

命令：git branch -D <branchName>

说明：强制删除指定分支，即便其中含有未合并的变更。该命令常见于当开发者希望永久删除某一开发过程中的所有commit。
