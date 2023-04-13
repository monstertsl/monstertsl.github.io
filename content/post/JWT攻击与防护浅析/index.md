---
#标题
title: "JWT攻击与防护浅析"
#副标题
description: 
#日期
date: 2023-04-13
#封面图片
image: 
#协议信息，可以设置false
license: 
#优先级
weight: 
#评论开关，默认false,如果使用了这个关键字会关闭评论，如果要开启评论，删除这个关键字即可
comments: 
#隐藏文章，默认false
hidden:
#分类
categories:
    - 教程
    - 渗透
    - 笔记
    - web安全
#标签
tags:
    - JWT
    - 渗透测试
    - 令牌
#显示 / 隐藏目录，默认true
toc:
#最后修改时间
lastmod:
---

## JWT是什么

JWT全称为JSON Web Token,将json对象作为载体来传输信息，是为了在网络应用环境间传递声明而执行的一中基于JSON的开放标准（RFC 7519），一般被用在身份提供者和服务提供者间传递被认证的用户身份信息，也可以增加一些额外的业务逻辑所必须声明信息，该token可被直接用于认证，也可用作加密。

### 原理

1）客户端提交用户名密码等信息到服务端请求登录，服务端在验证通过后前发一个具有时效性的token，将token返回给客户端

2）客户端收到token后会将token存储在cookie或localStorage中

3）随后客户端每次请求都会携带这个token，服务端收到请求后校验该token并在验证通过后返回对应资源

## JWT令牌结构

JWT由3部分组成：Headers、Payload、Signature这三个部分构成，这些部分之间用点`.`号隔开,形如：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.5mhBHqs5_DTLdINd9p5m7ZJ6XD0Xc55kIaCRY5r6HRA
```
```
Headers:头部
Payload:有效载荷
Signature:签名
```
### Headers和Payload

其中头部包含关于令牌本身的元数据，而载荷包含关于用户的实际“声明”，再对其各自使用base64url编码组成JWT的前两个部分，可以对上述令牌的进行解码,得到如下结果：

```
HEADER:ALGORITHM & TOKEN TYPE

    {
    "alg": "HS256",
    "typ": "JWT"
    }

PAYLOAD:DATA

    {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
    }

VERIFY SIGNATURE

    HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    test)
```
>因为Headers和Payload只进行base64url编码所以不要将机密信息放在JWT的Headers和Payload

### signature

这一部分是对前两部分的签名，防止数据被纂改。加入密钥然后就使用header头里的签名算法按以下方式创建签名：

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```
在上面的示例中使用了`test`这个密钥，在实际中如果使用这种密钥是十分容易被暴力破解的！

## 攻击与防护
### 暴力破解密钥
在这里我们使用到一个JWT的密钥爆破工具：[jwt_tool](https://github.com/ticarpi/jwt_tool)，以及一个常用JWT密钥库：[jwt-secrets](https://github.com/wallarm/jwt-secrets)
靶场地址：[JWT_Cracking](https://authlab.digi.ninja/JWT_Cracking)       
获取令牌并且复制，使用爆破工具尝试破解，命令格式为：
```
jwt_tool.py JWT -C -d 字典
```
![](img/2023-04-13-15-48-48.png)
破解出使用的密钥为`hello`
![](img/2023-04-13-15-50-46.png)
也可以使用[JWT.IO](https://jwt.io/)进行验证，可以看见提示令牌无效
![](img/2023-04-13-15-53-51.png)
使用`hello`作为密钥填入，提示签名已验证，证明了密钥的正确
![](img/2023-04-13-15-55-49.png)
修改JWT用户信息进行越权，服务器接收了我们伪造的登录信息
![](img/2023-04-13-15-57-25.png)
![](img/2023-04-13-15-57-41.png)
对我们在前文中提到的实例JWT进行破解，因为使用了弱密钥的缘故被很快破解出密钥
![](img/2023-04-13-16-00-03.png)

### 敏感信息泄露
靶场地址：[Leaky JWT](https://authlab.digi.ninja/Leaky_JWT)     
打开靶场，在这里已经模拟受害者被获取到了令牌
![](img/2023-04-12-09-43-43.png)
我们将获取到的令牌放到[JWT.IO](https://jwt.io/)中进行解密，发现开发者直接将用户的账户和密钥放到JWT的载荷中进行传输。
![](img/2023-04-12-09-46-36.png)
其中密钥部分可以看出使用了MD5加密，对其进行解密得到密钥为`Password1`，使用得到的用户名和密钥进行尝试登录发现可以登录成功。
![](img/2023-04-12-09-52-03.png)

### 未验证签名
靶场地址：[通过未经验证的签名绕过 JWT 身份验证](https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-unverified-signature)
![](img/2023-04-13-14-34-08.png)
进入靶场，首先使用提示的账户信息`wiener:peter`进行登录，发现成功登录后服务器返回了JWT认证信息
![](img/2023-04-13-14-35-42.png)
刷新页面发现每次请求都会带有认证信息
![](img/2023-04-13-14-36-29.png)
尝试修改修改`Payload`中的`sub`为`administrator`，重新发包，发现可以返回登录的信息
![](img/2023-04-13-14-46-21.png)
替换浏览器中的cookie，已经实现垂直越权登录了管理员账户，并且多了一个功能入口，进去根据要求删除对于用户完成即可完成

![](img/2023-04-13-14-48-12.png)
![](img/2023-04-13-14-48-33.png)

### 空加密算法
靶场地址：[通过有缺陷的签名验证绕过 JWT 身份验证](https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-flawed-signature-verification)
![](img/2023-04-13-11-26-43.png)
进入靶场，首先使用提示的账户信息`wiener:peter`进行登录，发现成功登录后服务器返回了JWT认证信息
![](img/2023-04-13-13-54-29.png)
刷新页面发现每次请求都会带有认证信息
![](img/2023-04-13-13-55-57.png)
使用上个实例同样的方法，对登录用户的信息进行修改，在题干中已经提示了接受未签名的JWT，所以只需要修改JWT的前两部分`Headers`中的`alg`为`none`，修改`Payload`中的`sub`为`administrator`，因为`Signature`部分使用了`Headers`中声明的加密算法进行加密，所以删除掉这部分(但是要保留最后的`.`构成一个完整的JWT)发现可以正常返回管理员账户信息
![](img/2023-04-13-14-06-08.png)

替换cookie，刷新页面发现登录了管理员账户，并且多了一个功能入口，进去根据要求删除对于用户完成即可完成

![](img/2023-04-13-14-20-47.png)
![](img/2023-04-13-14-22-02.png)

### JWT头部参数注入
### jwk参数注入
### kid参数注入
### 算法修改攻击


## 参考链接

[检测与防护能力—浅析JWT攻击类型](https://www.topsec.com.cn/newsx/3727)  
[web渗透之jwt 安全问题](https://blog.csdn.net/qq_44159028/article/details/129683126)  
[JWT总结](https://blog.csdn.net/m0_62422842/article/details/124971440)  
[浅析JWT Attack](https://zhuanlan.zhihu.com/p/593391315?utm_id=0)   
[渗透测试-JWT攻击](https://blog.csdn.net/cdyunaq/article/details/122561096)   

