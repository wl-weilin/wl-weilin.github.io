---
layout: post
# 标题配置
title:  ContentProvider-getType(uri)调用过程

# 时间配置
date:   2022-10-16

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


# **getType(uri)调用过程**

Base on：Android 13

 

​    getType()会根据传进来的URI，调用到Provider端，由Provider端自定义的ContentProvider返回一个表示MimeType的字符串。

## 常见问题

​    ContentResolver.getType()中的getTypeAsync()是一个异步请求，调用后即返回，然后Resolver端线程进入wait状态。

​    从getTypeAsync()调用到AMS端之后，如果涉及到Provider端进程启动，且进程启动耗时，通常在CPH.getContentProviderImpl()处陷入wait()，于是无法调用notify()唤醒ContentResolver端，最终ContentResolver端就会发生ANR。

 

ContentResolver端堆栈状态示例：

```txt
"main" prio=5 tid=1 TimedWaiting
  | group="main" sCount=1 ucsCount=0 flags=1 obj=0x71a7f398 self=0xb400007d16242c00
  | sysTid=11509 nice=-10 cgrp=top-app sched=0/0 handle=0x7dc858e4f8
  | state=S schedstat=( 7539789172 6591919896 9380 ) utm=603 stm=150 core=6 HZ=100
  | stack=0x7fc5ab0000-0x7fc5ab2000 stackSize=8188KB
  | held mutexes=
  at java.lang.Object.wait(Native method)
  - waiting on <0x04738fd1> (a android.content.ContentResolver$StringResultListener)
  at java.lang.Object.wait(Object.java:442)
  at android.content.ContentResolver$ResultListener.waitForResult(ContentResolver.java:1005)
  - locked <0x04738fd1> (a android.content.ContentResolver$StringResultListener)
  at android.content.ContentResolver.getType(ContentResolver.java:956)
  at android.content.Intent.resolveType(Intent.java:8569)
  at android.content.Intent.resolveTypeIfNeeded(Intent.java:8594)
  at android.app.Instrumentation.execStartActivity(Instrumentation.java:1860)
  at android.app.Activity.startActivityForResult(Activity.java:5623)
  at androidx.activity.ComponentActivity.startActivityForResult(ComponentActivity.java:2)
  at android.app.Activity.startActivityForResult(Activity.java:5576)
  at androidx.activity.ComponentActivity.startActivityForResult(ComponentActivity.java:1)
  at android.app.Activity.startActivity(Activity.java:6094)
  at android.app.Activity.startActivity(Activity.java:6061)
  ...
```



AMS端等待进程启动堆栈：

```txt
"pool-2-thread-1" prio=5 tid=245 TimedWaiting
  | group="main" sCount=1 ucsCount=0 flags=1 obj=0x14bded50 self=0xb400007ba7604800
  | sysTid=4758 nice=0 cgrp=foreground sched=0/0 handle=0x7b8a5c8cb0
  | state=S schedstat=( 6722807920 17774798580 15733 ) utm=362 stm=310 core=5 HZ=100
  | stack=0x7b8a4c5000-0x7b8a4c7000 stackSize=1039KB
  | held mutexes=
  at java.lang.Object.wait(Native method)
  - waiting on <0x00f440b6> (a com.android.server.am.ContentProviderRecord)
  at java.lang.Object.wait(Object.java:442)
  at com.android.server.am.ContentProviderHelper.getContentProviderImpl(ContentProviderHelper.java:662)
  - locked <0x00f440b6> (a com.android.server.am.ContentProviderRecord)
  at com.android.server.am.ContentProviderHelper.getContentProviderExternalUnchecked(ContentProviderHelper.java:158)
  at com.android.server.am.ContentProviderHelper.doGetProviderMimeTypeAsync(ContentProviderHelper.java:1139)
  at com.android.server.am.ContentProviderHelper.lambda$getProviderMimeTypeAsync$0$com-android-server-am-ContentProviderHelper(ContentProviderHelper.java:1122)
  at com.android.server.am.ContentProviderHelper$$ExternalSyntheticLambda0.run(unavailable:8)
  at com.android.server.am.ContentProviderHelper$1WithCallingIdentityRequest.run(ContentProviderHelper.java:1115)
  at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:463)
  at java.util.concurrent.FutureTask.run(FutureTask.java:264)
  at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1137)
  at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:637)
  at java.lang.Thread.run(Thread.java:1012)
```

