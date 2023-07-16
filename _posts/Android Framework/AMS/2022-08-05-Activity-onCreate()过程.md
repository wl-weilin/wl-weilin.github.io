---
layout: post
# 标题配置
title:  Activity-onCreate()过程

# 时间配置
date:   2022-08-05

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



## 常见场景

创建Activity对象，常见场景如下：

- 桌面点击方式启动一个APP，该APP进程启动之后，再启动自己的根Activity；
- 进程已存在，调用startActivity(intent)开启一个未实例化的或者允许多个实例存在的Activity；
- 其它方式。

 

## 日志-桌面点击

Base on: Android 13

 

场景：在桌面启动APP名为ActivityDemo的APP，被启动的Activity为com.demoapp.activitydemo.MainActivity。

涉及到的进程：Home、system_server及ActivityDemo。

```txt
06-12 18:43:38.985  1711 13415 I ActivityTaskManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.demoapp.activitydemo/.MainActivity bnds=[23,530][230,894]} from uid 10086

# system端
06-12 18:43:38.995  1711 13415 I wm_task_created: [51,-1]
06-12 18:43:39.006  1711 13415 I wm_task_moved: [51,1,6]
06-12 18:43:39.007  1711 13415 I wm_task_to_front: [0,51]
06-12 18:43:39.008  1711 13415 I wm_create_task: [0,51]
06-12 18:43:39.008  1711 13415 I wm_create_activity: [0,245284976,51,com.demoapp.activitydemo/.MainActivity,android.intent.action.MAIN,NULL,NULL,270532608]
06-12 18:43:39.008  1711 13415 I wm_task_moved: [51,1,6]
06-12 18:43:39.012  1711 13415 I wm_pause_activity: [0,134036600,com.android.launcher3/.uioverrides.QuickstepLauncher,userLeaving=true,pauseBackTasks]

# APP端-Launcher
06-12 18:43:39.022 20435 20435 I wm_on_top_resumed_lost_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,topStateChangedWhenResumed]
06-12 18:43:39.024 20435 20435 I wm_on_paused_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,performPause]

# system端
06-12 18:43:39.029  1711 13415 I wm_add_to_stopping: [0,134036600,com.android.launcher3/.uioverrides.QuickstepLauncher,makeInvisible]
06-12 18:43:39.049  1711  1906 I ActivityManager: Start proc 13463:com.demoapp.activitydemo/u0a108 for next-top-activity {com.demoapp.activitydemo/com.demoapp.activitydemo.MainActivity}
06-12 18:43:39.049  1711  1906 I am_proc_start: [0,13463,10108,com.demoapp.activitydemo,next-top-activity,{com.demoapp.activitydemo/com.demoapp.activitydemo.MainActivity}]
06-12 18:43:39.107  1711  3159 I wm_restart_activity: [0,245284976,51,com.demoapp.activitydemo/.MainActivity]
06-12 18:43:39.111  1711  3159 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.MainActivity,minimalResumeActivityLocked - onActivityStateChanged]

# APP端-ActivityDemo
06-12 18:43:39.270 13463 13463 I wm_on_create_called: [245284976,com.demoapp.activitydemo.MainActivity,performCreate]
06-12 18:43:39.272 13463 13463 I wm_on_start_called: [245284976,com.demoapp.activitydemo.MainActivity,handleStartActivity]
06-12 18:43:39.273 13463 13463 I wm_on_resume_called: [245284976,com.demoapp.activitydemo.MainActivity,RESUME_ACTIVITY]
06-12 18:43:39.288 13463 13463 I wm_on_top_resumed_gained_called: [245284976,com.demoapp.activitydemo.MainActivity,topStateChangedWhenResumed]

# system端
06-12 18:43:39.350  1711  1882 I wm_activity_launch_time: [0,245284976,com.demoapp.activitydemo/.MainActivity,362]
06-12 18:43:39.350  1711  1882 I ActivityTaskManager: Displayed com.demoapp.activitydemo/.MainActivity: +362ms
06-12 18:43:39.582  1711  1885 I wm_stop_activity: [0,134036600,com.android.launcher3/.uioverrides.QuickstepLauncher]

# APP端-Launcher
06-12 18:43:39.602 20435 20435 I wm_on_stop_called: [134036600,com.android.launcher3.uioverrides.QuickstepLauncher,STOP_ACTIVITY_ITEM]
```


## 日志-APP内启动

Base on: Android 13

 

场景：在APP ActivityDemo的MainActivity中，通过调用startActivity(intent)启动SecondActivity。

涉及到的进程：system_server及ActivityDemo。

