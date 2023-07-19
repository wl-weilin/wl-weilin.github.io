---
layout: post
# 标题配置
title:  Activity-onDestroy()过程

# 时间配置
date:   2022-08-12

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

## onDestroy常见场景

- 在Activity中执行finish()；
- 通过返回将Task栈顶上的Activity移除出栈；
- 从最近任务移除Task。

 

## 日志-执行finish()

Base on: Android 13

 

在ActivityDemo的MainActivity中执行finish()，日志如下：

```txt
# system端
06-12 15:36:20.727  1711  1760 I wm_finish_activity: [0,256052167,36,com.demoapp.activitydemo/.MainActivity,app-request]

06-12 15:36:20.728  1711  1760 I wm_task_moved: [1,1,6]
06-12 15:36:20.728  1711  1760 I wm_task_moved: [15,1,2147483647]
06-12 15:36:20.728  1711  1760 I wm_task_to_front: [0,15]
06-12 15:36:20.728  1711  1760 I wm_focused_root_task: [0,0,1,36,finish-top adjustFocusToNextFocusableTask]

06-12 15:36:20.729  1711  1760 I wm_set_resumed_activity: [0,com.android.launcher3/.uioverrides.QuickstepLauncher,finish-top adjustFocusToNextFocusableTask]
06-12 15:36:20.736  1711  1760 I wm_pause_activity: [0,256052167,com.demoapp.activitydemo/.MainActivity,userLeaving=false,finish]

# APP端
06-12 15:36:20.742 22250 22250 I wm_on_top_resumed_lost_called: [256052167,com.demoapp.activitydemo.MainActivity,topStateChangedWhenResumed]
06-12 15:36:20.745 22250 22250 I wm_on_paused_called: [256052167,com.demoapp.activitydemo.MainActivity,performPause]

# system端
06-12 15:36:20.745  1711  1760 I wm_add_to_stopping: [0,256052167,com.demoapp.activitydemo/.MainActivity,completeFinishing]
06-12 15:36:20.745  1711  1760 I wm_set_resumed_activity: [0,com.android.launcher3/.uioverrides.QuickstepLauncher,resumeTopActivity - onActivityStateChanged]
06-12 15:36:20.746  1711  1760 I wm_resume_activity: [0,134036600,15,com.android.launcher3/.uioverrides.QuickstepLauncher]

# APP端-Home
06-12 15:36:20.746  2832  2832 I wm_on_restart_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,performRestartActivity]
06-12 15:36:20.748  2832  2832 I wm_on_start_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,handleStartActivity]
06-12 15:36:20.749  2832  2832 I wm_on_resume_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,RESUME_ACTIVITY]
06-12 15:36:20.750  2832  2832 I wm_on_top_resumed_gained_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,topWhenResuming]

# system端
06-12 15:36:21.394  1711  1885 I wm_destroy_activity: [0,256052167,36,com.demoapp.activitydemo/.MainActivity,finish-imm:idle]

# APP端
06-12 15:36:21.415 22250 22250 I wm_on_stop_called: [256052167,com.demoapp.activitydemo.MainActivity,LIFECYCLER_STOP_ACTIVITY]
06-12 15:36:21.417 22250 22250 I wm_on_destroy_called: [256052167,com.demoapp.activitydemo.MainActivity,performDestroy]

06-12 15:36:21.426  1711 22180 I wm_task_removed: [36,removeChild:removeChild last r=ActivityRecord{f430bc7 u0 com.demoapp.activitydemo/.MainActivity} t-1 f}} in t=Task{50122de #36 type=standard A=10108:com.demoapp.activitydemo}]
06-12 15:36:21.426  1711 22180 I wm_task_removed: [36,removeChild]
```

## 日志-返回

Base on: Android 13

 

从ActivityDemo的SecondActivity返回到MainActivity。

