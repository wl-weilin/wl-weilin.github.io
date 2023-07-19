---
layout: post
# 标题配置
title:  Activity-onRestart()过程

# 时间配置
date:   2022-08-08

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

 

## onRestart常见场景

Activity在之前已经Create，使其变得可见。包括以下情况：

- 不可见后，通过多任务界面或者桌面图标进入Activity；
- 通过返回键返回到该Activity；
- 在APP的Activity A中打开另一个Activity B，B在之前已经Create，且属性为android:launchMode="singleTask"；
- 其它方式。

## 日志-桌面点击

​    在桌面点击APP图标，该APP之前已存在Task和Activity。所以此次点击只执行onRestart()生命周期。

```txt
# Task信息
06-01 19:02:25.094  8185 11420 I wm_task_moved: [155,1,6]
06-01 19:02:25.094  8185 11420 I wm_task_to_front: [0,155]
06-01 19:02:25.095  8185 11420 I wm_focused_root_task: [0,0,155,1,bringingFoundTaskToFront]

# system端
06-01 19:02:25.096  8185 11420 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,bringingFoundTaskToFront]
06-01 19:02:25.096  8185 11420 I wm_new_intent: [0,69548440,155,com.demoapp.activitydemo/.MainActivity,android.intent.action.MAIN,NULL,NULL,268435456]
06-01 19:02:25.101  8185 11420 I wm_pause_activity: [0,142578439,com.miui.home/.launcher.Launcher,userLeaving=true,pauseBackTasks]

# APP端-Home
06-01 19:02:25.108  4234  4234 I wm_on_top_resumed_lost_called: [142578439,com.miui.home.launcher.Launcher,topStateChangedWhenResumed]
06-01 19:02:25.109  4234  4234 I wm_on_paused_called: [0,142578439,com.miui.home.launcher.Launcher,performPause,1]

# system端
06-01 19:02:25.111  8185 11438 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,resumeTopActivity - onActivityStateChanged]
06-01 19:02:25.112  8185 11438 I wm_add_to_stopping: [0,142578439,com.miui.home/.launcher.Launcher,makeInvisible]
06-01 19:02:25.115  8185 11438 I wm_resume_activity: [0,69548440,155,com.demoapp.activitydemo/.MainActivity]

# APP端-ActivityDemo
06-01 19:02:25.131 20604 20604 I wm_on_restart_called: [0,69548440,com.demoapp.activitydemo.MainActivity,performRestartActivity,0]
06-01 19:02:25.136 20604 20604 I wm_on_start_called: [0,69548440,com.demoapp.activitydemo.MainActivity,handleStartActivity,5]
06-01 19:02:25.156 20604 20604 I wm_on_resume_called: [0,69548440,com.demoapp.activitydemo.MainActivity,RESUME_ACTIVITY,13]
06-01 19:02:25.158 20604 20604 I wm_on_top_resumed_gained_called: [69548440,com.demoapp.activitydemo.MainActivity,topWhenResuming]
06-01 19:02:25.498 20604 20604 I wm_on_idle_called: com.demoapp.activitydemo.MainActivity

# system端
06-01 19:02:25.708  8185  8205 I wm_stop_activity: [0,142578439,com.miui.home/.launcher.Launcher]

# APP端-Home
06-01 19:02:25.716  4234  4234 I wm_on_stop_called: [0,142578439,com.miui.home.launcher.Launcher,STOP_ACTIVITY_ITEM,2]
```

## 日志-返回键

