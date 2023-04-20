---
layout: post
# 标题配置
title:  Broadcast发送与处理过程

# 时间配置
date:   2021-09-20

# 大类配置
categories: Android-Framework

# 小类配置
tag: AMS

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# 发送Broadcast—注册到AMS

Base on: Android 12

Broadcast的注册过程指APP发送广播后，AMS将广播（BroadcastRecord）添加到广播队列的过程。

## APP端发送广播

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.MY_BROADCAST");
sendBroadcast(intent);
```

## ContextWrapper.sendBroadcast()

ContextWrapper中调用mBase.sendBroadcast(intent)，此处的mBase实际是一个ContextImpl类。

```java
Context mBase;
public ContextWrapper(Context base) {
    mBase = base;
}
public void sendBroadcast(Intent intent) {
    mBase.sendBroadcast(intent);
}
```

## ContextImpl.sendBroadcast()

在ContextImpl中，sendBroadcast()有两个重载函数，分别是带权限和不带权限的。在sendBroadcast()中通过Binder调用AMS的服务，之后便是system端的处理过程。

```java
public void sendBroadcast(Intent intent) {
    warnIfCallingFromSystemProcess();
    String resolvedType = intent.resolveTypeIfNeeded(getContentResolver());
    try {
        intent.prepareToLeaveProcess(this);
        ActivityManager.getService().broadcastIntentWithFeature(
                mMainThread.getApplicationThread(), getAttributionTag(), intent, resolvedType,
                null, Activity.RESULT_OK, null, null, null, AppOpsManager.OP_NONE, null, false,
                false, getUserId());
    } catch (RemoteException e) {
        throw e.rethrowFromSystemServer();
    }
}

@Override
public void sendBroadcast(Intent intent, String receiverPermission) {
    warnIfCallingFromSystemProcess();
    String resolvedType = intent.resolveTypeIfNeeded(getContentResolver());
    String[] receiverPermissions = receiverPermission == null ? null
            : new String[] {receiverPermission};
    try {
        intent.prepareToLeaveProcess(this);
        ActivityManager.getService().broadcastIntentWithFeature(
                mMainThread.getApplicationThread(), getAttributionTag(), intent, resolvedType,
                null, Activity.RESULT_OK, null, null, receiverPermissions,
                AppOpsManager.OP_NONE, null, false, false, getUserId());
    } catch (RemoteException e) {
        throw e.rethrowFromSystemServer();
    }
}
```

## AMS.broadcastIntentWithFeature()

验证intent是否合法，获取调用端进程的相关信息。

```java
public final int broadcastIntentWithFeature(IApplicationThread caller, String callingFeatureId,
        Intent intent, String resolvedType, IIntentReceiver resultTo,
        int resultCode, String resultData, Bundle resultExtras,
        String[] requiredPermissions, int appOp, Bundle bOptions,
        boolean serialized, boolean sticky, int userId) {
    enforceNotIsolatedCaller("broadcastIntent");
    synchronized(this) {
        intent = verifyBroadcastLocked(intent);
        // 获取调用端进程的信息，并在下面通过参数传入
        final ProcessRecord callerApp = getRecordForAppLocked(caller);
        final int callingPid = Binder.getCallingPid();
        final int callingUid = Binder.getCallingUid();

        final long origId = Binder.clearCallingIdentity();
        try {
            return broadcastIntentLocked(callerApp,
                    callerApp != null ? callerApp.info.packageName : null, callingFeatureId,
                    intent, resolvedType, resultTo, resultCode, resultData, resultExtras,
                    requiredPermissions, appOp, bOptions, serialized, sticky,
                    callingPid, callingUid, callingUid, callingPid, userId);
        } finally {
            Binder.restoreCallingIdentity(origId);
        }
    }
}
```

## AMS.broadcastIntentLocked()

broadcastIntentLocked()中对广播的intent进行处理，然后加入到不同的广播队列。广播包括有序广播和无序广播，拥有各自不同的队列。

broadcastIntentLocked()中的代码约700行，下面只看主要方法。

```java
@GuardedBy("this")
final int broadcastIntentLocked(ProcessRecord callerApp, String callerPackage,
        @Nullable String callerFeatureId, Intent intent, String resolvedType,
        IIntentReceiver resultTo, int resultCode, String resultData,
        Bundle resultExtras, String[] requiredPermissions, int appOp, Bundle bOptions,
        boolean ordered, boolean sticky, int callingPid, int callingUid, int realCallingUid,
        int realCallingPid, int userId, boolean allowBackgroundActivityStarts,
        @Nullable int[] broadcastWhitelist) {......}
```

### 广播预处理

对广播添加一些默认的flag，判断当前的系统和用户状态并作一些操作。

```java
intent = new Intent(intent);
//......
// 默认广播不发送给已停止的APP，如安装后从未启动过的APP，无法通过静态注册的广播来启动
intent.addFlags(Intent.FLAG_EXCLUDE_STOPPED_PACKAGES);

// 若系统未启动完成
if (!mProcessesReady && (intent.getFlags()&Intent.FLAG_RECEIVER_BOOT_UPGRADE) == 0) {
    //只有动态注册receiver才能接受广播
    intent.addFlags(Intent.FLAG_RECEIVER_REGISTERED_ONLY);
}
//非USER_ALL广播且当前用户并没有处于Running
if (userId != UserHandle.USER_ALL && !mUserController.isUserOrItsParentRunning(userId)) {
//如果不是系统升级广播或者关机广播，则直接返回
    if ((callingUid != SYSTEM_UID
            || (intent.getFlags() & Intent.FLAG_RECEIVER_BOOT_UPGRADE) == 0)
            && !Intent.ACTION_SHUTDOWN.equals(intent.getAction())) {
        Slog.w(TAG, "Skipping broadcast of " + intent
                + ": user " + userId + " and its parent (if any) are stopped");
        return ActivityManager.BROADCAST_FAILED_USER_STOPPED;
    }
}
```

### 广播调用者验证

当callingAppId为SYSTEM_UID，PHONE_UID，SHELL_UID，BLUETOOTH_UID，NFC_UID，SE_UID，NETWORK_STACK_UID或者callingUid == 0时都畅通无阻。

```java
final boolean isCallerSystem;
switch (UserHandle.getAppId(callingUid)) {
    case ROOT_UID:
    case SYSTEM_UID:
    case PHONE_UID:
    case BLUETOOTH_UID:
    case NFC_UID:
    case SE_UID:
    case NETWORK_STACK_UID:
        isCallerSystem = true;
        break;
    default:
        isCallerSystem = (callerApp != null) && callerApp.isPersistent();
        break;
}