```txt
07-15 00:19:34.171  1607  7870 I ActivityTaskManager: START u0 {flg=0x10000000 cmp=com.demoapp.activitydemo/.SecondActivity} from uid 10108

# system端
07-15 00:19:34.183  1607  7870 I wm_task_moved: [236,1,2]
07-15 00:19:34.184  1607  7870 I wm_create_activity: [0,131796363,236,com.demoapp.activitydemo/.SecondActivity,NULL,NULL,NULL,268435456]
07-15 00:19:34.187  1607  7870 I wm_pause_activity: [0,146902564,com.demoapp.activitydemo/.MainActivity,userLeaving=true,resumeTopActivity]

# APP端-MainActivity
07-15 00:19:34.187 16385 16385 I wm_on_top_resumed_lost_called: [146902564,com.demoapp.activitydemo.MainActivity,topStateChangedWhenResumed]
07-15 00:19:34.194 16385 16385 I wm_on_paused_called: [146902564,com.demoapp.activitydemo.MainActivity,performPause]

# system端
07-15 00:19:34.197  1607  3288 I wm_add_to_stopping: [0,146902564,com.demoapp.activitydemo/.MainActivity,makeInvisible]
07-15 00:19:34.199  1607  3288 I wm_restart_activity: [0,131796363,236,com.demoapp.activitydemo/.SecondActivity]
07-15 00:19:34.201  1607  3288 I wm_set_resumed_activity: [0,com.demoapp.activitydemo/.SecondActivity,minimalResumeActivityLocked - onActivityStateChanged]

# APP端-SecondActivity
07-15 00:19:34.226 16385 16385 I wm_on_create_called: [131796363,com.demoapp.activitydemo.SecondActivity,performCreate]
07-15 00:19:34.228 16385 16385 I wm_on_start_called: [131796363,com.demoapp.activitydemo.SecondActivity,handleStartActivity]
07-15 00:19:34.228 16385 16385 I wm_on_resume_called: [131796363,com.demoapp.activitydemo.SecondActivity,RESUME_ACTIVITY]
07-15 00:19:34.235 16385 16385 I wm_on_top_resumed_gained_called: [131796363,com.demoapp.activitydemo.SecondActivity,topStateChangedWhenResumed]

# system端
07-15 00:19:34.266  1607  1918 I wm_activity_launch_time: [0,131796363,com.demoapp.activitydemo/.SecondActivity,97]
07-15 00:19:34.756  1607  1922 I wm_stop_activity: [0,146902564,com.demoapp.activitydemo/.MainActivity]
07-15 00:19:34.773 16385 16385 I wm_on_stop_called: [146902564,com.demoapp.activitydemo.MainActivity,STOP_ACTIVITY_ITEM]
```

## 示例说明

以下以桌面启动APP为例。

Base on: Android 13

Branch: android-13.0.0_r30 

注：本例中是以桌面启动Activity为例的，调用端是com.android.launcher3进程。

# (1) APP端-Launcher

## 调用端启动Activity

这里的调用端指调用startActivity(intent)的进程。

- 如果是在桌面点击的应用图标，则调用端是桌面进程，如com.android.launcher、com.android.home或com.miui.home等；
- 如果是在其它APP执行的，那么调用端就是其它APP；
- 如果是在本APP启动APP内的Activity，则调用端就是当前APP，那么之后就不会涉及到"进程不存在"的情况，除非被启动Activity设置了android:process属性。

 

启动APP内的Activity代码示例：

```java
public class MainActivity extends Activity implements OnClickListener {
    private final static String LOG_TAG = "MainActivity";

    private Button myButton = null;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        myButton = (Button)findViewById(R.id.myButton);
        myButton.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        if(v.equals(myButton)) {
            Intent intent = new Intent(this, nextActivity.class);
            startActivity(intent);
        }
    }
}
```

## Activity.startActivity()

路径：frameworks/base/core/java/android/app/Activity.java

自定义的MainActivity继承自Activity类，会调用Activity.startActivity()方法，该方法在Activity.java中有两个重载版本。

```java
public class Activity extends ContextThemeWrapper
    implements LayoutInflater.Factory2,
Window.Callback, KeyEvent.Callback,
OnCreateContextMenuListener, ComponentCallbacks2,
Window.OnWindowDismissedCallback,
AutofillManager.AutofillClient, ContentCaptureManager.ContentCaptureClient {
    //......

    @Override
    public void startActivity(Intent intent) {
        this.startActivity(intent, null);
    }

    //......
    @Override
    public void startActivity(Intent intent, @Nullable Bundle options) {
        if (mIntent != null && mIntent.hasExtra(AutofillManager.EXTRA_RESTORE_SESSION_TOKEN)
            && mIntent.hasExtra(AutofillManager.EXTRA_RESTORE_CROSS_ACTIVITY)) {
            if (TextUtils.equals(getPackageName(),
                                 intent.resolveActivity(getPackageManager()).getPackageName())) {
                // Apply Autofill restore mechanism on the started activity by startActivity()
                final IBinder token =
                    mIntent.getIBinderExtra(AutofillManager.EXTRA_RESTORE_SESSION_TOKEN);
                // Remove restore ability from current activity
                mIntent.removeExtra(AutofillManager.EXTRA_RESTORE_SESSION_TOKEN);
                mIntent.removeExtra(AutofillManager.EXTRA_RESTORE_CROSS_ACTIVITY);
                // Put restore token
                intent.putExtra(AutofillManager.EXTRA_RESTORE_SESSION_TOKEN, token);
                intent.putExtra(AutofillManager.EXTRA_RESTORE_CROSS_ACTIVITY, true);
            }
        }
        if (options != null) {
            startActivityForResult(intent, -1, options);
        } else {
            // Note we want to go through this call for compatibility with
            // applications that may have overridden the method.
            startActivityForResult(intent, -1);
        }
    }
    //......
}
```

startActivity()有两个重载函数，最终都会调用startActivity(Intent, Bundle)这个方法，其中Bundle类用于传递数据。

在startActivity()中最后会调用startActivityForResult()。

## Activity.startActivityForResult()

startActivityForResult()有两个重载函数，但最终都会调用startActivityForResult(intent, requestCode, options)。startActivityForResult()的第二个参数为 -1，表示 Launcher 不需要知道 Activity 启动的结果。

