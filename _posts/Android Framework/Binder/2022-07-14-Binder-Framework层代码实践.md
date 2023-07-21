---
layout: post

# 标题配置
title:  Binder-Framework层代码实践

# 时间配置
date:   2022-07-14

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


# Binder实践-Framework层

Base on: Android 11

 

参考：

《Android系统源代码情景分析》——5.10 Binder进程间通信机制的Java接口

[Binder系列8—如何使用Binder](http://gityuan.com/2015/11/22/binder-use/) 

[Android : 跟我学Binder --- (6) JAVA实现](https://www.cnblogs.com/blogs-of-lxl/p/10522785.html)

## 源码文件

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践4.png" alt="代码实践4.png" style="zoom:80%" />
</div>

common文件夹源码：

IMyService.aidl：定义接口，生成IMyService.java；

IMyService.java：继承自IInterface的接口类，定义DESCRIPTOR属性；

MyService.java：（class MyService extends Binder implements IMyService）接收远程消息，实现onTransact()方法，实现服务方法。

<br/>

服务端的源码文件如下：

MyServer.java：启动服务端程序，包括注册、启动等代码；

Android.mk：源码build文件

<br/>

客户端的源码文件：

MyClient.java: 启动客户端程序，包括获取、调用服务等；

Android.mk：源码build文件

## IMyService.aidl

```java
interface IMyService {
void sayHello();
}
```

定义接口，通过aidl命令生成IMyService.java文件。

```sh
source build/envsetup.sh		# 导入make命令
make aidl						# 安装aidl
# 将aidl文件转换为java文件，需要指明aidl命令所在路径
out/host/linux-x86/bin/aidl ./path/IMyService.aidl
```

在生成的IMyService.java文件中第一行加上package com.android.myserver。

## IMyService.java

具体代码较多：略

 

IMyService.java文件里有3个类：

(1)   IMyService接口

定义：public interface IMyService extends android.os.IInterface

- IMyService类似与native模型中的“服务接口”；
- IMyService.stub则类似于BnInterface，实现了onTransact()，继承它的类实现了具体的服务方法；
- IMyService.Stub.Proxy类似于BpInterface，实现了具体的本地代理方法。

<br/>

(2)   抽象类IMyService.stub

定义：public static abstract class Stub extends android.os.Binder implements IMyService

<br/>

IMyService.Stub是在Java接口IMyService内部定义的。我们要实现的具体服务FregService就是以IFregService.Stub为父类的。

静态成员函数aslnterface通常用来将一个Java服务代理对象（即BinderProxy对象）封装成一个IFregService.Stub.Proxy对象,Proxy是一个实现了IFregService接口的Java服务代理对象。

```java
public interface IMyService extends android.os.IInterface {
	.......
	public static IMyService asInterface(android.os.IBinder obj) {
		if ((obj==null)) {
			return null;
		}
		android.os.IInterface iin = obj.queryLocalInterface(DESCRIPTOR);
		if (((iin!=null)&&(iin instanceof IMyService))) {
			return ((IMyService)iin);
		}
		return new IMyService.Stub.Proxy(obj);
	}
}
```

成员函数onTransact是用来接收和分发进程间通信请求的，并调用代理类中的服务函数。

<br/>

(3)   代理类IMyService.Stub.Proxy

定义：private static class Proxy implements IMyService

类IMyService.Stub.Proxy是在Java抽象类IMyService.Stub内部定义的。IMyService.Stub.Proxy类用来描述一个Java服务代理对象，Proxy类实现了IMyService接口的实现代理的成员函数。

成员变量mRemote指向的是一个Java服务代理对象，即一个BinderProxy对象，用来向一个实现TIFregService接口的Java服务发送进程间通信请求。

## MyService.java

```java
package com.android.myserver;

public class MyService extends IMyService.Stub {
	// 服务端实现具体的服务函数
	@Override
	public void sayHello() {
		System.out.println("MyService: Hello,I'm Server");
	}
};
```

MyService.java继承IMyService.Stub类，实现了具体的服务方法。

## MyServer.java

```java
package com.android.myserver;

import android.os.ServiceManager;
import android.os.Looper;

public class MyServer {
	public static void main(String[] args) {
		System.out.println("MyService Start.");
		//准备Looper循环执行
		Looper.prepareMainLooper();
		//设置为前台优先级
		android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_FOREGROUND);
		//注册服务
		ServiceManager.addService("server.myservice", new MyService());
		Looper.loop();
	}
}
```

注册服务，并在线程中进行循环（随时相应客户端的请求）。

## MyClient.java

```java
package com.android.myserver;

import android.os.ServiceManager;
import android.os.IBinder;
import android.os.RemoteException;

public class MyClient {
	public static void main(String[] args) throws RemoteException {
		System.out.println("Client start.");
		// 通过服务名获取服务
		IBinder binder = ServiceManager.getService("server.myservice");
		//获取代理对象
		IMyService myService = IMyService.Stub.asInterface(binder);
		//通过代理对象调用接口的方法
		myService.sayHello();

		System.out.println("Client end.");
	}
}
```

获取服务并调用服务方法。

## Android.mk

在server文件夹下新建Android.mk：

```makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE_TAGS :=optional
LOCAL_SRC_FILES := ../common/IMyService.java \
../common/MyService.java \
MyServer.java
LOCAL_MODULE := MyServer
include $(BUILD_JAVA_LIBRARY)
```

<br/>

在client文件夹下新建Android.mk：

```makefile
LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)
LOCAL_MODULE_TAGS :=optional
LOCAL_SRC_FILES := ../common/IMyService.java \
../common/MyService.java \
MyClient.java
LOCAL_MODULE := MyClient
include $(BUILD_JAVA_LIBRARY)
```

## 生成可执行文件

在/Android源码/external/目录下新建一个binder-framework目录，将以上源码文件放在该目录下。

 

在源码根目录下，执行以下命令：

```shell
source build/envsetup.sh		# 初始化sh文件
lunch 机型名-userdebug		# 使用具体机型名

mmm ./external/binder-framework		# 生成可执行文件
```

最后会在/out/target/product/$(device_name)/system/framework/目录中生成两个jar文件MyServer.jar和MyClient.jar。

## 执行

(1)   手机连接到电脑

```sh
adb root		# 获取管理员权限
adb remount	# 改为可写入模式

# 将可执行文件push到手机
adb push MyServer.jar /system/framework
adb push MyClient.jar /system/framework
```

<br/>

(2)   在一个终端先打开服务端：

```sh
adb shell		# 进入shell

# 设置CLASSPATH，其实就是jar所在路径，否则将无法执行
export CLASSPATH=/system/framework/MyServer.jar

# 运行MyServer服务端，注册并等待调用
app_process /system/framework com.android.myserver.MyServer
```

打开服务端后，终端显示“MyService Start”，等待客户端调用。

注：app_process命令中，/system/framework是要执行的jar包所在目录，com.android.myserver.MyServer是main方法所在类名。

<br/>

(3)   在另一个终端再打开客户端

```sh
adb shell		# 进入shell

# 设置CLASSPATH，其实就是jar所在路径，否则将无法执行
export CLASSPATH=/system/framework/MyClient.jar

# 运行MyServer服务端，注册并等待调用
app_process /system/framework com.android.myserver.MyClient
```

客户端调用服务后，服务端收到调用消息，会在服务端窗口打印字符串，则表示Binder调用成功。

<br/>

(4)   结果展示

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践5.png" alt="代码实践5.png" style="zoom:80%" />
</div>

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/Binder/代码实践6.png" alt="代码实践6.png" style="zoom:80%" />
</div>

# AS中直接使用Binder

[Android Binder的极简使用——简书](https://www.jianshu.com/p/2d6ddd6a3399) 

老版本的Android可以直接使用Binder，而不是通过aidl文件，但现在不行了，用户无法直接调用相关系统服务。

但还是了解一下这种方式，以便更直观地理解Binder调用过程。

## 服务端

写一个MyBinder的类被调用：

```java
public class MyBinder extends Binder {
    String TAG = "MyBinder";
    private Context context = null;

    public MyBinder(Context context) {
        this.context = context;
    }

    @Override
    protected boolean onTransact(int code, Parcel data, Parcel reply, int flags) throws RemoteException {
        switch (code) {
            case 0:
                Log.d(TAG, "onTransact case 0");
                reply.writeString("服务端收到！");
                return true;
            case 1:
                return true;
        }
        return super.onTransact(code, data, reply, flags);
    }
}
```

<br/>

注册该服务：

```java
IBinder iBinder = new MyBinder(this) ;
findViewById(R.id.register).setOnClickListener(v -> {
    try {
        // 通过反射调用ServiceManager，将自定义Service注册到系统中
        Class<?>  serviceManager = Class.forName("android.os.ServiceManager");
        Method method=serviceManager.getMethod("addService", String.class, IBinder.class);
        // 注册名为MyBinder
        method.invoke(null, "MyBinder", iBinder);
        Log.d(TAG, "add MyBinder to SystemService");
    } catch (Exception e) {
        Log.i(TAG, "Add MyBinder Failed");
        e.printStackTrace();
    }

});
```

## 客户端

获取MyBinder引用：

```java
IBinder iBinder = null;
try {
    //通过反射调用ServiceManager，因为无法直接调用
    Class<?> serviceManager = Class.forName("android.os.ServiceManager");
    Method method = serviceManager.getMethod("getService", String.class);
    iBinder = (IBinder) method.invoke(null, "MyBinder");
    Log.i(TAG, "get MyBinder success, iBinder=" + iBinder);
} catch (Exception e) {
    Log.i(TAG, "get MyBinder failed");
}
```

<br/>

发送并获取返回数据：

```java
// 定义要发送的数据
Parcel data = Parcel.obtain();
data.writeString("Hello,Service!");
// 接收Service的返回数据
Parcel reply = Parcel.obtain();

try {
    // status为true表示通信成功
    boolean status = iBinder.transact(0, data, reply, 0);
    String result = reply.readString();
} catch (Exception e) {
    e.printStackTrace();
}
```

## 相关问题

但目前通过以上方法会调用失败，设备为Android 13，失败日志如下：

```txt
System.err  W  Caused by: java.lang.SecurityException: App UIDs cannot add services
System.err  W  	at android.os.Parcel.createExceptionOrNull(Parcel.java:3011)
System.err  W  	at android.os.Parcel.createException(Parcel.java:2995)
System.err  W  	at android.os.Parcel.readException(Parcel.java:2978)
System.err  W  	at android.os.Parcel.readException(Parcel.java:2920)
System.err  W  	at android.os.IServiceManager$Stub$Proxy.addService(IServiceManager.java:446)
System.err  W  	at android.os.ServiceManagerProxy.addService(ServiceManagerNative.java:72)
System.err  W  	at android.os.ServiceManager.addService(ServiceManager.java:213)
System.err  W  	at android.os.ServiceManager.addService(ServiceManager.java:180)
System.err  W  	... 16 more
```

<br/>

关键信息"App UIDs cannot add services"，最后通过方法将APP的Uid修改为系统进程的1000后继续测试，但也失败了，日志如下：

```txt
System.err  W  Caused by: java.lang.SecurityException: SELinux denial
System.err  W  	at android.os.Parcel.createExceptionOrNull(Parcel.java:3011)
System.err  W  	at android.os.Parcel.createException(Parcel.java:2995)
System.err  W  	at android.os.Parcel.readException(Parcel.java:2978)
System.err  W  	at android.os.Parcel.readException(Parcel.java:2920)
System.err  W  	at android.os.IServiceManager$Stub$Proxy.addService(IServiceManager.java:446)
System.err  W  	at android.os.ServiceManagerProxy.addService(ServiceManagerNative.java:72)
System.err  W  	at android.os.ServiceManager.addService(ServiceManager.java:213)
System.err  W  	at android.os.ServiceManager.addService(ServiceManager.java:180)
```

<br/>

打印"App UIDs cannot add services"和"SELinux denial"的代码位于ServiceManager.cpp。

```c++
Status ServiceManager::addService(const std::string& name, const sp<IBinder>& binder, bool allowIsolated, int32_t dumpPriority) {
    auto ctx = mAccess->getCallingContext();

    if (multiuser_get_app_id(ctx.uid) >= AID_APP) {
        return Status::fromExceptionCode(Status::EX_SECURITY, "App UIDs cannot add services");
    }

    if (!mAccess->canAdd(ctx, name)) {
        return Status::fromExceptionCode(Status::EX_SECURITY, "SELinux denial");
    }

    if (binder == nullptr) {
        return Status::fromExceptionCode(Status::EX_ILLEGAL_ARGUMENT, "Null binder");
    }

    if (!isValidServiceName(name)) {
        LOG(ERROR) << "Invalid service name: " << name;
        return Status::fromExceptionCode(Status::EX_ILLEGAL_ARGUMENT, "Invalid service name");
    }
    //...
}
```

所以当前是不支持这种方法的。