## getContentResolver().getType(uri)

 

用户APP端调用接口查询：

```java
Uri uri = Uri.parse(uriString);
String mime=getContentResolver().getType(uri);
```

## ContentResolver.getType(uri)

这里分为两种情况。

 

情况1：Resolver端进程已有IContentProvider连接（之前访问过），那么就直接通过provider.getTypeAsync()异步调用到Provider端，返回MIME类型后被唤醒。

 

情况2：Resolver端进程本地没有IContentProvider连接，则走到下面，通过AMS.getProviderMimeTypeAsync()异步访问，然后等待唤醒。

```java
public final @Nullable String getType(@NonNull Uri url) {
    Objects.requireNonNull(url, "url");
    //...
    IContentProvider provider = acquireExistingProvider(url);
    if (provider != null) {
        try {
            final StringResultListener resultListener = new StringResultListener();
            provider.getTypeAsync(url, new RemoteCallback(resultListener));
            resultListener.waitForResult(CONTENT_PROVIDER_TIMEOUT_MILLIS);
            if (resultListener.exception != null) {
                throw resultListener.exception;
            }
            return resultListener.result;
        } catch (RemoteException e) {
            // ...
        }
    }


    try {
        final StringResultListener resultListener = new StringResultListener();
        ActivityManager.getService().getProviderMimeTypeAsync(
                ContentProvider.getUriWithoutUserId(url),
                resolveUserId(url),
                new RemoteCallback(resultListener));
        resultListener.waitForResult(REMOTE_CONTENT_PROVIDER_TIMEOUT_MILLIS);
        if (resultListener.exception != null) {
            throw resultListener.exception;
        }
        return resultListener.result;
    } catch (RemoteException e) {
        // ...
        return null;
    }
 }
```

## AMS.getProviderMimeTypeAsync()

```java
/**
 * Allows apps to retrieve the MIME type of a URI.
 * If an app is in the same user as the ContentProvider, or if it is allowed to interact across
 * users, then it does not need permission to access the ContentProvider.
 * Either way, it needs cross-user uri grants.
 */
@Override
public void getProviderMimeTypeAsync(Uri uri, int userId, RemoteCallback resultCallback) {
    mCpHelper.getProviderMimeTypeAsync(uri, userId, resultCallback);
}
```

## CPH.getProviderMimeTypeAsync()

从这里获取到Provider引用之后，同ContentResolver.getType(uri)中的情况1一样，通过该引用异步调用provider.getTypeAsync()，将MIME结果放入到RemoteCallback对象中。

```java
void getProviderMimeTypeAsync(Uri uri, int userId, RemoteCallback resultCallback) {
    mService.enforceNotIsolatedCaller("getProviderMimeTypeAsync");
    final String name = uri.getAuthority();
    final int callingUid = Binder.getCallingUid();
    final int callingPid = Binder.getCallingPid();
    final int safeUserId = mService.mUserController.unsafeConvertIncomingUser(userId);
    final long ident = canClearIdentity(callingPid, callingUid, userId)
            ? Binder.clearCallingIdentity() : 0;
    try {
        final ContentProviderHolder holder = getContentProviderExternalUnchecked(name, null,
                callingUid, "*getmimetype*", safeUserId);
        if (holder != null) {
            holder.provider.getTypeAsync(uri, new RemoteCallback(result -> {
                final long identity = Binder.clearCallingIdentity();
                try {
                    removeContentProviderExternalUnchecked(name, null, safeUserId);
                } finally {
                    Binder.restoreCallingIdentity(identity);
                }
                resultCallback.sendResult(result);
            }));
        } else {
            resultCallback.sendResult(Bundle.EMPTY);
        }
    } catch (RemoteException e) {
        Log.w(TAG, "Content provider dead retrieving " + uri, e);
        resultCallback.sendResult(Bundle.EMPTY);
    } finally {
        Binder.restoreCallingIdentity(ident);
    }
}
```

