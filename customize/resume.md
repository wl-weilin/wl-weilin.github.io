---
layout: post
# 标题配置
title:  魏林-个人简历
permalink: /resume/


# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..
---

* content
{:toc}




## 教育背景


|年份|学校|专业|学历|
| ---- | ---- | ---- | ---- |
| 2013-2017 | 江苏大学 | 机械电子工程 | 本科 |
| 2018-2021 | 重庆大学 | 计算机技术 | 硕士 |
|  |  |  |  |

## 专业技能

|项目|技能|
| ---- | ---- |
|**计算机基础**|数据结构及算法，计算机网络，操作系统，软件开发等。|
|**程序语言**|Java（Android & Web），C/C++，Python , MySQL。|
|**系统开发**|Android Framework系统服务开发，系统APP开发，系统稳定性，熟悉系统架构，了解Native及HAL开发等。|
|**APP开发**|SDK开发，APP性能优化，逆向分析，常用组件等。|
|**语言技能**|英语四级CET-4，熟练阅读英语技术文档。|
|**其它技能**|设计模式，Linux操作系统，Git版本控制，Windows软件开发，搭建网站，单片机开发，神经网络等。|




## 工作经历

| **2021.07-2023.08**  **小米通讯技术有限公司**                |
| ------------------------------------------------------------ |
| 部门：手机部-软件部-应用软件部-核心体验部-安卓框架组         |
| 岗位：Android-Framework 软件开发工程师                       |
| 工作内容简述：<br/>(1) AMS模块的维护和开发工作，包括Activity、Service、ContentProvider及Broadcast四大组件；<br/>(2) APP开发：小米便签APP的手写笔界面SDK维护及需求处理；<br/>(3) WMS模块的维护和开发工作：如窗口显示、平行窗口、View架构、Config等；<br/>(4) 其它Framework相关模块：包括Input进程启动、杀进程、多任务模块、Package、Notification、SystemUI、Settings等；<br/>(5) Android稳定性相关问题，如ANR、Crash、内存泄漏、卡顿、死机重启等问题；<br/>(6) 其它：协助APP解决相关问题，临时处理其它代码需求，效率工具的维护及需求开发，培训应届生，组内作技术分享及输出文档等。 |



## 具体工作内容

### Framework-四大组件AMS

小米任职期间主要从事AMS模块的工作，处理AMS下的四大组件Activity、Broadcast、ContentProvider及Service的引发的相关问题及产品需求。

![Resume-03.png](/wl-docs/个人简历/Resume-03.png)

<br/>

主要完成以下工作：

(1) AMS相关的开发项目：远程锁定手机(运营商定制系统服务)，折叠屏连续性及打点，新增Shell命令，监测前台APP变化，Provider多用户适配，应用启动白名单管理等，以及其它保密项目。

(2) AMS的维护及升级：用户反馈Bug修复，自动化测试生成的Bug修复，Android升级适配。

![20230731004554](/wl-docs/个人简历/简历2.jpg)

<br/>

### Framework-窗口管理WMS

窗口定制与开发，窗口层级树、窗口显示流程及Configuration等模块，主要完成以下工作：

(1)  WMS相关的开发项目：平行窗口，平行窗口反向适配，多屏协同-投屏(稳定性相关)等，以及其它保密项目。

(2)  WMS的维护及升级：用户反馈Bug修复，自动化测试生成的Bug修复，Android升级适配。

![image-20240223235323477](/wl-docs/个人简历/Resume-16.png)

### 便签-手写笔SDK

小米便签APP中的手写笔界面SDK的维护及需求更新。

![Resume-06](/wl-docs/个人简历/Resume-06.jpg)

<br/>

(1) 产品需求