```txt
# system端
06-16 11:13:02.893  1839  3036 I wm_finish_activity: [0,202905386,155,com.demoapp.activitydemo/.SecondActivity,app-request]
06-16 11:13:02.905  1839  3036 I wm_pause_activity: [0,202905386,com.demoapp.activitydemo/.SecondActivity,userLeaving=false,finish]

# APP端
06-16 11:13:02.911  4231  4231 I wm_on_top_resumed_lost_called: [202905386,com.demoapp.activitydemo.SecondActivity,topStateChangedWhenResumed]
06-16 11:13:02.912  4231  4231 I wm_on_paused_called: [202905386,com.demoapp.activitydemo.SecondActivity,performPause]

# system端
06-16 11:13:02.913  1839  3036 I wm_add_to_stopping: [0,202905386,com.demoapp.activitydemo/.SecondActivity,completeFinishing]
06-16 11:13:02.916  1839  3036 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,resumeTopActivity - onActivityStateChanged]
06-16 11:13:02.920  1839  3036 I wm_resume_activity: [0,178272833,155,com.demoapp.activitydemo/.MainActivity]

# APP端
06-16 11:13:02.928  4231  4231 I wm_on_restart_called: [178272833,com.demoapp.activitydemo.MainActivity,performRestartActivity]
06-16 11:13:02.928  4231  4231 I wm_on_start_called: [178272833,com.demoapp.activitydemo.MainActivity,handleStartActivity]
06-16 11:13:02.929  4231  4231 I wm_on_resume_called: [178272833,com.demoapp.activitydemo.MainActivity,RESUME_ACTIVITY]
06-16 11:13:02.929  4231  4231 I wm_on_top_resumed_gained_called: [178272833,com.demoapp.activitydemo.MainActivity,topWhenResuming]

# system端
06-16 11:13:03.466  1839  2149 I wm_destroy_activity: [0,202905386,155,com.demoapp.activitydemo/.SecondActivity,finish-imm:idle]
06-16 11:13:03.489  4231  4231 I wm_on_stop_called: [202905386,com.demoapp.activitydemo.SecondActivity,LIFECYCLER_STOP_ACTIVITY]
06-16 11:13:03.490  4231  4231 I wm_on_destroy_called: [202905386,com.demoapp.activitydemo.SecondActivity,performDestroy]
```

## 日志-singleTask

操作步骤说明：

- 启动APP ActivityDemo进入MainActivity，属性android:launchMode="singleTask"；
- 在MainActivity打开SecondActivity；
- 在SecondActivity中打开已Create的MainActivity；
- SecondActivity会执行Destroy，MainActivity会执行onRestart。

 

之后打印MainActivity的生命周期日志如下。

```txt
# system端
06-02 19:09:40.790  2441  2941 I wm_finish_activity: [0,68916182,165,com.demoapp.activitydemo/.SecondActivity,clear-task-stack]
06-02 19:09:40.792  2441  2941 I wm_pause_activity: [0,68916182,com.demoapp.activitydemo/.SecondActivity,userLeaving=false,finish]
06-02 19:09:40.793  2441  2941 I wm_new_intent: [0,252441087,165,com.demoapp.activitydemo/.MainActivity,android.intent.action.MAIN,NULL,NULL,270532608]
06-02 19:09:40.793  2441  2941 I wm_task_moved: [165,1,3]

# APP端-SecondActivity
06-02 19:09:40.816  9668  9668 I wm_on_top_resumed_lost_called: [68916182,com.demoapp.activitydemo.SecondActivity,topStateChangedWhenResumed]
06-02 19:09:40.820  9668  9668 I wm_on_paused_called: [0,68916182,com.demoapp.activitydemo.SecondActivity,performPause,1]

# system端
06-02 19:09:40.821  2441  4837 I wm_add_to_stopping: [0,68916182,com.demoapp.activitydemo/.SecondActivity,completeFinishing]
06-02 19:09:40.823  2441  4837 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,resumeTopActivity - onActivityStateChanged]
06-02 19:09:40.829  2441  4837 I wm_resume_activity: [0,252441087,165,com.demoapp.activitydemo/.MainActivity]

# APP端-MainActivity
06-02 19:09:40.850  9668  9668 I wm_on_restart_called: [0,252441087,com.demoapp.activitydemo.MainActivity,performRestartActivity,0]
06-02 19:09:40.852  9668  9668 I wm_on_start_called: [0,252441087,com.demoapp.activitydemo.MainActivity,handleStartActivity,2]
06-02 19:09:40.857  9668  9668 I wm_on_resume_called: [0,252441087,com.demoapp.activitydemo.MainActivity,RESUME_ACTIVITY,1]
06-02 19:09:40.858  9668  9668 I wm_on_top_resumed_gained_called: [252441087,com.demoapp.activitydemo.MainActivity,topWhenResuming]
06-02 19:09:41.197  9668  9668 I wm_on_idle_called: com.demoapp.activitydemo.MainActivity

# system端
06-02 19:09:41.502  2441  2646 I wm_destroy_activity: [0,68916182,165,com.demoapp.activitydemo/.SecondActivity,finish-imm:idle]

# APP端-SecondActivity
06-02 19:09:41.547  9668  9668 I wm_on_stop_called: [0,68916182,com.demoapp.activitydemo.SecondActivity,LIFECYCLER_STOP_ACTIVITY,1]
06-02 19:09:41.552  9668  9668 I wm_on_destroy_called: [0,68916182,com.demoapp.activitydemo.SecondActivity,performDestroy,3]
```