```java
public void startActivityForResult(@RequiresPermission Intent intent, int requestCode) {
    startActivityForResult(intent, requestCode, null);
}

public void startActivityForResult(@RequiresPermission Intent intent, int requestCode,
        @Nullable Bundle options) {
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

接下来主要调用Instrumentation类的execStartActivity()方法，Instrumentation 类主要用来监控应用程序和系统的交互。

## Instrumentation.execStartActivity()

路径：/frameworks/base/core/java/android/app/Instrumentation.java

```java
public ActivityResult execStartActivity(
        Context who, IBinder contextThread, IBinder token, Activity target,
        Intent intent, int requestCode, Bundle options) {
    IApplicationThread whoThread = (IApplicationThread) contextThread;
    Uri referrer = target != null ? target.onProvideReferrer() : null;
    if (referrer != null) {
        intent.putExtra(Intent.EXTRA_REFERRER, referrer);
    }
    if (mActivityMonitors != null) {
        synchronized (mSync) {
            final int N = mActivityMonitors.size();
            for (int i=0; i<N; i++) {
                final ActivityMonitor am = mActivityMonitors.get(i);
                ActivityResult result = null;
                if (am.ignoreMatchingSpecificIntents()) {
                    result = am.onStartActivity(intent);
                }
                if (result != null) {
                    am.mHits++;
                    return result;
                } else if (am.match(who, null, intent)) {
                    am.mHits++;
                    if (am.isBlocking()) {
                        return requestCode >= 0 ? am.getResult() : null;
                    }
                    break;
                }
            }
        }
    }
    try {
        intent.migrateExtraStreamToClipData(who);
        intent.prepareToLeaveProcess(who);
        int result = ActivityTaskManager.getService().startActivity(whoThread,
                who.getBasePackageName(), who.getAttributionTag(), intent,
                intent.resolveTypeIfNeeded(who.getContentResolver()), token,
                target != null ? target.mEmbeddedID : null, requestCode, 0, null, options);
        checkStartActivityResult(result, intent);
    } catch (RemoteException e) {
        throw new RuntimeException("Failure from system", e);
    }
    return null;
}
```

execStartActivity()中会调用 ActivityTaskManager.getService().startActivity()，ActivityTaskManager.getService()通过Binder调用获取ActivityTaskManagerService的代理对象，按着调用它的 startActivity 方法。此处startActivity()的共有11个参数。

# (2) system端

## 共有流程

```txt
ActivityTaskManagerService.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest() ->
ActivityStarter.startActivityUnchecked() ->
ActivityStarter.startActivityInner()
```

## ATMS.startActivity()

ATMS=ActivityTaskManagerService

```java
@Override
public final int startActivity(IApplicationThread caller, String callingPackage,
        String callingFeatureId, Intent intent, String resolvedType, IBinder resultTo,
        String resultWho, int requestCode, int startFlags, ProfilerInfo profilerInfo,
        Bundle bOptions) {
    return startActivityAsUser(caller, callingPackage, callingFeatureId, intent, resolvedType,
            resultTo, resultWho, requestCode, startFlags, profilerInfo, bOptions,
            UserHandle.getCallingUserId());
}
```

- caller: 当前应用的ApplicationThread对象mAppThread；
- callingPackage: 调用当前ContextImpl.getBasePackageName(),获取当前Activity所在包名；
- intent: 这便是启动Activity时,传递过来的参数；
- resolvedType: 调用intent.resolveTypeIfNeeded而获取；
- resultTo: 来自于当前Activity.mToken；
- resultWho: 来自于当前Activity.mEmbeddedID；
- requestCode = -1;
- startFlags = 0;
- profilerInfo = null;
- options = null;

startActivity()中调用startActivityAsUser()。startActivityAsUser()比AMS的startActivity()多了一个参数 UserHandle.getCallingUserId()，这个方法会获得调用者的 UserId，AMS 根据这个 UserId 来确定调用者的权限。

## ATMS.startActivityAsUser()

startActivityAsUser()一共有两个重载方法，但最终都会调用13参数的那个方法。比另一个方法多了boolean validateIncomingUser这个参数，且默认为true。

```java
@Override
public int startActivityAsUser(IApplicationThread caller, String callingPackage,
        String callingFeatureId, Intent intent, String resolvedType, IBinder resultTo,
        String resultWho, int requestCode, int startFlags, ProfilerInfo profilerInfo,
        Bundle bOptions, int userId) {
    return startActivityAsUser(caller, callingPackage, callingFeatureId, intent, resolvedType,
            resultTo, resultWho, requestCode, startFlags, profilerInfo, bOptions, userId,
            true /*validateIncomingUser*/);
}

private int startActivityAsUser(IApplicationThread caller, String callingPackage,
        @Nullable String callingFeatureId, Intent intent, String resolvedType,
        IBinder resultTo, String resultWho, int requestCode, int startFlags,
        ProfilerInfo profilerInfo, Bundle bOptions, int userId, boolean validateIncomingUser) {
    assertPackageMatchesCallingUid(callingPackage);
    //判断调用者进程是否被隔离
    enforceNotIsolatedCaller("startActivityAsUser");
    //检查调用者权限
    userId = getActivityStartController().checkTargetUser(userId, validateIncomingUser,
            Binder.getCallingPid(), Binder.getCallingUid(), "startActivityAsUser");

    // TODO: Switch to user app stacks here.
    return getActivityStartController().obtainStarter(intent, "startActivityAsUser")
            .setCaller(caller)
            .setCallingPackage(callingPackage)
            .setCallingFeatureId(callingFeatureId)
            .setResolvedType(resolvedType)
            .setResultTo(resultTo)
            .setResultWho(resultWho)
            .setRequestCode(requestCode)
            .setStartFlags(startFlags)
            .setProfilerInfo(profilerInfo)
            .setActivityOptions(bOptions)
            .setUserId(userId)
            .execute();

}
```

如果调用者进程被隔离或者无权限，会抛出 SecurityException 异常。

startActivityAsUser()主要部分为最后的return语句。

getActivityStartController()获取到一个 ActivityStartController对象。然后调用ActivityStartController.obtainStarter()，获取一个ActivityStarter对象。然后ActivityStarter调用一系列的set()函数。

## ActivityStarter.setxxx()

ActivityStarter 是 Android 7.0 中新加入的类，它是加载 Activity 的控制类，会收集所有的逻辑来决定如何将 Intent 和 Flags 转换为 Activity。

ActivityStarter中的set系列方法用于赋值。

```java
ActivityStarter setCaller(IApplicationThread caller) {
    mRequest.caller = caller;
    return this;
}

