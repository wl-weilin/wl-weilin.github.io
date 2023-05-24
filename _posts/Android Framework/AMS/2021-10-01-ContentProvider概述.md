---
layout: post
# 标题配置
title:  ContentProvider概述

# 时间配置
date:   2021-10-01

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

## ContentProvider作用

ContentProvider的作用是为不同的应用之间数据共享，提供统一的接口。安卓系统中应用内部的数据是对外隔离的，要想让其它应用能使用自己的数据（例如通讯录），就需要用到ContentProvider。

ContentProvider通过uri来标识其它应用要访问的数据，通过ContentResolver的增、删、改、查方法实现对共享数据的操作。还可以通过注册ContentObserver来监听数据是否发生了变化来对应的刷新页面。

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/ContentProvider作用.png" style="zoom:80%" />
</div>



ContentProvider的优点：

- 为数据访问提供统一接口
- 跨进程数据的访问

ContentProvider的缺点：

- 不能单独使用，必须与其他存储方式结合使用


## ContentResolver作用

如果想要访问内容提供器中共享的数据，就一定要借助ContentResolver 类，可以通过Context中的getContentResolver()方法获取到该类的实例。 ContentResolver 中提供了一系列的方法用于对数据进行CRUD操作。

## ContentObserver作用

内容观察者，目的是观察(捕捉)特定Uri引起的数据库的变化，继而做一些相应的处理，它类似于数据库技术中的触发器(Trigger)，当ContentObserver所观察的Uri发生变化时，便会触发它，并执行相应的操作（如刷新页面）。

## Provider的Binder架构

<div style="text-align: center">
    <img src="/wl-docs/Android Framework/AMS/Provider的Binder架构.png" style="zoom:80%" />
</div>

如：应用进程A访问进程B提供的Provider

- 访问端：进程A
- AMS端：是上图中的Binder客户端，访问进程B提供的Provider；
- 服务端B：ContentProvider是个抽象类，通过内部类Transport继承了ContentProviderNative，用户端进程B发布Provider时需要继承ContentProvider，这样Provider架构的服务端就实现了。

AMS在获取Provider的引用（在ContentProviderHolder对象中）后，传递给进程A。

# 常用类和成员

