---
layout: post
# 标题配置
title:  Broadcast概述

# 时间配置
date:   2021-09-01

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


# 概述

## 广播的使用方法

(1)	接收端注册广播监听器
```java
public class MainActivity extends AppCompatActivity {

    private IntentFilter intentFilter;
    private MyReceiver myReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
		//......

        //定义过滤器，想要监听什么广播，就添加相应的Action
        intentFilter = new IntentFilter();
        intentFilter.addAction("com.example.broadcast.MY_BROADCAST");
        intentFilter.setPriority(10);

        //定义广播处理类
        myReceiver = new MyReceiver();
        //注册本地广播监听器
        registerReceiver(myReceiver, intentFilter);
    }
	//......
}
```
注册前也可以设置权限或优先级。

## 广播的超时时间

广播的超时时间在ActivityManagerService中根据广播的不同类型（前台和后台）进行设置的，代码位于AMS的构造函数中。参数位于BroadcastConstants类中，BroadcastConstants对象用于保存广播调度策略的相关参数。

BROADCAST_FG_TIMEOUT表示前台广播的超时时间为10s，BROADCAST_BG_TIMEOUT表示后台广播的超时时间为60s。

```java
// How long we allow a receiver to run before giving up on it.
static final int BROADCAST_FG_TIMEOUT = 10*1000;
static final int BROADCAST_BG_TIMEOUT = 60*1000;

public ActivityManagerService(Context systemContext, ActivityTaskManagerService atm) {
    //...
    // Broadcast policy parameters
    final BroadcastConstants foreConstants = new BroadcastConstants(
            Settings.Global.BROADCAST_FG_CONSTANTS);
    foreConstants.TIMEOUT = BROADCAST_FG_TIMEOUT;

    final BroadcastConstants backConstants = new BroadcastConstants(
            Settings.Global.BROADCAST_BG_CONSTANTS);
    backConstants.TIMEOUT = BROADCAST_BG_TIMEOUT;

    final BroadcastConstants offloadConstants = new BroadcastConstants(
            Settings.Global.BROADCAST_OFFLOAD_CONSTANTS);
    offloadConstants.TIMEOUT = BROADCAST_BG_TIMEOUT;
    // by default, no "slow" policy in this queue
    offloadConstants.SLOW_TIME = Integer.MAX_VALUE;

    mEnableOffloadQueue = SystemProperties.getBoolean(
            "persist.device_config.activity_manager_native_boot.offload_queue_enabled", false);

    mFgBroadcastQueue = new BroadcastQueue(this, mHandler,
            "foreground", foreConstants, false);
    mBgBroadcastQueue = new BroadcastQueue(this, mHandler,
            "background", backConstants, true);
    mOffloadBroadcastQueue = new BroadcastQueue(this, mHandler,
            "offload", offloadConstants, true);
    //...
}

```
## 有|无序、并|串行

开发者只需要注意在发送时定义广播是否有序（通过sendBroadcast或sendOrderedBroadcast发送），而广播的并行与串行处理由Android系统完成，但也与广播是否有序有关。

```java
Intent intent = new Intent();
intent.setAction("com.example.broadcast.ACTION1");
sendBroadcast(intent);		//无序广播
sendOrderedBroadcast(intent, null);	//有序广播
```
通常一条广播对应多个Receiver。并行处理是指针对某一条广播，一次性（在一个for循环中）发送给所有的广播接收器。串行处理是指对某一条广播，一次发送给其中一个Receiver（按照权限顺序），然后再发送下一条。串行处理有ANR机制。
网上的大量资料并没太注意并行、串行处理与有序、无序广播的区别，经常将术语混用，需注意区分。

当使用sendOrderedBroadcast()发送有序广播(ordered=true)时：

- 静态注册的广播接收者(receivers)，采用串行处理；
- 动态注册的广播接收者(registeredReceivers)，采用串行处理；
- 然后对receivers和registeredReceivers按优先级合并到receivers中再一个接一个地分发。

当使用sendBroadcast()发送无序广播(ordered=false)时：

- 静态注册的广播接收者(receivers)，依然采用串行处理；
- 动态注册的广播接收者(registeredReceivers)，采用并行处理；
- 先将广播向registeredReceivers中的接收者分发出去，再向receivers中的接收者一个接一个地进行分发。