// First line security check before anything else: stop non-system apps from
// sending protected broadcasts.
if (!isCallerSystem) {
    if (isProtectedBroadcast) {
        String msg = "Permission Denial: not allowed to send broadcast "
                + action + " from pid="
                + callingPid + ", uid=" + callingUid;
        Slog.w(TAG, msg);
        throw new SecurityException(msg);

    } else if (AppWidgetManager.ACTION_APPWIDGET_CONFIGURE.equals(action)
            || AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)) {
        // Special case for compatibility: we don't want apps to send this,
        // but historically it has not been protected and apps may be using it
        // to poke their own app widget.  So, instead of making it protected,
        // just limit it to the caller.
        if (callerPackage == null) {
            String msg = "Permission Denial: not allowed to send broadcast "
                    + action + " from unknown caller.";
            Slog.w(TAG, msg);
            throw new SecurityException(msg);
        } else if (intent.getComponent() != null) {
            // They are good enough to send to an explicit component...  verify
            // it is being sent to the calling app.
            if (!intent.getComponent().getPackageName().equals(
                    callerPackage)) {
                String msg = "Permission Denial: not allowed to send broadcast "
                        + action + " to "
                        + intent.getComponent().getPackageName() + " from "
                        + callerPackage;
                Slog.w(TAG, msg);
                throw new SecurityException(msg);
            }
        } else {
            // Limit broadcast to their own package.
            intent.setPackage(callerPackage);
        }
    }
}
```

### 处理系统广播

这里约250行代码，对特定的action进行处理。

```java
if (action != null) {
//查看后台进程是否可以接收该广播，若可以则添加flag
    if (getBackgroundLaunchBroadcasts().contains(action)) {
        if (DEBUG_BACKGROUND_CHECK) {
            Slog.i(TAG, "Broadcast action " + action + " forcing include-background");
        }
        intent.addFlags(Intent.FLAG_RECEIVER_INCLUDE_BACKGROUND);
    }

    switch (action) {
//发送以下广播需要相关权限
        case Intent.ACTION_UID_REMOVED:
        case Intent.ACTION_PACKAGE_REMOVED:
        case Intent.ACTION_PACKAGE_CHANGED:
        case Intent.ACTION_EXTERNAL_APPLICATIONS_UNAVAILABLE:
        case Intent.ACTION_EXTERNAL_APPLICATIONS_AVAILABLE:
        case Intent.ACTION_PACKAGES_SUSPENDED:
        case Intent.ACTION_PACKAGES_UNSUSPENDED:
            // Handle special intents: if this broadcast is from the package
            // manager about a package being removed, we need to remove all of
            // its activities from the history stack.
            if (checkComponentPermission(
                    android.Manifest.permission.BROADCAST_PACKAGE_REMOVED,
                    callingPid, callingUid, -1, true)
                    != PackageManager.PERMISSION_GRANTED) {
                String msg = "Permission Denial: " + intent.getAction()
                        + " broadcast from " + callerPackage + " (pid=" + callingPid
                        + ", uid=" + callingUid + ")"
                        + " requires "
                        + android.Manifest.permission.BROADCAST_PACKAGE_REMOVED;
                Slog.w(TAG, msg);
                throw new SecurityException(msg);
            }
            switch (action) {
                case Intent.ACTION_UID_REMOVED:
                //......
                case Intent.ACTION_EXTERNAL_APPLICATIONS_UNAVAILABLE:
                //......
}
```

### 处理sticky广播

将粘性广播添加到AMS的mStickyBroadcasts。

```java
if (sticky) {//......}
```

### receivers与registeredReceivers

根据intent中的参数查询符合条件的Receiver，无论有序或无序的广播，对当前的intent，其所匹配的Receiver有两类：

- receivers：保存匹配当前intent的所有静态注册Receiver（ResolveInfo对象），通过collectReceiverComponents()函数查询PMS返回结果；
- registeredReceivers：保存匹配当前intent的所有动态注册Receiver（BroadcastFilter对象），通过mReceiverResolver.queryIntent()返回结果，mReceiverResolver记录着所有动态注册的Receiver。

```java
// Figure out who all will receive this broadcast.
List receivers = null;
List<BroadcastFilter> registeredReceivers = null;
// Need to resolve the intent to interested receivers...
if ((intent.getFlags()&Intent.FLAG_RECEIVER_REGISTERED_ONLY)
         == 0) {
    receivers = collectReceiverComponents(
            intent, resolvedType, callingUid, users, broadcastWhitelist);
}
//对隐式广播匹配其Receiver
if (intent.getComponent() == null) {
    if (userId == UserHandle.USER_ALL && callingUid == SHELL_UID) {
        // Query one target user at a time, excluding shell-restricted users
        for (int i = 0; i < users.length; i++) {
            if (mUserController.hasUserRestriction(
                    UserManager.DISALLOW_DEBUGGING_FEATURES, users[i])) {
                continue;
            }
            List<BroadcastFilter> registeredReceiversForUser =
                    mReceiverResolver.queryIntent(intent,
                            resolvedType, false /*defaultOnly*/, users[i]);
            if (registeredReceivers == null) {
                registeredReceivers = registeredReceiversForUser;
            } else if (registeredReceiversForUser != null) {
                registeredReceivers.addAll(registeredReceiversForUser);
            }
        }
    } else {
        registeredReceivers = mReceiverResolver.queryIntent(intent,
                resolvedType, false /*defaultOnly*/, userId);
    } 
}
```

接下来再通过广播的有序或无序、Receiver静态或动态注册，将BroadcastRecord添加到不同的队列。

对无序广播的处理流程：

- 将intent及registeredReceivers（动态注册的Receiver列表）封装到BroadcastRecord对象，然后添加到并行发送队列，然后registeredReceivers=null；
- 将intent及receivers（静态注册的Receiver列表）封装到BroadcastRecord对象，然后添加到串行发送队列。

对有序广播的处理流程：

- 将receivers及registeredReceivers按优先级合并大到receivers列表中，然后添加到串行发送队列。

### 添加广播到并行队列

对无序广播的intent（通过sendBroadcast()发送，ordered=false），且匹配到的动态注册的Receiver数量>0，处理流程如下：

- 调用broadcastQueueForIntent()判断intent为前台还是后台广播，前台广播则返回AMS中的mFgBroadcastQueue（BroadcastQueue对象，前台广播队列），后台广播则返回mBgBroadcastQueue（后台广播队列）；
- 通过intent及registeredReceivers、ordered、sticky等属性构造BroadcastRecord对象（之后通过该对象进行分发）；
- 通过enqueueParallelBroadcastLocked()将该BroadcastRecord对象加入到并行广播队列mParallelBroadcasts中；
- 再通过scheduleBroadcastsLocked()进入分发广播的流程；
- registeredReceivers = null，NR = 0。

```java
//NR表示该广播的接收器的数量
int NR = registeredReceivers != null ? registeredReceivers.size() : 0;
if (!ordered && NR > 0) {  //无序广播且接收器数量>0
    // If we are not serializing this broadcast, then send the
    // registered receivers separately so they don't wait for the
    // components to be launched.
    if (isCallerSystem) {
        checkBroadcastFromSystem(intent, callerApp, callerPackage, callingUid,
                isProtectedBroadcast, registeredReceivers);
    }
    //将该广播封装到BroadcastRecord对象中
    final BroadcastQueue queue = broadcastQueueForIntent(intent);
    BroadcastRecord r = new BroadcastRecord(queue, intent, callerApp, callerPackage,
            callerFeatureId, callingPid, callingUid, callerInstantApp, resolvedType,
            requiredPermissions, appOp, brOptions, registeredReceivers, resultTo,
            resultCode, resultData, resultExtras, ordered, sticky, false, userId,
            allowBackgroundActivityStarts, timeoutExempt);
    if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST, "Enqueueing parallel broadcast " + r);
    final boolean replaced = replacePending
            && (queue.replaceParallelBroadcastLocked(r) != null);
    // Note: We assume resultTo is null for non-ordered broadcasts.
    if (!replaced) {
        queue.enqueueParallelBroadcastLocked(r);
        queue.scheduleBroadcastsLocked();
    }
    registeredReceivers = null;
    NR = 0;
}

public void enqueueParallelBroadcastLocked(BroadcastRecord r) {
    mParallelBroadcasts.add(r);
    enqueueBroadcastHelper(r);
}
```

### 添加广播到串行队列

对有序广播的intent，将其receivers（包含所有静态注册Receiver）与registeredReceivers（包含所有动态注册Receiver）列表按照优先级顺序合并到receivers中。

对无序广播来说，registeredReceivers 已置为 null，所以合并后的receivers实际上只包含静态注册的Receiver。

然后通过enqueueOrderedBroadcastLocked()加入到串行广播队列，再通过scheduleBroadcastsLocked()处理广播。

总的过程如下：

- 按优先级将registeredReceivers中的BroadcastFilter对象加入到receivers；
- 调用broadcastQueueForIntent()判断intent为前台还是后台广播，前台广播则返回AMS中的mFgBroadcastQueue（BroadcastQueue对象，前台广播队列），后台广播则返回mBgBroadcastQueue（后台广播队列）；
- 通过intent及receivers、ordered、sticky等属性构造BroadcastRecord对象（之后通过该对象进行分发）；
- 通过enqueueOrderedBroadcastLocked()将该BroadcastRecord对象加入到串行广播队列mOrderedBroadcasts中；
- 再通过scheduleBroadcastsLocked()进入处理广播的流程；

```java
if (receivers != null) {
    //......
int NT = receivers != null ? receivers.size() : 0;
    int it = 0;
    ResolveInfo curt = null;
    BroadcastFilter curr = null;
    while (it < NT && ir < NR) {
        if (curt == null) {
            curt = (ResolveInfo)receivers.get(it);
        }
        if (curr == null) {
            curr = registeredReceivers.get(ir);
        }
        //按优先级将registeredReceivers加入到receivers
        if (curr.getPriority() >= curt.priority) {  
            //这里就可以看出，相同优先级下动态注册的Receivers比静态注册的先接收
            receivers.add(it, curr);  
            ir++;
            curr = null;
            it++;
            NT++;
        } else {
            it++;
            curt = null;
        }
    }
}
while (ir < NR) {  //将registeredReceivers剩余的Receivers（优先级最低）添加到receivers末尾
    if (receivers == null) {
        receivers = new ArrayList();
    }
    receivers.add(registeredReceivers.get(ir));
    ir++;
}

if (isCallerSystem) {
    checkBroadcastFromSystem(intent, callerApp, callerPackage, callingUid,
            isProtectedBroadcast, receivers);
}
//将intent及对应的receivers封装为BroadcastRecord对象
if ((receivers != null && receivers.size() > 0)
        || resultTo != null) {
    BroadcastQueue queue = broadcastQueueForIntent(intent);
    BroadcastRecord r = new BroadcastRecord(queue, intent, callerApp, callerPackage,
            callerFeatureId, callingPid, callingUid, callerInstantApp, resolvedType,
            requiredPermissions, appOp, brOptions, receivers, resultTo, resultCode,
            resultData, resultExtras, ordered, sticky, false, userId,
            allowBackgroundActivityStarts, timeoutExempt);

    if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST, "Enqueueing ordered broadcast " + r);

    final BroadcastRecord oldRecord =
            replacePending ? queue.replaceOrderedBroadcastLocked(r) : null;
    if (oldRecord != null) {
        // Replaced, fire the result-to receiver.
        if (oldRecord.resultTo != null) {
            final BroadcastQueue oldQueue = broadcastQueueForIntent(oldRecord.intent);
            try {
                oldQueue.performReceiveLocked(oldRecord.callerApp, oldRecord.resultTo,
                        oldRecord.intent,
                        Activity.RESULT_CANCELED, null, null,
                        false, false, oldRecord.userId);
            } catch (RemoteException e) {
                Slog.w(TAG, "Failure ["
                        + queue.mQueueName + "] sending broadcast result of "
                        + intent, e);

            }
        }
    } else {
        //添加到串行队列
        queue.enqueueOrderedBroadcastLocked(r);
        queue.scheduleBroadcastsLocked();
    }
} else {
    if (intent.getComponent() == null && intent.getPackage() == null
            && (intent.getFlags()&Intent.FLAG_RECEIVER_REGISTERED_ONLY) == 0) {
        // This was an implicit broadcast... let's record it for posterity.
        addBroadcastStatLocked(intent.getAction(), callerPackage, 0, 0, 0);
    }
}


public void enqueueOrderedBroadcastLocked(BroadcastRecord r) {
    mDispatcher.enqueueOrderedBroadcastLocked(r);
    enqueueBroadcastHelper(r);
}
```

# 处理Broadcast—分发到Receiver

实际上就是对BroadcastRecord对象的处理。

## BroadcastQueue.scheduleBroadcastsLocked()

给AMS线程发送消息，提示已有新的BroadcastRecord对象添加到队列中。

创建BroadcastQueue对象是在ActivityManagerService的构造函数中，所以BroadcastQueue运行在AMS所在的线程中。

```java
public void scheduleBroadcastsLocked() {
    if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST, "Schedule broadcasts ["
            + mQueueName + "]: current="
            + mBroadcastsScheduled);

    if (mBroadcastsScheduled) {
        return;
    }
    mHandler.sendMessage(mHandler.obtainMessage(BROADCAST_INTENT_MSG, this));
    mBroadcastsScheduled = true;
}
```

处理消息的代码在BroadcastQueue的BroadcastHandler中：

```java
private final class BroadcastHandler extends Handler {
    public BroadcastHandler(Looper looper) {
        super(looper, null, true);
    }