| 项目           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| 数据统计打点   | 在手写笔界面，统计用户按下每一个按钮的使用频率               |
| 小窗适配       | 需要根据屏幕大小折叠部分功能                                 |
| 三方库更新适配 | 手写笔界面引入了大量小米内部三方库，需要根据这些库的更新做适配以及问题修复 |
| 跨APP剪贴板    | 框选复制一块区域时，要求跨APP复制，需要使用Provider对外分享图片 |
| AAR包裁剪      | 减小APK的大小                                                |
| 多语言适配     | 新增需求时，需要做多语言适配                                 |
| 其它保密需求   | 其它MIUI升级相关需求                                         |

(2) 代码维护

如书写断线，涂鸦无笔划，Input异常事件，笔迹粗细不一致，笔记Crash，笔记ANR，多个报点等问题。

<br/>

### 稳定性相关

负责APP或Framework稳定性相关的问题，主要完成以下工作：

(1)  稳定性相关功能开发：ANR分析之输出历史消息及当前阻塞消息，提前输出ANR堆栈，Binder日志增强(输出调用链)等。

(2)  发现由稳定性引发的问题并进行修复，处理包括Application Not Responding、Crash、内存泄漏、应用卡顿、黑屏&白屏&闪屏、WatchDog等问题。

(3)  支持其它系统模块及APP的业务与工作，协助其处理稳定性相关的问题并提出修复建议。

![20230731005657](/wl-docs/个人简历/简历4.jpg)

### 其它模块

(1) 进程相关：熟悉进程启动流程及进程启动异常、进程被杀等问题；

(2) 多任务：相关原理以及最近任务窗口的显示问题；

![Resume-14](/wl-docs/个人简历/Resume-14.jpg)

(3) InputManager：熟悉事件分发机制并解决常见问题；

(4) PackageManager：调用四大组件时，传入的Intent解析方面问题；

(5) NotificationManager：前台通知异常，通知不消失，通知无反应等问题；

(6) Binder通信：Slow Binder，服务端问题，跨进程抛出异常等；

(7) SystemUI：多任务显示、锁屏、通知等问题；

(8) Settings：部分问题的处理，如数据库相关的ContentProvider，Activity相关的稳定性问题等。

(9) 其它工作内容：

- 协助APP解决相关问题：如组件的规范使用，以及一些小问题；
- 临时处理其它产品需求；
- 效率工具的维护及需求开发：Jira提示工具(基于Python)、任务分发工具、日志自动化分析工具等；
- 培训应届生：编写应届生培训文档，标准开发文档，AMS模块的PPT讲解等；
- 技术分享：组内作技术分享并输出文档等。



## 参与项目

### 远程锁定手机

项目名：远程锁定手机（运营商定制功能）

(1) 需求背景<br/>
国外相关运营商使用分期支付来促进手机销量，但如果用户逾期未支付，运营商要求可以远程锁定手机。

<br/>

(2) 解决方案<br/>
- APP层：运营商预置一个APP，主要功能是与运营商服务器通信以及调用相关系统Service；<br/ 
- Framework层：添加相关Service及接口，需要做的工作包括实现Service功能，判断设备是否启用该Service，注册该Service并允许APP调用，向BootLoader写入数据；<br/>
- Bootloader：添加相关属性及方法，判断是否锁定和解锁设备。

<br/>

(3) 我的工作（主要实现Framework层的功能）<br/>
- 实现Service功能：编写CustomService，实现判断设备状态，调用系统服务PersistentDataBlockService的接口向BootLoader写入数据等功能；
- Service接口：APP调用接口CustomManager，Binder调用CustomService.aidl；
- 配置权限：CustomService需要的系统权限（获取手机IMEI信息），以及APP的权限；
- 启动及注册：在SystemServer中开机自动启动该CustomService，在SystemServiceRegistry中注册CustomService使之能被APP调用；
- 配置编译：配置CustomService的编译信息，使之能够被编译到ROM中；

<br/>

功能简图：

![image-20230827180135823](/wl-docs/个人简历/Resume-15.png)

<br/>

### 监测前台APP变化

