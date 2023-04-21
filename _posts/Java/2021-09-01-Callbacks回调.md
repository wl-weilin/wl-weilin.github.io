---
layout: post
# 标题配置
title:  Callbacks回调

# 时间配置
date:   2022-09-01

# 大类配置
categories: java

# 小类配置
tag: java-other

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


## 什么是回调？

理解回调之前，需要先理解同步调用和异步调用。

(1)   同步调用

同步调用是最基本和常见的调用方式，类 A 的 funcA()方法调用类B的funcB()方法，funcA()需要一直等待funcB()执行完毕，才能继续向下执行。

适用情况：

- funcA()需要立刻拿到funcB()的结果或需要funcB()执行某个步骤，这样funcA()才能继续执行下去；
- funcB()执行时间不长的情况，因为funcB() 执行时间过长或者直接阻塞的话，funcA()是无法继续执行的，于是就会造成阻塞。

```java
public class Test {

    public static void main(String[] args) {
        new A().funcA();
    }
}

class A {
    void funcA() {
        System.out.println("call funcA()");
        new B().funcB();
    }
}

class B {
    void funcB() {
        System.out.println("call funcB()");
    }
}
```

(1)   异步调用

异步调用是为了解决同步调用可能出现的阻塞。funcA()调用funcB()方法，可以不用等待funcB()执行完毕，funcA()可以立刻向下继续执行。

**适用情况**：对同步（实时性）要求不高

如下通过多线程模拟异步调用

```java
public class Test {

    public static void main(String[] args) {
        new A().funcA();
    }
}


class A {

    public void funcA() {
        System.out.println("call funcA()");
        new Thread(new Runnable() {
            @Override
            public void run() {
                new B().funcB();
            }
        }).start();
    }
}

class B {
    public void funcB(CallBack c) {
        System.out.println("call funcB()");
        timeoutTask(2000);
    }

    //模拟耗时任务，参数为耗时时间，单位ms
    public void timeoutTask(long duration){
        final long cur = System.currentTimeMillis();
        while (System.currentTimeMillis() <= cur + duration) {
            //
        }
    }
}
```

(1)   回调

在某些情况下，funcA()异步调用funcB()，在funcA()又需要知道funcB()是否执行完成或者返回其执行结果。funcA()又不可能通过轮询的方式一直询问funcB()，这样就做不了其它事了。必须通过一定的方式对funcB()的执行结果进行监听。于是可以通过回调的方式实现这一点。

当funcB()执行完成之后，会自动调用A中的callback()方法进行通知，而这个callback()方法就是一个回调方法，需要通过特定的方式注册到B中。

<div style="text-align: center">
    <img src="/wl-weilin.github.io/wl-docs/Java/others/回调示例图.png" style="zoom:80%" />
</div>

## 回调函数应用场景

回调函数一般适合于以下几种场合。

 

(1)   事件驱动机制

​    为了简单说明该机制，我们假定有两个类，类A与类B。该模式的工作机制如下：

- 类A提供一个回调函数F，该回调函数执行根据不同的参数，执行不同的动作；
- 类A在初始化类B时，传入回调函数F的函数指针pF；
- 类B根据需要在不同的情况下调用回调函数指针pF，这样就实现了类B来驱动类A，类A来响应类B的动作。

 

(2)   通信协议的"推"模式

​    在我们实际工作中，经常会遇到数据通信的问题。总体来说，两个对象要实现数据通信，有以下两种方式：

- "拉"模式

​    在该模式下，假定对象A要从对象B中获取实时数据信息，“拉”模式的工作机制如下：对象A开启一个线程，该线程执行一个循环，每隔一定时间间隔，向对象B发出数据请求；

​    该模式的主要问题是需要维护一个循环线程。时间间隔太长会导致，通信的实时性下降；时间间隔太短，会导致CPU浪费太多。

 

- "推"模式

​    在该模式下，假定对象A要从对象B中获取实时数据信息，“推”模式的工作机制如下：对象A在调用对象B时，向其传递一个回调函数；对象B一旦有新的信息，就调用对象A传递过来的函数指针，将最新的信息发送给对象A。

​    该模式完美解决了"拉"模式产生的问题，不但保证了数据传输的实时性，而且降低了无用的CPU消耗。一般的通信协议，建议采用"推"模式。

# 回调的实现方式

