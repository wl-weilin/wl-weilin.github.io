---
layout: post

# 标题配置
title: SurfaceFlinger-概述

# 时间配置
date: 2023-06-01

# 大类配置
categories: Android-Framework

# 小类配置
tag: Framework-SurfaceFlinger

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


# 概述

 

## SurfaceFlinger的作用

SurfaceFlinger 是 Android 系统中非常重要的一个系统服务，它负责管理显示系统的组成部分。其主要作用包括：

<br/>

(1)   显示合成（Display Composition）

SurfaceFlinger 是 Android 显示系统的核心，负责合成应用程序界面的内容（来自各种应用的 Surface 对象）以及系统 UI 元素，如状态栏、导航栏等，最终将它们合成到屏幕上。这个过程包括对界面元素的叠加、缩放、旋转和混合。

<br/>

(2)   缓冲区管理（Buffer Management）

SurfaceFlinger 负责管理显示缓冲区，它能够有效地分配、跟踪和管理用于渲染和显示图形的缓冲区，以确保流畅的屏幕渲染。

<br/>

(3)   硬件加速（Hardware Acceleration）

SurfaceFlinger 利用 GPU 加速技术来提高图形渲染性能，使得显示操作更为流畅。

<br/>

(4)   屏幕刷新（Screen Refresh）

SurfaceFlinger 负责控制屏幕的刷新过程，确保将合成后的图像正确地显示在屏幕上。

<br/>

(5)   多窗口管理（Multi-window Management）

SurfaceFlinger 支持 Android 系统中的多窗口模式，允许多个应用程序同时显示在屏幕上，并对其进行管理和渲染。

<br/>

总的来说，SurfaceFlinger 在 Android 系统中扮演着显示和图形渲染的关键角色，它确保应用程序界面和系统 UI 能够流畅地显示在屏幕上，并提供硬件加速功能以优化图形渲染性能。

 

## Window与SurfaceFlinger关系

在 Android 中，Window 和 SurfaceFlinger 是用户界面显示和渲染的两个重要组成部分，它们之间存在紧密的关系。下面是它们之间的关系：

<br/>

(1)   Window（窗口）

在 Android 中，Window 是一个抽象的概念，代表了一个独立的绘制区域，用于承载一个或多个 UI 元素，即 View。每个 Activity 都会关联一个默认的 Window，用于呈现该 Activity 的用户界面。Window 包含了视图的层次结构、布局和交互逻辑。

<br/>

(2)   SurfaceFlinger（表面合成器）

SurfaceFlinger 是 Android 系统中的一个系统服务，负责管理、合成和渲染所有的视图（View）以及其它图形元素。它将多个视图的图像合成为最终的屏幕显示图像，并负责将图像呈现到物理显示设备上。SurfaceFlinger 确保界面的流畅性、动画效果以及屏幕的刷新。

<br/>

(3)   关系

Window 中的 View 组成了应用程序的用户界面，而 Window 本身是由 Surface 对象支持的。Surface 是一个用于渲染图像的数据结构，SurfaceFlinger 使用这些 Surface 对象来合成和显示屏幕上的图像。每个 Window 中的 View 最终会被转换为相应的 Surface，然后由 SurfaceFlinger 进行图像合成，将多个 Surface 合成为屏幕上的最终图像。

<br/>

总之，Window 是应用程序界面的容器，包含了多个 View，而 SurfaceFlinger 负责将多个 Surface 合成并渲染为屏幕上的图像，以实现流畅的用户界面显示。两者协同工作，使得应用程序的界面能够在设备屏幕上呈现出来。

 

## SurfaceFlinger属于哪个进程？

SurfaceFlinger属于Android系统中的一个单独的用户空间进程，它的进程名为"surfaceflinger"。它负责管理和渲染应用程序窗口以及其他图形元素，将它们合成到屏幕上，从而呈现用户界面。

<br/>

SurfaceFlinger 进程是 Android 系统的一个核心组件，它在系统启动时由 init 进程启动，以确保图形显示能够正常运行。它是 Android 系统中的一个独立进程，负责多个窗口的组合、显示和渲染，从而呈现出用户界面。这个进程负责处理窗口的层级关系、透明度、动画效果等，确保应用程序和系统界面的正常显示。



# Surface相关类

## Surface

```java
public class Surface implements Parcelable {...}
```

(1)   概述

一个Surface就是一个对象，该对象持有一群像素(pixels)，这些像素是要被组合到一起显示到屏幕上的。你在u上看到的每一个window(如对话框、全屏的activity、状态栏)都有唯一一个自己的surface，window将自己的内容(content)绘制到该surface中。Surface Flinger根据各个surface在Z轴上的顺序(Z-order)将它们渲染到最终的显示屏上。

 