    @Override
    public void handleMessage(Message msg) {
        switch (msg.what) {
            case BROADCAST_INTENT_MSG: {
                if (DEBUG_BROADCAST) Slog.v(
                        TAG_BROADCAST, "Received BROADCAST_INTENT_MSG ["
                        + mQueueName + "]");
                processNextBroadcast(true);
            } break;
            case BROADCAST_TIMEOUT_MSG: {
                synchronized (mService) {
                    broadcastTimeoutLocked(true);
                }
            } break;
        }
    }
}
```

## BroadcastQueue.processNextBroadcast()

在执行processNextBroadcastLocked()时全程持锁。

```java
final void processNextBroadcast(boolean fromMsg) {
    synchronized (mService) {
        processNextBroadcastLocked(fromMsg, false);
    }
}
```

## BroadcastQueue.processNextBroadcastLocked()

processNextBroadcastLocked()中是分发广播的具体代码，代码大约700行。主要分为以下部分：

- 分发并行广播；
- 处理串行广播：取出有序广播队列中的第一个BroadcastRecord并remove，对该BroadcastRecord进行最后的一些处理，如判断是否超时并强制结束、发送给最后一个Receiver、移除超时消息等；
- 从BroadcastRecord中获取下一个Receiver；
- 将广播发送给Receiver。

 

并行广播在processNextBroadcastLocked()中一次性处理完，而处理串行广播时是每次处理一个BroadcastFilter或ResolveInfo就得退出一次processNextBroadcastLocked，等待目标进程通知处理完了再调用processNextBroadcastLocked处理下一个BroadcastFilter或ResolveInfo。

在processNextBroadcastLocked()中，处理并行广播的是deliverToRegisteredReceiverLocked()，处理串行广播的是processCurBroadcastLocked()。

### 并行广播-分发

只有处理非order模式的动态注册的Receiver是并行的发送方式，总体上有两层循环。

第一层循环是在while循环中，处理并行广播队列mParallelBroadcasts中的每个BroadcastRecord对象，直到mParallelBroadcasts.size()==0：

- 取出BroadcastRecord对象r；
- 第二层循环：是一个for循环，对r的receivers成员，依次取出其BroadcastFilter对象（即Receiver）；
- 将广播分发给该Receiver。

```java
// First, deliver any non-serialized broadcasts right away.
while (mParallelBroadcasts.size() > 0) {  //并行广播队列若不为空
    r = mParallelBroadcasts.remove(0);  //循环中逐个取出队列中的广播
    r.dispatchTime = SystemClock.uptimeMillis();
    r.dispatchClockTime = System.currentTimeMillis();
    //......
    final int N = r.receivers.size();
    if (DEBUG_BROADCAST_LIGHT) Slog.v(TAG_BROADCAST, "Processing parallel broadcast ["
            + mQueueName + "] " + r);
    for (int i=0; i<N; i++) {  //遍历该BroadcastRecord的所有的receivers
        Object target = r.receivers.get(i);
        if (DEBUG_BROADCAST)  Slog.v(TAG_BROADCAST,
                "Delivering non-ordered on [" + mQueueName + "] to registered "
                + target + ": " + r);
        //将广播分发给已注册的Receiver
        deliverToRegisteredReceiverLocked(r, (BroadcastFilter)target, false, i);
    }
    addBroadcastToHistoryLocked(r);
    if (DEBUG_BROADCAST_LIGHT) Slog.v(TAG_BROADCAST, "Done with parallel broadcast ["
            + mQueueName + "] " + r);
}
```

对每一个Receiver，调用deliverToRegisteredReceiverLocked()，前面是是否跳过该Receiver的各类判断，之后的主要代码如下：

```java
try {
    if (DEBUG_BROADCAST_LIGHT) Slog.i(TAG_BROADCAST,
            "Delivering to " + filter + " : " + r);
    if (filter.receiverList.app != null && filter.receiverList.app.inFullBackup) {
        // Skip delivery if full backup in progress
        // If it's an ordered broadcast, we need to continue to the next receiver.
        if (ordered) {
            skipReceiverLocked(r);
        }
    } else {
        r.receiverTime = SystemClock.uptimeMillis();
        maybeAddAllowBackgroundActivityStartsToken(filter.receiverList.app, r);
        performReceiveLocked(filter.receiverList.app, filter.receiverList.receiver,
                new Intent(r.intent), r.resultCode, r.resultData,
                r.resultExtras, r.ordered, r.initialSticky, r.userId);
        // parallel broadcasts are fire-and-forget, not bookended by a call to
        // finishReceiverLocked(), so we manage their activity-start token here
        if (r.allowBackgroundActivityStarts && !r.ordered) {
            postActivityStartTokenRemoval(filter.receiverList.app, r);
        }
    }
    if (ordered) {
        r.state = BroadcastRecord.CALL_DONE_RECEIVE;
    }
}
```

### 处理mPendingBroadcast

在处理串行广播之前需要先处理mPendingBroadcast，mPendingBroadcast是一个BroadcastRecord对象，由于Receiver所在进程还未启动，所以先挂起了。

mPendingBroadcast的赋值是在上一次执行processNextBroadcastLocked()进行的。同时Receiver所在进程的启动也是在上一次processNextBroadcastLocked()最后处理静态Receiver时开始的。

当mPendingBroadcast!=null时，说明此时Receiver所在进程正在启动或者处理广播中，此次processNextBroadcastLocked()会退出。等待Receiver所在进程执行完广播后再重新调用进来，并且APP进程端会在sendPendingBroadcastsLocked()中置mPendingBroadcast = null。之后该Receiver的执行流程如下:

```txt
ActivityThread.handleReceiver() ->
BroadcastReceiver.PendingResult.finish() ->
BroadcastReceiver.PendingResult.sendFinished(IActivityManager mgr) ->
AMS.finishReceiver() ->
BroadcastQueue.processNextBroadcastLocked()
```

然后又回到了processNextBroadcastLocked()中，由于mPendingBroadcast = null，所以会继续向下执行发送串行广播的步骤。

```java
// If we are waiting for a process to come up to handle the next
// broadcast, then do nothing at this point.  Just in case, we
// check that the process we're waiting for still exists.
if (mPendingBroadcast != null) {
    if (DEBUG_BROADCAST_LIGHT) Slog.v(TAG_BROADCAST,
            "processNextBroadcast [" + mQueueName + "]: waiting for "
            + mPendingBroadcast.curApp);

    boolean isDead;
    if (mPendingBroadcast.curApp.pid > 0) {  //Receiver所在进程已启动
        synchronized (mService.mPidsSelfLocked) {
            ProcessRecord proc = mService.mPidsSelfLocked.get(
                    mPendingBroadcast.curApp.pid);
            //如果获取到了进程的ProcessRecord对象，且进程没有Crash，则isDead=false
            isDead = proc == null || proc.isCrashing();
        }
    } else {
        final ProcessRecord proc = mService.mProcessList.mProcessNames.get(
                mPendingBroadcast.curApp.processName, mPendingBroadcast.curApp.uid);
        isDead = proc == null || !proc.pendingStart;
    }
    if (!isDead) {
        // It's still alive, so keep waiting
        return;
    } else {
        Slog.w(TAG, "pending app  ["
                + mQueueName + "]" + mPendingBroadcast.curApp
                + " died before responding to broadcast");
        mPendingBroadcast.state = BroadcastRecord.IDLE;
        mPendingBroadcast.nextReceiver = mPendingBroadcastRecvIndex;
        mPendingBroadcast = null;
    }
}
```

### 串行广播-获取BroadcastRecord

然后进入一个do{......}while循环，get并remove串行广播队列mOrderedBroadcasts中的第一个BroadcastRecord对象r = mDispatcher.getNextBroadcastLocked(now)，作一些检查与处理，判断是否需要执行接下来的分发。r可能是第一次处理，可能是部分Receiver已分发过的，也有可能是已经分发完毕的，只有符合条件的BroadcastRecord对象（即r!=null）才能跳出do循环，进入下一步的分发阶段。

- if (r == null){......}：BroadcastRecord对象是否为null，若为null则继续循环；
- if (mService.mProcessesReady && ......){......}：检查是否超时，若超时则进行超时处理，执行broadcastTimeoutLocked方法，然后继续执行；
- if (r.receivers == null||......){......}：检测了广播是否已经发送给了全部的接收者，如果是，则还需要发送一个广播给最后一个接收者(也即是调用发送广播方法时设置的那个接收者)，然后执行cancelBroadcastTimeoutLocked()，取消该广播的超时消息。最后置r = null，重新do循环；
- if (!r.deferred){......}：如果广播既没有超时（r.deferred=false），且还未将广播发送给所有的接收者，在此代码中则执行广播的延时方案（具体请自行了解BroadcastDispatcher.Deferrals类），然后置r = null，重新do循环。此步总结一句话就是要找到下一个广播接收者。

```java
do {
    final long now = SystemClock.uptimeMillis();
    r = mDispatcher.getNextBroadcastLocked(now);  //从队列中取出第一条广播并remove

    if (r == null) {  //若所有广播处理完成，退出
        mDispatcher.scheduleDeferralCheckLocked(false);
        mService.scheduleAppGcsLocked();
        if (looped) {
            mService.updateOomAdjLocked(OomAdjuster.OOM_ADJ_REASON_START_RECEIVER);
        }
        if (mService.mUserController.mBootCompleted && mLogLatencyMetrics) {
            mLogLatencyMetrics = false;
        }
        return;
    }

    boolean forceReceive = false;
    int numReceivers = (r.receivers != null) ? r.receivers.size() : 0;
    //mService.mProcessesReady表示AMS已启动，可以开始接受客户端的请求
    //r.dispatchTime > 0表示当前的BroadcastRecord不是第一次被处理
    if (mService.mProcessesReady && !r.timeoutExempt && r.dispatchTime > 0) {
        //若广播处理超时
        if ((numReceivers > 0) &&
                (now > r.dispatchTime + (2 * mConstants.TIMEOUT * numReceivers))) {
            Slog.w(TAG, "Hung broadcast ["
                    + mQueueName + "] discarded after timeout failure:"
                    + " now=" + now
                    + " dispatchTime=" + r.dispatchTime
                    + " startTime=" + r.receiverTime
                    + " intent=" + r.intent
                    + " numReceivers=" + numReceivers
                    + " nextReceiver=" + r.nextReceiver
                    + " state=" + r.state);
            broadcastTimeoutLocked(false); // 强制结束广播
            forceReceive = true;
            r.state = BroadcastRecord.IDLE;
        }
    }
//.....

    // 如果广播对应的 receivers 为空||广播已经派发完毕||上一个广播接收者调用了abortBroadcast终止了广播||广播超时。满足这些条件表示该广播已经向所有receiver发送结束，或者广播中途被取消
    if (r.receivers == null || r.nextReceiver >= numReceivers
            || r.resultAbort || forceReceive) {
        if (r.resultTo != null) {  // 发送消息给最后一个Receiver
            boolean sendResult = true;
            // ......
            if (sendResult) {
                if (r.callerApp != null) {
                    mService.mOomAdjuster.mCachedAppOptimizer.unfreezeTemporarily(
                            r.callerApp);
                }
                try {  //分发广播消息
                    performReceiveLocked(r.callerApp, r.resultTo,
                            new Intent(r.intent), r.resultCode,
                            r.resultData, r.resultExtras, false, false, r.userId);
                    r.resultTo = null;
                } catch (RemoteException e) {
                    //......
                }
            }
        }
        //移除广播超时消息
        cancelBroadcastTimeoutLocked();

        if (DEBUG_BROADCAST_LIGHT) Slog.v(TAG_BROADCAST,
                "Finished with ordered broadcast " + r);

        // ... and on to the next...
        addBroadcastToHistoryLocked(r);
        if (r.intent.getComponent() == null && r.intent.getPackage() == null
                && (r.intent.getFlags()&Intent.FLAG_RECEIVER_REGISTERED_ONLY) == 0) {
            // This was an implicit broadcast... let's record it for posterity.
            mService.addBroadcastStatLocked(r.intent.getAction(), r.callerPackage,
                    r.manifestCount, r.manifestSkipCount, r.finishTime-r.dispatchTime);
        }
        mDispatcher.retireBroadcastLocked(r);
        r = null;
        looped = true;
        continue;
    }
    // ......
} while (r == null);
```

### 串行广播-分发给动态注册Receiver

对上一步取出的BroadcastRecord对象，取出其待处理的下一个动态注册的Receiver（即BroadcastFilter对象）。通过deliverToRegisteredReceiverLocked()发送给Receiver，由于此处传入的参数是ordered=true，所以会在之后的Args.getRunnable().run()中执行以下栈：

```txt
BroadcastReceiver.PendingResult.finish() ->
BroadcastReceiver.PendingResult.sendFinished(IActivityManager mgr) ->
AMS.finishReceiver() ->
BroadcastQueue.processNextBroadcastLocked()
```

然后又回到了processNextBroadcastLocked()中，对该BroadcastRecord对象进行下一个Receiver的分发。

(1)   获取一个Receiver

```java
int recIdx = r.nextReceiver++;
//......
final Object nextReceiver = r.receivers.get(recIdx);
```

(2)   分发给动态注册的广播接收器

```java
if (nextReceiver instanceof BroadcastFilter) {
    // Simple case: this is a registered receiver who gets
    // a direct call.
    BroadcastFilter filter = (BroadcastFilter)nextReceiver;
    if (DEBUG_BROADCAST)  Slog.v(TAG_BROADCAST,
            "Delivering ordered ["
            + mQueueName + "] to registered "
            + filter + ": " + r);
    deliverToRegisteredReceiverLocked(r, filter, r.ordered, recIdx);
    if (r.receiver == null || !r.ordered) {
        // The receiver has already finished, so schedule to
        // process the next one.
        if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST, "Quick finishing ["
                + mQueueName + "]: ordered="
                + r.ordered + " receiver=" + r.receiver);
        r.state = BroadcastRecord.IDLE;
        scheduleBroadcastsLocked();
    } else {
        if (filter.receiverList != null) {
            maybeAddAllowBackgroundActivityStartsToken(filter.receiverList.app, r);
            // r is guaranteed ordered at this point, so we know finishReceiverLocked()
            // will get a callback and handle the activity start token lifecycle.
        }
        if (brOptions != null && brOptions.getTemporaryAppWhitelistDuration() > 0) {
            scheduleTempWhitelistLocked(filter.owningUid,
                    brOptions.getTemporaryAppWhitelistDuration(), r);
        }
    }
    return;
}
```

执行完deliverToRegisteredReceiverLocked(r, filter, r.ordered, recIdx)后，会退出processNextBroadcastLocked()，之后再由PendingResult.finish()重新调用进来。

 

### 串行广播-静态Receiver权限检查

若该Receiver不是动态注册的Receiver，则代码会执行到此处，接下来就会对该静态注册的Receiver进行分发。

由于涉及到进程启动，以及Android 8.0之后对静态注册的Receiver的诸多限制，此步涉及到大量的权限检查，代码较多，不多说。

不满足条件则当前Receiver会被标记为skip=true，然后跳过分发，调用scheduleBroadcastsLocked()后再return。

```java
ResolveInfo info =
    (ResolveInfo)nextReceiver;