(1) 需求说明

有时候系统或系统APP需要检测到特定的前台应用或Activity，以启用特定的功能。如下：
- MIUI中的游戏侧边栏，在检测到应用为游戏时，从侧边便可滑动出游戏侧边栏；
- 检测到当前应用为相机时，执行一些优化步骤；
- 检测到前台应用为一些网络应用时，执行一些网络优化步骤；

总之，不同的前台应用或Activity，都可以通过注册和回调的方式，由不同模块自定义相关步骤，以实现不同的效果。

图片示例：
<div style="text-align: center">
    <img src="/wl-docs/个人简历/Resume-18.png" alt="前台APP监测.png" style="zoom:80%" />
</div>
<br/>

(2) 解决方案

&emsp;&emsp;原生AOSP并不带有一个公共的前台监听的模块，于是需要编写一个公用的aidl文件如IForegroundChangeListener.aidl，由各个模块实现IForegroundChangeListener.Stub后将其注册到系统中成员中，每次前台应用改变时便逐个取出该成员中注册的回调，通过广播的方式依次通知到各个模块。

<br/>

(3) 我的工作
- 编写IForegroundChangeListener.aidl文件及接口；
- 编写管理接口的系统服务，该服务负责注册和取消注册相关回调；
- 将XxxManagerService注册到系统中，随系统开机时启动；
- Activity切换时，在合适的地方如resumeTopActivity()调用注册到Service中的回调；
- 和其它需要使用到该XxxManagerService的模块对接，说明其使用方法；

<br/>

### Provider的多用户适配

(1) 需求说明

&emsp;&emsp;MIUI应用双开和系统分身功能是基于多用户实现的，多用户机制用于隔离不同用户下所拥有的资源。而ContentProvider需要根据不同功能的特性实现不同效果的资源隔离。

- 应用双开：同一APP在一个系统下可以开启两个进程，双开的进程其userId=999，可以访问主用户空间（userId=0）的资源，也可以被主用户空间访问。
- 系统分身：即copy一个新系统，在该新系统中可以安装APP。双开系统下的用户和主用户空间中的资源无法互相访问。

<br/>

(2) 我的工作

对Provider进行多用户适配，在不同场景下（应用双开或系统分身）使用Provider时实现不同的资源访问限制。

- 实现应用双开情况下分身APP可以通过Provider访问主用户空间的进程；
- 实现应用双开情况下分身APP可以通过Provider拉起主用户空间的进程
- 实现系统分身情况下无法通过Provider拉起或访问主用户空间的进程和资源。
- 其它权限的配置，如特殊应用的白名单等

<br/>

### 折叠屏-相机&听筒适配

适配机型为：小米 Mix Fold 2 和 小米 Mix Fold 3

(1) 需求说明

Fold 2 与 Fold 3 相机差异：
- Fold 2：内屏无前置摄像头，进入相机APP使用前置摄像头时有提示，但在三方APP中使用前置相机则无提示；
- Fold 3：内屏有前置摄像头，不用提示。<br/>

三方APP调用相机时，需要在相机的适配层（Framework与HAL层之间）添加接口并进行判断。

调用前摄的提示：
<div style="text-align: center">
    <img src="/wl-docs/个人简历/Resume-20.png" alt="Demo.png" style="zoom:80%" />
</div>


Fold 2 与Fold 3 听筒差异：

- Fold 2 ：内屏无听筒，当收到来电或微信通话时需要弹出Toast提示；

- Fold 3 ：内屏有听筒，不用提示。

 

收到来电后的提示：
<div style="text-align: center">
    <img src="/wl-docs/个人简历/Resume-21.png" alt="Demo.png" style="zoom:60%" />
</div>


<br/>

(2) 我的工作