## CPH.getContentProviderExternalUnchecked()

```java
ContentProviderHolder getContentProviderExternalUnchecked(String name,
        IBinder token, int callingUid, String callingTag, int userId) {
    return getContentProviderImpl(null, name, token, callingUid, null, callingTag,
            true, userId);
}
```

## CPH.getContentProviderImpl()

而在getContentProviderImpl()中，由于是从getContentProviderExternalUnchecked()中调用而来，所以caller == null，如果Provider端进程未启动，则会在以下处陷入wait，此处wait=20s。

```java
synchronized (cpr) {
    while (cpr.provider == null) {
        if (cpr.launchingApp == null) {
            //...
            return null;
        }
        try {
            final long wait = Math.max(0L, timeout - SystemClock.uptimeMillis());
            if (DEBUG_MU) {
                Slog.v(TAG_MU, "Waiting to start provider " + cpr
                       + " launchingApp=" + cpr.launchingApp + " for " + wait + " ms");
            }
            if (conn != null) {
                conn.waiting = true;
            }
            cpr.wait(wait);
            if (cpr.provider == null) {
                timedOut = true;
                break;
            }
        } catch (InterruptedException ex) {
        } finally {
            if (conn != null) {
                conn.waiting = false;
            }
        }
    }
}
```

堆栈如下：

```txt
"pool-2-thread-1" prio=5 tid=245 TimedWaiting
  | group="main" sCount=1 ucsCount=0 flags=1 obj=0x14bded50 self=0xb400007ba7604800
  | sysTid=4758 nice=0 cgrp=foreground sched=0/0 handle=0x7b8a5c8cb0
  | state=S schedstat=( 6722807920 17774798580 15733 ) utm=362 stm=310 core=5 HZ=100
  | stack=0x7b8a4c5000-0x7b8a4c7000 stackSize=1039KB
  | held mutexes=
  at java.lang.Object.wait(Native method)
  - waiting on <0x00f440b6> (a com.android.server.am.ContentProviderRecord)
  at java.lang.Object.wait(Object.java:442)
  at com.android.server.am.ContentProviderHelper.getContentProviderImpl(ContentProviderHelper.java:662)
  - locked <0x00f440b6> (a com.android.server.am.ContentProviderRecord)
  at com.android.server.am.ContentProviderHelper.getContentProviderExternalUnchecked(ContentProviderHelper.java:158)
  at com.android.server.am.ContentProviderHelper.doGetProviderMimeTypeAsync(ContentProviderHelper.java:1139)
  at com.android.server.am.ContentProviderHelper.lambda$getProviderMimeTypeAsync$0$com-android-server-am-ContentProviderHelper(ContentProviderHelper.java:1122)
  at com.android.server.am.ContentProviderHelper$$ExternalSyntheticLambda0.run(unavailable:8)
  at com.android.server.am.ContentProviderHelper$1WithCallingIdentityRequest.run(ContentProviderHelper.java:1115)
  at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:463)
  at java.util.concurrent.FutureTask.run(FutureTask.java:264)
  at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1137)
  at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:637)
  at java.lang.Thread.run(Thread.java:1012)
```

ResultListener.waitForResult()

在此处等待AMS端调用notify()

## 详解-IContentProvider.getTypeAsync()

有两处调用到这里：

- ContentResolver.getType(uri)

​    Resolver端进程已有IContentProvider连接（之前访问过），那么就直接通过provider.getTypeAsync()异步调用到Provider端，返回MIME类型后被唤醒。

 

注：StringResultListener父类的父类ResultListener<T>实现了RemoteCallback.OnResultListener接口。

```java
try {
    final StringResultListener resultListener = new StringResultListener();
    provider.getTypeAsync(url, new RemoteCallback(resultListener));
    resultListener.waitForResult(CONTENT_PROVIDER_TIMEOUT_MILLIS);
    if (resultListener.exception != null) {
        throw resultListener.exception;
    }
    return resultListener.result;
}
```

- CPH.getProviderMimeTypeAsync()

