---
layout: post
# 标题配置
title:  ContentProvider-发布过程

# 时间配置
date:   2022-10-05

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


# 发布ContentProvider

[ContentProvider的启动流程分析—CSDN](https://blog.csdn.net/zhenjie_chang/article/details/62889188#t6)

[Android ContentProvider启动流程](https://juejin.cn/post/6844903992514838541)

## 拉起进程

创建ContentProvider是随着进程启动时进行的，在进程启动后，进入到进程的main方法，相关方法调用如下。

```java
ActivityThread.main() -> 
ActivityThread.attach() -> 
AMS.attachApplication() -> 
AMS.attachApplicationLocked() {
    Message msg = mHandler.obtainMessage(CONTENT_PROVIDER_PUBLISH_TIMEOUT_MSG);
    msg.obj = app;
    mHandler.sendMessageDelayed(msg,
             ContentResolver.CONTENT_PROVIDER_PUBLISH_TIMEOUT_MILLIS);
} ->
AMS.attachApplicationLocked() ->
ApplicationThread.bindApplication() ->
ActivityThread.handleBindApplication() ->
AT.handleBindApplication()
```

### AMS.attachApplicationLocked()

主要是通过bindApplication()创建Application和启动其它三大组件（如果需要的话），对Provider拉起的进程来说，主要看bindApplication()过程。

 

获取当前APP的所有ProviderInfo信息：

```java
List<ProviderInfo> providers = normalMode
                                    ? mCpHelper.generateApplicationProvidersLocked(app)
                                    : null;
final ProviderInfoList providerList = ProviderInfoList.fromList(providers);
```

ContentProviderHelper.generateApplicationProvidersLocked()如下：

```java
List<ProviderInfo> generateApplicationProvidersLocked(ProcessRecord app) {
    final List<ProviderInfo> providers;
    try {
        providers = AppGlobals.getPackageManager().queryContentProviders(
                            app.processName, app.uid, ActivityManagerService.STOCK_PM_FLAGS
                                | PackageManager.GET_URI_PERMISSION_PATTERNS
                                | PackageManager.MATCH_DIRECT_BOOT_AUTO, /*metaDataKey=*/ null)
                        .getList();
    } catch (RemoteException ex) {
        return null;
    }
```

传入到后续创建进程流程中：

```java
thread.bindApplication(processName, appInfo,
        app.sdkSandboxClientAppVolumeUuid, app.sdkSandboxClientAppPackage,
        providerList, null, profilerInfo, null, null, null, testMode,
        mBinderTransactionTrackingEnabled, enableTrackAllocation,
        isRestrictedBackupMode || !normalMode, app.isPersistent(),
        new Configuration(app.getWindowProcessController().getConfiguration()),
        app.getCompat(), getCommonServicesLocked(app.isolated),
        mCoreSettingsObserver.getCoreSettingsLocked(),
        buildSerial, autofillOptions, contentCaptureOptions,
        app.getDisabledCompatChanges(), serializedSystemFontMap,
        app.getStartElapsedTime(), app.getStartUptime());
```

### ApplicationThread.bindApplication()

在这里将相关参数封装到AppBindData对象中，然后通过H.BIND_APPLICATION消息发送到ActivityThread。

```java
data.providers = providerList.getList();
sendMessage(H.BIND_APPLICATION, data);
```

### AT.handleBindApplication()

```java
private void handleBindApplication(AppBindData data) {...}
```

安装Provider：

```java
// don't bring up providers in restricted mode; they may depend on the
// app's custom Application class
if (!data.restrictedBackupMode) {
    if (!ArrayUtils.isEmpty(data.providers)) {
        installContentProviders(app, data.providers);
    }
}
```

## AT.installContentProviders()

这里主要进行两步。

(1)   installProvider()：将进程中的所有Provider安装到本进程中

List<ProviderInfo> providers来自于AMS.attachApplicationLocked()，实际上通过PMS获得该APP下所有ProviderInfo。

(2)   publishContentProviders()：将Provider信息发布到AMS中

其它APP访问Provider时通过AMS查询。

```java
private void installContentProviders(
        Context context, List<ProviderInfo> providers) {
    final ArrayList<ContentProviderHolder> results = new ArrayList<>();

    for (ProviderInfo cpi : providers) {
        if (DEBUG_PROVIDER) {
            StringBuilder buf = new StringBuilder(128);
            buf.append("Pub ");
            buf.append(cpi.authority);
            buf.append(": ");
            buf.append(cpi.name);
            Log.i(TAG, buf.toString());
        }
        ContentProviderHolder cph = installProvider(context, null, cpi,
                false /*noisy*/, true /*noReleaseNeeded*/, true /*stable*/);
        if (cph != null) {
            cph.noReleaseNeeded = true;
            results.add(cph);
        }
    }

    try {
        ActivityManager.getService().publishContentProviders(
            getApplicationThread(), results);
    } catch (RemoteException ex) {
        throw ex.rethrowFromSystemServer();
    }
}
```

## Provider的install及onCreate()过程

与发布过程在installContentProviders()前是一样的。

```
ActivityThread.installContentProviders() ->
ActivityThread.installProvider() ->
ContentProvider.attachInfo() ->
ContentProvider.onCreate()
```

在ActivityThread.installProvider()方法中，调用attachInfo()的作用是将新创建的ContentProvider的ProviderInfo和Context关联起来，最后调用该Provider的onCreate()方法初始化ContentProvider。

通常会在onCreate()中完成对数据库的创建和升级等操作，返回true表示内容提供器初始化成功，返回false则表示失败。

### AT.installProvider()

```java
private ContentProviderHolder installProvider(Context context,
        ContentProviderHolder holder, ProviderInfo info,
        boolean noisy, boolean noReleaseNeeded, boolean stable) {...}
```



AT.installProvider()中的主要作用为将跨进程的Provider相关数据保存到本进程中，执行以下流程：

- 通过ProviderInfo info获取Provider所在进程的Context
- 通过Context获取到Provider对象及Binder引用
- 将Provider相关信息封装到ContentProviderHolder对象中
- 更新该Provider的引用计数

```java
private ContentProviderHolder installProvider(Context context,
         ContentProviderHolder holder, ProviderInfo info,
         boolean noisy, boolean noReleaseNeeded, boolean stable) {
    ContentProvider localProvider = null;
    IContentProvider provider;
    // holder为null表示还没有install过
    if (holder == null || holder.provider == null) {
        if (DEBUG_PROVIDER || noisy) {
            Slog.d(TAG, "Loading provider " + info.authority + ": "
                    + info.name);
        }
        Context c = null;
        ApplicationInfo ai = info.applicationInfo;
        //...
        //获取Provider所在进程的Context

        try {
            final java.lang.ClassLoader cl = c.getClassLoader();
            LoadedApk packageInfo = peekPackageInfo(ai.packageName, true);
            if (packageInfo == null) {
                // System startup case.
                packageInfo = getSystemContext().mPackageInfo;
            }
            // 创建provider对象
            localProvider = packageInfo.getAppFactory()
                    .instantiateProvider(cl, info.name);
            // 获取IContentProvider对象，用于跨进程binder引用
            provider = localProvider.getIContentProvider();
            //...
            // provider的attach，其中最重要的是会执行provider的onCreate
            localProvider.attachInfo(c, info);
        } catch (java.lang.Exception e) {
            //...
        }
    } else {
        provider = holder.provider;
        if (DEBUG_PROVIDER) Slog.v(TAG, "Installing external provider " + info.authority + ": "
                + info.name);
    }
    // provider的对象创建好了，那么接下来需要做的就是数据结构的封装
    // 把provider相关信息保存到ContentProviderHolder对象中
    ContentProviderHolder retHolder;

    synchronized (mProviderMap) {
        if (DEBUG_PROVIDER) Slog.v(TAG, "Checking to add " + provider
                + " / " + info.name);
        IBinder jBinder = provider.asBinder();
        if (localProvider != null) {
            ComponentName cname = new ComponentName(info.packageName, info.name);
            // mLocalProvidersByName的key是component信息，value是对应的ProviderClientReocrd
            ProviderClientRecord pr = mLocalProvidersByName.get(cname);
            if (pr != null) {
                // 不为空代表install过
                provider = pr.mProvider;
            } else {
                // 对于新创建的provider，创建其对应的ContentProviderHolder对象
                holder = new ContentProviderHolder(info);
                holder.provider = provider;
                holder.noReleaseNeeded = true;
                pr = installProviderAuthoritiesLocked(provider, localProvider, holder);
                // mLocalProviders的key是IContentProvider的binder对象，value是ProviderClientRecord
                // 将封装好的provider放入map中
                mLocalProviders.put(jBinder, pr);
                mLocalProvidersByName.put(cname, pr);
            }
            retHolder = pr.mHolder;
        } else { // 接下来更新引用计数
            // mProviderRefCountMap的key是binder对象，value是ProviderRefCount
            // ProviderRefCount中记录了这个provider的stable和unstable的数量
            ProviderRefCount prc = mProviderRefCountMap.get(jBinder);
            if (prc != null) {
                if (DEBUG_PROVIDER) {
                    Slog.v(TAG, "installProvider: lost the race, updating ref count");
                }
                // We need to transfer our new reference to the existing
                // ref count, releasing the old one...  but only if
                // release is needed (that is, it is not running in the
                // system process).
                if (!noReleaseNeeded) {
                    incProviderRefLocked(prc, stable);
                    try {
                        ActivityManager.getService().removeContentProvider(
                                holder.connection, stable);
                    } catch (RemoteException e) {
                        //do nothing content provider object is dead any way
                    }
                }
            } else {
                ProviderClientRecord client = installProviderAuthoritiesLocked(
                        provider, localProvider, holder);
                if (noReleaseNeeded) {
                    prc = new ProviderRefCount(holder, client, 1000, 1000);
                } else {
                    prc = stable
                            ? new ProviderRefCount(holder, client, 1, 0)
                            : new ProviderRefCount(holder, client, 0, 1);
                }
                mProviderRefCountMap.put(jBinder, prc);
            }
            retHolder = prc.holder;
        }
    }
    return retHolder;
}
```



### ContentProvider.attachInfo()

调用到目标Provider中，授予读写权限并执行onCreate()。

```java
public void attachInfo(Context context, ProviderInfo info) {
    attachInfo(context, info, false);
}

private void attachInfo(Context context, ProviderInfo info, boolean testing) {
    mNoPerms = testing;
    mCallingAttributionSource = new ThreadLocal<>();

    /*
     * Only allow it to be set once, so after the content service gives
     * this to us clients can't change it.
     */
    if (mContext == null) {
        mContext = context;
        if (context != null && mTransport != null) {
            mTransport.mAppOpsManager = (AppOpsManager) context.getSystemService(
                    Context.APP_OPS_SERVICE);
        }
        mMyUid = Process.myUid();
        if (info != null) {
            setReadPermission(info.readPermission);
            setWritePermission(info.writePermission);
            setPathPermissions(info.pathPermissions);
            mExported = info.exported;
            mSingleUser = (info.flags & ProviderInfo.FLAG_SINGLE_USER) != 0;
            setAuthorities(info.authority);
        }
        if (Build.IS_DEBUGGABLE) {
            setTransportLoggingEnabled(Log.isLoggable(getClass().getSimpleName(),
                    Log.VERBOSE));
        }
        ContentProvider.this.onCreate();
    }
}
```

### MyContentProvider.onCreate()

执行自定义Provider对象的onCreate()。

 

## Provider的publish过程

Provider进程端安装Provider过程：

```txt
ActivityThread.installContentProviders() ->
AMS.publishContentProviders() ->
ContentProviderHelper.publishContentProviders(){
removeMessage(CONTENT_PROVIDER_PUBLISH_TIMEOUT_MSG) }
```

AMS.publishContentProviders()的工作主要就是将ContentProvider的信息保存到AMS服务中去。AMS服务保存ContentProvider的信息主要是在类ProviderMap中，它里边有两种保存的Provider信息的集合：

- ProviderByClass：以ComponentName为key保存了ContentProviderRecord的信息；
- ProviderByName：以authority为key保存了ContentProviderRecord的信息。

 

### AMS.publishContentProviders()

实际上的发布过程是在CPH.publishContentProviders()中完成的。

```java
public final void publishContentProviders(IApplicationThread caller,
        List<ContentProviderHolder> providers) {
    if (Trace.isTagEnabled(Trace.TRACE_TAG_ACTIVITY_MANAGER)) {
        final int maxLength = 256;
        final StringBuilder sb = new StringBuilder(maxLength);
        sb.append("publishContentProviders: ");
        if (providers != null) {
            boolean first = true;
            for (int i = 0, size = providers.size(); i < size; i++) {
                final ContentProviderHolder holder = providers.get(i);
                if (holder != null && holder.info != null && holder.info.authority != null) {
                    final int len = holder.info.authority.length();
                    if (sb.length() + len > maxLength) {
                        sb.append("[[TRUNCATED]]");
                        break;
                    }
                    if (!first) {
                        sb.append(';');
                    } else {
                        first = false;
                    }
                    sb.append(holder.info.authority);
                }
            }
        }
        Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, sb.toString());
    }
    try {
        mCpHelper.publishContentProviders(caller, providers);
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    }
}
```

### CPH.publishContentProviders()

​    在这里将Provider的信息添加到system_server进程中，实际上就是CPH的mProviderMap数据中，以后如果有其它进程访问，则不再执行onCreate()，而是直接通过AMS返回对象。

 

本步骤主要进行以下流程：

- 遍历Provider所在进程下所有已经安装的provider，将新的Provider保存到mProviderMap中；
- 从正在启动列表mLaunchingProviders中移除该Provider信息，因为已成功启动；
- 移除该Provider的超时消息；
- 唤醒正在等待该Provider的线程

```java
void publishContentProviders(IApplicationThread caller, List<ContentProviderHolder> providers) {
    if (providers == null) {
        return;
    }

    mService.enforceNotIsolatedOrSdkSandboxCaller("publishContentProviders");
    synchronized (mService) {
        // 获取Provider所在进程对象
        final ProcessRecord r = mService.getRecordForAppLOSP(caller);
        if (r == null) {
            throw new SecurityException("Unable to find app for caller " + caller
                    + " (pid=" + Binder.getCallingPid()
                    + ") when publishing content providers");
        }

        final long origId = Binder.clearCallingIdentity();
        boolean providersPublished = false;
        // 遍历该进程下所有已经安装的provider
        for (int i = 0, size = providers.size(); i < size; i++) {
            ContentProviderHolder src = providers.get(i);
            if (src == null || src.info == null || src.provider == null) {
                continue;
            }
            ContentProviderRecord dst = r.mProviders.getProvider(src.info.name);
            if (dst == null) {
                continue;
            }
            if (DEBUG_MU) {
                Slog.v(TAG_MU, "ContentProviderRecord uid = " + dst.uid);
            }
            providersPublished = true;
            // 将这个providerRecord放入到mProviderMap中
            ComponentName comp = new ComponentName(dst.info.packageName, dst.info.name);
            mProviderMap.putProviderByClass(comp, dst);
            String[] names = dst.info.authority.split(";");
            for (int j = 0; j < names.length; j++) {
                mProviderMap.putProviderByName(names[j], dst);
            }
            // 如果该Provider在正在启动的列表中，则移除
            boolean wasInLaunchingProviders = false;
            for (int j = 0, numLaunching = mLaunchingProviders.size(); j < numLaunching; j++) {
                if (mLaunchingProviders.get(j) == dst) {
                    mLaunchingProviders.remove(j);
                    wasInLaunchingProviders = true;
                    j--;
                    numLaunching--;
                }
            }
            // 移除超时消息
            if (wasInLaunchingProviders) {
                mService.mHandler.removeMessages(
                        ActivityManagerService.WAIT_FOR_CONTENT_PROVIDER_TIMEOUT_MSG, dst);
                mService.mHandler.removeMessages(
                        ActivityManagerService.CONTENT_PROVIDER_PUBLISH_TIMEOUT_MSG, r);
            }
            // Make sure the package is associated with the process.
            // XXX We shouldn't need to do this, since we have added the package
            // when we generated the providers in generateApplicationProvidersLocked().
            // But for some reason in some cases we get here with the package no longer
            // added...  for now just patch it in to make things happy.
            r.addPackage(dst.info.applicationInfo.packageName,
                    dst.info.applicationInfo.longVersionCode, mService.mProcessStats);
            // 唤醒正在等待该Provider的线程
            synchronized (dst) {
                dst.provider = src.provider;
                dst.setProcess(r);
                dst.notifyAll();
                dst.onProviderPublishStatusLocked(true);
            }
            dst.mRestartCount = 0;
            if (hasProviderConnectionLocked(r)) {
                r.mProfile.addHostingComponentType(HOSTING_COMPONENT_TYPE_PROVIDER);
            }
        }

        // update the app's oom adj value and each provider's usage stats
        if (providersPublished) {
            mService.updateOomAdjLocked(r, OomAdjuster.OOM_ADJ_REASON_GET_PROVIDER);
            for (int i = 0, size = providers.size(); i < size; i++) {
                ContentProviderHolder src = providers.get(i);
                if (src == null || src.info == null || src.provider == null) {
                    continue;
                }
                maybeUpdateProviderUsageStatsLocked(r,
                        src.info.packageName, src.info.authority);
            }
        }

        Binder.restoreCallingIdentity(origId);
    }
}
```

















