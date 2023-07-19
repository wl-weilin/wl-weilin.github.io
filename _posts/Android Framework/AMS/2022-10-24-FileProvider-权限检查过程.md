---
layout: post
# 标题配置
title:  FileProvider-权限检查过程

# 时间配置
date:   2022-10-24

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


# **FileProvider权限检查过程**

 

## 相关进程

Resolver端访问Provider端的大致流程可以看做3个进程的通信，即：

Resolver端 -> system_server -> Provider端

<br/>

system_server系统进程涉及到Provider的类主要是AMS和ContentProviderHelper(CPH)。

而在system_server进程和Provider端进程中都要进行权限检查，看Resolver端是否有读写或其它权限，如果在system_server中权限检查不通过，则不会再走后续流程，必须system_server和Provider端权限检查都通过之后，Resolver端才能进行数据操作。

 

## 过程概述

(1)   system_server中的权限检查过程

```txt
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission() ->
```

Component权限检查：

```txt
AMS.checkComponentPermission() ->
ActivityManager.checkComponentPermission()
```

Uri权限检查：

```txt
UGMS.LocalService.checkAuthorityGrants() ->
UGMS.checkAuthorityGrantsLocked() 
```

<br/>

(2)   Provider端权限检查过程

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

Provider端检查Uri权限时会调用到系统中：

```txt
ContextImpl.checkUriPermission() ->
AMS.checkUriPermission() ->
UriGrantsManagerService.checkUriPermission() ->
UriGrantsManagerService.checkAuthorityGrantsLocked()
```

# 普通APP-拥有权限

条件：

- APP端进程为普通用户（非Uid=100及system_server）；
- FileProvider端已授予Resolver端读或写权限；
- 当前是Resolver端与FileProvider端第1次建立连接；
- FileProvider端已启动。

<br/>

结果：

- system_server端：在UriGrantsManagerService.checkAuthorityGrantsLocked()中返回允许访问的授权；
- Provider端：在ContentProvider.enforceReadPermissionInner()返回允许访问的授权；
- 最终成功访问。

<br/>

注：只有Resolver端启动后第1次访问Provider时才会走到AMS.getContentProvider()的流程，这是才会询问授权情况。第2次时就会走acquireExistingProvider()，直接通过本地已有记录访问。相关逻辑在ActivityThread.acquireProvider()中。

 

## system_server端权限检查-granted

system_server端返回允许访问的权限的全过程堆栈：

```txt
CPH.getContentProviderImpl() ->
CPH.checkContentProviderPermission() ->
UriGrantsManagerService.LocalSercvice.checkAuthorityGrants() ->
UriGrantsManagerService.checkAuthorityGrantsLocked()
```

(1)   进程权限检查（即ComponentPermission）

调用栈：

```txt
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission() ->
AMS.checkComponentPermission() ->
ActivityManager.checkComponentPermission()
```

在ActivityManager.checkComponentPermission()中检查Resolver端进程是否拥有权限：

```txt
if (!exported) {
    return PackageManager.PERMISSION_DENIED;
}
```

返回否定，因为FileProvider端的android:exported属性只能为true，所以这里不是FileProvider的授权结果。

 

堆栈回到checkContentProviderPermission()中继续向下。

<br/>

(2)   Uri权限

UGMS=UriGrantsManagerService

 

调用栈：

```java
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission(){
  if (!checkedGrants
          && mService.mUgmInternal.checkAuthorityGrants(callingUid, cpi, userId, checkUser)) {
    return null;
  }
} ->
UGMS.LocalService.checkAuthorityGrants() ->
UGMS.checkAuthorityGrantsLocked() 
```

在UGMS.checkAuthorityGrants()中检查Resolver端进程是否拥有对该Authority的访问访问权限。返回true表示拥有权限。

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

## Provider端权限检查-granted

正常情况下获取允许授权结果在ContentProvider.enforceReadPermissionInner()中：