ComponentName component = new ComponentName(
        info.activityInfo.applicationInfo.packageName,
        info.activityInfo.name);

boolean skip = false;  //判断是否跳过此次分发
//接下来进行大量的权限检查
if (!skip && ......) {
    //......
}

//skip=true表示权限检查未通过，然后退出函数，否则继续执行
if (skip) {
    if (DEBUG_BROADCAST)  Slog.v(TAG_BROADCAST,
            "Skipping delivery of ordered [" + mQueueName + "] "
            + r + " for reason described above");
    r.delivery[recIdx] = BroadcastRecord.DELIVERY_SKIPPED;
    r.receiver = null;
    r.curFilter = null;
    r.state = BroadcastRecord.IDLE;
    r.manifestSkipCount++;
    scheduleBroadcastsLocked();
    return;
}
```

### 串行广播-静态Receiver的进程是否启动

若该静态静态Receiver满足分发条件，则在给静态Receiver发送广播前，需要判断该Receiver所在的进程是否启动，此处分为两种情况：

- 进程已启动：通过processCurBroadcastLocked()处理，然后return；
- 进程未启动：调用startProcessLocked()创建进程，若创建成功则置mPendingBroadcast为当前r，mPendingBroadcastRecvIndex为r.receivers中当前Receiver的索引，下次执行processNextBroadcastLocked()时向该进程发送广播。

(1)   进程已启动

之后的调用栈为：

```txt
BroadcastQueue.processCurBroadcastLocked() -> 
ApplicationThread.scheduleReceiver() -> 
Handler机制：sendMessage(H.RECEIVER, r) -> 
ActivityThread.handleReceiver() -> 
receiver.onReceive()
```

```java
// 当前Receiver所在的进程正在运行中，使用processCurBroadcastLocked派发广播
if (app != null && app.thread != null && !app.killed) {
    try {
        app.addPackage(info.activityInfo.packageName,
                info.activityInfo.applicationInfo.longVersionCode, mService.mProcessStats);
        maybeAddAllowBackgroundActivityStartsToken(app, r);
        processCurBroadcastLocked(r, app, skipOomAdj);
        return;
    } catch (RemoteException e) {
        Slog.w(TAG, "Exception when sending broadcast to "
              + r.curComponent, e);
    } catch (RuntimeException e) {
        Slog.wtf(TAG, "Failed sending broadcast to "
                + r.curComponent + " with " + r.intent, e);
        // If some unexpected exception happened, just skip
        // this broadcast.  At this point we are not in the call
        // from a client, so throwing an exception out from here
        // will crash the entire system instead of just whoever
        // sent the broadcast.
        logBroadcastReceiverDiscardLocked(r);
        finishReceiverLocked(r, r.resultCode, r.resultData,
                r.resultExtras, r.resultAbort, false);
        scheduleBroadcastsLocked();
        // We need to reset the state if we failed to start the receiver.
        r.state = BroadcastRecord.IDLE;
        return;
    }

    // If a dead object exception was thrown -- fall through to
    // restart the application.
}
```

然后退出当前processNextBroadcastLocked()，会通过scheduleBroadcastsLocked()重新调用进来。

(1)   进程未启动

如果进程未启动，则启动进程，这里分为两种情况，即进程启动成功或失败。

- 启动失败（r.curApp==null）：打印event log am_broadcast_discard_app -> 结束对当前APP的分发 -> 调用scheduleBroadcastsLocked()重新进入processNextBroadcastLocked()准备下一个Receiver的分发 -> 退出当前processNextBroadcastLocked()；
- 启动成功（r.curApp！=null）：首先启动进程，然后设置mPendingBroadcast = r，当前processNextBroadcastLocked()代码到此完成，之后会由待分发进程重新调用processCurBroadcastLocked()执行mPendingBroadcast流程完成此次分发。

进程启动成功到执行onReceive()的调用栈如下：

```txt
AMS.startProcessLocked() ->
......
ActivityThread.main() ->
ActivityThread.attach() ->
AMS.attachApplication() ->
AMS.attachApplicationLocked() ->
AMS.sendPendingBroadcastsLocked(ProcessRecord app) ->
BroadcastQueue.sendPendingBroadcastsLocked(ProcessRecord app) ->
BroadcastQueue.processCurBroadcastLocked() ->
ApplicationThread.scheduleReceiver(){ sendMessage(H.RECEIVER, r) } ->
ActivityThread.handleReceiver() ->
BroadcastReceiver.onReceive()
```

并且会在AMS.sendPendingBroadcastsLocked()->BQ.sendPendingBroadcastsLocked()中置mPendingBroadcast = null，最后调用到onReceive()中。

执行完onReceive()后，在handleReceiver()中继续向下执行：

```txt
ActivityThread.handleReceiver() ->
BroadcastReceiver.PendingResult.finish() ->
BroadcastReceiver.PendingResult.sendFinished(IActivityManager mgr) ->
AMS.finishReceiver() ->
BroadcastQueue.processNextBroadcastLocked()
```

之后由于mPendingBroadcast = null，于是便不会执行mPendingBroadcast部分的代码，会执行串行广播的下一个Receiver的分发。

```java
//该receiver所对应的进程尚未启动，则启动该进程
if (DEBUG_BROADCAST)  Slog.v(TAG_BROADCAST,
        "Need to start app ["
        + mQueueName + "] " + targetProcess + " for broadcast " + r);