AMS类中有前台广播队列mFgBroadcastQueue和后台广播队列mBgBroadcastQueue，它们都是BroadcastQueue对象。而BroadcastQueue类中又有mParallelBroadcasts队列和mOrderedBroadcasts队列，它们是ArrayList<BroadcastRecord>对象。
并行处理的广播在mParallelBroadcasts队列中，串行处理的广播在mOrderedBroadcasts队列中。

## 前台广播和后台广播的区别

(1)   发送时的定义方式

前台广播需要添加flag，不添加flag的默认都是后台广播。

```java
Intent intent = new Intent();
intent.setAction("com.example.broadcast.ACTION1");
intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);
sendBroadcast(intent);
```

(1)   串行广播的ANR时间不同

前台广播的ANR时间是10s，后台广播的ANR时间是60s。

广播及超时参数在构造AMS时确定。

```java
// Broadcast policy parameters
final BroadcastConstants foreConstants = new BroadcastConstants(
        Settings.Global.BROADCAST_FG_CONSTANTS);
foreConstants.TIMEOUT = BROADCAST_FG_TIMEOUT;  // 10s

final BroadcastConstants backConstants = new BroadcastConstants(
        Settings.Global.BROADCAST_BG_CONSTANTS);
backConstants.TIMEOUT = BROADCAST_BG_TIMEOUT;  // 60s
```

从BroadcastConstants参数对象的构造上可以看出，前台广播队列和后台广播队列最大的区别就是在ANR时间上。

使用建议：

前台广播队列通常比较空闲，如果希望广播能够尽快地被接收，那么可以添加前台flag。但同时开发者也必须限制前台广播的数量，而且在接收端不能有耗时操作。

## Broadcast相关的flag

位置：frameworks/base/core/java/android/content/Intent.java

添加Flag方法：

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.MY_BROADCAST");
intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);
sendBroadcast(intent);
```

| Flag                                      | 说明                                         |
| ----------------------------------------- | -------------------------------------------- |
| FLAG_RECEIVER_REGISTERED_ONLY             | 只允许已注册receiver接收广播                 |
| FLAG_RECEIVER_REPLACE_PENDING             | 新广播会替代相同广播                         |
| FLAG_RECEIVER_FOREGROUND                  | 发送前台广播                                 |
| FLAG_RECEIVER_NO_ABORT                    | 对于有序广播，先接收到的receiver无权抛弃广播 |
| FLAG_RECEIVER_REGISTERED_ONLY_BEFORE_BOOT | Boot完成之前，只允许已注册receiver接收广播   |
| FLAG_RECEIVER_BOOT_UPGRADE                | 升级模式下，允许系统准备就绪前可以发送广播   |

# Broadcast相关类

## BroadcastRecord类

发送广播后，在AMS.broadcastIntentLocked()中对intent进行一些列处理后，将相关参数封装到BroadcastRecord中。BroadcastRecord就是AMS分发广播时主要的处理对象。其重要属性如下：

| 成员变量                     | 说明                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| Intent intent                | //构造广播的原始Intent  Intent intent =new Intent();  intent.setAction("com.example.broadcast.MY_BROADCAST");  sendBroadcast(intent); |
| ComponentName targetComp     | 显式广播的目标组件                                           |
| ProcessRecord callerApp      | 发送广播的进程                                               |
| String callerFeatureId       | 发送广播所在package的feature                                 |
| int callingPid               | 发送广播的pid                                                |
| int callingUid               | 发送广播的uid                                                |
| String[] requiredPermissions | 该广播需要的权限                                             |
| int nextReceiver             | 下一个要派发的Receiver在receivers中的索引，从0开始  Object nextReceiver =  r.receivers.get(r.nextReceiver) |
| List receivers               | 该广播的接收器列表，包括动态注册(BroadcastFilter)和静态注册(ResolveInfo) |
| IIntentReceiver resultTo     | 最后一个处理广播的Receiver                                   |
| long enqueueClockTime        | 广播入队列时间点                                             |
| long dispatchTime            | 广播分发时间点，值等于SystemClock.uptimeMillis()             |
| long dispatchClockTime       | 广播分发时间点，值等于System.currentTimeMillis()             |
| long receiverTime            | 当前receiver开始处理时间点                                   |
| long finishTime              | 当前广播处理完成时间点                                       |
|                              |                                                              |


```java
final class BroadcastRecord extends Binder {
    final Intent intent;    // the original intent that generated us
    final ComponentName targetComp; // original component name set on the intent
    final ProcessRecord callerApp; // process that sent this
    final String callerPackage; // who sent this
    final @Nullable String callerFeatureId; // which feature in the package sent this
    final int callingPid;   // the pid of who sent this
    final int callingUid;   // the uid of who sent this
    final boolean callerInstantApp; // caller is an Instant App?
    final boolean ordered;  // serialize the send to receivers?
    final boolean sticky;   // originated from existing sticky data?
    final boolean initialSticky; // initial broadcast from register to sticky?
    final int userId;       // user id this broadcast was for
    final String resolvedType; // the resolved data type
    final String[] requiredPermissions; // permissions the caller has required
    final int appOp;        // an app op that is associated with this broadcast
    final BroadcastOptions options; // BroadcastOptions supplied by caller
    final List receivers;   // contains BroadcastFilter and ResolveInfo
    final int[] delivery;   // delivery state of each receiver
    final long[] duration;   // duration a receiver took to process broadcast
    IIntentReceiver resultTo; // who receives final result if non-null
    boolean deferred;
    int splitCount;         // refcount for result callback, when split
    int splitToken;         // identifier for cross-BroadcastRecord refcount
    long enqueueClockTime;  // the clock time the broadcast was enqueued
    long dispatchTime;      // when dispatch started on this set of receivers
    long dispatchClockTime; // the clock time the dispatch started
    long receiverTime;      // when current receiver started for timeouts.
    long finishTime;        // when we finished the broadcast.
    boolean timeoutExempt;  // true if this broadcast is not subject to receiver timeouts
    int resultCode;         // current result code value.
    String resultData;      // current result data value.
    Bundle resultExtras;    // current result extra data values.
    boolean resultAbort;    // current result abortBroadcast value.
    int nextReceiver;       // next receiver to be executed.
    IBinder receiver;       // who is currently running, null if none.
    int state;
    int anrCount;           // has this broadcast record hit any ANRs?
    int manifestCount;      // number of manifest receivers dispatched.
    int manifestSkipCount;  // number of manifest receivers skipped.
    BroadcastQueue queue;   // the outbound queue handling this broadcast