# onRestart()过程-桌面点击

Base on: Android 13

Branch: android-13.0.0_r30 

## (1)APP端-Home

### Activity.startActivity()

```java
@Override
public void startActivity(Intent intent, @Nullable Bundle options) {
    getAutofillClientController().onStartActivity(intent, mIntent);
    if (options != null) {
        startActivityForResult(intent, -1, options);
    } else {
        // Note we want to go through this call for compatibility with
        // applications that may have overridden the method.
        startActivityForResult(intent, -1);
    }
}
```

### Activity.startActivityForResult()

```java
public void startActivityForResult(@RequiresPermission Intent intent, int requestCode,
        @Nullable Bundle options) {
    // MIUI ADD: START
    if (mActivityStub != null && mActivityStub.startActivity(this, intent)) {
        return;
    }
    // END
    if (mParent == null) {
        options = transferSpringboardActivityOptions(options);
        Instrumentation.ActivityResult ar =
            mInstrumentation.execStartActivity(
                this, mMainThread.getApplicationThread(), mToken, this,
                intent, requestCode, options);
        if (ar != null) {
            mMainThread.sendActivityResult(
                mToken, mEmbeddedID, requestCode, ar.getResultCode(),
                ar.getResultData());
        }
        if (requestCode >= 0) {
            // If this start is requesting a result, we can avoid making
            // the activity visible until the result is received.  Setting
            // this code during onCreate(Bundle savedInstanceState) or onResume() will keep the
            // activity hidden during this time, to avoid flickering.
            // This can only be done when a result is requested because
            // that guarantees we will get information back when the
            // activity is finished, no matter what happens to it.
            mStartedActivity = true;
        }

        cancelInputsAndStartExitTransition(options);
        // TODO Consider clearing/flushing other event sources and events for child windows.
    } else {
        if (options != null) {
            mParent.startActivityFromChild(this, intent, requestCode, options);
        } else {
            // Note we want to go through this method for compatibility with
            // existing applications that may have overridden it.
            mParent.startActivityFromChild(this, intent, requestCode);
        }
    }
}
```

### Instrumentation.execStartActivity()

```java
try {
    intent.migrateExtraStreamToClipData(who);
    intent.prepareToLeaveProcess(who);
    int result = ActivityTaskManager.getService().startActivity(whoThread,
            who.getOpPackageName(), who.getAttributionTag(), intent,
            intent.resolveTypeIfNeeded(who.getContentResolver()), token,
            target != null ? target.mEmbeddedID : null, requestCode, 0, null, options);
    notifyStartActivityResult(result, options);
    checkStartActivityResult(result, intent);
} catch (RemoteException e) {
    throw new RuntimeException("Failure from system", e);
}
```



## (2)system端

从APP的Instrumentation.execStartActivity()调用过来后，在system端执行相关调度及设置数据结构，之后生成两个ClientTransaction事务对象并分别调用到APP端。

共有流程：

