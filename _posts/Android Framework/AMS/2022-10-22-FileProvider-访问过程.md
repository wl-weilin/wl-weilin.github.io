---
layout: post

# 标题配置
title:  FileProvider-访问过程

# 时间配置
date:   2022-10-22

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


# Resolver端

## APP调用栈

(1)   用户调用代码

​    这里是一个简单的读取文本文件的代码，通过openFileDescriptor()开始访问目标FileProvider。

```java
Uri uri = Uri.parse("content://com.demoapp.filedemo.fileprovider/share_name/myfile.txt");
ParcelFileDescriptor parcelFileDescriptor =
        getContentResolver().openFileDescriptor(uri, "r");
FileReader reader = new FileReader(parcelFileDescriptor.getFileDescriptor());
BufferedReader bufferedReader = new BufferedReader(reader);
// 解析传来的数据，\A表示从字符串开头进行匹配
String res = new Scanner(bufferedReader).useDelimiter("\\A").next();
Log.d(TAG, res);
```

(2)   APP端调用堆栈

```java
ContentResolver.openFileDescriptor(uri, mode) ->
ContentResolver.openFileDescriptor(uri, mode, null) ->
ContentResolver.openAssetFileDescriptor() ->
ContentResolver.openTypedAssetFileDescriptor() ->
ContentResolver.acquireUnstableProvider(uri) ->
ContextImpl.ApplicationContentResolver.acquireUnstableProvider() ->
AT.acquireProvider()
```

## CR.openFileDescriptor()

CR=ContentResolver

由用户调用CR.openFileDescriptor()请求文件并返回文件的ParcelFileDescriptor对象，ParcelFileDescriptor是一个可以跨进程程度的文件对象。

```java
public final @Nullable ParcelFileDescriptor openFileDescriptor(@NonNull Uri uri,
        @NonNull String mode) throws FileNotFoundException {
    return openFileDescriptor(uri, mode, null);
}

public final @Nullable ParcelFileDescriptor openFileDescriptor(@NonNull Uri uri,
        @NonNull String mode, @Nullable CancellationSignal cancellationSignal)
                throws FileNotFoundException {
    try {
        if (mWrapped != null) return mWrapped.openFile(uri, mode, cancellationSignal);
    } catch (RemoteException e) {
        return null;
    }

    AssetFileDescriptor afd = openAssetFileDescriptor(uri, mode, cancellationSignal);
    if (afd == null) {
        return null;
    }

    if (afd.getDeclaredLength() < 0) {
        // This is a full file!
        return afd.getParcelFileDescriptor();
    }

    // Client can't handle a sub-section of a file, so close what
    // we got and bail with an exception.
    try {
        afd.close();
    } catch (IOException e) {
    }

    throw new FileNotFoundException("Not a whole file");
}
```

## CR.openAssetFileDescriptor()

在这里会通过传入的Uri获取到scheme，根据scheme的不同执行不同的流程，只有scheme为"android.resource"和"file"走特有的流程，其它scheme如"content"都走else流程。

对FileProvider：

- 如果mode=r，即只读，调用openTypedAssetFileDescriptor()
- 其它mode，调用IContentProvider.openAssetFile()，通过Binder直接调用到Provider端。

 

接下来只介绍一下只读情况。

## CR.openTypedAssetFileDescriptor()

CR=ContentResolver

在ContentResolver.openTypedAssetFileDescriptor()中通过auth获取IContentProvider引用，通过该引用调用到Provider端，调用IContentProvider.openTypedAssetFile()

system_server端中的作用就是获取IContentProvider引用。

 

此步骤中主要进行：

- 首先获取不稳定的IContentProvider，即IContentProvider unstableProvider，它的作用主要是将远程Provider添加到本地，并判断目标对象是否存在；
- 如果通过unstableProvider判断目标对象存在，则使用stableProvider实际访问目标，获取到ParcelFileDescriptor pfd对象；
- 通过ParcelFileDescriptor pfd构造AssetFileDescriptor对象并返回给用户；
- 最后释放连接。

