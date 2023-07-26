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
| [Android系统架构](https://www.weilin.space/2021/07/Android系统架构/) | 从内核驱动到应用级APP |
| [AOSP-下载并编译源码](https://www.weilin.space/2021/07/AOSP-下载并编译源码/) | 如何从Google中下载源码并编译，最后从模拟器启动 |
| [Android编译命令与原理](https://www.weilin.space/2021/07/Android编译命令与原理/) | 常用的编译源码的命令及相关模块 |
| [Android系统分区](https://www.weilin.space/2021/07/Android系统分区/) | 传统分区结构、A/B分区结构以及SSI分区结构 |

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
| [消息机制主要类](https://www.weilin.space/2021/11/消息机制主要类/) | Hanler、Looper、Message类及其使用方式 |

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
| 四大组件拉起进程过程 | 待更新 |

<br/>

(6) 稳定性系列
| 稳定性                                                       | 简述 |
| ------------------------------------------------------------ | ---- |
| [ANR机制概述](https://www.weilin.space/2023/01/ANR机制概述/) |      |
| [Input ANR原理](https://www.weilin.space/2023/01/Input-ANR原理/) |      |
| [Service ANR原理](https://www.weilin.space/2023/01/Service-ANR原理/) |      |
| [Provider 超时](https://www.weilin.space/2023/01/Provider超时/) |      |
| [Android内存泄漏原因&检测工具](https://www.weilin.space/2023/01/Android内存泄漏原因&检测工具/) |      |
| [Android常见内存泄漏总结](https://www.weilin.space/2023/01/Android常见内存泄漏总结/) |      |
| [Watchdog原理](https://www.weilin.space/2023/01/Watchdog原理/) |      |




(7) Framework其它模块

| Input模块                                                    | 简述 |
| ------------------------------------------------------------ | ---- |
| [Input概述](https://www.weilin.space/2023/02/Input概述/)     |      |
| [APP事件分发流程](https://www.weilin.space/2023/02/APP事件分发流程/) |      |

| WindowManager模块                                            | 简述   |
| ------------------------------------------------------------ | ------ |
| [Window概述](https://www.weilin.space/2023/02/Window概述/)   |        |
| [Window-创建到显示过程](https://www.weilin.space/2023/02/Window-创建到显示过程/) |        |
| Window-移除过程                                              | 待更新 |

| PackageManager模块                                           | 简述   |
| ------------------------------------------------------------ | ------ |
| [PackageManagerService 概述](https://www.weilin.space/2023/02/PackageManagerService概述/) |        |
| [PackageManagerService 安装APK过程](https://www.weilin.space/2023/02/PKMS安装APK过程/) |        |
| PackageManagerService 解析Intent                             | 待更新 |

# 设计模式

(1) 创建型模式

| 创建型模式                                | 说明                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| 工厂方法模式<br/>Factory Method Pattern   | 定义一个创建产品对象的工厂接口，将实际创建工作推迟到子类中。 |
| 抽象工厂模式<br/>Abstract Factory Pattern | 提供一个创建一系列相关或者相互依赖的接口，而无需指定它们具体的类。 |
| 建造者模式<br/>Builder Pattern            | 将一个复杂的构建与其表示相分离，使得同样的构建过程可以创建不同的表示。 |
| 原型模式<br/>Prototype Pattern            | 用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象。 |
| 单例模式<br/>Singleton Pattern            | 保证一个类仅有一个实例，并提供一个访问它的全局访问点。       |

 

<br/>

(2) 结构型模式

| 模式                             | 说明                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| 适配器模式<br/>Adapter Pattern   | 将一个类的接口转换成客户希望的另外一个接口。使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。 |
| 桥接模式<br/>Bridge Pattern      | 将抽象部分与实际部分分离，使它们都可以独立的变化。           |
| 组合模式<br/>Composite Pattern   | 将对象组合成树形结构以表示“部分--整体”的层次结构。使得用户对单个对象和组合对象的使用具有一致性。 |
| 装饰者模式<br/>Decorator Pattern | 动态的给一个对象添加一些额外的职责。就增加功能来说，此模式比生成子类更为灵活。 |
| 外观模式<br/>Facade Pattern      | 为子系统中的一组接口提供一个一致的界面，此模式定义了一个高层接口，这个接口使得这一子系统更加容易使用。 |
| 享元模式<br/>Flyweight Pattern   | 以共享的方式高效的支持大量的细粒度的对象。                   |
| 代理模式<br/>Proxy Pattern       | 为其他对象提供一种代理以控制对这个对象的访问。               |

<br/>

(2) 行为型模式

| 模式                                           | 说明                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| 策略模式<br/>Strategy  Pattern                 | 定义了一系列算法，并将每个算法封装起来，使它们可以相互替换，且算法的改变不会影响算法的客户。 |
| 模版模式<br/>Template  Pattern                 | 定义一个操作中的算法骨架，而将算法的一些步骤延迟到子类中，使得子类可以不改变该算法结构的情况下重定义该算法的某些特点步骤。 |
| 观察者模式<br/>Observer  Pattern               | 多个对象间存在一对多的关系，当一个对象发生改变时，把这种改变通知给其他多个对象，从而影响其它对象的行为。 |
| 状态模式<br/>State Pattern                     | 允许一个对象在其内部状态发生改变时改变其行为能力。           |
| 备忘录模式<br/>Memento Pattern                 | 在不破坏封装性的前提下，获取并保存一个对象的内部状态，以便以后回复它。 |
| 访问者模式<br/>Visitor Pattern                 | 在不改变集合元素的前提下，为一个集合中的每个元素提供多种访问方式，即每个元素有多个访问者对象。 |
| 职责链模式<br/>Chain of Responsibility Pattern | 在该模式里，很多对象由每一个对象对其下家的引用而连接起来形成一条链。请求在这个链上传递，直到链上的某一个对象决定处理此请求，这使得系统可以在不影响客户端的情况下动态地重新组织链和分配责任。 |
| 命令模式<br/>Command Pattern                   | 将一个请求封装为一个对象，从而使你可用不同的请求对客户端进行参数化；对请求排队或记录请求日志，以及支持可撤销的操作。 |
| 解释器模式<br/>Interpreter Pattern             | 描述了如何为简单的语言定义一个语法，如何在该语言中表示一个句子，以及如何解释这些句子。 |
| 迭代器模式<br/>Iterator  Pattern               | 提供了一种方法顺序来访问一个聚合对象中的各个元素，而又不需要暴露该对象的内部表示。 |
| 中介者模式<br/>Mediator Pattern                | 定义一个中介对象来封装系列对象之间的交互。终结者使各个对象不需要显示的相互调用 ，从而使其耦合性松散，而且可以独立的改变他们之间的交互。 |
| 备忘录模式<br/>Memento Pattern                 | 在不破坏封装的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。 |



# Git使用

| Git                                                          | 简述 |
| ------------------------------------------------------------ | ---- |
| [Git相关文件说明](https://www.weilin.space/2022/01/Git相关文件说明/) |      |
| [git config 命令](https://www.weilin.space/2022/01/git-config命令/) |      |
| [git add 命令](https://www.weilin.space/2022/01/git-add-命令/) |      |
| [git branch 命令](https://www.weilin.space/2022/01/git-branch-命令/) |      |
| [git checkout 命令](https://www.weilin.space/2022/01/git-checkout-命令/) |      |
| [git commit 命令](https://www.weilin.space/2022/01/git-commit-命令/) |      |
| [git fetch 命令](https://www.weilin.space/2022/01/git-fetch-命令/) |      |
| [git merge 命令](https://www.weilin.space/2022/01/git-merge-命令/) |      |
| [git pull 命令](https://www.weilin.space/2022/01/git-pull-命令/) |      |
| [git push 命令](https://www.weilin.space/2022/01/git-push-命令/) |      |
| [git rebase 命令](https://www.weilin.space/2022/01/git-rebase-命令/) |      |
| [git remote 命令](https://www.weilin.space/2022/01/git-remote-命令/) |      |
| [git reset 命令](https://www.weilin.space/2022/02/git-reset-命令/) |      |