[一图解惑之Android管理ContentProvider结构](https://suojingchao.github.io/2018/01/03/一图解惑之Android管理ContentProvider结构.html) 

 

## 简介

| 对象                            | 说明                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| ActivityThread.ProviderKey      | 标识一个Provider资源，用作mProviderMap的Key                  |
| ActivityThread.ProviderRefCount | 保存一个Provider的引用数                                     |
|                                 |                                                              |
| ContentProviderConnection       | 表示一个客户端和Provider之间的连接                           |
| ContentProviderHolder           | 保存ContentProvider的信息和ContentProvider的调用接口，并在SystemServer和App进程间传递 |
| ContentProviderRecord           | 对应一个ContentProvider，表示一个Provider及其相关属性        |
|                                 |                                                              |
| IContentProvider                | 表示一个ContentProvider的远程调用接口                        |
| ProviderInfo                    | 一个Provider的相关信息，由PackageManager.resolveContentProvider()返回 |

## ActivityThread

ActivityThread中与Provider相关的对象如下。

(1)   mProviderMap

```java
final ArrayMap<ProviderKey, ProviderClientRecord> mProviderMap
    = new ArrayMap<ProviderKey, ProviderClientRecord>();
```

保存当前进程已经访问过的ContentProvider或是当前进程内自己定义的ContentProvider。

 

(2)   mLocalProviders

```java
final ArrayMap<IBinder, ProviderClientRecord> mLocalProviders
    = new ArrayMap<IBinder, ProviderClientRecord>();
```

保存当前进程内自己定义的ContentProvider

 

(3)   mLocalProvidersByName

```java
final ArrayMap<ComponentName, ProviderClientRecord> mLocalProvidersByName
        = new ArrayMap<ComponentName, ProviderClientRecord>();
```

与mLocalProviders中保存的ProviderClientRecord对象相同，只不过用ComponentName作为键值。

(4)   mGetProviderKeys

```java
final ArrayMap<ProviderKey, ProviderKey> mGetProviderKeys = new ArrayMap<>();
```

只在以下代码中用到了

```java
private ProviderKey getGetProviderKey(String auth, int userId) {
    final ProviderKey key = new ProviderKey(auth, userId);
    synchronized (mGetProviderKeys) {
        ProviderKey lock = mGetProviderKeys.get(key);
        if (lock == null) {
            lock = key;
            mGetProviderKeys.put(key, lock);
        }
        return lock;
    }
}
```

只是保存ProviderKey，暂不知道其作用。

## ContentProviderConnection

该对象表示一个客户端和Provider之间的连接。

```java
public final ContentProviderRecord provider;
public final ProcessRecord client;
public final String clientPackage;
public AssociationState.SourceState association;
public final long createTime;
private Object mProcStatsLock;  // Internal lock for accessing AssociationState

/**
 * Internal lock that guards access to the two counters.
 */
private final Object mLock = new Object();
@GuardedBy("mLock")
private int mStableCount;
@GuardedBy("mLock")
private int mUnstableCount;
// The client of this connection is currently waiting for the provider to appear.
// Protected by the provider lock.
public boolean waiting;
// The provider of this connection is now dead.
public boolean dead;

// The original user id when this connection was requested, it could be different from
// the client's user id because the client could request to access a content provider
// living in a different user if it has the permission.
@UserIdInt final int mExpectedUserId;

// For debugging.
private int mNumStableIncs;
private int mNumUnstableIncs;
```

## ContentProviderHelper

在此类中实质上查询Provider，对已发布的Provider返回对象，未发布的作拉起进程等处理。

 

| 成员                                                   | 说明                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| ArrayList<ContentProviderRecord>   mLaunchingProviders | 保存正在启动中的Provider（有客户端正在等待），一旦发布成功就会从这里移除 |
| ProviderMap   mProviderMap                             | 保存已发布的Provider对象ContentProviderRecord                |
| boolean mSystemProvidersInstalled                      | 表示system_server进程的相关Provider是否安装，在系统启动时执行并赋值true |

```java
/**
 * Activity manager code dealing with content providers.
 */
public class ContentProviderHelper {
    private static final String TAG = "ContentProviderHelper";

    private final ActivityManagerService mService;

    /**
     * List of content providers who have clients waiting for them.  The
     * application is currently being launched and the provider will be
     * removed from this list once it is published.
     */
    private final ArrayList<ContentProviderRecord> mLaunchingProviders = new ArrayList<>();
    private final ProviderMap mProviderMap;
    private boolean mSystemProvidersInstalled;

    ContentProviderHelper(ActivityManagerService service, boolean createProviderMap) {
        mService = service;
        mProviderMap = createProviderMap ? new ProviderMap(mService) : null;
    }
    //......
}
```

## ContentProviderHolder

作用：主要是保存ContentProvider的信息和ContentProvider的调用接口，并在SystemServer和App进程间传递。

| 对象                       | 说明                                                   |
| -------------------------- | ------------------------------------------------------ |
| ProviderInfo  info         | 描述该ContentProvider的信息                            |
| IContentProvider  provider | 该ContentProvider的调用接口，是一个Binder对象          |
| IBinder  connection        | 实际是一个ContentProviderConnection对象                |
| boolean  noReleaseNeeded   | 应该是表示该Provider使用之后，是否需要移除的意思       |
| boolean  mLocal            | Whether  the provider here is a local provider or not. |

```java
public final ProviderInfo info;

public IContentProvider provider;
public IBinder connection;

public boolean noReleaseNeeded;

/**
 * Whether the provider here is a local provider or not.
 */
public boolean mLocal;
```

## ContentProviderRecord

作用：对应一个ContentProvider，表示一个Provider及其相关属性。

```java
// Maximum attempts to bring up the content provider before giving up.
static final int MAX_RETRY_COUNT = 3;

final ActivityManagerService service;
public final ProviderInfo info;
final int uid;
final ApplicationInfo appInfo;
final ComponentName name;
final boolean singleton;
public IContentProvider provider;
public boolean noReleaseNeeded;
// All attached clients
final ArrayList<ContentProviderConnection> connections
        = new ArrayList<ContentProviderConnection>();
//final HashSet<ProcessRecord> clients = new HashSet<ProcessRecord>();
// Handles for non-framework processes supported by this provider
ArrayMap<IBinder, ExternalProcessHandle> externalProcessTokenToHandle;
// Count for external process for which we have no handles.
int externalProcessNoHandleCount;
int mRestartCount; // number of times we tried before bringing up it successfully.
ProcessRecord proc; // if non-null, hosting process.
ProcessRecord launchingApp; // if non-null, waiting for this app to be launched.
String stringName;
String shortStringName;
```

## IContentProvider

表示一个远程的（非本进程）的Provider对象，是一个Binder引用。

 

## ProviderKey

作用：在客户端的ActivityThread对象中标识一个Provider资源，通过这个Key记录一个Provider的信息（即ProviderKey的属性）。

 

ProviderKey是ActivityThread.java中的静态内部类。

```java
private static final class ProviderKey {
    final String authority;
    final int userId;

    @GuardedBy("mLock")
    ContentProviderHolder mHolder; // Temp holder to be used between notifier and waiter
    final Object mLock; // The lock to be used to get notified when the provider is ready

    public ProviderKey(String authority, int userId) {
        this.authority = authority;
        this.userId = userId;
        this.mLock = new Object();
    }

    @Override
    public boolean equals(@Nullable Object o) {
        if (o instanceof ProviderKey) {
            final ProviderKey other = (ProviderKey) o;
            return Objects.equals(authority, other.authority) && userId == other.userId;
        }
        return false;
    }

    @Override
    public int hashCode() {
        return ((authority != null) ? authority.hashCode() : 0) ^ userId;
    }
}
```

getGetProviderKey()方法是根据Provider的auth和userId创建一个ProviderKey，然后再到mGetProviderKeys中查询该mGetProviderKeys是否存在，不存在则将新建的ProviderKey加入。

```java
private ProviderKey getGetProviderKey(String auth, int userId) {
    final ProviderKey key = new ProviderKey(auth, userId);
    synchronized (mGetProviderKeys) {
        ProviderKey lock = mGetProviderKeys.get(key);
        if (lock == null) {
            lock = key;
            mGetProviderKeys.put(key, lock);
        }
        return lock;
    }
}
```