```java
public final @Nullable AssetFileDescriptor openTypedAssetFileDescriptor(@NonNull Uri uri,
        @NonNull String mimeType, @Nullable Bundle opts,
        @Nullable CancellationSignal cancellationSignal) throws FileNotFoundException {
    Objects.requireNonNull(uri, "uri");
    Objects.requireNonNull(mimeType, "mimeType");

    try {
        if (mWrapped != null) return mWrapped.openTypedAssetFile(uri, mimeType, opts, cancellationSignal);
    } catch (RemoteException e) {
        return null;
    }

    IContentProvider unstableProvider = acquireUnstableProvider(uri);
    if (unstableProvider == null) {
        throw new FileNotFoundException("No content provider: " + uri);
    }
    IContentProvider stableProvider = null;
    AssetFileDescriptor fd = null;

    try {
        ICancellationSignal remoteCancellationSignal = null;
        if (cancellationSignal != null) {
            cancellationSignal.throwIfCanceled();
            remoteCancellationSignal = unstableProvider.createCancellationSignal();
            cancellationSignal.setRemote(remoteCancellationSignal);
        }

        try {
            fd = unstableProvider.openTypedAssetFile(
                    mContext.getAttributionSource(), uri, mimeType, opts,
                    remoteCancellationSignal);
            if (fd == null) {
                // The provider will be released by the finally{} clause
                return null;
            }
        } catch (DeadObjectException e) {
            // The remote process has died...  but we only hold an unstable
            // reference though, so we might recover!!!  Let's try!!!!
            // This is exciting!!1!!1!!!!1
            unstableProviderDied(unstableProvider);
            stableProvider = acquireProvider(uri);
            if (stableProvider == null) {
                throw new FileNotFoundException("No content provider: " + uri);
            }
            fd = stableProvider.openTypedAssetFile(
                    mContext.getAttributionSource(), uri, mimeType, opts,
                    remoteCancellationSignal);
            if (fd == null) {
                // The provider will be released by the finally{} clause
                return null;
            }
        }

        if (stableProvider == null) {
            stableProvider = acquireProvider(uri);
        }
        releaseUnstableProvider(unstableProvider);
        unstableProvider = null;
        ParcelFileDescriptor pfd = new ParcelFileDescriptorInner(
                fd.getParcelFileDescriptor(), stableProvider);

        // Success!  Don't release the provider when exiting, let
        // ParcelFileDescriptorInner do that when it is closed.
        stableProvider = null;

        return new AssetFileDescriptor(pfd, fd.getStartOffset(),
                fd.getDeclaredLength(), fd.getExtras());

    } catch (RemoteException e) {
        // Whatever, whatever, we'll go away.
        throw new FileNotFoundException(
                "Failed opening content provider: " + uri);
    } catch (FileNotFoundException e) {
        throw e;
    } finally {
        if (cancellationSignal != null) {
            cancellationSignal.setRemote(null);
        }
        if (stableProvider != null) {
            releaseProvider(stableProvider);
        }
        if (unstableProvider != null) {
            releaseUnstableProvider(unstableProvider);
        }
    }
}
```

## 获取Provider的Binder引用

ACR=ApplicationContentResolver，是ContextImpl的内部类

也就是获取到IContentProvider对象。

调用栈：

```txt
CR.acquireUnstableProvider(uri) ->
ACR.acquireUnstableProvider() ->
ActivityThread.acquireProvider() ->
AMS.getContentProvider()
```

这里比较主要的是ActivityThread.acquireProvider()，详情参考“ContentProvider发布与访问过程”。

# system_server端

 

## 调用栈

```txt
AMS.getContentProvider() ->
ContentProviderHelper.getContentProvider() ->
ContentProviderHelper.getContentProviderImpl()
```

## AMS.getContentProvider()

```java
public final ContentProviderHolder getContentProvider(
        IApplicationThread caller, String callingPackage, String name, int userId,
        boolean stable) {
    traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "getContentProvider: ", name);
    try {
        return mCpHelper.getContentProvider(caller, callingPackage, name, userId, stable);
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    }
}
```

## CPH.getContentProvider()

```java
ContentProviderHolder getContentProvider(IApplicationThread caller, String callingPackage,
        String name, int userId, boolean stable) {
    mService.enforceNotIsolatedCaller("getContentProvider");
    if (Process.isSdkSandboxUid(Binder.getCallingUid())) {
        Slog.w(TAG, "Sdk sandbox process " + Binder.getCallingUid()
                + " is accessing content provider " + name
                + ". This access will most likely be blocked in the future");
    }
    if (caller == null) {
        String msg = "null IApplicationThread when getting content provider " + name;
        Slog.w(TAG, msg);
        throw new SecurityException(msg);
    }
    // The incoming user check is now handled in checkContentProviderPermissionLocked() to deal
    // with cross-user grant.
    final int callingUid = Binder.getCallingUid();
    if (callingPackage != null && mService.mAppOpsService.checkPackage(
            callingUid, callingPackage) != AppOpsManager.MODE_ALLOWED) {
        throw new SecurityException("Given calling package " + callingPackage
                + " does not match caller's uid " + callingUid);
    }
    return getContentProviderImpl(caller, name, null, callingUid, callingPackage,
            null, stable, userId);
}
```

## CPH.getContentProviderImpl()

getContentProviderImpl()中代码很多，有很多判断流程，这里暂不详细说明。详情参考“ContentProvider发布与访问过程”。

 

## 权限检查

调用栈：

```txt
CPH.getContentProviderImpl() ->
CPH.checkAssociationAndPermissionLocked() ->
CPH.checkContentProviderPermission() ->
AMS.checkComponentPermission() ->
ActivityManager.checkComponentPermission()
```

