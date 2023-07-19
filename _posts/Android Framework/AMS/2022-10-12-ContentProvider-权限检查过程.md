---
layout: post
# 标题配置
title:  ContentProvider-权限检查过程

# 时间配置
date:   2022-10-12

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

## 权限检查

Resolver端访问Provider端的大致流程可以看做3个进程的通信，即：

Resolver端 -> system_server -> Provider端

 

​    而在system_server进程和Provider端进程中都要进行权限检查，看Resolver端是否有读写或其它权限，如果在system_server中权限检查不通过，则不会再走后续流程，必须system_server和Provider端权限检查都通过之后，Resolver端才能进行数据操作。



# **system_server端权限检查**

## 总过程

```txt
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission() ->

Component权限检查：
AMS.checkComponentPermission() ->
ActivityManager.checkComponentPermission()

Uri权限检查：
UGMS.LocalService.checkAuthorityGrants() ->
UGMS.checkAuthorityGrantsLocked() 
```

## CPH.checkAssociationAndPermissionLocked()

在ContentProviderHelper.getContentProviderImpl()中被调用。

```java
private void checkAssociationAndPermissionLocked(ProcessRecord callingApp, ProviderInfo cpi,
        int callingUid, int userId, boolean checkUser, String cprName, long startTime) {
    String msg;
    if ((msg = checkContentProviderAssociation(callingApp, callingUid, cpi)) != null) {
        throw new SecurityException("Content provider lookup " + cprName
                + " failed: association not allowed with package " + msg);
    }
    checkTime(startTime, "getContentProviderImpl: before checkContentProviderPermission");
    if ((msg = checkContentProviderPermission(
                cpi, Binder.getCallingPid(), Binder.getCallingUid(), userId, checkUser,
                callingApp != null ? callingApp.toString() : null))
            != null) {
        throw new SecurityException(msg);
    }
    checkTime(startTime, "getContentProviderImpl: after checkContentProviderPermission");
}
```

各个参数为：

- ProcessRecord callingApp：访问端进程
- ProviderInfo cpi：Provider端info
- int callingUid：访问端Uid
- String cprName：ContentProviderRecord对象的toString()

<br/>

(1)   checkContentProviderAssociation()

检查访问端package与Provider端package是否可连接，如果可连接则返回null

<br/>

(2)   checkContentProviderPermission()

在这里进行主要检查，大多数问题都出现在这里，所以主要看这里之后的调用栈。

```java
if ((msg = checkContentProviderPermission(
            cpi, Binder.getCallingPid(), Binder.getCallingUid(), userId, checkUser,
            callingApp != null ? callingApp.toString() : null))
        != null) {
    throw new SecurityException(msg);
}
```

如果msg=null，则表示允许访问。

## CPH.checkContentProviderPermission()

(1)   检查用户权限

```java
if (checkUser) {....}
```

<br/>

(2)   检查访问端组件的读写权限

如果授权则返回null信息。

```java
if (ActivityManagerService.checkComponentPermission(cpi.readPermission,
        callingPid, callingUid, cpi.applicationInfo.uid, cpi.exported)
        == PackageManager.PERMISSION_GRANTED) {
    return null;
}
if (ActivityManagerService.checkComponentPermission(cpi.writePermission,
        callingPid, callingUid, cpi.applicationInfo.uid, cpi.exported)
        == PackageManager.PERMISSION_GRANTED) {
    return null;
}
```

<br/>

(3)   检查Uri权限

```java
if (!checkedGrants
        && mService.mUgmInternal.checkAuthorityGrants(callingUid, cpi, userId, checkUser)) {
    return null;
}
```

```txt
UriGrantsManagerService.checkAuthorityGrants() ->
UriGrantsManagerService.checkAuthorityGrantsLocked() 
```

返回true表示拥有权限。

获取从系统保存的Uri权限记录信息mGrantedUriPermissions。然后逐个取出Resolver端进程的所有授权的Uri中的Auth，依次与本次访问的Provider的Auth比较，如果有匹配项就返回true。

```java
private boolean checkAuthorityGrantsLocked(int callingUid, ProviderInfo cpi, int userId,
        boolean checkUser) {
    final ArrayMap<GrantUri, UriPermission> perms = mGrantedUriPermissions.get(callingUid);
    if (perms != null) {
        for (int i = perms.size() - 1; i >= 0; i--) {
            GrantUri grantUri = perms.keyAt(i);
            if (grantUri.sourceUserId == userId || !checkUser) {
                if (matchesProvider(grantUri.uri, cpi)) {
                    return true;
                }
            }
        }
    }
    return false;
}
```