[Java回调的四种写法（反射、直接调用、接口调用、Lamda表达式）](https://cloud.tencent.com/developer/article/1676582)

 

## 自定义接口实现回调

自定义回调接口类CallBack，在需要用到回调的代码处创建实例并重写call()，然后作为参数传入到funcB()。

```java
public class Test {

    public static void main(String[] args) {
        new A().funcA();
    }
}

interface CallBack {
    void call();
}

class A {
    CallBack mCallback = new CallBack() {
        @Override
        public void call() {
            System.out.println("call A:callback()");
        }
    };

    public void funcA() {
        System.out.println("call funcA()");
        new Thread(new Runnable() {
            @Override
            public void run() {
                new B().funcB(mCallback);
            }
        }).start();
    }
}

class B {
    public void funcB(CallBack c) {
        System.out.println("call funcB()");
        timeoutTask(2000);
        c.call();
    }

    //模拟耗时任务，参数为耗时时间，单位ms
    public void timeoutTask(long duration){
        final long cur = System.currentTimeMillis();
        while (System.currentTimeMillis() <= cur + duration) {
            //
        }
    }
}
```

## 通过Runnable接口实现回调

Runnable接口是java自带类，只需要重写run()方法，这种方式实现的回调其本质和自定义接口一样。

```java
public class Test {

    public static void main(String[] args) {
        new A().funcA();
    }
}

class A {

    Runnable r = new Runnable() {
        @Override
        public void run() {
            System.out.println("call A:callback()");
        }
    };

    public void funcA() {
        System.out.println("call funcA()");
        new Thread(new Runnable() {
            @Override
            public void run() {
                new B().funcB(r);
            }
        }).start();
    }
}

class B {
    public void funcB(Runnable r) {
        System.out.println("call funcB()");
        timeoutTask(2000);
        r.run();
    }

    //模拟耗时任务，参数为耗时时间，单位ms
    public void timeoutTask(long duration) {
        final long cur = System.currentTimeMillis();
        while (System.currentTimeMillis() <= cur + duration) {
            //
        }
    }
}
```

## 通过注册的方式调用回调

对于较大的项目，如果某一类B需要执行的回调太多，通过这种方式更方便管理。

```java
public class Test {

    public static void main(String[] args) {
        A a = new A();
        B b = new B();
        b.registerCallback(a);  //在B中注册A的回调
        a.funcA(b);     //执行funcA()，之后异步调用b.funcB()，后续会执行回调
    }
}

interface CallBack {
    void call();
}

/**
 * 任何类如果需要注册CallBack回调，都需要实现CallBack类
 * 也可以不用implements方式，而是通过内部类实现
 */
class A implements CallBack {

    public void funcA(B b) {
        System.out.println("call funcA()");
        new Thread(new Runnable() {
            @Override
            public void run() {
                b.funcB();
            }
        }).start();
    }

    @Override
    public void call() {
        System.out.println("call A:call()");
    }
}

class B {
    ArrayList<CallBack> mBCallBack =
            new ArrayList<>();

    public void funcB() {
        System.out.println("call funcB()");
        timeoutTask(2000);

        //执行完funcB()相关操作后，再执行所有已注册的回调
        for (CallBack callBack : mBCallBack) {
            callBack.call();
        }
    }

    //在类B中注册已实现CallBack接口的类
    public void registerCallback(CallBack callBack) {
        mBCallBack.add(callBack);
    }

    //模拟耗时任务，参数为耗时时间，单位ms
    public void timeoutTask(long duration) {
        final long cur = System.currentTimeMillis();
        while (System.currentTimeMillis() <= cur + duration) {
            //
        }
    }
}
```

一旦触发到类B中的某个方法，如funcB()，就会统一执行已注册的回调。

# Android中的生命周期回调

在Android中，如果需要监控某一个Activity的生命周期，比如在某个onXxxx()方法执行时需要执行一些操作。如onCreate()，除了直接在相关Activity的onCreate()直接写代码之外，还可以通过注册mActivityLifecycleCallbacks的方式实现。

 

以Activity的onCreate()方法为例，其实现方式如下。

 

## 用户注册生命周期回调

如下，自定义类LifecycleCallbacksManager并实现Application.ActivityLifecycleCallbacks接口，必须实现的方法有7个。

通过((Activity) context).getApplication()方法注册的是该APP所有Activity的回调，任何一个Activity执行了相关生命周期都会触发。如果直接调用Activity.registerActivityLifecycleCallbacks(this)则只是注册了一个Activity的生命周期回调。

```java
public class LifecycleCallbacksManager implements Application.ActivityLifecycleCallbacks {
    String TAG = "LifecycleCallbacksManager";

    public LifecycleCallbacksManager(Context context) {
        if (!(context instanceof Activity)) {
            throw new IllegalStateException("The context is not a activity!");
        }
        ((Activity) context).getApplication().registerActivityLifecycleCallbacks(this);
    }

    @Override
    public void onActivityCreated(@NonNull Activity activity, @Nullable Bundle savedInstanceState) {
        Log.d(TAG, "onActivityCreated");
    }

    @Override
    public void onActivityStarted(@NonNull Activity activity) {
        Log.d(TAG, "onActivityStarted");
    }

    @Override
    public void onActivityResumed(@NonNull Activity activity) {
        Log.d(TAG, "onActivityResumed");
    }

    @Override
    public void onActivityPaused(@NonNull Activity activity) {
        Log.d(TAG, "onActivityPaused");
    }

    @Override
    public void onActivityStopped(@NonNull Activity activity) {
        Log.d(TAG, "onActivityStopped");
    }

    @Override
    public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {

    }

    @Override
    public void onActivityDestroyed(@NonNull Activity activity) {
        Log.d(TAG, "onActivityDestroyed");
    }
}
```

在代码的其它地方创建实例，需要在相关生命周期执行前创建。

```java
new LifecycleCallbacksManager(this);
```

## APP如何注册回调

framework的Activity.java代码中会将上面自定义的接口类添加到mActivityLifecycleCallbacks列表中。

```java
private final ArrayList<Application.ActivityLifecycleCallbacks> mActivityLifecycleCallbacks =
        new ArrayList<Application.ActivityLifecycleCallbacks>();

public void registerActivityLifecycleCallbacks(
        @NonNull Application.ActivityLifecycleCallbacks callback) {
    synchronized (mActivityLifecycleCallbacks) {
        mActivityLifecycleCallbacks.add(callback);
    }
}
```

## APP如何调用回调

当APP执行onCreate()时，在APP端其最后流程的调用栈为：

```
ActivityThread.handleLaunchActivity() ->
ActivityThread.performLaunchActivity() ->
Instrumentation.callActivityOnCreate() ->
Activity.performCreate() ->
MyActivity.onCreate() ->
Activity.onCreate()
```

MyActivity是自定义的Activity，需要重写onCreate()方法。

```java
public class MyActivity extends Activity {
    String TAG = "MyActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_second);
        Log.d(TAG, "onCreate");

    }
}
```

然后调用父类的onCreate()方法，即Activity.onCreate()

```java
protected void onCreate(@Nullable Bundle savedInstanceState) {
    if (DEBUG_LIFECYCLE) Slog.v(TAG, "onCreate " + this + ": " + savedInstanceState);

    //......

    if (savedInstanceState != null) {
        getAutofillClientController().onActivityCreated(savedInstanceState);

        Parcelable p = savedInstanceState.getParcelable(FRAGMENTS_TAG);
        mFragments.restoreAllState(p, mLastNonConfigurationInstances != null
                ? mLastNonConfigurationInstances.fragments : null);
    }
    mFragments.dispatchCreate();
    dispatchActivityCreated(savedInstanceState);
    if (mVoiceInteractor != null) {
        mVoiceInteractor.attachActivity(this);
    }
    mRestoredFromBundle = savedInstanceState != null;
    mCalled = true;
    //...
}
```

其中会调用一个dispatchActivityCreated()方法，而该方法就是调用已注册的回调。

```java
private void dispatchActivityCreated(@Nullable Bundle savedInstanceState) {
    getApplication().dispatchActivityCreated(this, savedInstanceState);
    Object[] callbacks = collectActivityLifecycleCallbacks();
    if (callbacks != null) {
        for (int i = 0; i < callbacks.length; i++) {
            ((Application.ActivityLifecycleCallbacks) callbacks[i]).onActivityCreated(this,
                    savedInstanceState);
        }
    }
}
```

上面是Activity的dispatchActivityCreated()，其中还会调用Application.dispatchActivityCreated()，Activity和Application都各有一个mActivityLifecycleCallbacks属性保存回调接口。

然后通过collectActivityLifecycleCallbacks()从mActivityLifecycleCallbacks获取到之前注册的回调接口。然后调用用户重写的onActivityXxxx()方法。

```
private Object[] collectActivityLifecycleCallbacks() {
    Object[] callbacks = null;
    synchronized (mActivityLifecycleCallbacks) {
        if (mActivityLifecycleCallbacks.size() > 0) {
            callbacks = mActivityLifecycleCallbacks.toArray();
        }
    }
    return callbacks;
}
```