​    获取到Provider引用之后，同ContentResolver.getType(uri)中的情况1一样，通过该引用异步调用provider.getTypeAsync()，将MIME结果放入到RemoteCallback对象中。

```java
holder.provider.getTypeAsync(uri, new RemoteCallback(result -> {
    final long identity = Binder.clearCallingIdentity();
    try {
        removeContentProviderExternalUnchecked(name, null, safeUserId);
    } finally {
        Binder.restoreCallingIdentity(identity);
    }
    resultCallback.sendResult(result);
}));
```

### RemoteCallback说明

RemoteCallback是一个Android的回调类。

因为Resolver端调用getType()是一个异步调用，调用后即陷入wait状态，当AMS从Provider获取到结果后，需要通过RemoteCallback将Resolver端线程唤醒。

<br/>

在Resolver端调用getType()过程中，在获取到Provider的Binder引用后，都会将MIME结果放到RemoteCallback对象中（参数OnResultListener对象），然后唤醒wait状态中的Resolver端线程。

 

RemoteCallback对象在构造时传入一个OnResultListener接口对象，它就是回调时的执行代码。

### IContentProvider.getTypeAsync()

IContentProvider的实现在ContentProvider.Transport类中：

```java
@Override
public void getTypeAsync(Uri uri, RemoteCallback callback) {
    final Bundle result = new Bundle();
    try {
        result.putString(ContentResolver.REMOTE_CALLBACK_RESULT, getType(uri));
    } catch (Exception e) {
        result.putParcelable(ContentResolver.REMOTE_CALLBACK_ERROR,
                new ParcelableException(e));
    }
    callback.sendResult(result);
}
```

在这里通过Binder获取到结果后，调用到RemoteCallback.sendResult(result)中。

### RemoteCallback.sendResult()

在这里的条件为mListener != null，mHandler == null，所以直接执行mListener.onResult(result);

mListener是构造RemoteCallback是传入的参数。

```java
public void sendResult(@Nullable final Bundle result) {
    // Do local dispatch
    if (mListener != null) {
        if (mHandler != null) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    mListener.onResult(result);
                }
            });
        } else {
            mListener.onResult(result);
        }
    // Do remote dispatch
    } else {
        try {
            mCallback.sendResult(result);
        } catch (RemoteException e) {
            /* ignore */
        }
    }
}
```

### ResultListener.onResult()

代码位于：ContentResolver.ResultListener.onResult()

在这里唤醒本线程，于是ContentResolver.getType(uri)和CPH.getProviderMimeTypeAsync()中调用getTypeAsync()的线程被唤醒，并在ContentResolver.getType(uri)中将结果返回。

```java
@Override
public void onResult(Bundle result) {
    synchronized (this) {
        ParcelableException e = result.getParcelable(REMOTE_CALLBACK_ERROR);
        if (e != null) {
            Throwable t = e.getCause();
            if (t instanceof RuntimeException) {
                this.exception = (RuntimeException) t;
            } else {
                this.exception = new RuntimeException(t);
            }
        } else {
            this.result = getResultFromBundle(result);
        }
        done = true;
        notifyAll();
    }
}
```

# 其它

## getContentProviderExternalUnchecked()

```java
ContentProviderHolder getContentProviderExternalUnchecked(String name,
        IBinder token, int callingUid, String callingTag, int userId) {
    return getContentProviderImpl(null, name, token, callingUid, null, callingTag,
            true, userId);
}
```

getContentProviderImpl()是system_process进程中访问Provider的主要方法，有两处可以调用而来。

- 来自CPH.getContentProvider()：大多数APP访问Provider要走的流程
- 来自CPH.getContentProviderExternalUnchecked()：在部分情况下非用户APP的一些调用流程，如shell、native、getType()调用而来。

 

 

(1)   情况1：通过shell访问Provider

命令：adb shell content query --uri content://com.demoapp.contentproviderdemo.provider/person

<br/>

(2)   情况2：来自native的调用

如media进程（UID=1013）的调用：

 

Native层：

```txt
MediaPlayerService::setDataSource() ->
ActivityManager::openContentProviderFile()
```