<br/>

(4)   返回msg

如果以上所有流程都未return，则最后根据情况返回异常msg信息。

```java
final String suffix;
if (!cpi.exported) {
    suffix = " that is not exported from UID " + cpi.applicationInfo.uid;
} else if (android.Manifest.permission.MANAGE_DOCUMENTS.equals(cpi.readPermission)) {
    suffix = " requires that you obtain access using ACTION_OPEN_DOCUMENT or related APIs";
} else {
    suffix = " requires " + cpi.readPermission + " or " + cpi.writePermission;
}
final String msg = "Permission Denial: opening provider " + cpi.name
        + " from " + (appName != null ? appName : "(null)")
        + " (pid=" + callingPid + ", uid=" + callingUid + ")" + suffix;
Slog.w(TAG, msg);
return msg;
```

## Component权限

 

### AMS.checkComponentPermission()

​    在AMS.checkComponentPermission()中主要检查Resolver端进程是否拥有权限。

主要进行以下流程：

- Resolver端如果是system_server进程：if (pid == MY_PID)，一律运行授权；
- if (permission != null)：略；
- 进入到AM.checkComponentPermission()检查权限。

```java
public static int checkComponentPermission(String permission, int pid, int uid,
        int owningUid, boolean exported) {
    // AMS和CPH运行在system_server进程中，MY_PID就是system_server进程的Pid
    if (pid == MY_PID) {
        return PackageManager.PERMISSION_GRANTED;
    }

    if (permission != null) {
        synchronized (sActiveProcessInfoSelfLocked) {
            ProcessInfo procInfo = sActiveProcessInfoSelfLocked.get(pid);
            if (procInfo != null && procInfo.deniedPermissions != null
                    && procInfo.deniedPermissions.contains(permission)) {
                return PackageManager.PERMISSION_DENIED;
            }
        }
    }
    return ActivityManager.checkComponentPermission(permission, uid,
            owningUid, exported);
}
```

### AM.checkComponentPermission()

​    之后进入到ActivityManager.checkComponentPermission()中检查权限：

- permission表示查询的是允许哪种权限
- uid表示访问端的UID
- owningUid表示Provider端的UID
- exported表示Provider端的android:exported属性

```java
public static int checkComponentPermission(String permission, int uid,
        int owningUid, boolean exported) {
    // Root, system server get to do everything.
    final int appId = UserHandle.getAppId(uid);
    // 如果Resolver端uid=1000,默认拥有权限
    if (appId == Process.ROOT_UID || appId == Process.SYSTEM_UID) {
        return PackageManager.PERMISSION_GRANTED;
    }
    // Isolated processes don't get any permissions.
    if (UserHandle.isIsolated(uid)) {
        return PackageManager.PERMISSION_DENIED;
    }
    // If there is a uid that owns whatever is being accessed, it has
    // blanket access to it regardless of the permissions it requires.
    if (owningUid >= 0 && UserHandle.isSameApp(uid, owningUid)) {
        return PackageManager.PERMISSION_GRANTED;
    }
    // If the target is not exported, then nobody else can get to it.
    if (!exported) {
        /*
        RuntimeException here = new RuntimeException("here");
        here.fillInStackTrace();
        Slog.w(TAG, "Permission denied: checkComponentPermission() owningUid=" + owningUid,
                here);
        */
        return PackageManager.PERMISSION_DENIED;
    }
    //
    if (permission == null) {
        return PackageManager.PERMISSION_GRANTED;
    }
    try {
        return AppGlobals.getPackageManager()
                .checkUidPermission(permission, uid);
    } catch (RemoteException e) {
        throw e.rethrowFromSystemServer();
    }
}
```

几个比较重要的判断点需要注意：

<br/>

(1)   系统进程

Process.ROOT_UID=0，也就是root进程默认拥有权限；

UID=1000的进程也默认授权；

最后都返回PM.PERMISSION_GRANTED.

<br/>

(2)   相同Uid下的进程默认授权

<br/>

(3)   android:exported="false"

