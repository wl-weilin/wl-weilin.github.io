---
layout: post

# 标题配置
title: git commit 命令

# 时间配置
date: 2022-01-12

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


# git commit—提交到本地仓库

功能：将暂存区（执行add后）文件提交到本地仓库，提交必须要有注释。

 

## git commit -m "msg" 添加注释

说明：msg是当前提交的注释

![image-20230727004103419](/wl-docs/Git/git-commit-1.png)

<br/>

其它：

git commit [file1] [file2] ... -m [message]      # 提交指定文件

 

## git commit -a 直接提交

说明：不需要执行add指令，直接提交

 

## git commit -s 添加签名

说明：在窗口中输入提交信息

 

## git commit --amend 追加提交

说明：将此次修改追加到上一次提交。若上一次的提交有错误，则可以将此次的提交覆盖上一次的提交。