```java
// last chance, check against any uri grants
final int callingUserId = UserHandle.getUserId(uid);
final Uri userUri = (mSingleUser && !UserHandle.isSameUser(mMyUid, uid))
        ? maybeAddUserId(uri, callingUserId) : uri;
if (context.checkUriPermission(userUri, pid, uid, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        == PackageManager.PERMISSION_GRANTED) {
    return PermissionChecker.PERMISSION_GRANTED;
}
```

# 普通APP-没有权限

条件：

- APP端进程为普通用户（非Uid=100及system_process）；
- Resolver端进程未获得FileProvider端授权；
- Resolver端无法访问到FileProvider端的文件内容；
- FileProvider端已启动。

 

结果：会在UriGrantsManagerService.checkAuthorityGrantsLocked()返回拒绝授权。

 

## system_server权限检查-denied

​    逐个取出Resolver端进程的所有授权Uri中的Auth，依次与本次访问的Provider的Auth比较，如果有匹配项就返回true，表示拥有权限。

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

返回到CPH.checkContentProviderPermission()中打印信息：

```java
final String msg = "Permission Denial: opening provider " + cpi.name
        + " from " + (appName != null ? appName : "(null)")
        + " (pid=" + callingPid + ", uid=" + callingUid + ")" + suffix;
Slog.w(TAG, msg);
return msg;
```

# system_server进程访问

条件：

- 访问端进程为system_server或与system_server运行在同一进程；
- system_server进程未提前获得FileProvider端的Uri授权；
- 当前是Resolver端与FileProvider端第1次建立连接；
- FileProvider端已启动。

 

结果：

- system_server：默认具有访问权限。
- Provider端：权限校验通过

 

## system_server权限检查-granted

返回授权结果代码处：

```java
public static int checkComponentPermission(String permission, int pid, int uid,
        int owningUid, boolean exported) {
    if (pid == MY_PID) {
        return PackageManager.PERMISSION_GRANTED;
    }
    //...
}
```

此处由于Resolver端是system_server，所以Pid相同，允许授权。

## Provider端权限检查-granted

```java
if (context.checkUriPermission(userUri, pid, uid, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        == PackageManager.PERMISSION_GRANTED) {
    return PermissionChecker.PERMISSION_GRANTED;
}
```

这里返回允许权限，最终成功访问。

# Uid=1000,非system_server进程访问

条件：

- Resolver端与system_server的Uid相同但Pid不同；
- Resolver端进程未提前获得FileProvider端的Uri授权；
- 当前是Resolver端与FileProvider端第1次建立连接；
- FileProvider端已启动。

<br/>

结果：

- system_server：默认具有访问权限。
- Provider端：权限校验通过

 

## system_server检查权限-granted

在以下处返回：

```txt
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission() ->
AMS.checkComponentPermission() ->
ActivityManager.checkComponentPermission()
```

```java
public static int checkComponentPermission(String permission, int uid,
        int owningUid, boolean exported) {
    // Root, system server get to do everything.
    final int appId = UserHandle.getAppId(uid);
    if (appId == Process.ROOT_UID || appId == Process.SYSTEM_UID) {
        return PackageManager.PERMISSION_GRANTED;
    }
    //...
}
```

判断appId == Process.SYSTEM_UID符合条件，返回允许访问。之后Resolver端会获得Provider端的引用，通过该引用可以调用到Provider端。

## Provider端权限检查-denied

但实际上即使在system_server授权成功了，在没有Provider端的授权下，最终也访问失败。

关键信息：

```txt
java.lang.SecurityException: Permission Denial: reading androidx.core.content.FileProvider uri content://com.demoapp.filedemo.fileprovider/share_name/myfile.txt from pid=14563, uid=1000 requires the provider be exported, or grantUriPermission()
```

打印于ContentProvider.enforceReadPermissionInner()中：

```java
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