ActivityStarter setCallingPackage(String callingPackage) {
    mRequest.callingPackage = callingPackage;
    return this;
}

ActivityStarter setCallingFeatureId(String callingFeatureId) {
    mRequest.callingFeatureId = callingFeatureId;
    return this;
}

ActivityStarter setResolvedType(String type) {
    mRequest.resolvedType = type;
    return this;
}
//......
```

可见所有值都赋给了一个mRequest变量，mRequest是一个Request对象。是ActivityStarter的一个内部类。

最终会执行一个execute()方法。

## ActivityStarter.execute()

```java
/**
 * Resolve necessary information according the request parameters provided earlier, and execute
 * the request which begin the journey of starting an activity.
 * @return The starter result.
 */
int execute() {
    try {
        // Refuse possible leaked file descriptors
        if (mRequest.intent != null && mRequest.intent.hasFileDescriptors()) {
            throw new IllegalArgumentException("File descriptors passed in Intent");
        }

        final LaunchingState launchingState;
        synchronized (mService.mGlobalLock) {
            final ActivityRecord caller = ActivityRecord.forTokenLocked(mRequest.resultTo);
            launchingState = mSupervisor.getActivityMetricsLogger().notifyActivityLaunching(
                    mRequest.intent, caller);
        }

        // If the caller hasn't already resolved the activity, we're willing
        // to do so here. If the caller is already holding the WM lock here,
        // and we need to check dynamic Uri permissions, then we're forced
        // to assume those permissions are denied to avoid deadlocking.
        if (mRequest.activityInfo == null) {
            mRequest.resolveActivity(mSupervisor);
        }

        int res;
        synchronized (mService.mGlobalLock) {
            final boolean globalConfigWillChange = mRequest.globalConfig != null
                    && mService.getGlobalConfiguration().diff(mRequest.globalConfig) != 0;
            final ActivityStack stack = mRootWindowContainer.getTopDisplayFocusedStack();
            if (stack != null) {
                stack.mConfigWillChange = globalConfigWillChange;
            }
            if (DEBUG_CONFIGURATION) {
                Slog.v(TAG_CONFIGURATION, "Starting activity when config will change = "
                        + globalConfigWillChange);
            }

            final long origId = Binder.clearCallingIdentity();

            res = resolveToHeavyWeightSwitcherIfNeeded();
            if (res != START_SUCCESS) {
                return res;
            }
            res = executeRequest(mRequest);

            Binder.restoreCallingIdentity(origId);

            if (globalConfigWillChange) {
                // If the caller also wants to switch to a new configuration, do so now.
                // This allows a clean switch, as we are waiting for the current activity
                // to pause (so we will not destroy it), and have not yet started the
                // next activity.
                mService.mAmInternal.enforceCallingPermission(
                        android.Manifest.permission.CHANGE_CONFIGURATION,
                        "updateConfiguration()");
                if (stack != null) {
                    stack.mConfigWillChange = false;
                }
                if (DEBUG_CONFIGURATION) {
                    Slog.v(TAG_CONFIGURATION,
                            "Updating to new configuration after starting activity.");
                }
                mService.updateConfigurationLocked(mRequest.globalConfig, null, false);
            }

            // Notify ActivityMetricsLogger that the activity has launched.
            // ActivityMetricsLogger will then wait for the windows to be drawn and populate
            // WaitResult.
            mSupervisor.getActivityMetricsLogger().notifyActivityLaunched(launchingState, res,
                    mLastStartActivityRecord);
            return getExternalResult(mRequest.waitResult == null ? res
                    : waitForResult(res, mLastStartActivityRecord));
        }
    } finally {
        onExecutionComplete();
    }
}
```

## ActivityStarter.executeRequest()

```java
private int executeRequest(Request request) {
//......

    mLastStartActivityResult = startActivityUnchecked(r, sourceRecord, voiceSession,
            request.voiceInteractor, startFlags, true /* doResume */, checkedOptions, inTask,
            restrictedBgActivity, intentGrants);

    if (request.outActivity != null) {
        request.outActivity[0] = mLastStartActivityRecord;
    }

    return mLastStartActivityResult;
}
```

## ActivityStarter.startActivityUnchecked()

startActivityUnchecked()主要处理与栈管理相关的逻辑。

```java
/**
 * Start an activity while most of preliminary checks has been done and caller has been
 * confirmed that holds necessary permissions to do so.
 * Here also ensures that the starting activity is removed if the start wasn't successful.
 */