```txt
# system端-SecondActivity
07-17 15:44:16.002  1607  2239 I wm_finish_activity: [0,9229558,236,com.demoapp.activitydemo/.SecondActivity,app-request]
07-17 15:44:16.013  1607  2239 I wm_pause_activity: [0,9229558,com.demoapp.activitydemo/.SecondActivity,userLeaving=false,finish]

# APP端-SecondActivity
07-17 15:44:16.020 16385 16385 I wm_on_top_resumed_lost_called: [9229558,com.demoapp.activitydemo.SecondActivity,topStateChangedWhenResumed]
07-17 15:44:16.021 16385 16385 I wm_on_paused_called: [9229558,com.demoapp.activitydemo.SecondActivity,performPause]

# system端-MainActivity的resume；SecondActivity的stop
07-17 15:44:16.021  1607  2393 I wm_add_to_stopping: [0,9229558,com.demoapp.activitydemo/.SecondActivity,completeFinishing]
07-17 15:44:16.023  1607  2393 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,resumeTopActivity - onActivityStateChanged]
07-17 15:44:16.026  1607  2393 I wm_resume_activity: [0,146902564,236,com.demoapp.activitydemo/.MainActivity]

# APP端-MainActivity
07-17 15:44:16.032 16385 16385 I wm_on_restart_called: [146902564,com.demoapp.activitydemo.MainActivity,performRestartActivity]
07-17 15:44:16.032 16385 16385 I wm_on_start_called: [146902564,com.demoapp.activitydemo.MainActivity,handleStartActivity]
07-17 15:44:16.033 16385 16385 I wm_on_resume_called: [146902564,com.demoapp.activitydemo.MainActivity,RESUME_ACTIVITY]
07-17 15:44:16.033 16385 16385 I wm_on_top_resumed_gained_called: [146902564,com.demoapp.activitydemo.MainActivity,topWhenResuming]

# SecondActivity执行stop和destroy流程
07-17 15:44:16.560  1607  1922 I wm_destroy_activity: [0,9229558,236,com.demoapp.activitydemo/.SecondActivity,finish-imm:idle]
07-17 15:44:16.572 16385 16385 I wm_on_stop_called: [9229558,com.demoapp.activitydemo.SecondActivity,LIFECYCLER_STOP_ACTIVITY]
07-17 15:44:16.573 16385 16385 I wm_on_destroy_called: [9229558,com.demoapp.activitydemo.SecondActivity,performDestroy]
```

## 日志-移除Task

Base on: Android 13

 

打开ActivityDemo的MainActivity，然后从最近任务中移除。

```txt
07-17 15:54:02.800  1607  1767 I wm_task_moved: [1,1,3]
07-17 15:54:02.806  1607  1767 I wm_focused_root_task: [0,0,1,236,RecentsAnimation.onAnimationFinished()]
07-17 15:54:02.806 16385 16385 I wm_on_top_resumed_lost_called: [146902564,com.demoapp.activitydemo.MainActivity,topStateChangedWhenResumed]

# system端-MainActivity的pause，桌面的resume
07-17 15:54:02.807  1607  1767 I wm_pause_activity: [0,146902564,com.demoapp.activitydemo/.MainActivity,userLeaving=false,pauseBackTasks]
07-17 15:54:02.811  1607  1767 I wm_set_resumed_activity: [0,com.android.launcher3/.uioverrides.QuickstepLauncher,resumeTopActivity - onActivityStateChanged]
07-17 15:54:02.812  1607  1767 I wm_resume_activity: [0,208514294,230,com.android.launcher3/.uioverrides.QuickstepLauncher]

# APP端-桌面
07-17 15:54:02.813 19945 19945 I wm_on_resume_called: [208514294,com.android.launcher3.uioverrides.QuickstepLauncher,RESUME_ACTIVITY]

# MainActivity执行stop和destroy流程
07-17 15:54:02.813  1607  1767 I wm_add_to_stopping: [0,146902564,com.demoapp.activitydemo/.MainActivity,makeInvisible]
07-17 15:54:02.830 16385 16385 I wm_on_paused_called: [146902564,com.demoapp.activitydemo.MainActivity,performPause]
07-17 15:54:02.833 19945 19945 I wm_on_top_resumed_gained_called: [208514294,com.android.launcher3.uioverrides.QuickstepLauncher,topStateChangedWhenResumed]
07-17 15:54:02.833  1607  2393 I wm_stop_activity: [0,146902564,com.demoapp.activitydemo/.MainActivity]
07-17 15:54:02.856 16385 16385 I wm_on_stop_called: [146902564,com.demoapp.activitydemo.MainActivity,STOP_ACTIVITY_ITEM]
07-17 15:54:02.928  1607  7537 I wm_destroy_activity: [0,146902564,236,com.demoapp.activitydemo/.MainActivity,finish-imm:remove-task]

# 移除进程和Task
07-17 15:54:02.930  1607  1922 I ActivityManager: Killing 16385:com.demoapp.activitydemo/u0a108 (adj 905): remove task
07-17 15:54:02.969  1607  7537 I wm_task_removed: [236,removeChild:removeChild last r=ActivityRecord{8c18e24 u0 com.demoapp.activitydemo/.MainActivity} t-1 f}} in t=Task{a90c09a #236 type=standard A=10108:com.demoapp.activitydemo}]
07-17 15:54:02.969  1607  7537 I wm_task_removed: [236,removeChild]
```

