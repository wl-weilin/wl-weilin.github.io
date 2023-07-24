---
layout: post

# 标题配置
title: Service ANR原理

# 时间配置
date: 2023-01-10

# 大类配置
categories: Android-Framework

# 小类配置
tag: Android-稳定性

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# **Service Timeout**

## 发送延时消息

以通过startService(intent)的方式Create Service为例，执行栈如下：

```txt
ActivityManagerService.startService() ->
ActiveServices.startServiceLocked() ->
ActiveServices.startServiceLocked() ->
ActiveServices.startServiceInnerLocked() ->
ActiveServices.startServiceInnerLocked() ->
ActiveServices.bringUpServiceLocked() ->
// 判断进程是否启动 ->
ActiveServices.realStartServiceLocked()
```

<br/>

代码执行到ActiveServices.realStartServiceLocked()，关键步骤如下：

```java
private final void realStartServiceLocked(ServiceRecord r,
        ProcessRecord app, boolean execInFg) throws RemoteException {
    if (app.thread == null) {
        throw new RemoteException();
    }
    //发送delay消息
    bumpServiceExecutingLocked(r, execInFg, "create");
    //......

    boolean created = false;
    try {
        //最终会执行到APP端的onCreate()
        app.thread.scheduleCreateService(r, r.serviceInfo,
                mAm.compatibilityInfoForPackage(r.serviceInfo.applicationInfo),
                app.getReportedProcState());
        r.postNotification();
        created = true;
    } catch (DeadObjectException e) {
    //......
    } finally {
    //......
    }
//......
}
```

<br/>

bumpServiceExecutingLocked()发送延迟消息：

```java
private final void bumpServiceExecutingLocked(ServiceRecord r, boolean fg, String why) {
    //......
    if (r.executeNesting == 0) {
        //......
        if (r.app != null) {
            r.app.executingServices.add(r);
            r.app.execServicesFg |= fg;
            if (timeoutNeeded && r.app.executingServices.size() == 1) {
                scheduleServiceTimeoutLocked(r.app);
            }
        }
    } else if (r.app != null && fg && !r.app.execServicesFg) {
        r.app.execServicesFg = true;
        if (timeoutNeeded) {
            scheduleServiceTimeoutLocked(r.app);
        }
    }
    //......
}
```

<br/>

在scheduleServiceTimeoutLocked()中具体执行mAm.mHandler.sendMessageDelayed()。

```java
void scheduleServiceTimeoutLocked(ProcessRecord proc) {
    if (proc.executingServices.size() == 0 || proc.thread == null) {
        return;
    }
//从消息池中获取消息
    Message msg = mAm.mHandler.obtainMessage(
            ActivityManagerService.SERVICE_TIMEOUT_MSG);
    msg.obj = proc;
//向mAm.mHandler发送消息
    mAm.mHandler.sendMessageDelayed(msg,
            proc.execServicesFg ? SERVICE_TIMEOUT : SERVICE_BACKGROUND_TIMEOUT);
}
```

<br/>

其中execServicesFg表示该Service是否为前台或后台服务，然后设定不同的超时时间。

```java
// do we need to be executing services in the foreground?
boolean execServicesFg;
// How long we wait for a service to finish executing.
static final int SERVICE_TIMEOUT = 20*1000;
// How long we wait for a service to finish executing.
static final int SERVICE_BACKGROUND_TIMEOUT = SERVICE_TIMEOUT * 10;
```

## 移除延时消息

如果在ActivityThread.handleCreateService()代码中onCreate()正常执行后，则不会发生ANR，于是移除延时消息，执行serviceDoneExecuting()移除。

```java

private void handleCreateService(CreateServiceData data) {
    // ......
    try {
        // .....
        service.onCreate();
        mServices.put(data.token, service);
        try {
            //onCreate()正常执行完成之后，移除延时消息
            ActivityManager.getService().serviceDoneExecuting(
                    data.token, SERVICE_DONE_EXECUTING_ANON, 0, 0);
        } catch (RemoteException e) {
            throw e.rethrowFromSystemServer();
        }
    } catch (Exception e) {
        // ......
        }
    }
}
```

<br/>

serviceDoneExecuting()中实际在serviceDoneExecutingLocked()中移除消息。