private int startActivityUnchecked(final ActivityRecord r, ActivityRecord sourceRecord,
            IVoiceInteractionSession voiceSession, IVoiceInteractor voiceInteractor,
            int startFlags, boolean doResume, ActivityOptions options, Task inTask,
            boolean restrictedBgActivity, NeededUriGrants intentGrants) {
    int result = START_CANCELED;
    final ActivityStack startedActivityStack;
    try {
        mService.deferWindowLayout();
        Trace.traceBegin(Trace.TRACE_TAG_WINDOW_MANAGER, "startActivityInner");
        result = startActivityInner(r, sourceRecord, voiceSession, voiceInteractor,
                startFlags, doResume, options, inTask, restrictedBgActivity, intentGrants);
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_WINDOW_MANAGER);
        startedActivityStack = handleStartResult(r, result);
        mService.continueWindowLayout();
    }

    postStartActivityProcessing(r, result, startedActivityStack);

    return result;
}
```

## ActivityStarter.startActivityInner()

```java
int startActivityInner(final ActivityRecord r, ActivityRecord sourceRecord,
        IVoiceInteractionSession voiceSession, IVoiceInteractor voiceInteractor,
        int startFlags, boolean doResume, ActivityOptions options, Task inTask,
        boolean restrictedBgActivity, NeededUriGrants intentGrants) {
    setInitialState(r, options, inTask, doResume, startFlags, sourceRecord, voiceSession,
            voiceInteractor, restrictedBgActivity);

    //......
    if (mDoResume) {
        final ActivityRecord topTaskActivity =
                mStartActivity.getTask().topRunningActivityLocked();
        if (!mTargetStack.isTopActivityFocusable()
                || (topTaskActivity != null && topTaskActivity.isTaskOverlay()
                && mStartActivity != topTaskActivity)) {
            // If the activity is not focusable, we can't resume it, but still would like to
            // make sure it becomes visible as it starts (this will also trigger entry
            // animation). An example of this are PIP activities.
            // Also, we don't want to resume activities in a task that currently has an overlay
            // as the starting activity just needs to be in the visible paused state until the
            // over is removed.
            // Passing {@code null} as the start parameter ensures all activities are made
            // visible.
            mTargetStack.ensureActivitiesVisible(null /* starting */,
                    0 /* configChanges */, !PRESERVE_WINDOWS);
            // Go ahead and tell window manager to execute app transition for this activity
            // since the app transition will not be triggered through the resume channel.
            mTargetStack.getDisplay().mDisplayContent.executeAppTransition();
        } else {
            // If the target stack was not previously focusable (previous top running activity
            // on that stack was not visible) then any prior calls to move the stack to the
            // will not update the focused stack.  If starting the new activity now allows the
            // task stack to be focusable, then ensure that we now update the focused stack
            // accordingly.
            if (mTargetStack.isTopActivityFocusable()
                    && !mRootWindowContainer.isTopDisplayFocusedStack(mTargetStack)) {
                mTargetStack.moveToFront("startActivityInner");
            }
            mRootWindowContainer.resumeFocusedStacksTopActivities(
                    mTargetStack, mStartActivity, mOptions);
        }
    }
    mRootWindowContainer.updateUserStack(mStartActivity.mUserId, mTargetStack);

    // Update the recent tasks list immediately when the activity starts
    mSupervisor.mRecentTasks.add(mStartActivity.getTask());
    mSupervisor.handleNonResizableTaskIfNeeded(mStartActivity.getTask(),
            mPreferredWindowingMode, mPreferredTaskDisplayArea, mTargetStack);

    return START_SUCCESS;
}
```

启动一个活动，并决定该活动是否应该添加到一个现有任务的顶部，或交付新的意图到一个现有的活动。同时操作活动任务到被请求的或有效的堆栈/显示上。

 

之后在ActivityStarter.startActivityInner()又分为两路，最终都会调用到ClientTransaction.schedule()，然后调用到APP端。

## 创建ClientTransaction-1

​    从Task.moveToFront() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
ActivityStarter.startActivityInner() ->
Task.moveToFront() ->
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

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/onCreate过程1.png" alt="onCreate过程1.png" style="zoom:80%" />
</div>



## 创建ClientTransaction-2

​    从RootWindowContainer.resumeFocusedTasksTopActivities() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

 

(1)   堆栈

```txt
ActivityStarter.startActivityInner() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity() ->
TaskDisplayArea.pauseBackTasks() ->
WindowContainer.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
// Consumer接口调用过程，构造于TaskDisplayArea.pauseBackTasks()
TaskFragment.forAllLeafTaskFragments() ->
// Consumer接口调用过程，构造于TaskDisplayArea.pauseBackTasks()
TaskFragment.startPausing() ->
TaskFragment.startPausing() ->
TaskFragment.schedulePauseActivity() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

(2)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks=null；
- mLifecycleStateRequest为一个PauseActivityItem对象，之后APP端通过该对象执行onPause()；
- 之后还会通过PauseActivityItem.postExecute() -> ActivityClient.activityPaused()调用回system端。

## 关键过程

### START u0

说明：打印START ux日志，x表示userId。

日志示例：

ActivityTaskManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.demoapp.activitydemo/.MainActivity bnds=[81,772][253,944] (has extras)} from uid 10128 from pid 15720 callingPackage com.miui.home

 

(1)   打印位置

ActivityStarter.executeRequest(Request request)

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

(2)   堆栈

```txt
Binder: IActivityTaskManager.Stub.onTransact() ->
ATMS.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest()
```

### wm_create_activity

说明：表示将要对该Activity执行onCreate()。

日志示例：

```txt
06-12 18:43:39.008 1711 13415 I wm_create_activity: [0,245284976,51,com.demoapp.activitydemo/.MainActivity,android.intent.action.MAIN,NULL,NULL,270532608]
```



