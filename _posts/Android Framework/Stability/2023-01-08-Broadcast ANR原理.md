---
layout: post

# 标题配置
title: Broadcast ANR原理

# 时间配置
date: 2023-01-08

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


# **BroadcastQueue Timeout**

Base on: Android 12

<br/>

AMS只会对串行模式的广播设置超时时间，而串行模式有两种情形：

1） 发送者以sendOrderedBroadcast()方法发送广播。这时候无论是动态注册还是静态注册，AMS都会以串行模式处理所有的Receiver，也就是对所有的Receiver逐个串行处理；

2）发送者使用sendBroadcast()发送广播。如果接收者包含动态和静态注册的，则对动态注册的Receiver用并行模式直接发送，无超时机制，对静态注册的Receiver使用串行模式发送；

```java
//首先处理并行广播
while (mParallelBroadcasts.size() > 0) {//......}

//在do循环中取出一个BroadcastRecord对象，知道满足条件才退出do循环，之后对该BR对象进行处理
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
//timeoutExempt=true表示广播不受接收器超时的影响（即使超时依然要发给下个接收器）
    //r.dispatchTime > 0表示当前的BroadcastRecord不是第一次被处理
    if (mService.mProcessesReady && !r.timeoutExempt && r.dispatchTime > 0) {
        //此处是判断系统是否挂掉
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

## 发送延时消息

AMS只会对串行广播设置超时时间，对并行广播只管发出即可。

在BroadcastQueue.processNextBroadcastLocked()方法，在对串行广播的每一个Receiver进行分发前（即调用deliverToRegisteredReceiverLocked()前），调用setBroadcastTimeoutLocked()发送延时消息。其中timeoutTime=当前时间+mConstants.TIMEOUT，mConstants.TIMEOUT为超时时间（10s或60s）。

```java
final void processNextBroadcastLocked(boolean fromMsg) {
    //首先处理并行广播
    while (mParallelBroadcasts.size() > 0) {//......}

    //处理串行广播
    do {
        final long now = SystemClock.uptimeMillis();
        r = mDispatcher.getNextBroadcastLocked(now);
        //......
   } while (r == null);

    r.receiverTime = SystemClock.uptimeMillis();
    //......
    //mPendingBroadcastTimeoutMessage表示Handler中是否已经有BROADCAST_TIMEOUT_MSG消息
if (! mPendingBroadcastTimeoutMessage) {
        long timeoutTime = r.receiverTime + mConstants.TIMEOUT;
        if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST,
                "Submitting BROADCAST_TIMEOUT_MSG ["
                + mQueueName + "] for " + r + " at " + timeoutTime);
        setBroadcastTimeoutLocked(timeoutTime);
    }

    final BroadcastOptions brOptions = r.options;
    final Object nextReceiver = r.receivers.get(recIdx);
    if (nextReceiver instanceof BroadcastFilter) {
        // Simple case: this is a registered receiver who gets
        // a direct call.
        BroadcastFilter filter = (BroadcastFilter)nextReceiver;
        deliverToRegisteredReceiverLocked(r, filter, r.ordered, recIdx);
        //...
        return;
    }
//...
}