```txt
Binder: IActivityTaskManager.Stub.onTransact() ->
ATMS.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest() ->
ActivityStarter.startActivityUnchecked() ->
ActivityStarter.startActivityInner() ->
ActivityStarter.recycleTask() ->

```

​    在ActivityStarter.recycleTask()又分为两路，最终都会调用到ClientTransaction.schedule()，然后调用到APP端。

ActivityStarter.recycleTask()中关键代码：

```java
setTargetRootTaskIfNeeded(targetTaskTop);
// We didn't do anything...  but it was needed (a.k.a., client don't use that intent!)
// And for paranoia, make sure we have correctly resumed the top activity.
resumeTargetRootTaskIfNeeded();
```

### 创建ClientTransaction-1

​    从setTargetRootTaskIfNeeded() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
ActivityStarter.recycleTask() ->
ActivityStarter.setTargetRootTaskIfNeeded() ->
Task.moveTaskToFront() ->
ActivityRecord.moveFocusableActivityToTop() ->
Task.moveToFront() ->
Task.moveToFrontInner() ->
TaskDisplayArea.positionChildAt() ->
TaskDisplayArea.positionChildTaskAt() ->
ActivityTaskSupervisor.updateTopResumedActivityIfNeeded() ->
ActivityRecord.scheduleTopResumedActivityChanged() ->
ClientLifecycleManager.scheduleTransaction(client, activityToken, callback) ->
ClientLifecycleManager.scheduleTransaction(transaction) ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks包含一个TopResumedActivityChangeItem对象，执行该对象的回调；
- mLifecycleStateRequest = null，所以不会执行任何生命周期方法。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/onRestart过程1.png" alt="onRestart过程1.png" style="zoom:80%" />
</div>

### 创建ClientTransaction-2

​    从resumeTargetRootTaskIfNeeded() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含PauseActivityItem生命周期执行请求，然后传递到APP端。

 

(1)   堆栈

从resumeTargetRootTaskIfNeeded()调入。

```txt
IActivityTaskManager$Stub.onTransact() ->
ActivityTaskManagerService.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest() ->
ActivityStarter.startActivityUnchecked() ->
ActivityStarter.startActivityInner() ->
ActivityStarter.recycleTask() ->
ActivityStarter.resumeTargetRootTaskIfNeeded() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity() ->
TaskDisplayArea.pauseBackTasks() ->
WindowContainer.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
//Consumer接口调用过程，构造于TaskDisplayArea.pauseBackTasks()
TaskFragment.forAllLeafTaskFragments() ->
//Consumer接口调用过程，构造于TaskDisplayArea.pauseBackTasks()
TaskFragment.startPausing() ->
TaskFragment.startPausing() ->
TaskFragment.schedulePauseActivity() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

```java
public void schedule() throws RemoteException {
   mClient.scheduleTransaction(this);
 }
```



this的内容如下：

- mActivityCallbacks = null；
- mLifecycleStateRequest为一个PauseActivityItem对象，之后APP端通过该对象执行onPause()；
- 之后还会通过PauseActivityItem.postExecute() -> ActivityClient.activityPaused()调用回system端。

从这里调用到APP端，会执行生命周期onPause()，之后还会通过ActivityClient.activityPaused()调用回system端。

### 关键过程

#### START u0

说明：打印START ux日志，x表示userId。

日志示例：

```txt
ActivityTaskManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.demoapp.activitydemo/.MainActivity bnds=[81,772][253,944] (has extras)} from uid 10128 from pid 15720 callingPackage com.miui.home
```

打印位置：ActivityStarter.executeRequest(Request request)

```java
int err = ActivityManager.START_SUCCESS;
// Pull the optional Ephemeral Installer-only bundle out of the options early.
final Bundle verificationBundle =
        options != null ? options.popAppVerificationBundle() : null;