(1)   打印位置

```java
ActivityStarter.startActivityInner()
mStartActivity.logStartActivity(EventLogTags.WM_CREATE_ACTIVITY, startedTask);

ActivityRecord.logStartActivity()
void logStartActivity(int tag, Task task) {
    final Uri data = intent.getData();
    final String strData = data != null ? data.toSafeString() : null;

    EventLog.writeEvent(tag,
            mUserId, System.identityHashCode(this), task.mTaskId,
            shortComponentName, intent.getAction(),
            intent.getType(), strData, intent.getFlags());
}
```

(2)   堆栈

```txt
ActivityTaskManagerService.startActivity() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityTaskManagerService.startActivityAsUser() ->
ActivityStarter.execute() ->
ActivityStarter.executeRequest() ->
ActivityStarter.startActivityUnchecked() ->
ActivityStarter.startActivityInner() ->
ActivityRecord.logStartActivity()
```

### wm_pause_activity

说明：表示将要对该Activity执行onPause()。

日志示例：

```txt
06-12 18:43:39.012  1711 13415 I wm_pause_activity: [0,134036600,com.android.launcher3/.uioverrides.QuickstepLauncher,userLeaving=true,pauseBackTasks]
```

# (3) APP端-Launcher

作用：执行APP端的onPause()

 

system端有连续两次调用到此APP端。

共有过程如下：

```txt
ApplicationThread.scheduleTransaction() ->
ClientTransactionHandler.scheduleTransaction() ->
sendMessage(ActivityThread.H.EXECUTE_TRANSACTION, transaction) ->
ActivityThread.H.handleMessage(Message msg) ->
TransactionExecutor.execute()
```

## 执行ClientTransaction-1

第1次执行的是之前system的Task.moveToFront()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

 

## 执行ClientTransaction-2

第2次执行的是之前system的RootWindowContainer.resumeFocusedTasksTopActivities()调用过来的第2个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 不会执行executeCallbacks(transaction)，因为callbacks == null；
- 执行executeLifecycleState(transaction)，调用到onPause()生命周期方法；
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

## 调用到system

调用回system端的堆栈如下：

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
PauseActivityItem.postExecute() ->
ActivityClient.activityPaused()
```

之后调用到ActivityClientController.activityPaused(token)。

# (4) system端

## 共有流程

```txt
IActivityClientController$Stub.onTransact() ->
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity() ->
ActivityTaskSupervisor.startSpecificActivity()
```

## ATS.startSpecificActivity()

ATS=ActivityTaskSupervisor

在这里分两种情况，进程已启动或进程未启动。

```java
void startSpecificActivity(ActivityRecord r, boolean andResume, boolean checkConfig) {
    // Is this activity's application already running?
    final WindowProcessController wpc =
            mService.getProcessController(r.processName, r.info.applicationInfo.uid);

    boolean knownToBeDead = false;
    if (wpc != null && wpc.hasThread()) {
        try {
            realStartActivityLocked(r, wpc, andResume, checkConfig);
            return;
        } catch (RemoteException e) {
            Slog.w(TAG, "Exception when starting activity "
                    + r.intent.getComponent().flattenToShortString(), e);
        }

        // If a dead object exception was thrown -- fall through to
        // restart the application.
        knownToBeDead = true;
        // Remove the process record so it won't be considered as alive.
        mService.mProcessNames.remove(wpc.mName, wpc.mUid);
        mService.mProcessMap.remove(wpc.getPid());
    }

    r.notifyUnknownVisibilityLaunchedForKeyguardTransition();

    final boolean isTop = andResume && r.isTopRunningActivity();
    mService.startProcessAsync(r, knownToBeDead, isTop,
            isTop ? HostingRecord.HOSTING_TYPE_TOP_ACTIVITY
                    : HostingRecord.HOSTING_TYPE_ACTIVITY);
}
```

### 进程已存在

如果当前Activity所在进程已启动，则直接调用realStartActivityLocked()。

```txt
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity() ->
ActivityTaskSupervisor.startSpecificActivity() ->
ActivityTaskSupervisor.realStartActivityLocked()
```

​    之后在ATS.realStartActivityLocked()通过ClientLifecycleManager.getLifecycleManager()和Task.minimalResumeActivityLocked()分别调用到APP端。

第1次：

```txt
ActivityTaskSupervisor.realStartActivityLocked() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule()
```

第2次：

```txt
ActivityTaskSupervisor.realStartActivityLocked() ->
Task.minimalResumeActivityLocked() ->
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

### 进程不存在

若进程不存在，则执行ATMS.startProcessAsync()先创建进程：

```txt
ATMS.startProcessAsync() ->
AMS.startProcess() ->
AMS.startProcessLocked() ->
ProcessList.startProcessLocked(14 args) ->
ProcessList.handleProcessStart() ->
ProcessList.startProcess() ->

// Zygote流程…

// 被启动的APP进程
ActivityThread.main() ->
ActivityThread.attach() ->

// system端，之后最终走到ATS.realStartActivityLocked()
ActivityManagerService.attachApplication() ->
ActivityManagerService.attachApplicationLocked() ->
ActivityTaskManagerService$LocalService.attachApplication() ->
RootWindowContainer.attachApplication() ->
RootWindowContainer$AttachApplicationHelper.process() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
Task.forAllRootTasks() ->
RootWindowContainer$AttachApplicationHelper.accept() ->
RootWindowContainer$AttachApplicationHelper.accept() ->
WindowContainer.forAllActivities() ->
WindowContainer.forAllActivities() ->
ActivityRecord.forAllActivities() ->
RootWindowContainer$AttachApplicationHelper.test() ->
RootWindowContainer$AttachApplicationHelper.test() ->
ActivityTaskSupervisor.realStartActivityLocked()
```

