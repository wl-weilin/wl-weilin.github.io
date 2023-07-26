---
layout: post
# 标题配置
title: 导航页
# 时间配置
date: 2018-01-01 12:00:00 +0800
---

* content
{:toc}
# 完善中...

# Android Framework

Android 是由 Google 开发的一种移动操作系统，广泛应用于智能手机、平板电脑、智能电视、智能手表、VR 设备等移动设备和嵌入式系统中。它是基于 Linux 内核的开源操作系统，允许开发者自由定制和开发应用程序。

并且Android 版本每年不断更新和升级，截止2023年，已推出 Android 13 正式版，每个版本都引入了新的功能和改进。同时，Android 生态系统非常庞大，吸引了大量开发者和厂商参与，使得 Android 成为全球智能手机市场的主导操作系统。由于其开放性和多样性，Android 为开发者和用户提供了丰富的选择和自由度，成为全球最受欢迎的移动操作系统之一。

<br/>

本人由于从事 Android Framework 方面的开发，对 Framework 相关的知识及组件比较了解，所以本博客涉及的Android内容主要讲解 Framework 方面的知识多一些（特别是AMS对四大组件的管理），同时也会涉及一些 APP 开发、Native 层、 Linux 内核及系统编译方面的内容。接下来是按不同模块对相关知识点的梳理，之后会不间断更新。

<br/>

(1) Android架构及编译：

| 文章 | 简述 |
| --- | --- |
| WebKit | 一套网页浏览器的软件引擎 |

<br/>

(2) Binder通信

| 文章 | 简述 |
| ------------------------------------------------------------ | ---- |
| [Binder-原理介绍](https://www.weilin.space/2022/07/Binder-原理介绍/) | Binder通信的大致过程 |
| [Binder-深入源码](https://www.weilin.space/2022/07/Binder-深入源码/) | 通过代码理解Binder的实现，了解其Native和Framework架构 |
| [Binder-Native层代码实践](https://www.weilin.space/2022/07/Binder-Native层代码实践/) | 基于Native层来开发一个Binder进程间通信的应用实例 |
| [Binder-Framework层代码实践](https://www.weilin.space/2022/07/Binder-Framework层代码实践/) | 基于Framework层提供的接口实现一个Binder进程间通信的应用实例 |
| [Binder-异常处理机制](https://www.weilin.space/2022/07/Binder-异常处理机制/) | 了解跨进程的异常传输原理 |

<br/>

(3) Android的消息机制

| 文章 | 简述 |
| --- | --- |
| [消息机制原理](http://127.0.0.1:4000/2021/11/消息机制原理/) | Android消息机制的作用、成员及实现方式 |
| [消息机制主要类](http://127.0.0.1:4000/2021/11/消息机制主要类/) |  |

<br/>

(4) Android 日志架构与ADB

| 文章 | 简述 |
| --- | --- |
| [ADB安装&原理](https://www.weilin.space/2022/05/ADB安装&原理/) | 在Linux或Windows平台安装ADB，以及ADB工作原理   |
| [ADB命令执行流程](https://www.weilin.space/2022/05/ADB命令执行流程/) | 终端输入一个ADB命令，在Android设备上的执行过程 |
| [Android日志架构&解析](https://www.weilin.space/2022/05/Android日志架构&解析/) | Android的日志架构，以及如何解析日志            |
| [Logcat命令使用方法](https://www.weilin.space/2022/05/Logcat命令使用方法/) | adb logcat命令的使用方式与常用参数             |
| [trace文件分析](https://www.weilin.space/2022/05/trace文件分析/) | 分析ANR时，如何看懂输出的堆栈文件              |

<br/>

(5) Android 四大组件系列

[AMS概述](https://www.weilin.space/2022/08/AMS概述/)—ActivityManagerService的作用概述及启动流程

<br/>

| Activity 系列文章 | 简述 |
| --- | --- |
| [Activity概述](https://www.weilin.space/2022/08/Activity概述/) | Activity相关类以及与启动Activity相关的概念说明 |
| [Activity生命周期](https://www.weilin.space/2022/08/Activity生命周期/) | 常见的Activity切换场景下，输出的关键日志       |
| [Activity-onCreate()过程](https://www.weilin.space/2022/08/Activity-onCreate()过程/) | Activity创建过程的代码讲解                     |
| [Activity-onRestart()过程](https://www.weilin.space/2022/08/Activity-onRestart()过程/) | Activity执行onRestart()过程的代码讲解          |
| [Activity-onDestroy()过程](https://www.weilin.space/2022/08/Activity-onDestroy()过程/) | Activity执行onDestroy()过程的代码讲解          |

<br/>

| Broadcast 系列文章 | 简述 |
| --- | --- |
| [Broadcast-概述](https://www.weilin.space/2022/09/Broadcast-概述/) | 广播的常用概念及相关联说明 |
| [Broadcast-Receiver注册过程](https://www.weilin.space/2022/09/Broadcast-Receiver注册过程/) | 广播接收器在系统端的注册过程 |
| [Broadcast-发送与处理过程](https://www.weilin.space/2022/09/Broadcast-发送与处理过程/) | 用户发送广播后，广播接收器时如何接收到广播的 |

<br/>

| ContentProvider系列文章 | 简述 |
| --- | --- |
| [ContentProvider-概述](https://www.weilin.space/2022/10/ContentProvider-概述/) | ContentProvider的作用、架构及常用类 |
| [ContentProvider-发布过程](https://www.weilin.space/2022/10/ContentProvider-发布过程/) | ContentProvider伴随进程启动时的发布过程 |
| [ContentProvider-访问过程](https://www.weilin.space/2022/10/ContentProvider-访问过程/) | 客户端访问ContentProvider数据时的调用过程及流程图 |
| [ContentProvider-权限检查过程](https://www.weilin.space/2022/10/ContentProvider-权限检查过程/) | ContentProvider的各类权限的检测过程 |
| [ContentProvider-getType(uri)调用过程](https://www.weilin.space/2022/10/ContentProvider-getType(uri)调用过程/) | getType(uri)方法的调用过程 |
| [FileProvider-概述](https://www.weilin.space/2022/10/FileProvider-概述/) | FileProvider的简单介绍及相关类 |
| [FileProvider-访问过程](https://www.weilin.space/2022/10/FileProvider-访问过程/) | 客户端访问FileProvider的过程 |
| [FileProvider-权限检查过程](https://www.weilin.space/2022/10/FileProvider-权限检查过程/) | 不同权限的客户端访问FileProvider的过程及结果 |

<br/>

| Service系列文章 | 简述 |
| --- | --- |
| [Service-概述](https://www.weilin.space/2022/11/Service-概述/) | Service相关概念及系统类介绍                               |
| [Service-生命周期](https://www.weilin.space/2022/11/Service-生命周期/) | startService()与bindService()的常见生命周期与相关注意事项 |
| [Service-启动过程](https://www.weilin.space/2022/11/Service-启动过程/) | Service启动过程的详细代码讲解                             |

<br/>

| Android进程系列文章 | 简述 |
| --- | --- |
| [Android进程概述](https://www.weilin.space/2022/12/进程-概述/) | Android进程管理架构、状态、级别等介绍 |
| [Android进程启动过程](https://www.weilin.space/2022/12/进程启动过程/) | Android进程的启动过程，包括system端、Zygote和APP端 |
| 四大组件拉起进程过程 |  |







# 设计模式





# Git使用