WindowProcessController callerApp = null;
if (caller != null) {
    callerApp = mService.getProcessController(caller);
    if (callerApp != null) {
        callingPid = callerApp.getPid();
        callingUid = callerApp.mInfo.uid;
    } else {
        Slog.w(TAG, "Unable to find app for caller " + caller + " (pid=" + callingPid
                + ") when starting: " + intent.toString());
        err = START_PERMISSION_DENIED;
    }
}

final int userId = aInfo != null && aInfo.applicationInfo != null
        ? UserHandle.getUserId(aInfo.applicationInfo.uid) : 0;
if (err == ActivityManager.START_SUCCESS) {
    Slog.i(TAG, "START u" + userId + " {" + intent.toShortString(true, true, true, false)
            + "} from uid " + callingUid);
}
```

堆栈：

```txt
Binder: IActivityTaskManager.Stub.onTransact() ->
ATMS.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest()
```

## (3)APP端-Home

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

​    第1次执行的是之前system的ActivityStarter.setTargetRootTaskIfNeeded()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)，取出TopResumedActivityChangeItem对象，执行该对象的回调；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

 

### 执行ClientTransaction-2

​    第2次执行的是之前system的ActivityStarter.resumeTargetRootTaskIfNeeded()调用过来的第2个ClientTransaction事务。

 

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
Launcher.onPause()
```

注：Launcher即桌面。

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

​    从APP的ActivityClient.activityPaused()调用过来后，在system端执行相关调度及设置数据结构，之后生成两个ClientTransaction事务对象并调用到APP端。

 

### 共有流程

```txt
IActivityClientController$Stub.onTransact() ->
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity()
```

执行到TaskFragment.resumeTopActivity()后分两条栈继续向下执行。

### 创建ClientTransaction-1

​    从Activity.setState() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

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

(2)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks包含一个TopResumedActivityChangeItem对象，执行该对象的回调；
- mLifecycleStateRequest = null，所以不会执行任何生命周期方法。

### 创建ClientTransaction-2

​    从TaskFragment.resumeTopActivity() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含NewIntentItem回调执行请求和ResumeActivityItem生命周期执行请求，然后传递到APP端。

 

(1)   堆栈

从TaskFragment.resumeTopActivity()调用而来。

```java
TaskFragment.resumeTopActivity(){
transaction.setLifecycleStateRequest(
        ResumeActivityItem.obtain(next.app.getReportedProcState(),
                dc.isNextTransitionForward()));
mAtmService.getLifecycleManager().scheduleTransaction(transaction);
} ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下:

- mActivityCallbacks包含一个NewIntentItem对象，之后APP端通过该对象执行onRestart()、onStart()；
- mLifecycleStateRequest为一个ResumeActivityItem对象，之后APP端通过该对象执行onResume()。

## (5)APP端-ActivityDemo

system端又有连续两次调用到此APP端。

共有过程如下：

```txt
ApplicationThread.scheduleTransaction() ->
ClientTransactionHandler.scheduleTransaction() ->
sendMessage(ActivityThread.H.EXECUTE_TRANSACTION, transaction) ->
ActivityThread.H.handleMessage(Message msg) ->
TransactionExecutor.execute()
```

### 执行ClientTransaction-1

​    第1次执行的是之前system的Activity.setState()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)，取出TopResumedActivityChangeItem对象，执行该对象的回调；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

 

### 执行ClientTransaction-2

​    第2次执行的是之前system的TaskFragment.resumeTopActivity()调用过来的第2个ClientTransaction事务。

 

这一次在TransactionExecutor.execute(transaction)中：

- 执行executeCallbacks(transaction)，取出NewIntentItem对象，会调用到onRestart()、onStart()。
- 执行executeLifecycleState(transaction)，取出ResumeActivityItem对象，调用到onResume()生命周期方法。
- 最后通过ActivityClient.activityResumed()调用回system端。

 

主要看一下onRestart()、onStart()、onResume()生命周期方法的调用过程。

#### TransactionExecutor.executeCallbacks()

从cycleToPath()调用到onRestart()、onStart()。

```java
final int size = callbacks.size();
for (int i = 0; i < size; ++i) {
    final ClientTransactionItem item = callbacks.get(i);
    if (DEBUG_RESOLVER) Slog.d(TAG, tId(transaction) + "Resolving callback: " + item);
    final int postExecutionState = item.getPostExecutionState();
    final int closestPreExecutionState = mHelper.getClosestPreExecutionState(r,
            item.getPostExecutionState());
    if (closestPreExecutionState != UNDEFINED) {
        cycleToPath(r, closestPreExecutionState, transaction);
    }

    item.execute(mTransactionHandler, token, mPendingActions);
    item.postExecute(mTransactionHandler, token, mPendingActions);
    if (r == null) {
        // Launch activity request will create an activity record.
        r = mTransactionHandler.getActivityClient(token);
    }

    if (postExecutionState != UNDEFINED && r != null) {
        // Skip the very last transition and perform it by explicit state request instead.
        final boolean shouldExcludeLastTransition =
                i == lastCallbackRequestingState && finalState == postExecutionState;
        cycleToPath(r, postExecutionState, shouldExcludeLastTransition, transaction);
    }
}
```

#### onRestart()生命周期

```txt
TransactionExecutor.executeCallbacks() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.performRestartActivity() ->
Activity.performRestart() ->
Instrumentation.callActivityOnRestart() ->
MainActivity.onRestart()
```

#### onStart()生命周期

注：APP端自定义的MainActivity继承自AppCompatActivity。

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeCallbacks() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.handleStartActivity() ->
Activity.performStart() ->
Instrumentation.callActivityOnStart() ->
MainActivity.onStart() ->
```