这点通常是对FileProvider的，因为FileProvider的android:exported属性必须为false，如果请求的是FileProvider，则执行到这里返回PERMISSION_DENIED，及不授权。

之后回到CPH.checkContentProviderPermission()中会继续在Provider端中查询Resolver端是否拥有对FileProvider的权限。

<br/>

(4)   无权限限制

对于普通的Provider请求（即非FileProvider，也无其它自定义权限），则在 if (permission == null)中返回允许授权。

大多数对Provider的授权检查都在这里返回。

<br/>

(5)   PMS方检查访问端uid的权限

最后是PMS查询Resolver端APP是否拥有这一权限。

## Uri权限

UGMS=UriGrantsManagerService

 

### UGMS.LocalService.checkAuthorityGrants()

LocalService实现了UriGrantsManagerInternal类。

```java
public boolean checkAuthorityGrants(int callingUid, ProviderInfo cpi, int userId,
        boolean checkUser) {
    synchronized (mLock) {
        return UriGrantsManagerService.this.checkAuthorityGrantsLocked(
                callingUid, cpi, userId, checkUser);
    }
}
```

### UGMS.checkAuthorityGrantsLocked() 

检查Resolver端进程是否拥有对该Authority的访问访问权限。返回true表示拥有权限。

逐个取出Resolver端进程的所有授权Uri中的Auth，依次与本次访问的Provider的Auth比较，如果有匹配项就返回true。

```java
private boolean checkAuthorityGrantsLocked(int callingUid, ProviderInfo cpi, int userId,
        boolean checkUser) {
    final ArrayMap<GrantUri, UriPermission> perms = mGrantedUriPermissions.get(callingUid);
    if (perms != null) {
        for (int i = perms.size() - 1; i >= 0; i--) {
            GrantUri grantUri = perms.keyAt(i);
            if (grantUri.sourceUserId == userId || !checkUser) {
                if (matchesProvider(grantUri.uri, cpi)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/** Returns true if the uri authority is one of the authorities specified in the provider. */
private boolean matchesProvider(Uri uri, ProviderInfo cpi) {
    String uriAuth = uri.getAuthority();
    String cpiAuth = cpi.authority;
    if (cpiAuth.indexOf(';') == -1) {
        return cpiAuth.equals(uriAuth);
    }
    String[] cpiAuths = cpiAuth.split(";");
    int length = cpiAuths.length;
    for (int i = 0; i < length; i++) {
        if (cpiAuths[i].equals(uriAuth)) return true;
    }
    return false;
}
```

最后返回到checkAssociationAndPermissionLocked()，如果msg==null，表示无异常信息，检验通过。

```java
if ((msg = checkContentProviderPermission(
            cpi, Binder.getCallingPid(), Binder.getCallingUid(), userId, checkUser,
            callingApp != null ? callingApp.toString() : null))
        != null) {
    throw new SecurityException(msg);
}
```

# Provider端权限检查

## 总过程

通过Binder调用到Provider端之后，Provider端在执行数据操作前，也需要对来自Resolver端的请求作权限检查，如果不通过则不会进行数据操作。

以下过程以读取权限为例。

(1)   Provider端调用栈

```txt
Binder Native ->
Binder.execTransact() ->
Binder.execTransactInternal()
ContentProviderNative.onTransact() ->
```

读取FileProvider的权限检查流程：

```txt
ContentProvider.Transport.openTypedAssetFile() ->
ContentProvider.Transport.enforceFilePermission() ->
ContentProvider.Transport.enforceReadPermission() ->
ContentProvider.enforceReadPermissionInner()
```

查询普通Provider的权限检查流程：

```txt
ContentProvider.Transport.query() ->
ContentProvider.Transport.enforceReadPermission() ->
ContentProvider.enforceReadPermissionInner(){
    //此处返回
    if (allowDefaultRead) return PermissionChecker.PERMISSION_GRANTED;
}
```

<br/>

(2)   system_server端

Provider端检查Uri权限（FileProvider）时会调用到系统中。

```txt
ContextImpl.checkUriPermission() ->
AMS.checkUriPermission() ->
UriGrantsManagerService.checkUriPermission() ->
UriGrantsManagerService.checkAuthorityGrantsLocked()
```

## CP.enforceReadPermissionInner()

CP=ContentProvider

主要进行以下检查：

<br/>

(1)   Uid是否相同

如果Resolver端与Provider端的Uid相同，则授权允许；