```java
public void serviceDoneExecuting(IBinder token, int type, int startId, int res) {
    synchronized(this) {
        if (!(token instanceof ServiceRecord)) {
            Slog.e(TAG, "serviceDoneExecuting: Invalid service token=" + token);
            throw new IllegalArgumentException("Invalid service token");
        }
        mServices.serviceDoneExecutingLocked((ServiceRecord)token, type, startId, res);
    }
}
```

<br/>

通过removeMessages()移除之前发送的what=SERVICE_TIMEOUT_MSG，object=ProcessRecord app的消息。

```java
private void serviceDoneExecutingLocked(ServiceRecord r, boolean inDestroying,
        boolean finishing) {
        // ......
    if (r.executeNesting <= 0) {
        if (r.app != null) {
            if (DEBUG_SERVICE) Slog.v(TAG_SERVICE,
                    "Nesting at 0 of " + r.shortInstanceName);
            r.app.execServicesFg = false;
            r.app.executingServices.remove(r);
            if (r.app.executingServices.size() == 0) {
                // ......
                mAm.mHandler.removeMessages(ActivityManagerService.SERVICE_TIMEOUT_MSG, r.app);
            } else if (r.executeFg) {
            // ......
            }
        // ......
        }
        // ......
    }
}
```

## 执行ANR流程

如果定时消息未按时移除，说明service发生了ANR，则ActivityManagerService所在线程的Handler开始执行该SERVICE_TIMEOUT_MSG消息。

```java
public void handleMessage(Message msg) {
    switch (msg.what) {
    // ......
    case SERVICE_TIMEOUT_MSG: {
        mServices.serviceTimeout((ProcessRecord)msg.obj);
    } break;
    // ......
}

void serviceTimeout(ProcessRecord proc) {
    String anrMessage = null;  //发生service timeout的原因
    synchronized(mAm) {
        if (proc.isDebugging()) {
            // The app's being debugged, ignore timeout.
            return;
        }
        if (proc.executingServices.size() == 0 || proc.thread == null) {
            return;
        }
        final long now = SystemClock.uptimeMillis();
        //表示service当前若是正常的，其开始执行onCreate()的最大时刻
        final long maxTime =  now -
                (proc.execServicesFg ? SERVICE_TIMEOUT : SERVICE_BACKGROUND_TIMEOUT);
        ServiceRecord timeout = null;  //保存超时的ServiceRecord
        long nextTime = 0;
        //遍历当前进程中正在运行的service
        for (int i=proc.executingServices.size()-1; i>=0; i--) {
            ServiceRecord sr = proc.executingServices.valueAt(i);
            if (sr.executingStart < maxTime) {  //若当前service超时
                timeout = sr;
                break;
            }
            if (sr.executingStart > nextTime) {
                nextTime = sr.executingStart;
            }
        }
        //若当前存在service timeout，并且所在进程在运行中
        if (timeout != null && mAm.mProcessList.mLruProcesses.contains(proc)) {
            //打印ANR相关信息
            Slog.w(TAG, "Timeout executing service: " + timeout);
            StringWriter sw = new StringWriter();
            PrintWriter pw = new FastPrintWriter(sw, false, 1024);
            pw.println(timeout);
            timeout.dump(pw, "    ");
            pw.close();
            mLastAnrDump = sw.toString();
            mAm.mHandler.removeCallbacks(mLastAnrDumpClearer);
            mAm.mHandler.postDelayed(mLastAnrDumpClearer, LAST_ANR_LIFETIME_DURATION_MSECS);
            anrMessage = "executing service " + timeout.shortInstanceName;
        } else {
            Message msg = mAm.mHandler.obtainMessage(
                    ActivityManagerService.SERVICE_TIMEOUT_MSG);
            msg.obj = proc;
            mAm.mHandler.sendMessageAtTime(msg, proc.execServicesFg
                    ? (nextTime+SERVICE_TIMEOUT) : (nextTime + SERVICE_BACKGROUND_TIMEOUT));
        }
    }

    if (anrMessage != null) {
        mAm.mAnrHelper.appNotResponding(proc, anrMessage);
    }
}
```

## 总结