    // if set to true, app's process will be temporarily whitelisted to start activities
    // from background for the duration of the broadcast dispatch
    final boolean allowBackgroundActivityStarts;

    static final int IDLE = 0;
    static final int APP_RECEIVE = 1;
    static final int CALL_IN_RECEIVE = 2;
    static final int CALL_DONE_RECEIVE = 3;
    static final int WAITING_SERVICES = 4;

    static final int DELIVERY_PENDING = 0;
    static final int DELIVERY_DELIVERED = 1;
    static final int DELIVERY_SKIPPED = 2;
    static final int DELIVERY_TIMEOUT = 3;

    // The following are set when we are calling a receiver (one that
    // was found in our list of registered receivers).
    BroadcastFilter curFilter;

    // The following are set only when we are launching a receiver (one
    // that was found by querying the package manager).
    ProcessRecord curApp;       // hosting application of current receiver.
    ComponentName curComponent; // the receiver class that is currently running.
    ActivityInfo curReceiver;   // info about the receiver that is currently running.

    // Private refcount-management bookkeeping; start > 0
    static AtomicInteger sNextToken = new AtomicInteger(1);
    //......
}
```

## BroadcastFilter类

BroadcastFilter继承自IntentFilter类，IntentFilter实现了Parcelable接口。每一个动态注册的Receiver都至少与一个IntentFilter进行关联：

registerReceiver(receiver, intentFilter);

构造BroadcastFilter对象需要一个IntentFilter对象，所以BroadcastFilter对象可以理解为system端（AMS）中的IntentFilter，也是对IntentFilter的进一步封装，即作为接收器筛选广播的过滤器。每调用一次registerReceiver()就会生成一个BroadcastFilter对象。

| 关键属性                  | 说明                                    |
| ------------------------- | --------------------------------------- |
| ReceiverList receiverList | 包含本BroadcastFilter所属Receiver的     |
| String packageName        | 所属包名                                |
| String requiredPermission | 给该BroadcastFilter发送广播所需要的权限 |
| int owningUid             | 所属者uid                               |
| int owningUserId          | UserId                                  |

BroadcastFilter对象在AMS.registerReceiverWithFeature()中创建。

```java
BroadcastFilter bf = new BroadcastFilter(filter, rl, callerPackage, callerFeatureId,
         permission, callingUid, userId, instantApp, visibleToInstantApps);