if ((r.curApp=mService.startProcessLocked(targetProcess,
        info.activityInfo.applicationInfo, true,
        r.intent.getFlags() | Intent.FLAG_FROM_BACKGROUND,
        new HostingRecord("broadcast", r.curComponent),
        isActivityCapable ? ZYGOTE_POLICY_FLAG_LATENCY_SENSITIVE : ZYGOTE_POLICY_FLAG_EMPTY,
        (r.intent.getFlags()&Intent.FLAG_RECEIVER_BOOT_UPGRADE) != 0, false, false))
                == null) {
    // 创建失败
    Slog.w(TAG, "Unable to launch app "
            + info.activityInfo.applicationInfo.packageName + "/"
            + receiverUid + " for broadcast "
            + r.intent + ": process is bad");
    logBroadcastReceiverDiscardLocked(r);
    finishReceiverLocked(r, r.resultCode, r.resultData,
            r.resultExtras, r.resultAbort, false);
    scheduleBroadcastsLocked();
    r.state = BroadcastRecord.IDLE;
    return;
}
maybeAddAllowBackgroundActivityStartsToken(r.curApp, r);
mPendingBroadcast = r;
mPendingBroadcastRecvIndex = recIdx;
```

## BroadcastQueue.deliverToRegisteredReceiverLocked()

在该函数中执行将广播分发到已动态注册的Receiver中。同样会进行大量的检查，不满足条件则当前Receiver会被标记为skip=true，然后跳过分发。符合分发条件的进行下一步操作。

deliverToRegisteredReceiverLocked()有一个比较主要的参数ordered，表示是否为串行广播，之后会在该Receiver分发完成后根据ordered参数选择是否再次调用processNextBroadcastLocked()。

之后主要调用performReceiveLocked()。

```java
private void deliverToRegisteredReceiverLocked(BroadcastRecord r,
        BroadcastFilter filter, boolean ordered, int index) {
    boolean skip = false;
    //在这里进行一大堆检查
    if (skip) {
        r.delivery[index] = BroadcastRecord.DELIVERY_SKIPPED;
        return;
    }

    // If permissions need a review before any of the app components can run, we drop
    // the broadcast and if the calling app is in the foreground and the broadcast is
    // explicit we launch the review UI passing it a pending intent to send the skipped
    // broadcast.
    if (!requestStartTargetPermissionsReviewIfNeededLocked(r, filter.packageName,
            filter.owningUserId)) {
        r.delivery[index] = BroadcastRecord.DELIVERY_SKIPPED;
        return;
    }

    r.delivery[index] = BroadcastRecord.DELIVERY_DELIVERED;

    // If this is not being sent as an ordered broadcast, then we
    // don't want to touch the fields that keep track of the current
    // state of ordered broadcasts.
    if (ordered) {
        r.receiver = filter.receiverList.receiver.asBinder();
        r.curFilter = filter;
        filter.receiverList.curBroadcast = r;
        r.state = BroadcastRecord.CALL_IN_RECEIVE;
        if (filter.receiverList.app != null) {
            // Bump hosting application to no longer be in background
            // scheduling class.  Note that we can't do that if there
            // isn't an app...  but we can only be in that case for
            // things that directly call the IActivityManager API, which
            // are already core system stuff so don't matter for this.
            r.curApp = filter.receiverList.app;
            filter.receiverList.app.curReceivers.add(r);
            mService.updateOomAdjLocked(r.curApp, true,
                    OomAdjuster.OOM_ADJ_REASON_START_RECEIVER);
        }
    } else if (filter.receiverList.app != null) {
        mService.mOomAdjuster.mCachedAppOptimizer.unfreezeTemporarily(filter.receiverList.app);
    }

    try {
        if (DEBUG_BROADCAST_LIGHT) Slog.i(TAG_BROADCAST,
                "Delivering to " + filter + " : " + r);
        if (filter.receiverList.app != null && filter.receiverList.app.inFullBackup) {
            // Skip delivery if full backup in progress
            // If it's an ordered broadcast, we need to continue to the next receiver.
            if (ordered) {
                skipReceiverLocked(r);
            }
        } else {
            r.receiverTime = SystemClock.uptimeMillis();
            maybeAddAllowBackgroundActivityStartsToken(filter.receiverList.app, r);
            performReceiveLocked(filter.receiverList.app, filter.receiverList.receiver,
                    new Intent(r.intent), r.resultCode, r.resultData,
                    r.resultExtras, r.ordered, r.initialSticky, r.userId);
            // parallel broadcasts are fire-and-forget, not bookended by a call to
            // finishReceiverLocked(), so we manage their activity-start token here
            if (r.allowBackgroundActivityStarts && !r.ordered) {
                postActivityStartTokenRemoval(filter.receiverList.app, r);
            }
        }
        if (ordered) {
            r.state = BroadcastRecord.CALL_DONE_RECEIVE;
        }
    } catch (RemoteException e) {
        Slog.w(TAG, "Failure sending broadcast " + r.intent, e);
        // Clean up ProcessRecord state related to this broadcast attempt
        if (filter.receiverList.app != null) {
            filter.receiverList.app.removeAllowBackgroundActivityStartsToken(r);
            if (ordered) {
                filter.receiverList.app.curReceivers.remove(r);
            }
        }
        // And BroadcastRecord state related to ordered delivery, if appropriate
        if (ordered) {
            r.receiver = null;
            r.curFilter = null;
            filter.receiverList.curBroadcast = null;
        }
    }
}
```

## BroadcastQueue.performReceiveLocked()

```java
void performReceiveLocked(ProcessRecord app, IIntentReceiver receiver,
        Intent intent, int resultCode, String data, Bundle extras,
        boolean ordered, boolean sticky, int sendingUser)
        throws RemoteException {
    // Send the intent to the receiver asynchronously using one-way binder calls.
    if (app != null) {
        if (app.thread != null) {
            // If we have an app thread, do the call through that so it is
            // correctly ordered with other one-way calls.
            try {
                app.thread.scheduleRegisteredReceiver(receiver, intent, resultCode,
                        data, extras, ordered, sticky, sendingUser, app.getReportedProcState());
            // TODO: Uncomment this when (b/28322359) is fixed and we aren't getting
            // DeadObjectException when the process isn't actually dead.
            //} catch (DeadObjectException ex) {
            // Failed to call into the process.  It's dying so just let it die and move on.
            //    throw ex;
            } catch (RemoteException ex) {
                // Failed to call into the process. It's either dying or wedged. Kill it gently.
                synchronized (mService) {
                    Slog.w(TAG, "Can't deliver broadcast to " + app.processName
                            + " (pid " + app.pid + "). Crashing it.");
                    app.scheduleCrash("can't deliver broadcast");
                }
                throw ex;
            }
        } else {
            // Application has died. Receiver doesn't exist.
            throw new RemoteException("app.thread must not be null");
        }
    } else {
        receiver.performReceive(intent, resultCode, data, extras, ordered,
                sticky, sendingUser);
    }
}
```

接下来主要调用ActivityThread.ApplicationThread.scheduleRegisteredReceiver()。

## ApplicationThread.scheduleRegisteredReceiver()

这里调用的receiver是一个IIntentReceiver接口。

```java
// This function exists to make sure all receiver dispatching is
// correctly ordered, since these are one-way calls and the binder driver
// applies transaction ordering per object for such calls.
public void scheduleRegisteredReceiver(IIntentReceiver receiver, Intent intent,
        int resultCode, String dataStr, Bundle extras, boolean ordered,
        boolean sticky, int sendingUser, int processState) throws RemoteException {
    updateProcessState(processState, false);
    receiver.performReceive(intent, resultCode, dataStr, extras, ordered,
            sticky, sendingUser);
}
```

IIntentReceiver的具体实现在LoadedApk.java，其实现类为LoadedApk.ReceiverDispatcher.InnerReceiver。

ReceiverDispatcher是LoadedApk的静态内部类。InnerReceiver是ReceiverDispatcher的静态内部类，实现了IIntentReceiver.Stub接口。

## InnerReceiver.performReceive()

源码路径：frameworks/base/core/java/android/app/LoadedApk.java

rd是一个LoadedApk.ReceiverDispatcher对象，这里调用其performReceive()。

```java
public void performReceive(Intent intent, int resultCode, String data,
        Bundle extras, boolean ordered, boolean sticky, int sendingUser) {
    final LoadedApk.ReceiverDispatcher rd;
    if (intent == null) {
        Log.wtf(TAG, "Null intent received");
        rd = null;
    } else {
        rd = mDispatcher.get();
    }
    if (ActivityThread.DEBUG_BROADCAST) {
        int seq = intent.getIntExtra("seq", -1);
        Slog.i(ActivityThread.TAG, "Receiving broadcast " + intent.getAction()
                + " seq=" + seq + " to " + (rd != null ? rd.mReceiver : null));
    }
    if (rd != null) {
        rd.performReceive(intent, resultCode, data, extras,
                ordered, sticky, sendingUser);
    } else {
        // The activity manager dispatched a broadcast to a registered
        // receiver in this process, but before it could be delivered the
        // receiver was unregistered.  Acknowledge the broadcast on its
        // behalf so that the system's broadcast sequence can continue.
        if (ActivityThread.DEBUG_BROADCAST) Slog.i(ActivityThread.TAG,
                "Finishing broadcast to unregistered receiver");
        IActivityManager mgr = ActivityManager.getService();
        try {
            if (extras != null) {
                extras.setAllowFds(false);
            }
            mgr.finishReceiver(this, resultCode, data, extras, false, intent.getFlags());
        } catch (RemoteException e) {
            throw e.rethrowFromSystemServer();
        }
    }
}
```

## ReceiverDispatcher.performReceive()

源码路径：frameworks/base/core/java/android/app/LoadedApk.java

Args类继承自BroadcastReceiver.PendingResult类，并实现了Runnable接口。这里将intent及广播相关参数封装到Args类中，而Args类实现了Runnable接口，然后通过消息机制将args发送到对应线程的Handler中。最后执行args的Runnable接口函数。

```java
public void performReceive(Intent intent, int resultCode, String data,
        Bundle extras, boolean ordered, boolean sticky, int sendingUser) {
    final Args args = new Args(intent, resultCode, data, extras, ordered,
            sticky, sendingUser);
    if (intent == null) {
        Log.wtf(TAG, "Null intent received");
    } else {
        if (ActivityThread.DEBUG_BROADCAST) {
            int seq = intent.getIntExtra("seq", -1);
            Slog.i(ActivityThread.TAG, "Enqueueing broadcast " + intent.getAction()
                    + " seq=" + seq + " to " + mReceiver);
        }
    }
    if (intent == null || !mActivityThread.post(args.getRunnable())) {
        if (mRegistered && ordered) {
            IActivityManager mgr = ActivityManager.getService();
            if (ActivityThread.DEBUG_BROADCAST) Slog.i(ActivityThread.TAG,
                    "Finishing sync broadcast to " + mReceiver);
            args.sendFinished(mgr);
        }
    }
}
```

这里的ordered判断条件是实现串行广播的关键，在这里通过调用

```
args.sendFinished(mgr) ->
AMS.finishReceiver() ->
BroadcastQueue.processNextBroadcastLocked()
```

然后又回到了processNextBroadcastLocked()中，使得串行广播真正地能够一个接一个地分发到Receiver中。

## Args.getRunnable().run()

源码路径：frameworks/base/core/java/android/app/LoadedApk.java

这里调用BroadcastReceiver具体实现类的onReceive()方法。

```java
final class Args extends BroadcastReceiver.PendingResult {
    private Intent mCurIntent;
    private final boolean mOrdered;
    private boolean mDispatched;
    private boolean mRunCalled;

