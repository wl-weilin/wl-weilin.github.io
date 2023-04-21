---
layout: post
# 标题配置
title:  C++基础

# 时间配置
date:   2018-03-01

# 大类配置
categories: C++

# 小类配置
tag: C++基础

# 设置文章置顶
topping: false

# 资源根路径，该项在Jekyll网页显示时无用
typora-root-url: ./..\..\..
---

* content
{:toc}


## C/C++的区别

- C是面向过程的语言；C++是面向对象的语言
- C中函数不能进行重载；C++函数可以重载
- C函数的参数如果没有写void即是可变参数。如C中 int sum() 可接收任意参数;而C++中int sum()则表示输入参数为空。
- C中struct中不能有函数；C++中可以有函数。
- C++中try/catch/throw异常处理机制取代了C中的setjmp()和longjmp()函数。
- C++中，仍然支持malloc()和free()来分配和释放内存，同时增加了new和delete来管理内存。

## 面向对象与面向过程的区别

(1)   编程思想不同

- 面向过程：是一种以过程为中心的编程思想。都是以什么正在发生为属主要目标进行编程。
- 面向对象语言：是一类以对象作为基本程序结构单位的程序设计语言，指用于描述的设计是以对象为核心，而对象是程序运行时刻的基本成分。

(2)   特点不同

- 面向过程：就是分析出解决问题所需要的步骤，然后用函数把这些步骤一步一步实现，使用的时候一个一个依次调用就可以了。
- 面向对象语言：识认性，系统中的基本构件可识认为一组可识别的离散对象，对象具有唯一的静态类型和多个可能的动态类型，在基本层次关系的不同类中共享数据和操作。

面向过程的优缺点：

- 优点：性能比面向对象高，比如单片机、嵌入式开发、 Linux/Unix等一般采用面向过程开发，性能是最重要的因素。
- 缺点：没有面向对象易维护、易复用、易扩展。

面向对象的优缺点：

- 优点：易维护、易复用、易扩展，由于面向对象有封装、继承、多态性的特性，可以设计出低耦合的系统，使系统更加灵活、更加易于维护
- 缺点：性能比面向过程低，因为类调用时需要实例化，开销比较大，比较消耗资源。


## Java和C++的区别？

相同点：都是面向对象的语言，都支持封装、继承和多态。

(1)   Java无指针

Java不提供指针来直接访问内存，从而有效地防止了C/C++语言中指针操作失误，如野指针所造成的系统崩溃。

注：但也不是说Java没有指针，虚拟机内部还是使用了指针，只是外人不得使用而已。这有利于Java程序的安全。
<br/><br/>

(2)   自动内存管理方面

Java程序中所有的对象都是用new操作符建立在内存堆栈上，这个操作符类似于C++的new操作符。但是Java 有自动内存管理机制，不需要程序员手动释放无用内存。
<br/><br/>

(3)   是否支持多重继承

Java 的类是单继承的，C++ 支持多重继承；虽然 Java 的类不可以多继承，但是接口可以多继承。
<br/><br/>

(4)   是否完全面向对象

Java是完全面向对象的语言，所有函数和变量都必须是类的一部分。除了基本数据类型之外，其余的都作为类对象，包括数组。对象将数据和方法结合起来，把它们封装在类中，这样每个对象都可实现自己的特点和行为。

而C++允许将函数和变量定义为全局的。此外，Java中取消了C/C++中的结构和联合，消除了不必要的麻烦。
<br/><br/>

(5)   是否允许操作符重载

Java不支持操作符重载，操作符重载被认为是C++的突出特征。

在Java中虽然类大体上可以实现这样的功能，但操作符重载的方便性仍然丢失了不少。Java语言不支持操作符重载是为了保持Java语言尽可能简单。
<br/><br/>

(6)   是否支持强制转换

在C和C++中有时出现数据类型的隐含转换，这就涉及了自动强制类型转换问题。例如，在C++中可将一浮点值赋予整型变量，并去掉其尾数。