之后的调用栈和进程已启动一样，通过ClientLifecycleManager.getLifecycleManager()和Task.minimalResumeActivityLocked()分别调用到APP端。

## ATS.realStartActivityLocked()

ATS=ActivityTaskSupervisor

执行到此处，无论之前进程是否已启动，在这里则都启动了。

 

在这里直接生成一个ClientTransaction事务对象并调用到APP端。

```java
// Create activity launch transaction.
final ClientTransaction clientTransaction = ClientTransaction.obtain(
        proc.getThread(), r.token);

final boolean isTransitionForward = r.isTransitionForward();
final IBinder fragmentToken = r.getTaskFragment().getFragmentToken();
clientTransaction.addCallback(LaunchActivityItem.obtain(new Intent(r.intent),
        System.identityHashCode(r), r.info,
        // TODO: Have this take the merged configuration instead of separate global
        // and override configs.
        mergedConfiguration.getGlobalConfiguration(),
        mergedConfiguration.getOverrideConfiguration(), r.compat,
        r.getFilteredReferrer(r.launchedFromPackage), task.voiceInteractor,
        proc.getReportedProcState(), r.getSavedState(), r.getPersistentSavedState(),
        results, newIntents, r.takeOptions(), isTransitionForward,
        proc.createProfilerInfoIfNeeded(), r.assistToken, activityClientController,
        r.shareableActivityToken, r.getLaunchedFromBubble(), fragmentToken));

// Set desired final state.
final ActivityLifecycleItem lifecycleItem;
if (andResume) {
    lifecycleItem = ResumeActivityItem.obtain(isTransitionForward);
} else {
    lifecycleItem = PauseActivityItem.obtain();
}
clientTransaction.setLifecycleStateRequest(lifecycleItem);

// Schedule transaction.
mService.getLifecycleManager().scheduleTransaction(clientTransaction);
```

在这里通过Task.minimalResumeActivityLocked()流程也会创建一个ClientTransaction事务并调用到APP端。

```java
// so updating the state should be done accordingly.
if (andResume && readyToResume()) {
    // As part of the process of launching, ActivityThread also performs
    // a resume.
    rootTask.minimalResumeActivityLocked(r);
} else {
    // This activity is not starting in the resumed state... which should look like we asked
    // it to pause+stop (but remain visible), and it has done so and reported back the
    // current icicle and other state.
    ProtoLog.v(WM_DEBUG_STATES, "Moving to PAUSED: %s "
            + "(starting in paused state)", r);
    r.setState(PAUSED, "realStartActivityLocked");
    mRootWindowContainer.executeAppTransitionForAllDisplay();
}
```

## 创建ClientTransaction-1

​    无论进程是否启动，都会从ATS.realStartActivityLocked()调用到这里来。此次Binder线程中第1次生成ClientTransaction事务对象，该对象包含LaunchActivityItem回调执行请求和ResumeActivityItem生命周期执行请求，然后传递到APP端。

 

(2)   堆栈

```txt
ActivityTaskSupervisor.realStartActivityLocked() ->
ClientLifecycleManager.scheduleTransaction() ->
ClientTransaction.schedule() ->
```

(1)   ClientTransaction对象

this的内容如下：

- mActivityCallbacks包含一个LaunchActivityItem对象，执行该对象的回调；
- mLifecycleStateRequest为一个ResumeActivityItem对象，之后APP端通过该对象执行onResume()。

## 创建ClientTransaction-2

​    从RootWindowContainer.resumeFocusedTasksTopActivities() -> ClientTransaction.schedule()，经过一系列调用，生成ClientTransaction事务对象，该对象包含TopResumedActivityChangeItem回调执行请求，然后传递到APP端。

(1)   堆栈

```txt
ActivityTaskSupervisor.realStartActivityLocked() ->
Task.minimalResumeActivityLocked() ->
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

this的内容如下:

- mActivityCallbacks包含一个TopResumedActivityChangeItem对象,执行该对象的回调；
- mLifecycleStateRequest=null。

## 关键过程

### wm_add_to_stopping

说明：将上一个Activity加入到ActivityTaskSupervisor.mStoppingActivities列表中。

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
Task.forAllRootTasks() ->
// Consumer接口调用过程，构造于DisplayContent.ensureActivitiesVisible()
Task.ensureActivitiesVisible() ->
Task.forAllLeafTasks() ->
Task.forAllLeafTasks() ->
// Consumer接口调用过程，构造于Task.ensureActivitiesVisible()
TaskFragment.updateActivityVisibilities() ->
EnsureActivitiesVisibleHelper.process() ->
EnsureActivitiesVisibleHelper.setActivityVisibilityState() ->
ActivityRecord.makeInvisible() ->
ActivityRecord.addToStopping()
```

# (5) APP端-ActivityDemo

system端有连续两次调用到待启动Activity的APP端。

共有过程如下：

```txt
ApplicationThread.scheduleTransaction() ->
ClientTransactionHandler.scheduleTransaction() ->
sendMessage(ActivityThread.H.EXECUTE_TRANSACTION, transaction) ->
ActivityThread.H.handleMessage(Message msg) ->
TransactionExecutor.execute()
```

## 执行ClientTransaction-1