- 添加资源，将提供的图片通过<animation-list>方式组织为动态图片；
- 编写对资源的初始化、显示等代码，以及对外调用的接口；
- 在相机的硬件适配层frameworks/base/core/java/android/hardware/camera2/代码中添加对相机状态的判断及接口调用；
- 在services/core/java/com/android/server/audio/AudioService.java中添加代码以实现提示；
- 其它：新增资源文件及代码文件的编译等，新增的资源文件需要更新api/current.txt，新增代码更新Android.bp。

<br/>

(3) 注意事项

注意事项1：之前在Android T中添加资源文件时，并未更新current.txt文件，是因为未在Android T中开启API检查。而在Android U中，大部分机型都开启了API检查，所以需要新增资源或对外方法时，需要更新相应模块的current.txt。

注意事项2：折叠屏的资源本来是放置在foldable-res目录中，该目录只会在编译目标为折叠屏时编译。但由于xxx/frameworks/base/api/current.txt是全机型共享的，会导致非折叠屏设备编译失败，于是将资源文件移动到公共文件夹。



### 多屏协同-投屏

(1) 需求背景<br/>
&emsp;&emsp;多屏协同功能可以实现跨系统、跨设备协同，将手机与电脑、平板连接后，即实现资源共享，协同操作。<br/>
&emsp;&emsp;多屏协同的功能之一包含投屏，即将手机上的内容投屏显示到PC上，支持将多个手机应用投屏到PC显示，同时不影响手机的正常操作。<br/>
&emsp;&emsp;而当前的投屏存在稳定性和性能两类问题，稳定性问题包括：页面重新加载、闪黑屏、投屏新建窗口失败、应用闪退等；性能问题主要是卡顿严重，合成有明显的掉帧。AMS需要解决其中部分问题。

<br/>

(2) 需要解决的问题<br/>

&emsp;&emsp;AMS需要解决其中的Activity在屏幕中流转时的Relaunch问题。也就是投屏时由于Display（物理屏和虚拟屏）的切换，会导致Activity流转时重新执行生命周期onCreate()、onStart()和onResume()，因此会出现投屏过程中的重新加载、闪屏、卡顿等问题。

&emsp;&emsp;本项目需处理的是Activity在不同的Display之间流转时，使Activity不执行生命周期方法，而是执行onConfigurationChanged()流程，避免投屏过程中的闪屏问题以及其它稳定性问题。

<br/>

(3) 我的工作<br/>

&emsp;&emsp;正常情况下Config改变，为避免Activity重走生命周期，都要配置相关的android:configChanges属性。
&emsp;&emsp;而投屏时Activity的流转导致的Display的改变，Android中并没有这样的属性配置，并且也做不到每个APP都适配，所以需要在Framework中进行适配。

需要在系统端和APP做如下修改：
- system端ActivityRecord：判断当前Display变化是否是因为投屏导致的，如果是则不会走Relaunch流程。
- APP端Activity：在performActivityConfigurationChanged()中，检测到ConfigChange是由于投屏时流转导致的（通过displayId和包名判断），则shouldReportChange = true，之后会执行onConfigurationChanged()。

<br/>

图片示例：
![image-20230731231624046](/wl-docs/个人简历/Resume-8.png)

<br/>

### 折叠屏连续性&打点

(1) 需求背景<br/>
&emsp;&emsp;对折叠屏设备，当内外屏切换时，由于屏幕大小发生了改变，可能会导致部分APP的UI显示异常。为了良好的用户体验，需要统计发生问题的APP，并且弹出通知式按钮，让用户选择是否重启该APP，并且将相关统计数据发送到数据管理平台。

<br/>

(2) 解决方案<br/>
&emsp;&emsp;在系统进程中，监听到折叠变化后会执行回调函数onDisplayFoldChangedCallback()，在该回调函数中判断当前APP显示状态是否正常（主要比较当前Task的windowingMode和系统配置的WindowConfiguration，以及其它项）。<br/>
&emsp;&emsp;当不正常时，埋点并统计一次，然后弹出通知按钮（自定义Notification），如果用户点击，再次埋点并统计一次。之后会将数据发送到数据管理平台的指定数据库中，并由产品进一步分析APP或用户行为等。