```java
int openContentProviderFile(const String16& uri){
    int fd = -1;

    sp<IServiceManager> sm = defaultServiceManager();
    sp<IBinder> binder = sm->getService(String16("activity"));
    sp<IActivityManager> am = interface_cast<IActivityManager>(binder);
    if (am != NULL) {
        fd = am->openContentUri(uri);
    }

    return fd;
}
```

Framework层：

```txt
AMS.openContentUri(String uriString) ->
CPH.getContentProviderExternalUnchecked() ->
CPH.getContentProviderImpl()
```

<br/>

(3)   getContentProviderImpl()调用方式不同的区别

```java
ContentProviderHolder getContentProvider(IApplicationThread caller, String callingPackage,
        String name, int userId, boolean stable) {
    //...
    return getContentProviderImpl(caller, name, null, callingUid, callingPackage,
            null, stable, userId);
}

ContentProviderHolder getContentProviderExternalUnchecked(String name,
        IBinder token, int callingUid, String callingTag, int userId) {
    return getContentProviderImpl(null, name, token, callingUid, null, callingTag,
            true, userId);
}
```

在传入的参数上，最大的区别是IApplicationThread caller，ExternalUnchecked()调用而来的caller == null，这回导致后续在等待Provider端进程启动时有一些区别。

还有其它的参数如token、callingPackage、callingTag等，对getContentProviderImpl()中的流程造成的影响比较小。

<br/>

如果Provider端进程未启动，会走到启动进程的流程中：

```java
proc = mService.startProcessLocked(
        cpi.processName, cpr.appInfo, false, 0,
        new HostingRecord(HostingRecord.HOSTING_TYPE_CONTENT_PROVIDER,
            new ComponentName(
                    cpi.applicationInfo.packageName, cpi.name)),
        // MIUI MOD:
        // Process.ZYGOTE_POLICY_FLAG_EMPTY, false, false);
        Process.ZYGOTE_POLICY_FLAG_EMPTY, false, false, callerPackage);
```

<br/>

对常规APP调用进来的而言，由于caller != null，所以会在这里发送超时消息，并返回ContentProviderHolder对象，之后是在AT.acquireProvider()中等待进程启动，否则执行超时流程：

```java
if (caller != null) {
    // The client will be waiting, and we'll notify it when the provider is ready.
    synchronized (cpr) {
        if (cpr.provider == null) {
            if (cpr.launchingApp == null) {
                //...
                return null;
            }

            if (conn != null) {
                conn.waiting = true;
            }
            Message msg = mService.mHandler.obtainMessage(
                    ActivityManagerService.WAIT_FOR_CONTENT_PROVIDER_TIMEOUT_MSG);
            msg.obj = cpr;
            mService.mHandler.sendMessageDelayed(msg,
                    ContentResolver.CONTENT_PROVIDER_READY_TIMEOUT_MILLIS);
        }
    }
    //...
    return cpr.newHolder(conn, false);
}
```

对于通过getContentProviderExternalUnchecked()调用进来的流程，由于caller == null，所以在getContentProviderImpl()中，可能会走到以下流程中。

注：正常的APP调用不会走到从这里开始的流程后面。

```java
// Because of the provider's external client (i.e., SHELL), we'll have to wait right here.
// Wait for the provider to be published...
final long timeout =
        SystemClock.uptimeMillis() + ContentResolver.CONTENT_PROVIDER_READY_TIMEOUT_MILLIS;
boolean timedOut = false;
synchronized (cpr) {
    while (cpr.provider == null) {
        if (cpr.launchingApp == null) {
            //...
            return null;
        }
        try {
            final long wait = Math.max(0L, timeout - SystemClock.uptimeMillis());
            if (conn != null) {
                conn.waiting = true;
            }
            cpr.wait(wait);
            if (cpr.provider == null) {
                timedOut = true;
                break;
            }
        } catch (InterruptedException ex) {
        } finally {
            if (conn != null) {
                conn.waiting = false;
            }
        }
    }
}
```

从代码中可以看出，线程可能会在这里陷入等待，而不像APP调用一样在Resolver端进程等待。
