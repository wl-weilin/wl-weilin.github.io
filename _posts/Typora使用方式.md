---
layout: post
# 标题配置
title:  Typora使用方式
# 时间配置
date:   2018-01-01
# 大类配置
categories: 其它
# 小类配置
tag: 其它
# 设置文章置顶
topping: true

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..

---

* content
{:toc}
# Typora设置

## 取消下划线提示



# Markdown基本用法

## 教程

https://markdown.com.cn/



## 图片



### Markdown方式

语法：```![alt](图片链接 "title")```

alt：图片未成功加载的提示文字

title：大部分编辑器如typora不支持显示标题

![示例图片.png](/wl-docs/示例图片.png "图片title")



### HTML方式

text-align：对齐方式

style="zoom:xx%"：显示比例

```html
<div style="text-align: center">
    <img src="/wl-docs/Demo.png" alt="Demo.png" style="zoom:80%" />
</div>
```



<div style="text-align: center">
    <img src="/wl-docs/示例图片.png" alt="示例图片.png" style="zoom:80%" />
</div>





## 链接

```[可视文本](网址)```

[这是一个链接](https://www.baidu.com/)



## 代码

```java
public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
```



## 空行

在空行中插入```<br/>```可以空一行

段落1
<br/>
段落2

## 表格
要添加表格，请使用三个或多个连字符（---）创建每列的标题，并使用管道（|）分隔每列。

| name      | Description | Description2 |
| ----------- | ----------- | ----------- |
| Header      | Title       ||
| Paragraph   | Text        ||

如何设置每列宽度？

- 在表格头添加```&emsp;```扩大列宽，无效
- 使用```|name<img width=200/>|value<img width=100/>|```，无效
- 使用```<div style="width:290px">property</div>```，无效



如何在表格内换行？

在行末添加```<br>```即可。

# Jekyll使用注意

##  插入空行

必须使用```<br/><br/>```才有效

## 首行缩进

在缩进处插入```&emsp;&emsp;```，即可缩进两个中文字符