# onDestroy()过程-执行finish()

Base on: Android 13

Branch: android-13.0.0_r30 

 

## (1)APP端-ActivityDemo

### Activity.finish()

```java
/**
 * Call this when your activity is done and should be closed.  The
 * ActivityResult is propagated back to whoever launched you via
 * onActivityResult().
 */
public void finish() {
    finish(DONT_FINISH_TASK_WITH_ACTIVITY);
}


private void finish(int finishTask) {
    if (mParent == null) {
        int resultCode;
        Intent resultData;
        synchronized (this) {
            resultCode = mResultCode;
            resultData = mResultData;
        }
        if (false) Log.v(TAG, "Finishing self: token=" + mToken);
        if (resultData != null) {
            resultData.prepareToLeaveProcess(this);
        }
        if (ActivityClient.getInstance().finishActivity(mToken, resultCode, resultData,
                finishTask)) {
            mFinished = true;
        }
    } else {
        mParent.finishFromChild(this);
    }

    getAutofillClientController().onActivityFinish(mIntent);
}
```

### ActivityClient.finishActivity()

```java
public boolean finishActivity(IBinder token, int resultCode, Intent resultData,
        int finishTask) {
    try {
        return getActivityClientController().finishActivity(token, resultCode, resultData,
                finishTask);
    } catch (RemoteException e) {
        throw e.rethrowFromSystemServer();
    }
}
```

## (2)system端

从APP的ActivityClient.finishActivity()调用过来后，在system端执行相关调度及设置数据结构，之后生成两个ClientTransaction事务对象并分别调用到APP端。

 

### 共有流程

```txt
ActivityClientController.finishActivity() ->
ActivityRecord.finishIfPossible()
```

在ActivityRecord.finishIfPossible()中分为两路，最终都会调用到ClientTransaction.schedule()，然后调用到APP端。

 

### 创建ClientTransaction-1

从Task.adjustFocusToNextFocusableTask() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
ActivityRecord.finishIfPossible() ->
Task.adjustFocusToNextFocusableTask() ->
TaskDisplayArea.moveHomeActivityToTop() ->
ActivityRecord.moveFocusableActivityToTop() ->
Task.moveToFront() ->
Task.positionChildAt() ->
WindowContainer.positionChildAt() ->
TaskDisplayArea.positionChildAt() ->
TaskDisplayArea.positionChildTaskAt() ->
ActivityTaskSupervisor.updateTopResumedActivityIfNeeded() ->
ActivityRecord.scheduleTopResumedActivityChanged() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks包含一个TopResumedActivityChangeItem对象，执行该对象的回调；
- mLifecycleStateRequest = null，所以不会执行任何生命周期方法。