第1次执行的是之前system的Activity.setState()调用过来的第1个ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 执行executeCallbacks(transaction)，会调用到onCreate()；
- 执行executeLifecycleState(transaction)，会调用到onStart()、onResume()；
- 最后通过ActivityClient.activityResumed()调用回system端。

 

### TransactionExecutor.executeCallbacks()

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

### onCreate()生命周期

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeCallbacks() ->
LaunchActivityItem.execute() ->
ActivityThread.handleLaunchActivity() ->
ActivityThread.performLaunchActivity() ->
Instrumentation.callActivityOnCreate() ->
Activity.performCreate() ->
Activity.performCreate() ->
MainActivity.onCreate() ->
FragmentActivity.onCreate() ->
ComponentActivity.onCreate() ->
ComponentActivity.onCreate() ->
Activity.onCreate()
```

### TransactionExecutor.executeLifecycleState()

通过cycleToPath()执行onStart()生命周期，通过lifecycleItem.execute()执行onResume()，最后通过lifecycleItem.postExecute()调用到system端。

```java
/** Transition to the final state if requested by the transaction. */
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

### onStart()生命周期

```txt
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
TransactionExecutor.cycleToPath() ->
TransactionExecutor.performLifecycleSequence() ->
ActivityThread.handleStartActivity() ->
Activity.performStart() ->
Instrumentation.callActivityOnStart() ->
MainActivity.onStart() ->
AppCompatActivity.onStart() ->
FragmentActivity.onStart() ->
Activity.onStart()
```

### onResume()生命周期

```java
ActivityThread$H.handleMessage() ->
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
ResumeActivityItem.execute() ->
ActivityThread.handleResumeActivity() ->
ActivityThread.performResumeActivity() ->
Activity.performResume() ->
Instrumentation.callActivityOnResume() ->
MainActivity.onResume() ->
FragmentActivity.onResume() ->
Activity.onResume()
```

## 执行ClientTransaction-2

​    第2次执行的是之前system的RootWindowContainer.resumeFocusedTasksTopActivities()调用过来的ClientTransaction事务。

 

在TransactionExecutor.execute(transaction)中：

- 只是执行executeCallbacks(transaction)，是一个TopResumedActivityChangeItem对象；
- 不会执行executeLifecycleState(transaction)，因为lifecycleItem = null，直接return。

## 调用到system

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

# (6)system&Home-onStop()

## 创建ClientTransaction

​    Stop流程开始执行是从之前的ActivityClientController.activityPaused(token)调用进来后开始的。在TaskFragment.resumeTopActivity()中，从mRootWindowContainer.ensureVisibilityAndConfig()进入到stop栈中。

 

注：上一个Activity（Home）的onStop()和下一个Activity（ActivityDemo）的onResume()的生命周期调度都是从同一个system端的Binder线程调用过来的。只不过stop过程中间有一次消息传递，所以执行速度比resume略慢，体现在日志上就是wm_on_stop_called日志通常在wm_on_resume_called日志之后打印。

 

 

(1)   堆栈

- 进程未启动的堆栈

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

- 进程已启动的堆栈

```txt
IActivityClientController$Stub.onTransact() ->
ActivityClientController.activityPaused() ->
ActivityRecord.activityPaused() ->
TaskFragment.completePause() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
RootWindowContainer.resumeFocusedTasksTopActivities() ->
Task.resumeTopActivityUncheckedLocked() ->
Task.resumeTopActivityInnerLocked() ->
TaskFragment.resumeTopActivity() ->
ActivityTaskSupervisor.startSpecificActivity() ->
ActivityTaskSupervisor.realStartActivityLocked() ->
RootWindowContainer.ensureVisibilityAndConfig() ->
RootWindowContainer.ensureActivitiesVisible() ->
DisplayContent.ensureActivitiesVisible() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
WindowContainer.forAllRootTasks() ->
Task.forAllRootTasks() ->
//...
Task.ensureActivitiesVisible() ->
Task.forAllLeafTasks() ->
//...
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

接收到IDLE_NOW_MSG消息之后，在ActivityRecord.stopIfPossible()中打印wm_stop_activity日志。

(2)   ClientTransaction对象

this的内容如下:

- mActivityCallbacks = null；
- mLifecycleStateRequest为一个StopActivityItem对象，之后APP端通过该对象执行onStop()；
- 之后还会通过StopActivityItem.postExecute() -> ActivityClient.activityStopped()调用回system端。

## 执行ClientTransaction

​    执行之前system的Stop流程调用过来的ClientTransaction事务。

 

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

## 调用到system

(1)   创建StopInfo

```txt
TransactionExecutor.execute() ->
TransactionExecutor.executeLifecycleState() ->
ActivityTransactionItem.execute() ->
StopActivityItem.execute() ->
ActivityThread.handleStopActivity() ->
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

​    最后APP在ActivityClient.activityStopped()中调用到system中执行ActivityClientController.activityStopped()，主要是通知system端Stop执行完成，不会再调用到APP端。

```txt
PendingTransactionActions.StopInfo.run() ->
ActivityClient.activityStopped()
```

## 关键过程

### wm_stop_activity

说明：由接收IDLE_NOW_MSG消息开始，接收到IDLE_NOW_MSG消息之后，执行堆栈如下，在ActivityRecord.stopIfPossible()中打印wm_stop_activity日志。

```txt
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessage() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.handleMessageInner() ->
ActivityTaskSupervisor$ActivityTaskSupervisorHandler.activityIdleFromMessage() ->
ActivityTaskSupervisor.activityIdleInternal() ->
ActivityTaskSupervisor.processStoppingAndFinishingActivities() ->
ActivityRecord.stopIfPossible()
```