```

BroadcastFilter主要代码如下：

```java
final class BroadcastFilter extends IntentFilter {
    // Back-pointer to the list this filter is in.
    final ReceiverList receiverList;
    final String packageName;
    final String featureId;
    final String requiredPermission;
    final int owningUid;
    final int owningUserId;
    final boolean instantApp;
    final boolean visibleToInstantApp;

    BroadcastFilter(IntentFilter _filter, ReceiverList _receiverList,
            String _packageName, String _featureId, String _requiredPermission, int _owningUid, int _userId,
            boolean _instantApp, boolean _visibleToInstantApp) {
        super(_filter);
        receiverList = _receiverList;
        packageName = _packageName;
        featureId = _featureId;
        requiredPermission = _requiredPermission;
        owningUid = _owningUid;
        owningUserId = _userId;
        instantApp = _instantApp;
        visibleToInstantApp = _visibleToInstantApp;
    }
    public void dumpDebug(ProtoOutputStream proto, long fieldId) {......}
    public void dump(PrintWriter pw, String prefix) {......}
    public void dumpBrief(PrintWriter pw, String prefix) {......}
    public void dumpInReceiverList(PrintWriter pw, Printer pr, String prefix) {......}
    void dumpBroadcastFilterState(PrintWriter pw, String prefix) {......}
    public String toString() {......}
}

public class IntentFilter implements Parcelable {......}
```

BroadcastFilter在动态广播注册过程中，在AMS.registerReceiverWithFeature()中进行构造，构造如下：

```java
public Intent registerReceiverWithFeature(IApplicationThread caller, String callerPackage,
        String callerFeatureId, IIntentReceiver receiver, IntentFilter filter,
        String permission, int userId, int flags) {
  //...
    BroadcastFilter bf = new BroadcastFilter(filter, rl, callerPackage, callerFeatureId,
            permission, callingUid, userId, instantApp, visibleToInstantApps);
}
```

所以BroadcastFilter是在IntentFilter的基础上，多记录了receiverList 、callerPackage、permission等信息，是对IntentFilter的进一步包装。

BroadcastFilter对象的序列化：

```java
public String toString() {
    if (stringName != null) {
        return stringName;
    }
    StringBuilder sb = new StringBuilder(128);
    sb.append("ReceiverList{");
    sb.append(Integer.toHexString(System.identityHashCode(this)));
    sb.append(' ');
    sb.append(pid);
    sb.append(' ');
    sb.append((app != null ? app.processName : "(unknown name)"));
    sb.append('/');
    sb.append(uid);
    sb.append("/u");
    sb.append(userId);
    sb.append((receiver.asBinder() instanceof Binder) ? " local:" : " remote:");
    sb.append(Integer.toHexString(System.identityHashCode(receiver.asBinder())));
    sb.append('}');
    return stringName = sb.toString();
}
```

## ResolveInfo类

对于静态注册的广播接收器，每个intent-filter标签对应一个ResolveInfo对象。ResolveInfo是从PKMS处查到的静态Receiver的描述信息，它来自PKMS分析的那些AndroidManifest.xml文件。

ResolveInfo实现了Parcelable接口。

```java
public class ResolveInfo implements Parcelable {
    //......
    public void dump(Printer pw, String prefix) {...}
    public void dump(Printer pw, String prefix, int dumpFlags) {...}
    public ResolveInfo() {
        targetUserId = UserHandle.USER_CURRENT;
    }

    public ResolveInfo(ResolveInfo orig) {
        activityInfo = orig.activityInfo;
        serviceInfo = orig.serviceInfo;
        providerInfo = orig.providerInfo;
        filter = orig.filter;
        priority = orig.priority;
        preferredOrder = orig.preferredOrder;
        match = orig.match;
        specificIndex = orig.specificIndex;
        labelRes = orig.labelRes;
        nonLocalizedLabel = orig.nonLocalizedLabel;
        icon = orig.icon;
        resolvePackageName = orig.resolvePackageName;
        noResourceId = orig.noResourceId;
        iconResourceId = orig.iconResourceId;
        system = orig.system;
        targetUserId = orig.targetUserId;
        handleAllWebDataURI = orig.handleAllWebDataURI;
        isInstantAppAvailable = orig.isInstantAppAvailable;
    }
    public String toString() {...}
    public void writeToParcel(Parcel dest, int parcelableFlags) {...}
    private ResolveInfo(Parcel source) {...}
    public static class DisplayNameComparator implements Comparator<ResolveInfo> {...}
}
```

## IIntentReceiver类

IIntentReceiver是一个Binder接口，用于广播的跨进程的通信，它在LoadedApk.ReceiverDispatcher.InnerReceiver中实现。在ContextImpl.registerReceiverInternal()进行初始化：

```java
rd = new LoadedApk.ReceiverDispatcher(
           receiver, context, scheduler, null, true).getIIntentReceiver()