### 创建ClientTransaction-2

从TaskFragment.startPausing() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含PauseActivityItem生命周期执行请求，然后传递到APP端。

(1)   堆栈

```txt
ActivityRecord.finishIfPossible() ->
TaskFragment.startPausing() ->
TaskFragment.schedulePauseActivity() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(1)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks = null；
- mLifecycleStateRequest为一个PauseActivityItem对象，之后APP端通过该对象执行onPause()；
- 之后还会通过PauseActivityItem.postExecute() -> ActivityClient.activityPaused()调用回system端。

## (3)APP端-ActivityDemo

system端有连续两次调用到此APP端。

共有过程如下：

```txt
ApplicationThread.scheduleTransaction() ->
ClientTransactionHandler.scheduleTransaction() ->
sendMessage(ActivityThread.H.EXECUTE_TRANSACTION, transaction) ->
ActivityThread.H.handleMessage(Message msg) ->
TransactionExecutor.execute()
```

### 执行ClientTransaction-1

第1次执行的是之前system的Task.adjustFocusToNextFocusableTask()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)，执行TopResumedActivityChangeItem对象的回调；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

 

### 执行ClientTransaction-2

第2次执行的是之前system的TaskFragment.startPausing()调用过来的第2个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 不会执行executeCallbacks(transaction)，因为callbacks == null；
- 执行executeLifecycleState(transaction)，取出PauseActivityItem对象，调用到onPause()生命周期方法；
- 最后从executeLifecycleState(transaction)中调用回system端。

 

(1)   调用到onPause()的堆栈如下

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
PauseActivityItem.execute() ->
ActivityThread.handlePauseActivity() ->
ActivityThread.performPauseActivity() ->
ActivityThread.performPauseActivityIfNeeded() ->
Instrumentation.callActivityOnPause() ->
Activity.performPause() ->
Launcher.onPause() ->
```

### 调用到system

调用回system端的堆栈如下：

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
PauseActivityItem.postExecute() ->
ActivityClient.activityPaused()
```

之后调用到ActivityClientController.activityPaused(token)。

## (4)system端

​    从APP的ActivityClientController.activityPaused(token)调用过来后，在system端执行相关调度及设置数据结构，之后生成两个ClientTransaction事务对象并分别调用到APP端。

 

### 共有流程

```txt
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity()
```

​    在TaskFragment.resumeTopActivity()中分为两路，最终都会调用到ClientTransaction.schedule()，然后调用到APP端。

 

### 创建ClientTransaction-1

​    从ActivityRecord.setState() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
TaskFragment.resumeTopActivity() ->
ActivityRecord.setState() ->
TaskFragment.onActivityStateChanged() ->
TaskFragment.setResumedActivity() ->
ActivityTaskSupervisor.updateTopResumedActivityIfNeeded() ->
ActivityTaskSupervisor.scheduleTopResumedActivityStateIfNeeded() ->
ActivityRecord.scheduleTopResumedActivityChanged() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(1)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks包含一个TopResumedActivityChangeItem对象，执行该对象的回调；
- mLifecycleStateRequest = null，所以不会执行任何生命周期方法。

### 创建ClientTransaction-2

​    从TaskFragment.resumeTopActivity() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含ResumeActivityItem生命周期执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
TaskFragment.resumeTopActivity() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks = null；
- mLifecycleStateRequest为一个ResumeActivityItem对象，之后APP端通过该对象执行onPause()；
- 之后还会通过PauseActivityItem.postExecute() -> ActivityClient.activityPaused()调用回system端。

### 关键过程

#### wm_add_to_stopping

说明：将Activity加入到ActivityTaskSupervisor.mStoppingActivities列表中。

日志示例：

```txt
06-12 15:36:20.745  1711  1760 I wm_add_to_stopping: [0,256052167,com.demoapp.activitydemo/.MainActivity,completeFinishing]
```

(1)   打印位置

```java
/** List of activities that are ready to be stopped, but waiting for the next activity to
 * settle down before doing so. */