Java不支持C++中的自动强制类型转换，如果需要，必须由程序显式进行强制类型转换。

**应用场景：**

- JAVA：企业级应用开发、网站平台开发、移动领域、移动Android APP开发
- C++：游戏领域、办公软件、图形处理、网站、搜索引擎、图形界面层、关系型数据库、浏览器、邮件客户端、软件开发集成环境、编译器、3D引擎。

## C++11新特性

[C++11常用特性总结](https://www.cnblogs.com/chengjundu/p/10893702.html#title22)

(1)   关键字及新语法

- auto关键字及用法
- nullptr关键字及用法
- for循环语法

(2)   STL容器

- std::array
- std::forward_list
- std::unordered_map
- std::unordered_set

(3)   多线程

- std::thread
- st::atomic
- std::condition_variable

(4)   智能指针内存管理

- std::shared_ptr
- std::weak_ptr

(5)   其他

- std::function、std::bind封装可执行对象
- lamda表达式

## NULL与nullptr的区别

[C++中NULL和nullptr的区别](https://blog.csdn.net/qq_18108083/article/details/84346655)

某些时候，我们需要将指针赋值为空指针，以防止野指针。

NULL的定义：

```c++
#ifndef NULL
    #ifdef __cplusplus
        #define NULL 0
    #else
        #define NULL ((void *)0)
    #endif
#endif
```

定义上的区别：

- NULL是C/C++中的宏，在C中是((void *)0)（指针类型为void，内容置为0），在C++中表示0（将指针内容置为0）。
- nullptr是C++中的关键字，表示空指针。

**C++11中为什么要引入nullptr**？

因为NULL或者0给指针赋值时，既是整数常量，也可以当作空指针常量。这就导致了NULL的二义性，为了解决这种二义性，C++11标准引入了关键字nullptr，它作为一种空指针常量。

NULL二义性代码示例：

```c++
#include <iostream>
using namespace std;

void func(int) { cout << "调用int" << endl; }     // #1
void func(int*) { cout << "调用int*" << endl; }   // #2

int main() {
	func(NULL);		//调用#1
	func(nullptr);	//调用#2

	system("pause");
	return 0;
}
```

从字面意义上来讲，NULL可以进行诸如int *p=NULL这样的赋值，于是会觉得NULL是个空指针常量。但事实上func(NULL)调用的却是#1，因为C++中NULL定义为常数0，它是int型。

为了解决这种二义性，C++11标准引入了关键字nullptr，它作为一种空指针常量。

**为什么C++中NULL是(void*)0（空指针常量），而C++中为0**？

答：因为C语言中任何类型的指针都可以（隐式地）转换为void*型，反过来也行。而C++中void*型不能隐式地转换为别的类型指针（如：int*p = (void*)0;使用C++编译器编译会报错）。但其它类型可以转换为void*类型（如void*p = (int*)0;是合法的）。

代码示例：

```c++
#include <iostream>
#include<string>
#include<vector>
using namespace std;

int main() {
	int *ptr;
	ptr = NULL;		//合法
	ptr = 0;		//合法
	ptr = (int*)0;	//合法
	//ptr = (void*)0;	//不合法，C++中void*型不能隐式地转换为别的类型指针

	void *ptr1;
	ptr1 = (int*)5;		//合法，C++中其它类型可以转换为void*型
	cout << ptr1 << endl;	//输出：0000000000000005
	system("pause");
	return 0;
}
```

## C++有哪些数据类型，为什么long和int都是4字节？

C++定义了一套包括算术类型和空类型在内的基本数据类型，其中算术类型包含了字符、整型数、布尔值和浮点数。

| **类型**  | **含义**     | **最小尺寸** |
| --------- | ------------ | ------------ |
| bool      | 布尔类型     | 未定义       |
| char      | 字符         | 8位          |
| wchar_t   | 宽字符       | 16位         |
| short     | 短整型       | 16位         |
| int       | 整型         | 16位         |
| long      | 长整型       | 32位         |
| long long | 长整型       | 64位         |
| float     | 单精度浮点数 | 6位有效数字  |
| double    | 双精度浮点数 | 10位有效数字 |

C++语言规定一个int至少和一个short一样大，一个long至少和一个int一样大，一个long long至少和一个long一样大。

所以第二个问题本身就有问题，long和int在符合C++语言标准的前提下会由编译器具体实现数据大小,long和int不一定都是4字节。

## 在C++程序中调用C语言代码，为什么要加extern “C”？

[关于extern “C”](https://blog.csdn.net/qq_24282081/article/details/87530239)

(1)   被extern "C"修饰的变量和函数是按照 C 语言方式编译和连接的

(2)   extern "C"的作用是让 C++ 编译器将extern "C"声明的代码当作 C 语言代码处理，可以避免 C++ 因符号修饰导致代码不能和C语言库中的符号进行链接。

举例说明，先创建5个文件。

cfunc.h代码：

```c++
//方法1：使用条件编译
//c++中定义了__cplusplus，C语言中没有该定义。即：识别是c代码还是c++代码。
#ifdef __cplusplus
extern "C" {
#endif
	int add_C(int num1, int num2);
#ifdef __cplusplus
};
#endif
```

cfunc.c代码：
```c++
//方法2：声明函数为C语言调用
//extern "C" int add_C(int num1, int num2);

int add_C(int num1, int num2) {
	return num1 + num2;
}
```

cplusfunc.h代码：
```c++
int add_Cplus(int num1, int num2);
```

cplusfunc.cpp代码：
```c++
int add_Cplus(int num1, int num2) {
	return num1 + num2;
}
```

main.cpp代码：
```c++
#include <stdio.h>
#include <iostream>
#include "cfunc.h"
#include "cplusfunc.h"

int main(int argc, char* argv[])
{
	std::cout << add_C(4, 5) << std::endl;
	//std::cout << add_Cplus(4, 5) << std::endl;
	system("pause");
	return 0;
}
```

当cfunc.h中的函数声明为int add_C(int num1, int num2);时，运行main()会报出如下错误：

```
main.obj : error LNK2019: 无法解析的外部符号 "int __cdecl add_C(int,int)" (?add_C@@YAHHH@Z)，该符号在函数 _main 中被引用
fatal error LNK1120: 1 个无法解析的外部命令
```

这个报错的意思是add_C这个函数在被编译器编译后函数名称变成了?add_C@@YAHHH@Z这个符号，而在链接的过程中，main函数去找这个符号的时候找不到。

**为什么？**

因为在c++的编译环境中调用c实现的函数时。在编译过程中，c函数add编译后的符号为“_add”，而在c++的main中，add被编译为“?add@@YAHHH@Z”。两个符号不一致，即无法链接到函数的实现，所以就会在链接过程中报错。

**解决方法**：

用extern "C"修饰函数，于是在C++的main中，add就被编译为“_add”。这样符号一致，链接器就能找到了。但最好用条件编译的方法实现（即cfunc.h的方法一），这样的话C和C++都能调用了。

## 如何防止头文件被重复包含

使用条件编译，多重包含绝大多数情况下出现在大型程序中，它往往需要使用很多头文件，因此要发现重复包含并不容易。

如果所有的头文件都像以下这样编写，那么就可以避免多重包含。
```c++
#ifndef _HEADERNAME_H
#define _HEADERNAME_H
...//(头文件内容)
#endif
```

- 当头文件第一次被包含时，它被正常处理，符号_HEADERNAME_H被定义。
- 如果头文件被再次包含，通过#ifndef条件编译，发现该符号已经定义过了，于是直到#endif的代码均被忽略，不用再次进行编译。
- 符号_HEADERNAME_H按照被包含头文件的文件名进行取名，以避免由于其他头文件使用相同的符号而引起的冲突。

注：若后只有一个字符串，如上面的#define _HEADERNAME_H，也表示这个宏被定义了，只不过内容是空的。