    public Args(Intent intent, int resultCode, String resultData, Bundle resultExtras,
            boolean ordered, boolean sticky, int sendingUser) {
        super(resultCode, resultData, resultExtras,
                mRegistered ? TYPE_REGISTERED : TYPE_UNREGISTERED, ordered,
                sticky, mIIntentReceiver.asBinder(), sendingUser, intent.getFlags());
        mCurIntent = intent;
        mOrdered = ordered;
    }

    public final Runnable getRunnable() {
        return () -> {
            final BroadcastReceiver receiver = mReceiver;
            final boolean ordered = mOrdered;
            //......
            if (receiver == null || intent == null || mForgotten) {
                if (mRegistered && ordered) {
                    if (ActivityThread.DEBUG_BROADCAST) Slog.i(ActivityThread.TAG,
                            "Finishing null broadcast to " + mReceiver);
                    sendFinished(mgr);
                }
                return;
            }

            Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "broadcastReceiveReg");
            try {
                ClassLoader cl = mReceiver.getClass().getClassLoader();
                intent.setExtrasClassLoader(cl);
                intent.prepareToEnterProcess();
                setExtrasClassLoader(cl);
                receiver.setPendingResult(this);
                receiver.onReceive(mContext, intent);
            } catch (Exception e) {
                if (mRegistered && ordered) {
                    if (ActivityThread.DEBUG_BROADCAST) Slog.i(ActivityThread.TAG,
                            "Finishing failed broadcast to " + mReceiver);
                    sendFinished(mgr);
                }
                if (mInstrumentation == null ||
                        !mInstrumentation.onException(mReceiver, e)) {
                    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
                    throw new RuntimeException(
                            "Error receiving broadcast " + intent
                                    + " in " + mReceiver, e);
                }
            }

            if (receiver.getPendingResult() != null) {
                finish();
            }
            Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
        };
    }
}
```

## BroadcastReceiver.onReceive()

接下来便是执行用户自定义的处理广播的onReceive()函数了，注意不要在这里执行耗时任务，否则会报出广播超时的ANR（Broadcast of Intent {...}）。也会导致串行广播中下一个Receiver的执行时间延时。

到此为止，一个动态注册的有序广播的Receiver的分发完毕，其它不同类型的广播在processNextBroadcastLocked()走不同的分支。

```java
public class MyReceiver extends BroadcastReceiver {
    String TAG = "BroadcastReceiver";
    String myAction1 = "com.example.broadcast.MY_BROADCAST1";
    String myAction2 = "com.example.broadcast.MY_BROADCAST2";

