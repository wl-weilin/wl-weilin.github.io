---
layout: post
# 标题配置
title:  Broadcast-概述

# 时间配置
date:   2022-09-01

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

## 广播分类

[Android中广播的分类](https://blog.csdn.net/Yrainy_D/article/details/113562395) 

(1)   普通广播与有序广播

- 普通广播：广播发出之后，所有的广播接收器几乎都会在同一时刻接收到这条广播消息，因此它们之间没有任何先后顺序。也意味着接受器不能对收到的广播做任何处理,也不能截断广播继续传播。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/Broadcast概述1.png" alt="Broadcast概述1.png" style="zoom:80%" />
</div>

普通广播用sendBroadcast()发送：

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.MY_BROADCAST1");
sendBroadcast(intent);
```

- 有序广播：在广播发出之后，同一时刻只会有一个广播接收器能够收到这条广播消息，当这个广播接收器中的逻辑执行完毕后，广播才会继续传递。 所以此时的广播接收器是有先后顺序的，优先级高的广播接收器就可以先收到广播消息，并且前面的广播接收器还可以截断正在传递的广播，这样后面的广播接收器就无法收到广播消息了。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/Broadcast概述2.png" alt="Broadcast概述2.png" style="zoom:80%" />
</div>

有序广播用sendOrderedBroadcast()发送，第2个参数为权限：

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.MY_BROADCAST1");
sendOrderedBroadcast(intent,null);
```

<br/>

(2)   前台广播与后台广播

[Broadcast之前/后台广播队列](https://blog.csdn.net/weixin_33716557/article/details/88007448) 

发送广播时，可以通过设置Intent.FLAG_RECEIVER_FOREGROUND属性来将广播定义为前台广播，如果未定义，默认使用后台广播。

前台广播与后台广播主要用三个方面的区别：名称、超时时间以及mDelayBehindServices的值。

- 超时时间：前台广播超时时间为10s，后台广播超时时间为60s。一旦发生超时，就会进入broadcastTimeoutLocked方法，触发ANR。
- mDelayBehindServices，它对有序广播会有一定的影响。如果该变量为true，那么BroadcastQueue就可能陷入一种名为WAITING_SERIVCES的状态。相关代码在BroadcastQueue.finishReceiverLocked方法中(广播派发成功之后由接收者回调AMS时触发)。

<br/>

(3)   系统广播

系统内置的一些广播Action。

<br/>

(4)   粘性广播

粘性广播在发送后就一直存在于系统的消息容器里面，等待对应的Receiver去处理，如果暂时没有Receiver处理这个广播，那么它则一直在消息容器里面处于等待状态，可以通过removeStickyBroadcast()取消粘性广播。

粘性广播主要为了解决先发送广播，后动态注册的Receiver也能够收到广播。例如首先发送一广播，Receiver是动态注册的。如果是普通广播，Receiver注册后肯定无法收到广播了。但是通过发送粘性广播就能够在Receiver动态注册者后也能收到广播。

<br/>

(5)   应用内广播

只在应用内传播，也称为本地广播。





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

<br/>

(2)   发送端发送广播

```java
sendBroadcast(intent,null);
或
sendOrderedBroadcast(intent,null);
```

<br/>

(3)   接收端接收广播并执行相关动作

```java
public class MyReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Toast.makeText(context,"收到广播", Toast.LENGTH_SHORT).show();
        Log.d("BroadcastReceiver","The Broadcast received");
        abortBroadcast();
    }
}
```

如果是有序广播，使用abortBroadcast()截断后有序广播不会再继续发送。



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



## Android 8.0中广播的变化

[Android 8.0限制隐式广播的原因和解决方案——简书](https://www.jianshu.com/p/68306c1af1cb) 

[广播概览——developer.android](https://developer.android.com/guide/components/broadcasts) 

### **Android 8.0对静态注册接收隐式广播的限制**

targetSdkVersion 在26（Android 8.0）或者以上的App，在Manifest里面注册的Receiver已经受到限制（即接收者无法接收隐式广播），而用Java代码动态注册的Receiver则不受影响。

targetSdkVersion 在 25或以下的App，即使在Android 8.0以上的机器上运行，其Receiver也不受影响。

 

如果targetSdkVersion 在26或者以上，在Manifest注册的Receiver（无论进程是否启动）可能无法接收到其它APP发送的隐式广播消息，并且会在Logcat里面打印出如下消息：

```txt
BroadcastQueue: Background execution not allowed: receiving Intent { act=com.xiaoqiang.try.something.receiver flg=0x2010 (has extras) } to xiaoqiang.com.trysomething/.broadcast.TheReceiver
```



 

影响的范围如下：

- 系统发送的广播基本都是隐式广播，大部分都会受到影响，除了部分受豁免广播之外（[隐式广播例外情况——developer.android](https://developer.android.com/guide/components/broadcast-exceptions) ）；

- App发送的自定义隐式广播，都会受到影响。

 

### **为何限制隐式广播**

在Manifest里面注册的系统广播接收器会被缓存在系统中，即使当App关闭之后，如果有相应的广播发出，应用程序仍然会被唤醒。

比如如果有20个App在Manifest里面注册了ACTION_BOOT_COMPLETED的广播接收器监听设备启动，那么当设备启动时，就会有20个应用程序被唤醒并作出相应的动作。

而动态注册的广播则跟随组件的生命周期而消存。因此在Manifest里面注册广播接收器的App越多，设备的性能就越容易受到影响，限制隐式广播主要是为了优化系统性能。

 

### **Android 8.0及以上如何使用广播**

- 优先使用动态注册Receiver的方式，能动态注册绝不使用Manifest注册；
- 如果一定要Manifest注册，那么当发送广播的时候，指定广播接收者的包名，即发送显式广播。



# 发送广播

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

<br/>

当使用sendOrderedBroadcast()发送有序广播(ordered=true)时：

- 静态注册的广播接收者(receivers)，采用串行处理；
- 动态注册的广播接收者(registeredReceivers)，采用串行处理；
- 然后对receivers和registeredReceivers按优先级合并到receivers中再一个接一个地分发。

<br/>

当使用sendBroadcast()发送无序广播(ordered=false)时：

- 静态注册的广播接收者(receivers)，依然采用串行处理；
- 动态注册的广播接收者(registeredReceivers)，采用并行处理；
- 先将广播向registeredReceivers中的接收者分发出去，再向receivers中的接收者一个接一个地进行分发。

<br/>

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

(2)   串行广播的ANR时间不同

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

<br/>

使用建议：前台广播队列通常比较空闲，如果希望广播能够尽快地被接收，那么可以添加前台flag。但同时开发者也必须限制前台广播的数量，而且在接收端不能有耗时操作。



## 显式广播与隐式广播

(1)   显式广播

即明确指出了接收者app及具体类。

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.ACTION1");
intent.setComponent(new ComponentName("com.demoapp.broadcastreceiver",
        "com.demoapp.broadcastreceiver.MyReceiver"));
sendBroadcast(intent);
```

其中通过setComponent()指定了接收APP为com.demoapp.broadcastreceiver，接收者的处理类为com.demoapp.broadcastreceiver.MyReceiver。

<br/>

(2)   隐式广播

不指明接收者APP，只是发送广播，接收者根据广播注册信息接收广播。

```java
Intent intent =new Intent();
intent.setAction("com.example.broadcast.ACTION1");
sendBroadcast(intent);
```

系统发送的广播基本都是隐式广播。



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



# Receiver注册&接收

## 动态注册与静态注册

(1)   动态注册

动态注册是指在代码中注册

<br/>

(2)   静态注册

指在AndroidManifest.xml中注册，可以实现程序在未启动的情况下接收到广播。但在设置中应该允许APP自动启动，否则达不到静态注册的目的。

 

 

## 广播接收器的优先级

(1)   对静态注册的广播接收器，可以在AndroidManifest中进行设置

```java
<receiver
    android:name=".MyReceiver"
    android:enabled="true"
    android:exported="true">

    <intent-filter
        android:priority="10">
        <action android:name="com.example.broadcast.MY_BROADCAST"/>
    </intent-filter>
```

<br/>

(2)   对动态注册的广播接收器，可以通过intentFilter.setPriority(int)进行设置

```java
//定义过滤器，想要监听什么广播，就添加相应的Action
intentFilter = new IntentFilter();
intentFilter.addAction("com.example.broadcast.MY_BROADCAST");
//设置优先级
intentFilter.setPriority(10);
//定义广播处理类
myReceiver = new MyReceiver();
//注册广播监听器
registerReceiver(myReceiver, intentFilter);
```

优先级取值范围为-1000到1000，数值越大，优先级就越高，那么该接收器就越早接收到广播。设置优先级对只对有序广播有效，对于动态及静态注册的广播：

- 优先级高的先接收到广播；
- 优先级相同的，动态广播先接收。

## 注册与接收广播-注意事项

(1)   注册动态广播时

```java
private IntentFilter intentFilter;
private MyReceiver myReceiver;

//定义广播处理类
myReceiver = new MyReceiver();
//定义过滤器，想要监听什么广播，就添加相应的Action
intentFilter = new IntentFilter();
intentFilter.addAction("com.example.broadcast.MY_BROADCAST");
intentFilter.addAction("com.example.broadcast.MY_BROADCAST2");
//注册广播监听器
registerReceiver(myReceiver, intentFilter);
```

每个IntentFilter可以有多个action，接收时只需要满足一个即可。经测试，也可以将同一Receiver使用不同intentFilter分别注册，使用如下：

```java
intentFilter = new IntentFilter();
intentFilter.addAction("com.example.broadcast.MY_BROADCAST");
registerReceiver(myReceiver, intentFilter);

intentFilter2 = new IntentFilter();
intentFilter2.addAction("com.example.broadcast.MY_BROADCAST2");
registerReceiver(myReceiver, intentFilter2);
```

<br/>

(2)   注册静态广播时

可以有多个intentFilter 标签。

<br/>

(3)   接收广播时

如果一个Receiver要处理多个广播，可以使用if...else if...进行处理。

```java
public class MyReceiver extends BroadcastReceiver {
    String myAction1="com.example.broadcast.MY_BROADCAST";
    String myAction2="com.example.broadcast.MY_BROADCAST2";
    @Override
    public void onReceive(Context context, Intent intent) {
        String action=intent.getAction();

        if(myAction1.equals(action)){
            Toast.makeText(context,"收到广播1", Toast.LENGTH_SHORT).show();
            Log.d("BroadcastReceiver","The Broadcast received");
        }else if(myAction2.equals(action)){
            Toast.makeText(context,"收到广播2", Toast.LENGTH_SHORT).show();
        }
    }
}
```



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

```java
registerReceiver(receiver, intentFilter);
```

构造BroadcastFilter对象需要一个IntentFilter对象，所以BroadcastFilter对象可以理解为system端（AMS）中的IntentFilter，也是对IntentFilter的进一步封装，即作为接收器筛选广播的过滤器。每调用一次registerReceiver()就会生成一个BroadcastFilter对象。

| 关键属性                  | 说明                                    |
| ------------------------- | --------------------------------------- |
| ReceiverList receiverList | 包含本BroadcastFilter所属Receiver的     |
| String packageName        | 所属包名                                |
| String requiredPermission | 给该BroadcastFilter发送广播所需要的权限 |
| int owningUid             | 所属者uid                               |
| int owningUserId          | UserId                                  |

<br/>

BroadcastFilter对象在AMS.registerReceiverWithFeature()中创建。

```java
BroadcastFilter bf = new BroadcastFilter(filter, rl, callerPackage, callerFeatureId,
         permission, callingUid, userId, instantApp, visibleToInstantApps);
```

<br/>

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

<br/>

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

<br/>

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

<br/>

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