<br/>

(3) 我的工作：<br/>

- 与产品对接，按要求以合规方式搜集数据（搜集什么数据，如何发送等）;<br/>
- 根据代码执行流程，进行具体的代码实现；<br/>
- 与数据管理平台对接，建立数据库； <br/>
- 将数据发送到目标数据库，之后由产品方面分析；

<br/>

图片示例：
![Resume-10](/wl-docs/个人简历/Resume-10.jpg)

注：具体数据和表格不便展示。

<br/>

### 平行窗口适配

(1) 需求说明

&emsp;&emsp;从Android 12L开始，Google引入了Activity Embedding实现平行窗口。于是MIUI 也使用了Android 12L 的 Activity Embedding 方案。<br/>
&emsp;&emsp;但是Google的AE方案需要APP主动适配，需要修改代码以及写配置文件才能实现平行视界。但实际上上根本没几家 APP 适配AE方案，于是为了用户体验，MIUI只能在AE的基础上修改一些Framework代码，简化APP适配流程，并且由小米为一些常用APP写配置文件。

<br/>

(2) 常见问题

&emsp;&emsp;部分APP未对平板设备的平行窗口模式做适配，会出现一些异常现象，需要对这些应用进行问题分析和配置修复。如常见提示页面、同意页面显示不全，有裁剪；应用权限弹窗显示不全；打开某些Activity，或横屏时，会出现闪退等问题。

<br/>

(3)我的工作<br/>

- 了解Google Activity Embedding方式实现培训窗口的流程；<br/>
- APP如何适配Google AE实现平行窗口；<br/>
- 根据Top日活清单将这些APP的相关Activity添加到云控的列表中，对这些Activity做特殊适配；<br/>
- 处理平行窗口中出现的其它的Activity启动失败、闪退以及生命周期相关问题。

<br/>

图片示例：
![image-20230731235306277](/wl-docs/个人简历/Resume-12.png)

<br/>

### 其它项目

(1) 添加shell命令

- 了解shell命令原理，根据需求添加新的终端命令语句；
- 新增adb shell am logging enable-text DEBUG_XXX命令，移除ActivityManagerDebugConfig.java和ActivityManagerDebugConfig.java等文件中debug开关的final限制，使之可以通过命令打开debug开关，以实现打印出debug日志；
- 新增Provider命令adb shell am monitor-auth --auth com.auth.name --uid \<uid\>，并添加相关日志，以实现监控指定的APP的指定authority的访问情况。

<br/>

(2) 大屏模式

&emsp;&emsp;对于12寸以上大屏平板设备新增了feature——大屏模式（桌面模式）。需要在系统中新增一个字段isDesktopMode表示当前是否处于大屏模式，并且可以通过Provider的方式使其它模块或APP访问到该字段，以实现相关的适配及界面变化。

<br/>

(3) 超级剪切板-应用适配

&emsp;&emsp;小米便签手写界面复制图片：复制端APP需要将数据按Android剪切板规范写入剪切板，可写入纯文本、HTML、URI等。主要适配图片的写入，通过Provider的方式对外分享Uri的方式实现。

<br/>

(4) 应用启动白名单管理

&emsp;&emsp;AOSP和MIUI在启动应用时，针对一些非正常情况下启动的APP，会拦截该APP的启动。但实际情况中部分APP被会导致用户体验较差，因此新增白名单管理机制，将不需要被拦截的APP添加到该名单中。

## 自我评价

- 擅于钻研，勤于思考，对非所属任务但相关的知识也力求掌握；
- 擅于管理时间，合理安排不同任务的开发进度，力求按时完成交付；
- 自学能力强，能在短时间内接管新项目并投入研发；
- 性格稳重，做事细心。与他人相处融洽，具有良好的团队合作精神。