```

返回IIntentReceiver实例。

注册广播是一个跨进程过程，需要具有跨进程的通信功能的IIntentReceiver。可以将IIntentReceiver对象理解为一个可以跨进程的序列化的Receiver。

ReceiverList继承自ArrayList<BroadcastFilter>，BroadcastFilter对象是对一个动态注册的Receiver对应的IntentFilter的封装，每个Receiver中可以有一个或多个IntentFilter（意图过滤器，表示每个Receiver可以处理多种不同类型的广播）。

ReceiverList可以理解为包含所在APP相关信息的、在AMS端使用的Receiver。

| 关键属性                      | 说明                                    |
| ----------------------------- | --------------------------------------- |
| IIntentReceiver receiver      | 可以跨进程调用的Receiver                |
| ProcessRecord app             | 所属进程                                |
| int pid                       | 所属进程pid                             |
| int uid                       | 所属包的uid                             |
| int userId                    | 用户id                                  |
| BroadcastRecord  curBroadcast | 当前BroadcastRecord对象会向自己发送广播 |


ReceiverList对象在AMS.registerReceiverWithFeature()中通过IIntentReceiver对象和其它参数构造。

```java
/**
 * A receiver object that has registered for one or more broadcasts.
 * The ArrayList holds BroadcastFilter objects.
 */
final class ReceiverList extends ArrayList<BroadcastFilter>
        implements IBinder.DeathRecipient {
    final ActivityManagerService owner;
    public final IIntentReceiver receiver;
    public final ProcessRecord app;
    public final int pid;
    public final int uid;
    public final int userId;
    BroadcastRecord curBroadcast = null;
    boolean linkedToDeath = false;

    String stringName;

    ReceiverList(ActivityManagerService _owner, ProcessRecord _app,
            int _pid, int _uid, int _userId, IIntentReceiver _receiver) {
        owner = _owner;
        receiver = _receiver;
        app = _app;
        pid = _pid;
        uid = _uid;
        userId = _userId;
    }

    public boolean equals(Object o) {...}
    public int hashCode() {...}
    public void binderDied() {...}
    public boolean containsFilter(IntentFilter filter) {...}
    void dumpDebug(ProtoOutputStream proto, long fieldId) {...}
    void dumpLocal(PrintWriter pw, String prefix) {...}
    void dump(PrintWriter pw, String prefix) {...}
    public String toString() {...}
}
```

## BroadcastFilter与ReceiverList关系

```java
//定义广播处理类
MyReceiver myReceiver1 = new MyReceiver();

intentFilter1 = new IntentFilter();  //定义过滤器，想要监听什么广播，就添加相应的Action
intentFilter1.addAction("com.example.broadcast.MY_BROADCAST1");
registerReceiver(myReceiver1, intentFilter1);  //注册广播监听器

intentFilter2 = new IntentFilter();
intentFilter2.addAction("com.example.broadcast.MY_BROADCAST2");
registerReceiver(myReceiver1, intentFilter1);
```

如上，BroadcastFilter是一个存在于AMS端的IntentFilter对象，ReceiverList对象可以看作是一个Receiver（代码中的MyReceiver对象），所以一个ReceiverList对象包含了一个Receiver的所有的IntentFilter，同时也包含了所在进程的相关信息（如APP、Pid等）。

而IntentFilter对象也包含了ReceiverList的引用，AMS中是使用BroadcastFilter将广播分发到目标Receiver的，也是通过BroadcastFilter.receiverList获取到目标Receiver的相关信息的，如filter.receiverList.app（目标Receiver所在进程），filter.receiverList.pid（目标Receiver的pid）, filter.receiverList.uid（目标Receiver的uid）等。