- 发送SERVICE_TIMEOUT_MSG关键代码：ActiveServices.realStartServiceLocked() -> AS.bumpServiceExecutingLocked() -> AS.scheduleServiceTimeoutLocked() -> mAm.mHandler.sendMessageDelayed()；
- 移除SERVICE_TIMEOUT_MSG条件：在执行完onCreate后才会移除延时消息；
- service超时打印出的日志通常为：executing service <PackageName>/<Service ClassName>。

# 调用startForeground()超时

Base on: Android 12



## 说明

通过startForegroundService(serviceIntent)开启前台Service，如果不在10s内调用startForeground(int id, notification)以显示前台，也会发生ANR。



## 发送延时消息

通过startForegroundService(intent)的方式Create Service为例，执行栈如下：

```java
ActivityManagerService.startService() ->
ActiveServices.startServiceLocked() ->
ActiveServices.startServiceLocked() ->
ActiveServices.startServiceInnerLocked() ->
ActiveServices.startServiceInnerLocked() ->
ActiveServices.bringUpServiceLocked() ->
// 判断进程是否启动 ->
ActiveServices.realStartServiceLocked()
ActiveServices.sendServiceArgsLocked()
```

<br/>

在AS.sendServiceArgsLocked()中调用scheduleServiceForegroundTransitionTimeoutLocked(r)。

```java
bumpServiceExecutingLocked(r, execInFg, "start", null /* oomAdjReason */);
if (r.fgRequired && !r.fgWaiting) {
    if (!r.isForeground) {
        if (DEBUG_BACKGROUND_CHECK) {
            Slog.i(TAG, "Launched service must call startForeground() within timeout: " + r);
        }
        scheduleServiceForegroundTransitionTimeoutLocked(r);
    } else {
        if (DEBUG_BACKGROUND_CHECK) {
            Slog.i(TAG, "Service already foreground; no new timeout: " + r);
        }
        r.fgRequired = false;
    }
}
```

<br/>

scheduleServiceForegroundTransitionTimeoutLocked(r)代码如下：

```java
void scheduleServiceForegroundTransitionTimeoutLocked(ServiceRecord r) {
    if (r.app.mServices.numberOfExecutingServices() == 0 || r.app.getThread() == null) {
        return;
    }
    Message msg = mAm.mHandler.obtainMessage(
            ActivityManagerService.SERVICE_FOREGROUND_TIMEOUT_MSG);
    msg.obj = r;
    r.fgWaiting = true;
    mAm.mHandler.sendMessageDelayed(msg, SERVICE_START_FOREGROUND_TIMEOUT);
    // MIUI ADD:
    SystemPressureControllerStub.getInstance().componentStart(
            SystemPressureControllerStub.COMPONENT_START_TYPE_SERVICE, r.app, true);
}
```

延迟时间为10s，即10s后如果不调用startForeground()，则会发生异常。

## 移除延时消息

在自定义MyService的onStartCommand()中还需要执行startForeground(int id, notification)，其流程如下：

```txt
startForeground(int id, notification) ->
Service.startForeground(int id, notification) ->
// Binder过程
AMS.setServiceForeground() ->
AS.setServiceForegroundLocked() ->
AS.setServiceForegroundInnerLocked()
```

<br/>

setServiceForegroundInnerLocked()中移除延时消息：

```java
if (r.fgRequired) {
    if (DEBUG_SERVICE || DEBUG_BACKGROUND_CHECK) {
        Slog.i(TAG, "Service called startForeground() as required: " + r);
    }
    r.fgRequired = false;
    r.fgWaiting = false;
    alreadyStartedOp = stopProcStatsOp = true;
    mAm.mHandler.removeMessages(
            ActivityManagerService.SERVICE_FOREGROUND_TIMEOUT_MSG, r);

    // MIUI ADD:
    SystemPressureControllerStub.getInstance().componentStart(
            SystemPressureControllerStub.COMPONENT_START_TYPE_SERVICE, r.app, false);
}
```

## 执行ANR流程

如果客户端调用startForegroundService()开启Service，但服务端不在自定义的Service中的onCreate()或onStartCommand()中调用startForeground(id,notification)，则在一段时间后会执行ANR流程。

注：按标准是在onStartCommand()中调用的。

<br/>

执行SERVICE_FOREGROUND_TIMEOUT_MSG消息的Handler位于AMS中：

```java
case SERVICE_FOREGROUND_TIMEOUT_MSG: {
    mServices.serviceForegroundTimeout((ServiceRecord) msg.obj);
} break;
```