#### TransactionExecutor.executeLifecycleState()

```java
private void executeLifecycleState(ClientTransaction transaction) {
    final ActivityLifecycleItem lifecycleItem = transaction.getLifecycleStateRequest();
    if (lifecycleItem == null) {
        // No lifecycle request, return early.
        return;
    }

    final IBinder token = transaction.getActivityToken();
    final ActivityClientRecord r = mTransactionHandler.getActivityClient(token);
    if (DEBUG_RESOLVER) {
        Slog.d(TAG, tId(transaction) + "Resolving lifecycle state: "
                + lifecycleItem + " for activity: "
                + getShortActivityName(token, mTransactionHandler));
    }

    if (r == null) {
        // Ignore requests for non-existent client records for now.
        return;
    }

    // Cycle to the state right before the final requested state.
    cycleToPath(r, lifecycleItem.getTargetState(), true /* excludeLastState */, transaction);

    // Execute the final transition with proper parameters.
    lifecycleItem.execute(mTransactionHandler, token, mPendingActions);
    lifecycleItem.postExecute(mTransactionHandler, token, mPendingActions);
}
```

#### onResume()生命周期

注：APP端自定义的MainActivity继承自AppCompatActivity。

```java
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
ResumeActivityItem.execute() ->
ActivityThread.handleResumeActivity() ->
ActivityThread.performResumeActivity() ->
Activity.performResume() ->
Instrumentation.callActivityOnResume() ->
MainActivity.onResume()
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

## (6)system&Home-onStop()

### 创建ClientTransaction

Stop流程开始执行是从之前的ActivityClientController.activityPaused(token)调用进来后开始的。在TaskFragment.resumeTopActivity()中，从mRootWindowContainer.ensureVisibilityAndConfig()进入到stop栈中。

 

注：上一个Activity（Home）的onStop()和下一个Activity（ActivityDemo）的onResume()的生命周期调度都是从同一个system端的Binder线程调用过来的。只不过stop过程中间有一次消息传递，所以执行速度比resume略慢，体现在日志上就是wm_on_stop_called日志通常在wm_on_resume_called日志之后打印。

 

(1)   堆栈

```txt
IActivityClientController$Stub.onTransact() ->
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.ensureActivitiesVisible() ->
RootWindowContainer.ensureActivitiesVisible() ->
DisplayContent.ensureActivitiesVisible() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
// Consumer接口调用过程，构造于DisplayContent.ensureActivitiesVisible()
Task.ensureActivitiesVisible() ->
Task.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
// Consumer接口调用过程，构造于Task.ensureActivitiesVisible()
TaskFragment.updateActivityVisibilities() ->
EnsureActivitiesVisibleHelper.process() ->
EnsureActivitiesVisibleHelper.setActivityVisibilityState() ->
ActivityRecord.makeInvisible() ->
ActivityRecord.addToStopping() ->
ActivityTaskSupervisor.scheduleIdle()
```

然后执行到ActivityTaskSupervisor.scheduleIdle()，给system中的本线程发送了一个IDLE_NOW_MSG。

```java
final void scheduleIdle() {
    if (!mHandler.hasMessages(IDLE_NOW_MSG)) {
        if (DEBUG_IDLE) Slog.d(TAG_IDLE, "scheduleIdle: Callers=" + Debug.getCallers(4));
        mHandler.sendEmptyMessage(IDLE_NOW_MSG);
    }
}
```

接收到IDLE_NOW_MSG消息之后，执行堆栈如下，在ActivityRecord.stopIfPossible()中打印wm_stop_activity日志。

```txt
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessage() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessageInner() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.activityIdleFromMessage() ->
ActivityTaskSupervisor.activityIdleInternal() ->
ActivityTaskSupervisor.processStoppingAndFinishingActivities() ->
ActivityRecord.stopIfPossible() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下:

- mActivityCallbacks = null；
- mLifecycleStateRequest为一个StopActivityItem对象，之后APP端通过该对象执行onStop()；
- 之后还会通过StopActivityItem.postExecute() -> ActivityClient.activityStopped()调用回system端。

### 执行ClientTransaction

执行之前system的Stop流程调用过来的ClientTransaction事务。

 

这一次在TransactionExecutor.execute(transaction)中：

- 不会执行executeCallbacks(transaction)，因为callbacks == null。
- 执行executeLifecycleState(transaction)，取出StopActivityItem对象，调用到onStop()生命周期方法。
- 最后通过ActivityClient.activityStopped()调用回system端。

 

onStop()生命周期方法的调用过程：

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
StopActivityItem.execute() ->
ActivityThread.handleStopActivity() ->
ActivityThread.performStopActivityInner() ->
ActivityThread.callActivityOnStop() ->
Activity.performStop() ->
Instrumentation.callActivityOnStop() ->
Launcher.onStop()
```

### 调用到system

(1)   创建StopInfo

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
StopActivityItem.execute() ->
ActivityThread.handleStopActivity()
```

```java
@Override
public void handleStopActivity(ActivityClientRecord r, int configChanges,
        PendingTransactionActions pendingActions, boolean finalStateRequest, String reason) {
    r.activity.mConfigChangeFlags |= configChanges;

    final StopInfo stopInfo = new StopInfo();
    performStopActivityInner(r, stopInfo, true /* saveState */, finalStateRequest,
            reason);

    if (localLOGV) Slog.v(
        TAG, "Finishing stop of " + r + ": win=" + r.window);

    updateVisibility(r, false);

    // Make sure any pending writes are now committed.
    if (!r.isPreHoneycomb()) {
        QueuedWork.waitToFinish();
    }

    stopInfo.setActivity(r);
    stopInfo.setState(r.state);
    stopInfo.setPersistentState(r.persistentState);
    pendingActions.setStopInfo(stopInfo);
    mSomeActivitiesChanged = true;
}
```

(2)   发送StopInfo到Looper

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
StopActivityItem.postExecute() ->
ActivityThread.reportStop()
```

```java
public void reportStop(PendingTransactionActions pendingActions) {
    mH.post(pendingActions.getStopInfo());
}
```

(3)   执行StopInfo

最后APP在ActivityClient.activityStopped()中调用到system中执行ActivityClientController.activityStopped()，主要是通知system端Stop执行完成，不会再调用到APP端。

```txt
PendingTransactionActions.StopInfo.run() ->
ActivityClient.activityStopped()
```