一个surface通常有两个缓冲区以实现双缓冲绘制：当应用正在一个缓冲区中绘制自己下一个UI状态时，Surface Flinger可以将另一个缓冲区中的数据合成显示到屏幕上，而不用等待应用绘制完成。

 

(2)   成员变量

```java
final Object mLock = new Object(); // protects the native state

private String mName;

long mNativeObject; // package scope only for SurfaceControl access

private long mLockedObject;
private int mGenerationId; // incremented each time mNativeObject changes
private final Canvas mCanvas = new CompatibleCanvas();

// A matrix to scale the matrix set by application. This is set to null for
// non compatibility mode.
private Matrix mCompatibleMatrix;

private HwuiContext mHwuiContext;

private boolean mIsSingleBuffered;
private boolean mIsSharedBufferModeEnabled;
private boolean mIsAutoRefreshEnabled;

```

(3)   构造函数

```java
/**
 * Create an empty surface, which will later be filled in by readFromParcel().
 * @hide
 */
@UnsupportedAppUsage
public Surface() {
}

/**
 * Create a Surface associated with a given {@link SurfaceControl}. Buffers submitted to this
 * surface will be displayed by the system compositor according to the parameters
 * specified by the control. Multiple surfaces may be constructed from one SurfaceControl,
 * but only one can be connected (e.g. have an active EGL context) at a time.
 *
 * @param from The SurfaceControl to associate this Surface with
 */
public Surface(@NonNull SurfaceControl from) {
    copyFrom(from);
}

/**
 * Create Surface from a {@link SurfaceTexture}.
 *
 * Images drawn to the Surface will be made available to the {@link
 * SurfaceTexture}, which can attach them to an OpenGL ES texture via {@link
 * SurfaceTexture#updateTexImage}.
 *
 * Please note that holding onto the Surface created here is not enough to
 * keep the provided SurfaceTexture from being reclaimed.  In that sense,
 * the Surface will act like a
 * {@link java.lang.ref.WeakReference weak reference} to the SurfaceTexture.
 *
 * @param surfaceTexture The {@link SurfaceTexture} that is updated by this
 * Surface.
 * @throws OutOfResourcesException if the surface could not be created.
 */
public Surface(SurfaceTexture surfaceTexture) {
    if (surfaceTexture == null) {
        throw new IllegalArgumentException("surfaceTexture must not be null");
    }
    mIsSingleBuffered = surfaceTexture.isSingleBuffered();
    synchronized (mLock) {
        mName = surfaceTexture.toString();
        setNativeObjectLocked(nativeCreateFromSurfaceTexture(surfaceTexture));
    }
}

/* called from android_view_Surface_createFromIGraphicBufferProducer() */
@UnsupportedAppUsage(maxTargetSdk = Build.VERSION_CODES.R, trackingBug = 170729553)
private Surface(long nativeObject) {
    synchronized (mLock) {
        setNativeObjectLocked(nativeObject);
    }
}

```

## SurfaceSession

在Android的Window体系中Session表示一个活动的APP端，并且与WMS交互。顾名思义，SurfaceSession则表示一个system_server进程与SurfaceFlinger的连接。

 

SurfaceSession是与SurfaceFlinger交互创建Surface的一个类，本身没什么函数功能，主要是创建SurfaceComposerClient并建立与SurfaceFlinger的连接，将其指针返回给Java层，Java层的SurfaceControl的多参构造函数主要需要传入一个SurfaceSession，其中主要是拿其中的SurfaceComposerClient。

 

SurfaceSession.java中的代码并不多，主要如下。其native方法的实现在android_view_SurfaceSession.cpp中。

```java
/**
 * An instance of this class represents a connection to the surface
 * flinger, from which you can create one or more Surface instances that will
 * be composited to the screen.
 * {@hide}
 */
public final class SurfaceSession {
    // Note: This field is accessed by native code.
    @UnsupportedAppUsage(maxTargetSdk = Build.VERSION_CODES.R, trackingBug = 170729553)
    private long mNativeClient; // SurfaceComposerClient*

    private static native long nativeCreate();
    private static native void nativeDestroy(long ptr);

    /** Create a new connection with the surface flinger. */
    @UnsupportedAppUsage
    public SurfaceSession() {
        mNativeClient = nativeCreate();
    }

    /* no user serviceable parts here ... */
    @Override
    protected void finalize() throws Throwable {
        try {
            kill();
        } finally {
            super.finalize();
        }
    }

    /**
     * Remove the reference to the native Session object. The native object may still exist if
     * there are other references to it, but it cannot be accessed from this Java object anymore.
     */
    @UnsupportedAppUsage
    public void kill() {
        if (mNativeClient != 0) {
            nativeDestroy(mNativeClient);
            mNativeClient = 0;
        }
    }
}
```

