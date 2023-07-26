---
layout: post

# 标题配置
title: PackageManagerService 概述

# 时间配置
date: 2023-02-15

# 大类配置
categories: Android-Framework

# 小类配置
tag: Framework-other

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# 概述

## PKMS作用

PackageManagerService (简称为PMS，但为了与PowerManagerService区分，也可以简称为PKMS)是 Android 系统中的一个关键服务，在Android 系统中负责应用程序包管理和维护的核心服务。它确保应用程序的正确安装、更新、启动和管理，并对应用程序的权限和组件进行控制和调度。

<br/>

(1)   应用程序的安装和卸载

PackageManagerService 负责处理应用程序的安装和卸载操作。当用户通过应用商店或其他途径安装或卸载应用程序时，PackageManagerService 负责验证、解析和安装新的应用程序或删除已安装的应用程序。

<br/>

(2)   应用程序信息的维护

PackageManagerService 维护应用程序的信息，包括应用程序的名称、图标、版本、权限、组件信息（Activity、Service、BroadcastReceiver）等。这些信息用于应用程序的展示、启动和权限管理。

<br/>

(3)   应用程序权限管理

PackageManagerService 管理应用程序的权限，根据应用程序声明的权限和设备的权限策略，决定是否授予应用程序相应的权限。

<br/>

(4)   应用程序签名验证

PackageManagerService 在应用程序安装时验证应用程序的数字签名，以确保应用程序的完整性和安全性。

<br/>

(5)   应用程序组件启动和调度

PackageManagerService 负责启动和调度应用程序的组件，如 Activity、Service、BroadcastReceiver。它根据应用程序的清单文件和启动方式，进行组件的启动和管理。

<br/>

(6)   应用程序数据清理

PackageManagerService 提供应用程序的数据清理功能，允许用户清除应用程序的缓存、数据和设置。

<br/>

(7)   应用程序更新管理

PackageManagerService 管理应用程序的更新，当有新的应用程序版本可用时，它负责下载、安装和替换旧版本的应用程序。

<br/>

(8)   应用程序组件的隐藏和禁用

PackageManagerService 允许隐藏或禁用应用程序的组件，使其在系统中不可见或不可用。

## PKMS的关键过程

[Android apk安装过程分析——简书](https://www.jianshu.com/p/e02b1f95ea58)

<br/>

(1)   开机扫描过程

开机后，加载/data/system/packages.xml文件,然后扫描特定安装目录:/system/app、/system/priv-app、/system/vendor/app、/data/app。解析里面的apk文件,将静态信息保存到PackageManagerService的相关数据结构中。

<br/>

(2)   安装APK

将一个新的APK安装到Android系统中。

<br/>

(3)   解析Intent

调用方发起一个intent，如startActivity(intent)，PKMS需要解析该Intent，通过Intent获取到目的Activity、ContentProvider、BroadCastReceiver 或Service。

# PKMS启动过程

Base on: Android 13

Branch: android-13.0.0_r30

## 启动过程概述

PackageManagerService在系统启动时就会自动启动并一直运行在后台，负责管理应用程序的安装、卸载、更新等操作，以及提供应用程序信息的查询功能。其启动过程如下：

<br/>

(1)   SystemServer进程开始启动PKMS

系统启动时，Zygote进程会启动SystemServer进程，SystemServer进程会负责启动各个系统服务。

在SystemServer进程中，PackageManagerService是第一个被启动的系统服务之一，其启动的代码位于com.android.server.pm.PackageManagerService.main()方法中。

PackageManagerService的启动过程大致分为两个阶段：初始化阶段和数据加载阶段。

<br/>

(2)   PKMS的初始化阶段

在初始化阶段，PackageManagerService会创建必要的内部数据结构、初始化各个管理器对象（例如PackageSettings、UserManager等）、注册各种系统广播接收器等。

<br/>

(3)   PKMS的数据加载阶段

在数据加载阶段，PackageManagerService会遍历所有已知的应用程序安装路径，扫描并加载所有已安装的应用程序包（APK）信息，包括包名、版本、权限等信息。此外，PackageManagerService还会加载应用程序的组件信息，例如Activity、Service、BroadcastReceiver等。

<br/>

(4)   启动完成

在数据加载阶段完成后，PackageManagerService会将所有已安装应用程序包和组件信息保存到内部的数据结构中，并且监听安装、卸载等相关事件，以便在应用程序发生变化时及时更新其内部数据结构。

<br/>

(5)   提供服务

PackageManagerService启动完成后，其他系统服务和应用程序就可以通过它提供的API进行应用程序管理和查询操作了。

## SystemServer.startBootstrapServices()

system_server进程中创建PackageManagerService。

```java
IPackageManager iPackageManager;
t.traceBegin("StartPackageManagerService");
try {
    Watchdog.getInstance().pauseWatchingCurrentThread("packagemanagermain");
    Pair<PackageManagerService, IPackageManager> pmsPair = PackageManagerService.main(
            mSystemContext, installer, domainVerificationService,
            mFactoryTestMode != FactoryTest.FACTORY_TEST_OFF, mOnlyCore);
    mPackageManagerService = pmsPair.first;
    iPackageManager = pmsPair.second;
} finally {
    Watchdog.getInstance().resumeWatchingCurrentThread("packagemanagermain");
}
```

## PackageManagerService.main()

Android T的PackageManagerService.main()有点长，但关键代码就以下这些。主要是创建PKMS对象并注册framework和native的ServiceManager中。

```java
PackageManagerService m = new PackageManagerService(injector, onlyCore, factoryTest,
        PackagePartitions.FINGERPRINT, Build.IS_ENG, Build.IS_USERDEBUG,
        Build.VERSION.SDK_INT, Build.VERSION.INCREMENTAL);

m.installAllowlistedSystemPackages();
IPackageManagerImpl iPackageManager = m.new IPackageManagerImpl();
ServiceManager.addService("package", iPackageManager);
final PackageManagerNative pmn = new PackageManagerNative(m);
ServiceManager.addService("package_native", pmn);
LocalManagerRegistry.addManager(PackageManagerLocal.class, m.new PackageManagerLocalImpl());
return Pair.create(m, iPackageManager);
```

# 开机扫描过程

## 待补充
