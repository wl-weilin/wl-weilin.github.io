---
layout: post
# 标题配置
title:  FileProvider-概述

# 时间配置
date:   2022-10-20

# 大类配置
categories: Android-Framework

# 小类配置
tag: Framework-AMS

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# 概述

## FileProvider简介

FileProvider是基于ContentProvider实现的，其作用是访问Provider分享的文件，同ContentProvider一样，FileProvider的基本流程也是：

Resolver端 -> system_server -> Provider端

<br/>

除了一些调用方法不一样外，由于对外分享文件是高度敏感的权限，所以在权限管控方面也有很大区别。FileProvider默认禁止外部访问（android:exported="false"），如果要访问，必须要得到Provider端的授权。

```java
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.demoapp.contentproviderdemo.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_path" />
</provider>
```

## **FileProvider类**

FileProvider实际上是ContentProvider的一个子类。

```java
public class FileProvider extends ContentProvider {...}
```



## Android 7.0后的改变

Android 7.0(API 24)之后，安全级别升级了。为了保护源文件，禁止在应用外部公开file://URI。如果一项包含文件URI的intent离开您的应用，则应用出现故障，并出现FileUriExposedException异常。要在应用间共享文件，应发送一项content://URI，并授予URI临时访问权限。使用第三方应用打开文件的时候会通过FileProvider ，生成 content URI允许使用临时访问权限来授予读取和写入访问权限，进行此授权的最简单方式是使用FileProvider类。

<br/>

FileProvider属于Android 7.0新增的一个类，该类位于v4包下，详情可见android.support.v4.content.FileProvider。

# 相关类

 

## ParcelFileDescriptor

​    ParcelFileDescriptor主要用于在Android应用程序中实现进程间通信（IPC），它提供了一种传递文件描述符（File Descriptor）的方法，以便在不同进程之间共享文件或进行通信。在Android应用程序中，如果要将文件或数据传递给另一个进程，则通常需要使用IPC机制，而ParcelFileDescriptor是其中一个重要的工具。

<br/>

具体来说，ParcelFileDescriptor可以用于以下场景：

- 在不同的进程之间传递文件描述符，以便在另一个进程中读取或写入文件。
- 在不同的进程之间传递管道（pipe）或套接字（socket），以便进行进程间通信。
- 将一个文件描述符复制到另一个文件描述符，以便在同一进程中共享文件或通信。

<br/>

​    ParcelFileDescriptor可以与其他IPC机制（如Intent或AIDL）一起使用，以便在不同进程之间传递文件描述符和数据。如果您需要在Android应用程序中实现进程间通信或数据共享，则ParcelFileDescriptor是一个非常有用的类。

 

 

## AssetFileDescriptor

```java
public final @Nullable AssetFileDescriptor openAssetFileDescriptor(@NonNull Uri uri,
        @NonNull String mode, @Nullable CancellationSignal cancellationSignal)
                throws FileNotFoundException {...}
```

AssetFileDescriptor是Android SDK中的一个类，用于访问应用程序的assets文件夹中的文件。它提供了一种获取文件描述符（FileDescriptor）的方法，以便在不同的组件（如MediaPlayer或ContentProvider）中使用。

<br/>

AssetFileDescriptor的作用如下：

- 读取assets文件夹中的文件：可以使用AssetManager打开assets文件夹中的文件，并使用AssetFileDescriptor获取文件描述符以读取文件内容。

- 提供对文件描述符的访问：可以使用AssetFileDescriptor获取文件描述符，并将其传递给其他组件，如MediaPlayer或ContentProvider，以便它们可以访问assets文件夹中的文件。
- 控制文件的访问：使用AssetFileDescriptor可以控制文件的访问方式，例如只允许读取文件或允许读写文件。这可以防止意外修改或删除assets文件夹中的文件。

<br/>

​    AssetFileDescriptor实际上是对ParcelFileDescriptor作了一些封装，在ParcelFileDescriptor基础上添加了一些常用方法。
