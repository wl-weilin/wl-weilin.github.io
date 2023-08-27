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
|**程序语言**|Java（Android & Web），C/C++，Python , MySQL|
|**基础技能**|数据结构及算法，计算机网络，Linux操作系统，软件开发等|
|**语言技能**|英语四级CET-4，熟练阅读英语技术文档|
|||




## 工作经历

| **2021.07-2023.08**  **小米通讯技术有限公司**                |
| ------------------------------------------------------------ |
| 部门：手机部-软件部-应用软件部-核心体验部-安卓框架组         |
| 岗位：Android-Framework 软件开发工程师                       |
| 职级：现职级14级                                             |
| 工作内容简述：<br/>(1)  负责AMS模块的维护和开发工作，包括Activity、Service、ContentProvider及Broadcast四大组件<br/>(2)  其它与AMS相关的模块，包括进程启动、杀进程、多任务模块、Input、Package、Notification、Window等；<br/>(3)  Android稳定性相关问题，如ANR、Crash、内存泄漏、黑屏、应用卡顿等问题；<br/>(4)  小米便签APP的手写笔界面SDK维护及需求处理；<br/>(5)  其它：协助APP解决相关问题，临时处理其它代码需求，效率工具的维护及需求开发，培训应届生，组内作技术分享及输出文档等。 |



## 具体工作内容

### Framework-四大组件AMS

小米任职期间主要从事AMS模块的工作，处理AMS下的四大组件Activity、Broadcast、ContentProvider及Service的引发的相关问题及产品需求。

![Resume-03.png](/wl-docs/个人简历/Resume-03.png)

<br/>

主要完成以下工作：

(1) AMS的维护及升级：用户反馈Bug修复，自动化测试生成的Bug修复，Android升级适配。



![20230731004554](/wl-docs/个人简历/简历2.jpg)

<br/>

(2) AMS的开发项目：手机和PC的多屏协同，折叠屏连续性及打点，平行窗口等

| 远程锁定手机（运营商定制功能）                               |
| ------------------------------------------------------------ |
| 需求背景：<br/>国外相关运营商使用分期支付来促进手机销量，但如果用户逾期未支付，运营商要求可以远程锁定手机。 |
| 解决方案：<br/>(1) APP层：运营商预置一个APP，主要功能是与运营商服务器通信以及调用相关系统Service；<br/>(2) Framework层：添加相关Service及接口，需要做的工作包括实现Service功能，判断设备是否启用该Service，注册该Service并允许APP调用，向BootLoader写入数据；<br/>(3) Bootloader：添加相关属性及方法，判断是否锁定和解锁设备。 |
| 我的工作（主要实现Framework层的功能）：<br/>(1) 实现Service功能：编写CustomService，实现判断设备状态，调用系统服务PersistentDataBlockService的接口向BootLoader写入数据等功能；<br/>(2) Service接口：APP调用接口CustomManager，Binder调用CustomService.aidl；<br/>(3) 配置权限：CustomService需要的系统权限（获取手机IMEI信息），以及APP的权限；<br/>(4) 启动及注册：在SystemServer中开机自动启动该CustomService，在SystemServiceRegistry中注册CustomService使之能被APP调用；<br/>(5) 配置编译：配置CustomService的编译信息，使之能够被编译到ROM中； |
|                                                              |


功能简图：

![image-20230827180135823](/wl-docs/个人简历/Resume-15.png)

<br/>

| 多屏协同-投屏功能 |
| ----------------------------- |
| 需求背景：<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;多屏协同功能可以实现跨系统、跨设备协同，将手机与电脑、平板连接后，即实现资源共享，协同操作。<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;多屏协同的功能之一包含投屏，即将手机上的内容投屏显示到PC上，支持将多个手机应用投屏到PC显示，同时不影响手机的正常操作。<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;而当前的投屏存在稳定性和性能两类问题，稳定性问题包括：页面重新加载、闪黑屏、投屏新建窗口失败、应用闪退等；性能问题主要是卡顿严重，合成有明显的掉帧。AMS需要解决其中部分问题。 |
| 解决方案：<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;正常情况下投屏时由于Display（物理屏和虚拟屏）的切换，会导致Activity流转时重新执行生命周期onCreate()、onStart()和onResume()，因此会出现投屏过程中的重新加载、闪屏、卡顿等问题。<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本项目需处理的是Activity在不同的Display之间流转时，使Activity不执行生命周期方法，而是执行onConfigurationChanged()流程，避免投屏过程中的闪屏问题以及其它稳定性问题。 |
| 我的工作：<br/>(1) system端ActivityRecord：判断Display变化时的configChanged值，之后通过相关返回值判断使之调用到APP端。<br/>(2) APP端Activity：当Configuration方面的回调调用到APP端时，判断displayId，使APP端不再走生命周期回调，避免了闪屏等问题。 |

图片示例：

![image-20230731231624046](/wl-docs/个人简历/Resume-8.png)