<br/>

(2)   if (mExported && checkUser(pid, uid, context))

- FileProvider不会走此流程，因为mExported == false。
- 对普通Provider：即非FileProvider和带有额外权限的Provider，默认拥有权限：

```java
boolean allowDefaultRead = (componentPerm == null);
if (allowDefaultRead) return PermissionChecker.PERMISSION_GRANTED;
```

- 检查路径权限

<br/>

(3)   检查Uri权限

​    通过context.checkUriPermission调用到AMS，最后调用到UGMS以检查Resolver端是否拥有Uri授权。

调用栈：

```txt
ContextImpl.checkUriPermission() ->
AMS.checkUriPermission() ->
UriGrantsManagerService.checkUriPermission() ->
UriGrantsManagerService.checkAuthorityGrantsLocked()
```

详情参考system_server端权限检查中的UGMS.checkAuthorityGrantsLocked()。

```java
protected int enforceReadPermissionInner(Uri uri,
             @NonNull AttributionSource attributionSource) throws SecurityException {
    final Context context = getContext();
    final int pid = Binder.getCallingPid();
    final int uid = Binder.getCallingUid();
    String missingPerm = null;
    int strongestResult = PermissionChecker.PERMISSION_GRANTED;
    //如果是相同Uid则授权允许
    if (UserHandle.isSameApp(uid, mMyUid)) {
        return PermissionChecker.PERMISSION_GRANTED;
    }
    //这部分暂未验证
    if (mExported && checkUser(pid, uid, context)) {
        final String componentPerm = getReadPermission();
        if (componentPerm != null) {
            final int result = checkPermission(componentPerm, attributionSource);
            if (result == PermissionChecker.PERMISSION_GRANTED) {
                return PermissionChecker.PERMISSION_GRANTED;
            } else {
                missingPerm = componentPerm;
                strongestResult = Math.max(strongestResult, result);
            }
        }

        // 对未添加额外权限的普通Provider默认拥有权限
        boolean allowDefaultRead = (componentPerm == null);

        final PathPermission[] pps = getPathPermissions();
        if (pps != null) {
            final String path = uri.getPath();
            for (PathPermission pp : pps) {
                final String pathPerm = pp.getReadPermission();
                if (pathPerm != null && pp.match(path)) {
                    final int result = checkPermission(pathPerm, attributionSource);
                    if (result == PermissionChecker.PERMISSION_GRANTED) {
                        return PermissionChecker.PERMISSION_GRANTED;
                    } else {
                        // any denied <path-permission> means we lose
                        // default <provider> access.
                        allowDefaultRead = false;
                        missingPerm = pathPerm;
                        strongestResult = Math.max(strongestResult, result);
                    }
                }
            }
        }

        // if we passed <path-permission> checks above, and no default
        // <provider> permission, then allow access.
        //普通Provider在这里返回
        if (allowDefaultRead) return PermissionChecker.PERMISSION_GRANTED;
    }

    // 检查Uri授权，FileProvider需要走到这一步
    final int callingUserId = UserHandle.getUserId(uid);
    final Uri userUri = (mSingleUser && !UserHandle.isSameUser(mMyUid, uid))
            ? maybeAddUserId(uri, callingUserId) : uri;
    if (context.checkUriPermission(userUri, pid, uid, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            == PackageManager.PERMISSION_GRANTED) {
        return PermissionChecker.PERMISSION_GRANTED;
    }

    // If the worst denial we found above was ignored, then pass that
    // ignored through; otherwise we assume it should be a real error below.
    if (strongestResult == PermissionChecker.PERMISSION_SOFT_DENIED) {
        return PermissionChecker.PERMISSION_SOFT_DENIED;
    }

    //最后权限授权失败，打印失败日志
    final String suffix;
    if (android.Manifest.permission.MANAGE_DOCUMENTS.equals(mReadPermission)) {
        suffix = " requires that you obtain access using ACTION_OPEN_DOCUMENT or related APIs";
    } else if (mExported) {
        suffix = " requires " + missingPerm + ", or grantUriPermission()";
    } else {
        suffix = " requires the provider be exported, or grantUriPermission()";
    }
    throw new SecurityException("Permission Denial: reading "
            + ContentProvider.this.getClass().getName() + " uri " + uri + " from pid=" + pid
            + ", uid=" + uid + suffix);
}
```

