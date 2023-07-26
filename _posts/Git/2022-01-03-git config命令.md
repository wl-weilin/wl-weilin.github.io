---
layout: post

# 标题配置
title: git config 命令

# 时间配置
date: 2022-01-03

# 大类配置
categories: Git

# 小类配置
tag: Git

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# git config—配置

## git config -l 查看配置

说明：同--list，查看当前配置。

 

## git config 局部配置

说明：同--local，局部配置。局部是只对当前仓库起效的，它的配置信息会在当前仓库根目录/.git/config文件下。

```txt
# 配置仅对当前仓库有效的邮箱和用户名
git config user.email "Your Email"
git config user.name "Your Name"
```

## git config --global 全局配置

说明：全局配置。对所有用户都有效，该配置会写在 ~/.gitconfig 文件中

```txt
# 配置全局有效的邮箱和用户名
git config --global user.name "Your Name"
```

## 设置默认分支名

说明：安装Git后master作为默认的分支名，该默认名可以更改，如可以改为main。

命令：git config --global init.defaultBranch \<name>