final ArrayList<ActivityRecord> mStoppingActivities = new ArrayList<>();

ActivityRecord.addToStopping()
if (!mTaskSupervisor.mStoppingActivities.contains(this)) {
    EventLogTags.writeWmAddToStopping(mUserId, System.identityHashCode(this),
            shortComponentName, reason);
    mTaskSupervisor.mStoppingActivities.add(this);
}
```

(2)   堆栈

```txt
IActivityClientController$Stub.onTransact() ->
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
ActivityRecord.completeFinishing() ->
ActivityRecord.addToStopping()
```

## (5)APP端-Launcher-onResume

 

### 执行ClientTransaction-1

​    第1次执行的是之前system的Activity.setState()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)，取出TopResumedActivityChangeItem对象，执行该对象的回调；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

 

### 执行ClientTransaction-2

​    第2次执行的是之前system的TaskFragment.resumeTopActivity()调用过来的第2个ClientTransaction事务。

 

这一次在TransactionExecutor.execute(transaction)中：

- 不会执行executeCallbacks(transaction)，因为callbacks == null。
- 执行executeLifecycleState(transaction)，取出ResumeActivityItem对象，调用到onRestart()、onStart()、onResume()生命周期方法。
- 最后通过ActivityClient.activityResumed()调用回system端。

 

主要看一下onRestart()、onStart()、onResume()生命周期方法的调用过程。

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.performRestartActivity() ->
Activity.performRestart() ->
Instrumentation.callActivityOnRestart() ->
Activity.onRestart()
```

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.handleStartActivity() ->
Activity.performStart() ->
Instrumentation.callActivityOnStart() ->
Launcher.onStart() ->
BaseDraggingActivity.onStart() ->
BaseActivity.onStart() ->
Activity.onStart()
```

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
ResumeActivityItem.execute() ->
ActivityThread.handleResumeActivity() ->
ActivityThread.performResumeActivity() ->
Activity.performResume() ->
Instrumentation.callActivityOnResume() ->
QuickstepLauncher.onResume() ->
Launcher.onResume() ->
StatefulActivity.onResume() ->
BaseDraggingActivity.onResume() ->
BaseActivity.onResume() ->
Activity.onResume()
```

### 调用到system

调用回system端的堆栈如下：

```java
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState(){
final ActivityLifecycleItem lifecycleItem = transaction.getLifecycleStateRequest();
lifecycleItem.postExecute(mTransactionHandler, token, mPendingActions);
} ->
ResumeActivityItem.postExecute() ->
ActivityClient.activityResumed()

public void activityResumed(IBinder token, boolean handleSplashScreenExit) {
    try {
        getActivityClientController().activityResumed(token, handleSplashScreenExit);
    } catch (RemoteException e) {
        e.rethrowFromSystemServer();
    }
}

调用到system的ActivityClientController.activityResumed()。
@Override
public void activityResumed(IBinder token, boolean handleSplashScreenExit) {
    final long origId = Binder.clearCallingIdentity();
    synchronized (mGlobalLock) {
        ActivityRecord.activityResumedLocked(token, handleSplashScreenExit);
    }
    Binder.restoreCallingIdentity(origId);
}
```

主要是设置ActivityRecord对象的状态，之后不会再回调到APP端。

## (6)APP端-ActivityDemo-onDestroy

### 创建ClientTransaction

从Launcher调用过来的（未找到具体代码位置），在ActivityRecord.onAnimationFinished()中分两路执行到ATS.scheduleProcessStoppingAndFinishingActivitiesIfNeeded()并调用ATS.scheduleIdle()发送IDLE_NOW_MSG消息。

从onAnimationFinished()函数名可以看出，这是在上一个Activity的退出动画执行完之后才开始的Destroy流程。