    static final IntentFilter intentFilter = new IntentFilter();

    static {
        intentFilter.addAction("com.example.broadcast.MY_BROADCAST1");
        intentFilter.addAction("com.example.broadcast.MY_BROADCAST2");
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (myAction1.equals(action)) {
            //...
            Log.d("BroadcastReceiver", context + " get the Broadcast1");
        } else if (myAction2.equals(action)) {
            //...
            Log.d("BroadcastReceiver", context + " get the Broadcast2");
        }
    }

    public void register(Context context) {
        context.registerReceiver(this, intentFilter);
        Log.d(TAG, context + " 注册广播");
    }
}
```

# 其它

 

## 广播处理中的相关队列

前台广播队列

| 名称                   | 类型                           | 说明                                                      |
| ---------------------- | ------------------------------ | --------------------------------------------------------- |
| mRegisteredReceivers   | HashMap<IBinder, ReceiverList> | AMS成员，存储的是系统中所有进程的动态注册的Receivers      |
| mReceiverResolver      | IntentResolver<BF, BF>         | AMS成员，存储的是所有动态注册的Receiver的BroadcastFilter  |
| mFgBroadcastQueue      | BroadcastQueue对象             | AMS成员，保存前台广播，                                   |
| mBgBroadcastQueue      | BroadcastQueue对象             | AMS成员，保存后台广播                                     |
| mOffloadBroadcastQueue | BroadcastQueue对象             |                                                           |
|                        |                                |                                                           |
| mParallelBroadcasts    | ArrayList<BroadcastRecord>     | BroadcastQueue成员，保存并行广播                          |
| mOrderedBroadcasts     | ArrayList<BroadcastRecord>     | BroadcastDispatcher成员，保存串行广播                     |
| mDeferredBroadcasts    | ArrayList<Deferrals>           | BroadcastDispatcher成员，延期广播                         |
| mAlarmBroadcasts       | ArrayList<Deferrals>           | BroadcastDispatcher成员，与定时任务相关的广播，优先级最高 |
|                        |                                |                                                           |

 

优先级：mAlarmBroadcasts>mDeferredBroadcasts>mParallelBroadcasts，从getNextBroadcastLocked()中取出BroadcastRecord对象的顺序就可以看出。

## BroadcastDispatcher

BroadcastDispatcher类是用来管理串行广播的，串行广播队列mOrderedBroadcasts就是该类的成员。

| 成员变量                                              | 说明                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| static class Deferrals{...}                           | 表示一个延迟Receiver所在uid及其相关参数                      |
| SparseIntArray mAlarmUids                             | SparseIntArray有两个主要成员，int mKeys[]和int mValues[]，此处的mAlarmUids中,mKeys存储uid，mValues存储对应下标的uid的延迟次数 |
| AlarmManagerInternal.InFlightListener  mAlarmListener |                                                              |
| ArrayList<BroadcastRecord>  mOrderedBroadcasts        | 串行广播队列                                                 |
| ArrayList<Deferrals>   mDeferredBroadcasts            | 延迟广播队列，根据deferUntil（延迟到哪个时刻）排序，越小越靠前 |
| ArrayList<Deferrals>   mAlarmBroadcasts               | 保存来自Alarm的广播(与AlarmManagerService相关)，这类广播对时间的准确性要求较高，所以优先级最高，如闹钟等 |
| BroadcastRecord  mCurrentBroadcast                    | 当前正在处理的广播                                           |
