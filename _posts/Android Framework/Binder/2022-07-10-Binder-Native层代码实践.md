---
layout: post

# 标题配置
title:  Binder-Native层代码实践

# 时间配置
date:   2022-07-10

# 大类配置
categories: Android-Framework

# 小类配置
tag: Binder

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# **Binder实践-Native层**

Base on: Android 11

使用基于Native框架层提供的Binder库来开发一个Binder进程间通信应用实例，它包含一个Serveri进程和一个Client进程。 

## **源码文件**

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践1.png" alt="代码实践1.png" style="zoom:80%" />
</div>

各源码文件如下：

(1)   IMyService.h：自定义的MyService服务的头文件，声明了IMyService与BnMyService类；

(2)   IMyService.cpp：自定义的IMyService.h中的服务的具体实现，还有BpMyService的实现；

(3)   ServerDemo.cpp：包含MyService的实现，并启动服务端程序，包括注册、启动等代码；

(4)   ClientDemo.cpp: 启动客户端程序，包括获取、调用服务等；

(5)   Android.mk：源码build文件

<br/>

各种类的作用：

- IMyService：继承自IInterface的抽象类，IMyService需要声明Service组件和Client组件都要实现的服务接口（纯虚函数）。
- BnMyService：继承自IMyService的抽象类（public BnInterface<IMyService>），表示服务端本地对象类。只实现了onTransact()，可以不实现本地服务函数。
- MyService：继承自BnMyService，实现服务函数。
- BpMyService：继承自IMyService的抽象类（public BpInterface<IMyService>），表示远程代理对象类，实现远程代理方法。

## IMyService.h

```c++
#include <utils/RefBase.h>
#include <binder/IInterface.h>
#include <binder/Parcel.h>

using namespace android;

//定义命令字段,Client端的代理方法通过命令字段指明要调用的函数
//Server端通过switch及命令字段调用相应函数
enum
{
    HELLO = 1,
};

//在继承IInterface的IXXXXX类中声明Service组件和Client组件都要实现的服务接口
class IMyService : public IInterface
{
public:
    DECLARE_META_INTERFACE(MyService); //使用宏，申明MyService
    virtual void sayHello() = 0;       //声明接口
};

//服务端本地对象类BnMyService，需要实现onTransact()
class BnMyService : public BnInterface<IMyService>
{
public:
    virtual status_t onTransact(uint32_t code, const Parcel &data, Parcel *reply, uint32_t flags = 0);
};
```

## **IMyService.cpp**

```c++
#include "IMyService.h"
using namespace android;

class BpMyService : public BpInterface<IMyService>
{
public:
    BpMyService(const sp<IBinder> &impl) : BpInterface<IMyService>(impl)
    {
    }
    // 实现客户端代理对象中的sayHello()
    void sayHello()
    {
        printf("远程代理BpMyService:调用sayHello()\n");
        Parcel data, reply;
        data.writeInterfaceToken(IMyService::getInterfaceDescriptor());
        //向Service组件发送进程间通信请求，Server端会将答复数据保存在reply中
        remote()->transact(HELLO, data, &reply);
        printf("来自服务端BnMyService的答复为: %d\n", reply.readInt32());
    }
};

//使用宏，完成MyService定义
IMPLEMENT_META_INTERFACE(MyService, "android.demo.IMyService");

//实现服务端的onTransact()，用于接收并处理远程消息
status_t BnMyService::onTransact(uint_t code, const Parcel &data,
                                 Parcel *reply, uint32_t flags)
{
    switch (code)
    {
    case HELLO:
    {
        CHECK_INTERFACE(IMyService, data, reply);
        printf("服务端BnMyService:: got the client hello\n");
        sayHello();
        reply->writeInt32(2021);
        return NO_ERROR;
    }
    default:
    {
        return BBinder::onTransact(code, data, reply, flags);
    }
    }
}
```

## ServerDemo.cpp

```c++
#include <binder/IServiceManager.h>
#include <binder/IPCThreadState.h>
#include "IMyService.h"

using namespace android;

class MyService : public BnMyService
{
public:
    MyService();
    ~MyService();
    // 实现服务端sayHello()，这是最后真正需要执行的服务端方法
    void sayHello()
    {
        printf("服务端BnMyService::执行sayHello()方法\n");
    }
};

int main()
{
    //获取service manager引用
    sp<IServiceManager> sm = defaultServiceManager();
    //注册名为"service.myservice"的服务到service manager
    sm->addService(String16("android.demo.IMyService"), new MyService());
    //启动线程池
    ProcessState::self()->startThreadPool();
    //把主线程加入线程池
    IPCThreadState::self()->joinThreadPool();
    return 0;
}
```

## ClientDemo.cpp

```c++
#include "IMyService.h"
int main() {
    //获取service manager引用
    sp < IServiceManager > sm = defaultServiceManager();
    //获取对应服务名的binder接口
    sp < IBinder > binder = sm->getService(String16("android.demo.IMyService"));
    //将biner对象转换为强引用类型的IMyService
    sp<IMyService> cs = interface_cast < IMyService > (binder);
    //利用binder引用调用远程sayHello()方法
    cs->sayHello();
    return 0;
}
```

ClientDemo.cpp中获取的服务名与ServerDemo.cpp中的注册服务名必须一致。但与IMyService.cpp中的IMPLEMENT_META_INTERFACE宏使用的描述符可以不一致（没试验过，尽量保持一致）。

## Android.mk

在server文件夹下新建Android.mk：

```makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE_TAGS :=optional
LOCAL_SRC_FILES :=../common/IMyService.cpp \
MyServer.cpp
LOCAL_SHARED_LIBRARIES:= libcutils libutils libbinder
LOCAL_MODULE := MyServer
include $(BUILD_EXECUTABLE)
```

<br/>

在client文件夹下新建Android.mk：

```makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE_TAGS :=optional
LOCAL_SRC_FILES :=../common/IMyService.cpp \
MyClient.cpp
LOCAL_SHARED_LIBRARIES:= libcutils libutils libbinder
LOCAL_MODULE := MyClient
include $(BUILD_EXECUTABLE)
```

必须命名为Android.mk，否则报错“missing and no known rule to make it”。

## 生成可执行文件

- 在/Android源码/external/目录下新建一个binder目录，将以上源码文件放在该目录下。
- 在源码根目录下，执行以下命令：

```sh
source build/envsetup.sh		# 初始化sh文件
lunch 机型名-userdebug			  # 使用具体机型名

mmm ./external/binder		# 生成可执行文件
```

最后会在/out/target/product/gemeric/system/bin/目录或者/out/target/product/$(device_name)/obj/EXECUTABLES/目录中生成两个可执行文件MyServer和MyClient。

## 执行

手机连接到电脑后：

```sh
adb root		# 获取管理员权限
adb remount	# 改为可写入模式

# 将可执行文件push到手机
adb push MyServer /system/bin
adb push MyClient /system/bin

在一个终端先打开服务端：
adb shell		# 进入shell
/system/bin/MyServer		# 运行MyServer服务端，注册并等待调用

在另一个终端再打开客户端：
adb shell		# 进入shell
/system/bin/MyClient		# 运行MyClient客户端，调用服务
```

客户端调用服务后，服务端收到调用消息，会在服务端窗口打印字符串，则表示Binder调用成功。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践2.png" alt="Binder代码实践2.png" style="zoom:80%" />
</div>

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践3.png" alt="Binder代码实践3.png" style="zoom:80%" />
</div>