(1)   共同流程

```txt
IRemoteAnimationFinishedCallback$Stub.onTransact() ->
RemoteAnimationController$FinishedCallback.onAnimationFinished() ->
RemoteAnimationController.onAnimationFinished() ->
SurfaceAnimator$OnAnimationFinishedCallback.onAnimationFinished(){
SurfaceAnimator.getFinishedCallback()
SurfaceAnimator$OnAnimationFinishedCallback.onAnimationFinished
}
WindowContainer.onAnimationFinished() ->
WindowContainer.doAnimationFinished() ->
ActivityRecord.onAnimationFinished()
```

(2)   第1次发送IDLE_NOW_MSG消息

```txt
ActivityRecord.onAnimationFinished() ->
ActivityTaskSupervisor.scheduleProcessStoppingAndFinishingActivitiesIfNeeded() ->
ActivityTaskSupervisor.scheduleIdle()
```

(3)   第2次发送IDLE_NOW_MSG消息

```txt
ActivityRecord.onAnimationFinished() ->
AppTransition.notifyAppTransitionFinishedLocked() ->
WindowManagerService$4.onAppTransitionFinishedLocked() ->
ActivityRecord.updateReportedVisibilityLocked() ->
ActivityRecord.onWindowsVisible() ->
ActivityTaskSupervisor.scheduleProcessStoppingAndFinishingActivitiesIfNeeded()
ActivityTaskSupervisor.scheduleIdle()
```

(4)   收到并处理IDLE_NOW_MSG消息

之后接收到第1次的IDLE_NOW_MSG消息

```txt
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessage() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessageInner() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.activityIdleFromMessage() ->
ActivityTaskSupervisor.activityIdleInternal() ->
ActivityTaskSupervisor.processStoppingAndFinishingActivities() ->
ActivityRecord.destroyIfPossible() ->
ActivityRecord.destroyImmediately() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

第2次的IDLE_NOW_MSG消息执行到ActivityTaskSupervisor.processStoppingAndFinishingActivities()中return，不再向下执行。

```java
final int numFinishingActivities = mFinishingActivities.size();
if (numFinishingActivities == 0) {
    return;
}
```

### 执行ClientTransaction

调用到APP端，通过ClientTransaction事务执行onStop()和onDestroy()流程。

 

这一次在TransactionExecutor.execute(transaction)中：

- 不会执行executeCallbacks(transaction)，因为callbacks == null。
- 执行executeLifecycleState(transaction)，取出DestroyActivityItem对象，调用到onStop()和onDestroy()生命周期方法。
- 最后通过ActivityClient.activityDestroyed()调用回system端。

 

onStop()生命周期方法的调用过程：

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.handleStopActivity() ->
ActivityThread.performStopActivityInner() ->
ActivityThread.callActivityOnStop() ->
Activity.performStop() ->
Instrumentation.callActivityOnStop() ->
MainActivity.onStop() ->
AppCompatActivity.onStop() ->
FragmentActivity.onStop() ->
Activity.onStop() 
```

onDestroy()生命周期方法的调用过程：

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
DestroyActivityItem.execute() ->
ActivityThread.handleDestroyActivity() ->
ActivityThread.performDestroyActivity() ->
Instrumentation.callActivityOnDestroy() ->
Activity.performDestroy() ->
MainActivity.onDestroy() ->
AppCompatActivity.onDestroy() ->
FragmentActivity.onDestroy() ->
Activity.onDestroy()
```

### 调用到system

最后从ActivityClient.activityDestroyed()调用回system端。



```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
DestroyActivityItem.execute() ->
ActivityThread.handleDestroyActivity() ->
ActivityClient.activityDestroyed()
```

```java
public void activityDestroyed(IBinder token) {
    try {
        getActivityClientController().activityDestroyed(token);
    } catch (RemoteException e) {
        e.rethrowFromSystemServer();
    }
}
```

