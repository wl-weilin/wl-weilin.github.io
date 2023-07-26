---
layout: post

# 标题配置
title: git remote 命令

# 时间配置
date: 2022-01-28

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


# git remote—远程仓库操作

[git remote 命令——菜鸟教程](https://www.runoob.com/git/git-remote.html) 

常见例子及以下使用origin这个名字来标识远程仓库。

 

## git remote 查看远程仓库名

说明：查看本地仓库关联的远程仓库

 

## git remote -v 查看远程仓库url

说明：显示远程仓库的url地址

 

## git remote add 关联远程仓库

命令：git remote add [remote-name] [url]

说明：添加一个远程仓库（将本地仓库关联到远程仓库），可以指定一个简单的远程仓库名字（本地使用），以便将来引用。

注：必须现在GitHub或其它代码托管平台上创建项目，然后才能关联。

<br/>

如：

git remote add origin https://github.com/weilin6688/HelloWorld.git

![image-20230727010239654](/wl-docs/Git/git-remote-1.png)

也可以通过SSH方式：

git remote add origin git@github.com:weilin6688/HelloWorld.git

## git remote show 显示远程仓库信息

命令：git remote show \[url \| name]

说明：显示某个远程仓库的信息，不用事先添加。可以使用url或仓库名。

<br/>

如：

![image-20230727010320146](/wl-docs/Git/git-remote-2.png)

## git remote rename 修改远程仓库引用名

命令：git remote rename <old_name> <new_name>

说明：修改远程仓库在本地的引用名

<br/>

如：git remote rename origin Hello，将仓库名从origin改为Hello。

![image-20230727010338589](/wl-docs/Git/git-remote-3.png)

## git remote rm 删除远程仓库

命令：git remote rm [remote-name]

说明：删除本地关联的远程仓库

<br/>

![image-20230727010410442](/wl-docs/Git/git-remote-4.png)

<br/>

注：无法通过url方式删除关联

![image-20230727010430272](/wl-docs/Git/git-remote-5.png)

## git remote set-url 更新远程仓库的url

命令：git remote set-url <remote-name> <newurl>

说明：更新远程仓库的 url