详情参考：ContentProvider权限检查过程

# Provider端

## 调用栈

通过Binder调用到FileProvider.openFile(uri, mode)，调用栈如下：

```java
Native ->
Binder.execTransact() ->
Binder.execTransactInternal()
ContentProviderNative.onTransact(){
    //...
    case OPEN_TYPED_ASSET_FILE_TRANSACTION:
    {
        data.enforceInterface(IContentProvider.descriptor);
        AttributionSource attributionSource = AttributionSource.CREATOR
                .createFromParcel(data);
        Uri url = Uri.CREATOR.createFromParcel(data);
        String mimeType = data.readString();
        Bundle opts = data.readBundle();
        ICancellationSignal signal = ICancellationSignal.Stub.asInterface(
                data.readStrongBinder());

        AssetFileDescriptor fd;
        fd = openTypedAssetFile(attributionSource, url, mimeType, opts, signal);
        reply.writeNoException();
        if (fd != null) {
            reply.writeInt(1);
            fd.writeToParcel(reply,
                    Parcelable.PARCELABLE_WRITE_RETURN_VALUE);
        } else {
            reply.writeInt(0);
        }
        return true;
    }
    //...
} ->

ContentProvider.Transport.openTypedAssetFile() ->
ContentProvider.openTypedAssetFile(4 args) ->
ContentProvider.openTypedAssetFile(3 args) ->
ContentProvider.openAssetFile() ->
FileProvider.openFile()
```

接下来主要看一些关键流程。

## ContentProvider.openTypedAssetFile()

ContentProvider.Transport类：

```java
public AssetFileDescriptor openTypedAssetFile(
        @NonNull AttributionSource attributionSource, Uri uri, String mimeType,
        Bundle opts, ICancellationSignal cancellationSignal) throws FileNotFoundException {
    Bundle.setDefusable(opts, true);
    uri = validateIncomingUri(uri);
    uri = maybeGetUriWithoutUserId(uri);
    enforceFilePermission(attributionSource, uri, "r");
    traceBegin(TRACE_TAG_DATABASE, "openTypedAssetFile: ", uri.getAuthority());
    final AttributionSource original = setCallingAttributionSource(
            attributionSource);
    try {
        return mInterface.openTypedAssetFile(
                uri, mimeType, opts, CancellationSignal.fromTransport(cancellationSignal));
    } catch (RemoteException e) {
        throw e.rethrowAsRuntimeException();
    } finally {
        setCallingAttributionSource(original);
        Trace.traceEnd(TRACE_TAG_DATABASE);
    }
}
```

最后调用到ContentProvider类：

```java
public @Nullable AssetFileDescriptor openTypedAssetFile(@NonNull Uri uri,
        @NonNull String mimeTypeFilter, @Nullable Bundle opts,
        @Nullable CancellationSignal signal) throws FileNotFoundException {
    return openTypedAssetFile(uri, mimeTypeFilter, opts);
}

public @Nullable AssetFileDescriptor openTypedAssetFile(@NonNull Uri uri,
        @NonNull String mimeTypeFilter, @Nullable Bundle opts) throws FileNotFoundException {
    if ("*/*".equals(mimeTypeFilter)) {
        // If they can take anything, the untyped open call is good enough.
        return openAssetFile(uri, "r");
    }
    String baseType = getType(uri);
    if (baseType != null && ClipDescription.compareMimeTypes(baseType, mimeTypeFilter)) {
        // Use old untyped open call if this provider has a type for this
        // URI and it matches the request.
        return openAssetFile(uri, "r");
    }
    throw new FileNotFoundException("Can't open " + uri + " as type " + mimeTypeFilter);
}
```

## ContentProvider.openAssetFile()

```java
public @Nullable AssetFileDescriptor openAssetFile(@NonNull Uri uri, @NonNull String mode)
        throws FileNotFoundException {
    ParcelFileDescriptor fd = openFile(uri, mode);
    return fd != null ? new AssetFileDescriptor(fd, 0, -1) : null;
}
```

## FileProvider.openFile()

最终调用到这里打开文件。

```java
public ParcelFileDescriptor openFile(@NonNull Uri uri, @NonNull String mode)
        throws FileNotFoundException {
    // ContentProvider has already checked granted permissions
    final File file = mStrategy.getFileForUri(uri);
    final int fileMode = modeToMode(mode);
    return ParcelFileDescriptor.open(file, fileMode);
}
```

注：FileProvider并不是AOSP中的类，而是来自androidx.core.content.FileProvider。

## 权限检查

```txt
Native ->
Binder.execTransact() ->
Binder.execTransactInternal()
ContentProviderNative.onTransact() ->
ContentProvider.openTypedAssetFile() ->
ContentProvider.enforceFilePermission() ->
ContentProvider.enforceReadPermission() ->
ContentProvider.enforceReadPermissionInner()
```

详情参考：ContentProvider权限检查过程