setBroadcastTimeoutLocked()具体实现如下：
final void setBroadcastTimeoutLocked(long timeoutTime) {
    if (! mPendingBroadcastTimeoutMessage) {
        Message msg = mHandler.obtainMessage(BROADCAST_TIMEOUT_MSG, this);
        mHandler.sendMessageAtTime(msg, timeoutTime);
        mPendingBroadcastTimeoutMessage = true;
    }
}
```

发送延时消息的条件是mPendingBroadcastTimeoutMessage==false，即当前消息队列中没有BROADCAST_TIMEOUT_MSG消息。所以并不是每执行一个Receiver就发送一个延迟消息，而是需要在当前BROADCAST_TIMEOUT_MSG消息执行函数broadcastTimeoutLocked()中，通过超时时刻与当前时刻进行比较，才决定是否重新入队一个BROADCAST_TIMEOUT_MSG消息或执行ANR操作。

## 移除延时消息

如果广播已经向所有Receiver发送结束，或者广播中途被取消，则代码执行到cancelBroadcastTimeoutLocked()，移除之前的延时执行消息。注意这里并不是每个Receiver执行完毕后移除消息的。

```java
do {
    //.....
    // 如果广播对应的 receivers 为空||广播已经派发完毕||上一个广播接收者调用了abortBroadcast终止了广播||系统挂掉。满足这些条件表示该广播已经向所有receiver发送结束，或者广播中途被取消
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
                try {  //给最后一个Receiver分发广播
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

        // ......
        r = null;
        looped = true;
        continue;
    }
    // ......
} while (r == null);
```

cancelBroadcastTimeoutLocked()的具体实现如下：

```java
//mPendingBroadcastTimeoutMessage表示Handler中是否已经有BROADCAST_TIMEOUT_MSG消息。
final void cancelBroadcastTimeoutLocked() {
    if (mPendingBroadcastTimeoutMessage) {
        mHandler.removeMessages(BROADCAST_TIMEOUT_MSG, this);
        mPendingBroadcastTimeoutMessage = false;
    }
}
```

<br/>

对一个广播（BroadcastRecord对象）来说，所有Receiver处理完成后才会移除延时消息，那么如果BroadcastRecord的所有Receiver处理时间之和超过10s，但单个Receiver未超过10s，那么当设定的10s时间来到，执行broadcastTimeoutLocked()时为什么不会发生ANR呢？原因在broadcastTimeoutLocked()中：

```java
//r.receiverTime是当前Receiver开始分发的时间，在deliverToRegisteredReceiverLocked()中进行设置
long timeoutTime = r.receiverTime + mConstants.TIMEOUT;
if (timeoutTime > now) { //true表示当前时刻还未到达设定的超时时间
    // We can observe premature timeouts because we do not cancel and reset the
    // broadcast timeout message after each receiver finishes.  Instead, we set up
    // an initial timeout then kick it down the road a little further as needed
    // when it expires.
    if (DEBUG_BROADCAST) Slog.v(TAG_BROADCAST,
            "Premature timeout ["
            + mQueueName + "] @ " + now + ": resetting BROADCAST_TIMEOUT_MSG for "
            + timeoutTime);
    setBroadcastTimeoutLocked(timeoutTime);
    return;
}
```

<br/>

如一个BroadcastRecord对象有>2个的Receiver，第1个Receiver执行6s，第2个Receiver执行5s，之后正常。（以下时间表示距离开机的毫秒数）

- 第1个Receiver开始分发时：r.receiverTime=2050000，timeoutTime=r.receiverTime+10000=2060000，执行时间6s；
- 第2个Receiver开始分发时：r.receiverTime=2056000，timeoutTime=2060000（并不是每个Receiver执行完毕后移除消息并重置timeoutTime的）；
- 当第10s时执行定时消息（now=2060000），AMS端执行broadcastTimeoutLocked()，此时APP端正在处理第2个Receiver。在broadcastTimeoutLocked()中，置timeoutTime=r.receiverTime+10000=2066000，此时timeoutTime>now，于是重新发送一个延时消息（6s后执行）。
- 第3个Receiver开始分发时：r.receiverTime=2061000，timeoutTime=2066000；
- 当第16s时执行定时消息（now=2066000），AMS端执行broadcastTimeoutLocked()，置timeoutTime=r.receiverTime+10000=2071000，此时timeoutTime>now，于是重新发送一个延时消息（5s后执行）。

<br/>

如果每个Receiver都耗时数秒但不超过10s，会产生ANR吗？对一个BroadcastRecord对象，前n-1个Receiver在x时刻执行完成，前n个Receiver在y时刻执行完成，在x到y时刻之间执行了一次消息，下一次执行消息的时刻是x+10，则只需要保证x+10>y即y-x>10即可，而y-x正是第n个Receiver的执行时间，所以只需要中间的某个Receiver不超过10s就不会产生ANR。

## 执行ANR流程

有两种情况会触发Broadcast ANR。

 

### 情况1-达到超时时间

说明：达到执行BROADCAST_TIMEOUT_MSG的时间时执行broadcastTimeoutLocked(true)

 

在Handler中执行broadcastTimeoutLocked(true)，如下：

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

在BROADCAST_TIMEOUT_MSG执行函数中会判断当前时间now是否超过了超时时间，如果true，则执行ANR流程。

```java
long timeoutTime = r.receiverTime + mConstants.TIMEOUT;
if (timeoutTime > now) { //true表示当前时刻还未到达设定的超时时间
    setBroadcastTimeoutLocked(timeoutTime);
    return;
}
```

### 情况2-系统挂掉

说明：系统挂掉，此时已经延时较长时间，较少见。

 

如果当前为前台广播队列，则mConstants.TIMEOUT=10s（后台广播队列的mConstants.TIMEOUT=60s），若当前时刻>开始分发时刻+2*10*numReceivers，则满足执行ANR的条件。AMS实际上在10s或60s基础上x2，是为了有更多的时间判断是否为系统问题。

注意此处的10 秒或 60 秒是针对一个 receiver 而言的，例如前台广播中的某个BroadcastRecord有3个Receivers，则实际TIMEOUT=2*10*3=60s，那么只要在60s之内将广播分发给这3个Receivers即可。

```java
do {
    //......
    boolean forceReceive = false;
    int numReceivers = (r.receivers != null) ? r.receivers.size() : 0;
//mService.mProcessesReady表示AMS已启动，可以开始接受客户端的请求
    //timeoutExempt=true表示广播不受接收器超时的影响（即使超时依然要发给下个接收器）
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
            broadcastTimeoutLocked(false);   //执行ANR并强制结束广播
            forceReceive = true;
            r.state = BroadcastRecord.IDLE;
        }
    }
    //......
    // Is the current broadcast is done for any reason?
    if (r.receivers == null || r.nextReceiver >= numReceivers
            || r.resultAbort || forceReceive) {
        //......
        //移除广播超时消息
        cancelBroadcastTimeoutLocked();
        //......
    }
    //......
}
```

broadcastTimeoutLocked(fromMsg)的参数fromMsg=true，表示该函数是由Handler执行的。

broadcastTimeoutLocked()代码如下：

```java
final void broadcastTimeoutLocked(boolean fromMsg) {
    if (fromMsg) {
        //=true表示Handler有待执行的BROADCAST_TIMEOUT_MSG消息
        mPendingBroadcastTimeoutMessage = false;
    }

    if (mDispatcher.isEmpty() || mDispatcher.getActiveBroadcastLocked() == null) {
        return;
    }

    long now = SystemClock.uptimeMillis();
    BroadcastRecord r = mDispatcher.getActiveBroadcastLocked();
    if (fromMsg) {
        // 当AMS还未准备就绪时，不执行广播超时机制
        if (!mService.mProcessesReady) {
            return;
        }

        // 如果广播设置了免除超时机制
        if (r.timeoutExempt) {
            if (DEBUG_BROADCAST) {
                Slog.i(TAG_BROADCAST, "Broadcast timeout but it's exempt: "
                        + r.intent.getAction());
            }
            return;
        }
        //......
    }

    //......

    ProcessRecord app = null;
    String anrMessage = null;

    Object curReceiver;
    if (r.nextReceiver > 0) {
        curReceiver = r.receivers.get(r.nextReceiver-1);
        r.delivery[r.nextReceiver-1] = BroadcastRecord.DELIVERY_TIMEOUT;
    } else {
        curReceiver = r.curReceiver;
    }
    Slog.w(TAG, "Receiver during timeout of " + r + " : " + curReceiver);
    logBroadcastReceiverDiscardLocked(r);
    //获取APP信息
    if (curReceiver != null && curReceiver instanceof BroadcastFilter) {
        BroadcastFilter bf = (BroadcastFilter)curReceiver;
        if (bf.receiverList.pid != 0
                && bf.receiverList.pid != ActivityManagerService.MY_PID) {
            synchronized (mService.mPidsSelfLocked) {
                app = mService.mPidsSelfLocked.get(
                        bf.receiverList.pid);
            }
        }
    } else {
        app = r.curApp;
    }

    if (app != null) {
        anrMessage = "Broadcast of " + r.intent.toString();
    }

    if (mPendingBroadcast == r) {
        mPendingBroadcast = null;
    }

    // Move on to the next receiver.
    finishReceiverLocked(r, r.resultCode, r.resultData,
            r.resultExtras, r.resultAbort, false);
    scheduleBroadcastsLocked();

    if (!debugging && anrMessage != null) {
        mService.mAnrHelper.appNotResponding(app, anrMessage);
    }
}
```

最后执行appNotResponding()。执行appNotResponding()的条件是APP处于Debug模式下并且app != null，这样才会输出ANR日志。

# 广播ANR常见案例

待更新
