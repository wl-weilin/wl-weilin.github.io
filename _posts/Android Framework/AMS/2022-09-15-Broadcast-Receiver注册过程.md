---
layout: post
# 标题配置
title:  Broadcast-Receiver注册过程

# 时间配置
date:   2022-09-15

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


# 动态注册Broadcast Receiver

Base on: Android 13

Branch: android-13.0.0_r30

[Android S动态广播注册流程(广播1)——CSDN](https://blog.csdn.net/yun_hen/article/details/124415431) 

## 流程图

下图中为注册Receiver的过程。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/Broadcast Receiver注册过程.png" alt="Activity生命周期.png" style="zoom:80%" />
</div>

## APP端注册Receiver

```java
    //定义过滤器，想要监听什么广播，就添加相应的Action
    intentFilter = new IntentFilter();
    intentFilter.addAction("com.example.broadcast.MY_BROADCAST");
    //定义广播处理类
    myReceiver = new MyReceiver();
    //注册本地广播监听器
    registerReceiver(myReceiver, intentFilter);
```

将IntentFilter与MyReceiver进行绑定，然后注册到系统中。另外在注册接收器前可以对intentFilter设置优先级，优先级数值越大，优先级就越高，那么该接收器就越早接收到广播。设置优先级对只对有序广播有效。

```java
    intentFilter.setPriority(10);
```

## ContextWrapper.registerReceiver()

```java
public Intent registerReceiver(@Nullable BroadcastReceiver receiver, IntentFilter filter) {
    return mBase.registerReceiver(receiver, filter);
}
```

mBase是一个Context类，实际调用的是ContextImpl类。

## ContextImpl.registerReceiver()

registerReceiver()有4个重载方法，但最后调用的都是registerReceiverInternal()。

```java
public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
    return registerReceiver(receiver, filter, null, null);
}

@Override
public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter,
        int flags) {
    return registerReceiver(receiver, filter, null, null, flags);
}

@Override
public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter,
        String broadcastPermission, Handler scheduler) {
    return registerReceiverInternal(receiver, getUserId(),
            filter, broadcastPermission, scheduler, getOuterContext(), 0);
}

@Override
public Intent registerReceiver(BroadcastReceiver receiver, IntentFilter filter,
        String broadcastPermission, Handler scheduler, int flags) {
    return registerReceiverInternal(receiver, getUserId(),
            filter, broadcastPermission, scheduler, getOuterContext(), flags);
}
```

## ContextImpl.registerReceiverInternal()

在这里将BroadcastReceiver对象构造为一个可跨进程传输的IIntentReceiver对象，然后调用系统服务AMS.registerReceiverWithFeature()。

```java
private Intent registerReceiverInternal(BroadcastReceiver receiver, int userId,
        IntentFilter filter, String broadcastPermission,
        Handler scheduler, Context context, int flags) {
    IIntentReceiver rd = null;
    if (receiver != null) {
        if (mPackageInfo != null && context != null) {
            if (scheduler == null) {
                scheduler = mMainThread.getHandler();
            }
            rd = mPackageInfo.getReceiverDispatcher(
                receiver, context, scheduler,
                mMainThread.getInstrumentation(), true);
        } else {
            if (scheduler == null) {
                scheduler = mMainThread.getHandler();
            }
            rd = new LoadedApk.ReceiverDispatcher(
                    receiver, context, scheduler, null, true).getIIntentReceiver();
        }
    }
    try {
        final Intent intent = ActivityManager.getService().registerReceiverWithFeature(
                mMainThread.getApplicationThread(), mBasePackageName, getAttributionTag(), rd,
                filter, broadcastPermission, userId, flags);
        if (intent != null) {
            intent.setExtrasClassLoader(getClassLoader());
            intent.prepareToEnterProcess();
        }
        return intent;
    } catch (RemoteException e) {
        throw e.rethrowFromSystemServer();
    }
}
```

## AMS.registerReceiverWithFeature()

该函数中大约200行代码，主要是对Receiver端进程的检查、对Receiver在系统端进行注册，以及构造粘性广播的BroadcastRecord。

### 检查caller进程

对caller进程（Receiver所在进程）进行检查，判断其当前状态是否正常。

```java
public Intent registerReceiverWithFeature(IApplicationThread caller, String callerPackage,
        String callerFeatureId, IIntentReceiver receiver, IntentFilter filter,
        String permission, int userId, int flags) {
    enforceNotIsolatedCaller("registerReceiver");
    ArrayList<Intent> stickyIntents = null;
    ProcessRecord callerApp = null;
    final boolean visibleToInstantApps
            = (flags & Context.RECEIVER_VISIBLE_TO_INSTANT_APPS) != 0;
    int callingUid;
    int callingPid;
    boolean instantApp;
    synchronized(this) {
        //查询调用者的相关信息
        if (caller != null) {
            callerApp = getRecordForAppLocked(caller);
            if (callerApp == null) {
                throw new SecurityException(
                        "Unable to find app for caller " + caller
                        + " (pid=" + Binder.getCallingPid()
                        + ") when registering receiver " + receiver);
            }
            if (callerApp.info.uid != SYSTEM_UID &&
                    !callerApp.pkgList.containsKey(callerPackage) &&
                    !"android".equals(callerPackage)) {
                throw new SecurityException("Given caller package " + callerPackage
                        + " is not running in process " + callerApp);
            }
            callingUid = callerApp.info.uid;
            callingPid = callerApp.pid;
        } else {
            callerPackage = null;
            callingUid = Binder.getCallingUid();
            callingPid = Binder.getCallingPid();
        }
        //...
}
//...
}
```

### 处理粘性广播

调用sendStickyBroadcast()来发送某个action类型的广播时，系统会把这个广播的Intent保存在AMS.mStickyBroadcasts中。当之后每次其它进程调用registerReceiver()来注册某个action类型的广播接收器，AMS.mStickyBroadcasts就会查询是否有该action类型Intent。

如果当前注册的Receiver符合粘性广播，则通过queue、intent、BroadcastFilter构造粘性广播的BroadcastRecord对象，然后添加到并行广播队列，之后进行分发。

```java
public Intent registerReceiverWithFeature(IApplicationThread caller, String callerPackage,
        String callerFeatureId, IIntentReceiver receiver, IntentFilter filter,
        String permission, int userId, int flags) {
    enforceNotIsolatedCaller("registerReceiver");
    ArrayList<Intent> stickyIntents = null;
    ProcessRecord callerApp = null;
    final boolean visibleToInstantApps
            = (flags & Context.RECEIVER_VISIBLE_TO_INSTANT_APPS) != 0;
    int callingUid;
    int callingPid;
    boolean instantApp;
    synchronized(this) {
        //查询调用者的相关信息...

        instantApp = isInstantApp(callerApp, callerPackage, callingUid);
        userId = mUserController.handleIncomingUser(callingPid, callingUid, userId, true,
                ALLOW_FULL_ONLY, "registerReceiver", callerPackage);
        //取出filter中的所有action，返回一个迭代器
        Iterator<String> actions = filter.actionsIterator();
        if (actions == null) {
            ArrayList<String> noAction = new ArrayList<String>(1);
            noAction.add(null);
            actions = noAction.iterator();
        }
        
        // Collect stickies of users
        //callingUid为注册receiver的APP的Uid，此处的userIds表示所有应该接收粘性广播的用户
        int[] userIds = { UserHandle.USER_ALL, UserHandle.getUserId(callingUid) };
        while (actions.hasNext()) {
            String action = actions.next();
            for (int id : userIds) {
                //查询该userId是否有待执行的粘性广播，若有则返回
                ArrayMap<String, ArrayList<Intent>> stickies = mStickyBroadcasts.get(id);
                if (stickies != null) {
                    //从stickies中取出粘性广播的action
                    ArrayList<Intent> intents = stickies.get(action);
                    if (intents != null) {
                        if (stickyIntents == null) {
                            stickyIntents = new ArrayList<Intent>();
                        }
                        //stickyIntents存储所有粘性广播的intent
                        stickyIntents.addAll(intents);
                    }
                }
            }
        }
    }

    ArrayList<Intent> allSticky = null;
    if (stickyIntents != null) {
        final ContentResolver resolver = mContext.getContentResolver();
        // Look for any matching sticky broadcasts...
        for (int i = 0, N = stickyIntents.size(); i < N; i++) {
            Intent intent = stickyIntents.get(i);
            // Don't provided intents that aren't available to instant apps.
            if (instantApp &&
                    (intent.getFlags() & Intent.FLAG_RECEIVER_VISIBLE_TO_INSTANT_APPS) == 0) {
                continue;
            }
            // If intent has scheme "content", it will need to acccess
            // provider that needs to lock mProviderMap in ActivityThread
            // and also it may need to wait application response, so we
            // cannot lock ActivityManagerService here.
            //查询filter中是否有粘性广播的intent
            if (filter.match(resolver, intent, true, TAG) >= 0) {
                if (allSticky == null) {
                    allSticky = new ArrayList<Intent>();
                }
                allSticky.add(intent);
            }
        }
    }

    // The first sticky in the list is returned directly back to the client.
    Intent sticky = allSticky != null ? allSticky.get(0) : null;
    if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST, "Register receiver " + filter + ": " + sticky);
    if (receiver == null) {
        return sticky;
    }
//...

synchronized (this) {
        //将receiver和filter进行注册
        //...

        // Enqueue broadcasts for all existing stickies that match
        // this filter.
        if (allSticky != null) {
            ArrayList receivers = new ArrayList();
            receivers.add(bf);

            final int stickyCount = allSticky.size();
            for (int i = 0; i < stickyCount; i++) {
                Intent intent = allSticky.get(i);
                BroadcastQueue queue = broadcastQueueForIntent(intent);
                BroadcastRecord r = new BroadcastRecord(queue, intent, null,
                        null, null, -1, -1, false, null, null, OP_NONE, null, receivers,
                        null, 0, null, null, false, true, true, -1, false,
                        false /* only PRE_BOOT_COMPLETED should be exempt, no stickies */);
                queue.enqueueParallelBroadcastLocked(r);
                queue.scheduleBroadcastsLocked();
            }
        }

        return sticky;
    }
}
```

### 将receiver和filter进行注册

将receiver和filter进行注册，将它们关联后分别加入的维护队列中（及AMS的成员变量mRegisteredReceivers与mReceiverResolver中）。

- 通过IIntentReceiver receiver构造ReceiverList对象rl；
- 通过rl、filter等构造BroadcastFilter对象bf（bf中包含rl对象的引用）；
- 将rl与bf关联：rl.add(bf)（rl中包含bf对象）;

```java
public Intent registerReceiverWithFeature(IApplicationThread caller, String callerPackage,
        String callerFeatureId, IIntentReceiver receiver, IntentFilter filter,
        String permission, int userId, int flags) {
    enforceNotIsolatedCaller("registerReceiver");
    ArrayList<Intent> stickyIntents = null;
    ProcessRecord callerApp = null;
    final boolean visibleToInstantApps
            = (flags & Context.RECEIVER_VISIBLE_TO_INSTANT_APPS) != 0;
    int callingUid;
    int callingPid;
    boolean instantApp;
    synchronized(this) {
        //查询调用者的相关信息...
        //处理粘性广播...
    }

    synchronized (this) {
        if (callerApp != null && (callerApp.thread == null
                || callerApp.thread.asBinder() != caller.asBinder())) {
            // Original caller already died
            return null;
        }
        ReceiverList rl = mRegisteredReceivers.get(receiver.asBinder());
        if (rl == null) {
            rl = new ReceiverList(this, callerApp, callingPid, callingUid,
                    userId, receiver);
            if (rl.app != null) {
                final int totalReceiversForApp = rl.app.receivers.size();
                if (totalReceiversForApp >= MAX_RECEIVERS_ALLOWED_PER_APP) {
                    throw new IllegalStateException("Too many receivers, total of "
                            + totalReceiversForApp + ", registered for pid: "
                            + rl.pid + ", callerPackage: " + callerPackage);
                }
                rl.app.receivers.add(rl);
            } else {
                try {
                    receiver.asBinder().linkToDeath(rl, 0);
                } catch (RemoteException e) {
                    return sticky;
                }
                rl.linkedToDeath = true;
            }
            mRegisteredReceivers.put(receiver.asBinder(), rl);
        } else if (rl.uid != callingUid) {
            throw new IllegalArgumentException(
                    "Receiver requested to register for uid " + callingUid
                    + " was previously registered for uid " + rl.uid
                    + " callerPackage is " + callerPackage);
        } else if (rl.pid != callingPid) {
            throw new IllegalArgumentException(
                    "Receiver requested to register for pid " + callingPid
                    + " was previously registered for pid " + rl.pid
                    + " callerPackage is " + callerPackage);
        } else if (rl.userId != userId) {
            throw new IllegalArgumentException(
                    "Receiver requested to register for user " + userId
                    + " was previously registered for user " + rl.userId
                    + " callerPackage is " + callerPackage);
        }
        BroadcastFilter bf = new BroadcastFilter(filter, rl, callerPackage, callerFeatureId,
                permission, callingUid, userId, instantApp, visibleToInstantApps);
        if (rl.containsFilter(filter)) {
            Slog.w(TAG, "Receiver with filter " + filter
                    + " already registered for pid " + rl.pid
                    + ", callerPackage is " + callerPackage);
        } else {
            rl.add(bf);
            if (!bf.debugCheck()) {
                Slog.w(TAG, "==> For Dynamic broadcast");
            }
            mReceiverResolver.addFilter(bf);
        }

        // 粘性广播的处理代码...
}
```

## mRegisteredReceivers与mReceiverResolver关系

AMS有两个与广播相关的成员变量mRegisteredReceivers与mReceiverResolver。

(1)   mRegisteredReceivers

mRegisteredReceivers存储的是系统中所有进程的动态注册的Receiver。

mRegisteredReceivers是一个HashMap，key为Receiver的IBinder代理对象（即receiver.asBinder()，receiver是一个IIntentReceiver对象），value为一个ReceiverList对象。

```java
/**
 * Keeps track of all IIntentReceivers that have been registered for broadcasts.
 * Hash keys are the receiver IBinder, hash value is a ReceiverList.
 */
final HashMap<IBinder, ReceiverList> mRegisteredReceivers = new HashMap<>();
```

<br/>

(2)   mReceiverResolver

​    mReceiverResolver存储的是所有动态注册的Receiver的BroadcastFilter（由IntentFilter构造而来）。是一个IntentResolver<BF, BF>对象。

```java
/**
 * Resolver for broadcast intents to registered receivers.
 * Holds BroadcastFilter (subclass of IntentFilter).
 */
final IntentResolver<BroadcastFilter, BroadcastFilter> mReceiverResolver
        = new IntentResolver<BroadcastFilter, BroadcastFilter>() {...}
```

<br/>

(3)   两者关系

```java
public Intent registerReceiverWithFeature(IApplicationThread caller, String callerPackage,
        String callerFeatureId, IIntentReceiver receiver, IntentFilter filter,
        String permission, int userId, int flags) {
//...
    //从mRegisteredReceivers中通过IIntentReceiver查询并获取ReceiverList对象    
    ReceiverList rl = mRegisteredReceivers.get(receiver.asBinder());
    // 如果rl == null，则表示该Receiver还未加入（注册）到mRegisteredReceivers中
if (rl == null) {
        //构造ReceiverList并加入到mRegisteredReceivers
        rl = new ReceiverList(this, callerApp, callingPid, callingUid,
                userId, receiver);
        //...
        mRegisteredReceivers.put(receiver.asBinder(), rl);
    }
    //根据IntentFilter、ReceiverList等信息生成BroadcastFilter
    BroadcastFilter bf = new BroadcastFilter(filter, rl, callerPackage, callerFeatureId,
        permission, callingUid, userId, instantApp, visibleToInstantApps);
    //如果rl中已经包含给该intentFilter，则说明以及注册过了，不用再重复注册了
if (rl.containsFilter(filter)) {
        Slog.w(TAG, "Receiver with filter " + filter
                + " already registered for pid " + rl.pid
                + ", callerPackage is " + callerPackage);
    } else { //未注册过，执行注册流程
        // 将BroadcastFilter加入到Receiver的记录中
        rl.add(bf);
        if (!bf.debugCheck()) {
            Slog.w(TAG, "==> For Dynamic broadcast");
        }
        //将BroadcastFilter加入到mReceiverResolver列表中
        mReceiverResolver.addFilter(bf);
    }
//...
}
```

mRegisteredReceivers维护的是ReceiverList，每个ReceiverList包含一个或多个BroadcastFilter。

mReceiverResolver维护的是BroadcastFilter，从构造函数可以看出BroadcastFilter也会记录自己属于哪个ReceiverList。

# 静态注册Broadcast Receiver

## APP端注册Receiver

```java
<receiver
    android:name=".MyReceiver"
    android:enabled="true"
    android:exported="true">

    <intent-filter
        android:priority="9">
        <action android:name="com.example.broadcast.MY_BROADCAST1"/>
    </intent-filter>

</receiver>
```

## 系统端注册

系统端注册是由PMS解析AndroidManifest.xml文件的，最后PMS将PMS.将Receiver相关信息添加到PMS.mComponentResolver中。

这里暂时略过，以后用空再补充。

## 查询静态注册Receiver

当发送广播，AMS在AMS.broadcastIntentLocked()中查询可以匹配的Receiver时，调用栈如下：

```txt
AMS.broadcastIntentLocked() ->
AppGlobals.getPackageManager().queryIntentReceivers() ->
PMS.queryIntentReceiversInternal() ->
PMS.mComponentResolver.queryReceivers() ->
```

最后返回一个List<ResolveInfo>对象作为匹配到的静态Receiver结果。