<br/>

AS.serviceForegroundTimeout()代码如下：

```java
void serviceForegroundTimeout(ServiceRecord r) {
    ProcessRecord app;
    synchronized (mAm) {
        if (!r.fgRequired || r.destroying) {
            // MIUI ADD:
            SystemPressureControllerStub.getInstance().componentStart(
                    SystemPressureControllerStub.COMPONENT_START_TYPE_SERVICE, r.app, false);
            return;
        }

        app = r.app;
        if (app != null && app.isDebugging()) {
            // MIUI ADD:
            SystemPressureControllerStub.getInstance().componentStart(
                    SystemPressureControllerStub.COMPONENT_START_TYPE_SERVICE, app, false);
            // The app's being debugged; let it ride
            return;
        }

        if (DEBUG_BACKGROUND_CHECK) {
            Slog.i(TAG, "Service foreground-required timeout for " + r);
        }
        r.fgWaiting = false;
        stopServiceLocked(r, false);
    }

    if (app != null) {
        // MIUI ADD:
        SystemPressureControllerStub.getInstance().componentStart(
                SystemPressureControllerStub.COMPONENT_START_TYPE_SERVICE, app, false);
        mAm.mAnrHelper.appNotResponding(app,
                "Context.startForegroundService() did not then call Service.startForeground(): "
                    + r);
    }
}
```

<br/>

之后的调用流程如下：

```txt
AMS.mAnrHelper.appNotResponding() ->
AnrHelper.appNotResponding() ->
AnrHelper.startAnrConsumerIfNeeded(){new AnrConsumerThread().start()} ->
AnrHelper.AnrConsumerThread.run() ->
AnrHelper.AnrRecord.appNotResponding() ->
ProcessErrorStateRecord.appNotResponding()
```

由于APP被singal 9强制杀死，所以不会打印am_anr日志，ANR流程至此结束。

```java
} else if (mApp.isKilled()) {
    Slog.i(TAG, "Skipping died app ANR: " + this + " " + annotation);
    return;
}
```

# Service的ANR案例

## **startForeground()使用不当**

以下原因都会造成抛出ForegroundServiceDidNotStartInTimeException异常。

<br/>

(1)   未调用startForeground()

在客户端调用startForegroundService()打开前台服务，但是未在服务端的service.onStartCommand()中调用startForeground(id,notification)，服务端在10s后会抛出异常并退出。

抛出的错误为：

```txt
AndroidRuntime: android.app.ForegroundServiceDidNotStartInTimeException: Context.startForegroundService() did not then call Service.startForeground()。
```

<br/>

(2)   onCreate()中调用startForeground()

startForeground()一般需要在onStartCommand()方法里调用，而不是在Service的onCreate()中。如果在onCreate()中调用startForeground()，通常情况下并不会发生异常，但由于onCreate()只是在创建Service时调用一次，所以startForeground()也只会被调用一次，所以在某些情况下会发生错误。

执行以下步骤可以复现异常：

- 客户端A调用startForegroundService(intent)；
- 服务端在onCreate()中调用startForeground()后，又调用了stopForeground(false|true)；
- 客户端B再次调用startForegroundService(intent)，由于服务端Service已存在，所以不会调用startForeground()；
- 最后服务端发生ForegroundServiceDidNotStartInTimeException异常而退出。

<br/>

(3)   调用startForeground()前耗时

在onStartCommand()方法中按规范写了startForeground()，但是在执行startForeground()前有耗时代码。

<br/>

(4)   执行onStartCommand()延时

startForeground()写在其中，最终也会导致startForeground()执行与延时，发生ForegroundServiceDidNotStartInTimeException错误。

<br/>

(5)   进程创建过程延时

通过Service拉起进程，在执行进程创建过程中，主线程执行消息h=android.app.ActivityThread$H w=110延时，实际执行的是ActivityThread.handleBindApplication()，此时还没执行到创建Service那一步，但会导致后续代码执行延时。

## 等锁耗时

需要找到具体的等锁代码处才能发现根本原因，日志关键字"dvm_lock_sample"。

## Binder线程池耗尽

APP或system server的binder线程都处于忙碌状态，没有空余资源进行通信，等待了较长时间。

## 其它原因

三方设备厂商的自定义策略导致的，如进程冻结或权限等方面。