<br/>

| 折叠屏连续性&打点 |
| ------------------- |
| 需求背景：<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;对折叠屏设备，当内外屏切换时，由于屏幕大小发生了改变，可能会导致部分APP的UI显示异常。为了良好的用户体验，需要统计发生问题的APP，并且弹出通知式按钮，让用户选择是否重启该APP，并且将相关统计数据发送到数据管理平台。 |
| 解决方案：<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在系统进程中，监听到折叠变化后会执行回调函数onDisplayFoldChangedCallback()，在该回调函数中判断当前APP显示状态是否正常（主要比较当前Task的windowingMode和系统配置的WindowConfiguration，以及其它项）。<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;当不正常时，埋点并统计一次，然后弹出通知按钮（自定义Notification），如果用户点击，再次埋点并统计一次。之后会将数据发送到数据管理平台的指定数据库中，并由产品进一步分析APP或用户行为等。 |
| 我的工作：<br/>(1) 与产品对接，按要求以合规方式搜集数据（搜集什么数据，如何发送等）;<br/>(2) 根据代码执行流程，进行具体的代码实现；<br/>(3) 与数据管理平台对接，建立数据库； <br/>(4) 将数据发送到目标数据库，之后由产品方面分析； |

图片示例：

![Resume-10](/wl-docs/个人简历/Resume-10.jpg)

注：具体数据和表格不便展示。

<br/>

| 平行窗口适配                                                 |
| ------------------------------------------------------------ |
| 说明：部分APP未对平板设备的平行窗口模式做适配，会出现一些异常现象，需要对这些应用进行问题分析和配置修复。如常见提示页面、同意页面显示不全，有裁剪；应用权限弹窗显示不全；打开某些Activity，或横屏时，会出现闪退等问题。 |
| 解决1：根据Top日活清单将这些APP的相关Activity添加到云控的transitionrule规则中，对这些Activity做特殊适配。 |
| 解决2：处理平行窗口中出现的其它的Activity启动失败、闪退以及生命周期相关问题。 |
|                                                              |

图片示例：

![image-20230731235306277](/wl-docs/个人简历/Resume-12.png)

<br/>

(3) 其它保密项目：如MIUI升级项目等。

### Framework-其它模块

(1) 进程相关：熟悉进程启动流程及进程启动异常、进程被杀等问题；

(2) 多任务：相关原理以及最近任务窗口的显示问题；

![Resume-14](/wl-docs/个人简历/Resume-14.jpg)

(3) InputManager：熟悉事件分发机制并解决常见问题；

(4) PackageManager：调用四大组件时，传入的Intent解析方面问题；

(5) NotificationManager：前台通知异常，通知不消失，通知无反应等问题；

(6) WindowManager：了解窗口显示流程；

(7) Binder通信：Slow Binder，服务端问题，跨进程抛出异常等。



### 稳定性相关

负责应用或Framework稳定性相关的问题，包括Application Not Responding、Crash、内存泄漏、应用卡顿、黑屏&白屏&闪屏、WatchDog等问题。发现由稳定性引发的问题并进行修复，或给APP及其它模块提出修复建议。

![20230731005657](/wl-docs/个人简历/简历4.jpg)

### 便签-手写笔SDK

小米便签APP中的手写笔界面SDK的维护及需求更新。

![Resume-06](/wl-docs/个人简历/Resume-06.jpg)

(1) 代码维护

如书写断线，涂鸦无笔划，Input异常事件，笔迹粗细不一致，笔记Crash，笔记ANR，多个报点等问题。

<br/>

(2) 产品需求

| 项目           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| 数据统计打点   | 在手写笔界面，统计用户按下每一个按钮的使用频率               |
| 三方库更新适配 | 手写笔界面引入了大量小米内部三方库，需要根据这些库的更新做适配以及问题修复 |
| 跨APP剪贴板    | 框选复制一块区域时，要求跨APP复制，需要使用Provider对外分享图片 |
| AAR包裁剪      | 减小APK的大小                                                |
| 多语言适配     | 新增需求时，需要做多语言适配                                 |
| 其它保密需求   | 其它MIUI升级相关需求                                         |



### 其它

- 协助APP解决相关问题：如组件的规范使用，以及一些小问题；
- 临时处理其它产品需求；
- 效率工具的维护及需求开发：Jira提示工具(基于Python)、任务分发工具、日志自动化分析工具等；
- 培训应届生：编写应届生培训文档，标准开发文档，AMS模块的PPT讲解等；
- 技术分享：组内作技术分享并输出文档等。



## 自我评价

- 擅于钻研，勤于思考，对非所属任务但相关的知识也力求掌握；
- 擅于管理时间，合理安排不同任务的开发进度，力求按时完成交付；
- 自学能力强，能在短时间内接管新项目并投入研发；
- 性格稳重，做事细心。与他人相处融洽，具有良好的团队合作精神。

