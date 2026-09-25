---
title: RSSHub 的 Twitter 路由：TWITTER_AUTH_TOKEN 到底该填什么
slug: rsshub-twitter-auth-token
date: 2026-09-25
tags:
  - rsshub
  - self-hosted
  - troubleshooting
  - docker
description: 关于这个配置项，网上至少有三种互相矛盾的说法。我把 RSSHub 的源码读了一遍，把格式钉死了。
---

自建 RSSHub 之后想做的第一件事，通常就是把 Twitter 加进来。然后你会遇到这个：

```
error: Error in /twitter/user/someone: ConfigNotFoundError: Twitter API is not configured
```

于是去搜。搜完你会更迷茫——因为你会同时看到三种说法：

1. 把**整条 cookie** 填进 `TWITTER_COOKIE`
2. 只需要填 `TWITTER_AUTH_TOKEN`，值是 `auth_token` cookie 的内容
3. 要填 `TWITTER_USERNAME` + `TWITTER_PASSWORD` + `TWITTER_AUTHENTICATION_SECRET`

**这三种说法分别对应三个不同时期的设计，其中两个已经死了。** 更麻烦的是文档没跟上，所以老文章至今还在传播。

我最后是直接读源码把答案钉死的。

## TL;DR

`TWITTER_AUTH_TOKEN` **只填 `auth_token` 这个 cookie 的「值」本身**：

```env
TWITTER_AUTH_TOKEN=0123abcd...（一长串十六进制）
```

- ❌ 不要写 `auth_token=0123abcd...`
- ❌ 不要写 `auth_token=0123abcd...; ct0=efgh...`
- ✅ 多个账号用**英文逗号**分隔：`值1,值2,值3`

`ct0` 不需要你提供。

## 为什么会同时存在三种说法

这套认证换过三代，而换的时候文档没改：

| 代 | 变量 | 现状 |
|---|---|---|
| 一 | `TWITTER_COOKIE` = **整条 cookie 串** | 已改名，且语义变了 |
| 二 | **`TWITTER_AUTH_TOKEN`** = **只填 auth_token 的值** | ✅ 现行，官方推荐 |
| 三 | `TWITTER_USERNAME` + `TWITTER_PASSWORD` + `TWITTER_AUTHENTICATION_SECRET` | ❌ 已废弃 |

第三种的废弃有官方原文（`lib/routes/twitter/namespace.ts`）：

> This no longer works since mobile client attestation has been implemented in October 2025.

而第一种到第二种的迁移，坑的来源有官方 issue 背书（[#16184](https://github.com/DIYgod/RSSHub/issues/16184)）：

> 目前底层配置从 TWITTER_COOKIE 切换到 TWITTER_AUTH_TOKEN 后，没有修改相应的文档，无法了解如何配置 TWITTER_AUTH_TOKEN

**所以：你看到的"整条 cookie"教程，是上一个时代的东西。**

## 读源码：为什么只能填「值」

关键函数在 `lib/routes/twitter/api/web-api/utils.ts`，叫 `token2Cookie`：

```js
const jar = new CookieJar();
await jar.setCookie(`auth_token=${token}`, 'https://x.com');  // ← 它自己拼 auth_token=
await ofetch('https://x.com', { dispatcher: agent });          // ← 带着这个 cookie 访问一次 x.com
const cookie = JSON.stringify(jar.serializeSync());            // ← x.com 回种的 cookie 被整体捕获
```

三行就把事情说完了：

1. **它自己拼 `auth_token=` 前缀**。所以如果你填的是 `auth_token=xxx`，最终 cookie 会变成 `auth_token=auth_token=xxx`——一个无效值。
2. **它带着这个 cookie 去访问一次 `https://x.com`**。X 会在响应里补种 `ct0`、`gt` 等 cookie，这些都被 `CookieJar` 捕获。
3. 之后真正发请求时，CSRF 头是这么来的：

```js
'x-csrf-token': jsonCookie.ct0,     // ct0 来自上面那次访问的结果
```

**所以 `ct0` 是自动换来的，不需要你填。** 这也解释了为什么老教程让你填整条 cookie——在旧实现里确实要自己提供 ct0，新实现把它自动化了。

## 怎么拿到 auth_token

1. 浏览器登录 x.com
2. 打开开发者工具 → **Application**（Firefox 是 **Storage**）→ Cookies → `https://x.com`
3. 找到名为 **`auth_token`** 的那一条 → 复制它的 **Value**（HttpOnly，一长串）

只复制值，别把 `auth_token=` 或整行粘进去。

## 你的报错是怎么产生的

`lib/routes/twitter/api/index.ts` 的选择逻辑：

```js
const enableThirdPartyApi = config.twitter.thirdPartyApi;
const enableWebApi        = config.twitter.authToken;
const enableDeveloperApi  = config.twitter.consumerKey && config.twitter.consumerSecret;

let api = {
    init: () => { throw new ConfigNotFoundError('Twitter API is not configured'); },
    // ...
};

if (enableThirdPartyApi || enableWebApi) {
    api = webApi;
} else if (enableDeveloperApi) {
    api = devApi;
}
```

三条路都没配 → `init()` 直接抛 `ConfigNotFoundError('Twitter API is not configured')`。**这就是那个报错的全部来源。**

顺带记一下另外两个可能的报错：

- `No valid Twitter token found` —— 配了 token，但都被"用掉"了（见下一节）
- `Twitter cookie for token xxx***** is not valid` —— 拿 auth_token 换 ct0 失败，通常是到不了 x.com，或 token 已失效

## 坑一：token 会被"用掉"

RSSHub 里 token 的消耗逻辑是硬编码的：

- 多个 token 轮流用（`authTokenIndex++ % length`），并发时给每个 token 加锁
- 遇到 **401/403**：把该 token 从内存数组里 **`splice` 掉**，并锁 3600 秒——相当于**当场报废**，重启才恢复
- 遇到 **429**（或返回空用户 `{"user":{}}`）：锁 2000 秒；若响应头有 `x-rate-limit-reset`，按 reset 时间 ×2 锁

也就是说：**Twitter 的限流会实实在在地吃掉你的 token**，单账号跑一阵子就没了。

→ **一次多填几个账号的 auth_token**（逗号分隔），这是稳定性上最有效的一招。

## 坑二：`.env` 不会自动进容器

这个坑跟 Twitter 无关，但会让你以为"我明明配了"。

用 Docker Compose 时，把变量写进 `.env` **只是给 compose 做变量插值**，容器里看不到。必须在 service 里显式声明：

```yaml
services:
  rsshub:
    environment:
      TWITTER_AUTH_TOKEN: ${TWITTER_AUTH_TOKEN:-}
```

`:-` 是给个空默认值，避免没配时报错。

验证真的传进去了：

```bash
docker compose exec rsshub sh -c 'printenv TWITTER_AUTH_TOKEN | head -c 8; echo "...(前8位)"'
```

只打前 8 位。

## 坑三：必须能访问 x.com

因为要 GET 一次 `https://x.com` 去换 ct0，所以：

- 网络必须能到 x.com——国内部署需要代理
- 如果配了 `PROXY_URI` + `PROXY_URL_REGEX`，**正则要能匹配 `x.com`**
- ⚠️ `PROXY_URL_REGEX` 匹配的是**完整 URL 字符串**（不是 hostname），而且要自己加锚定：

```env
PROXY_URI=http://你的代理:7890
PROXY_URL_REGEX=^https?://([^/]+\.)?(twitter\.com|x\.com|youtube\.com|instagram\.com|reddit\.com)([:/])
```

不锚定的正则会误伤——只写 `twitter\.com` 会同时命中 `https://twitter.com.evil.com/` 和 `https://example.com/?u=twitter.com`。

## 安全：请用专用小号

`auth_token` **等同于账号的登录凭据**，谁拿到谁就能以你的身份操作该账号。所以：

- 用专用小号，不要用主号
- 它会以环境变量形式存在于容器配置里
- 浏览器里"退出登录"或改密码会让它失效

## 排错：把 debug 日志打开

日志级别由 `LOGGER_LEVEL` 控制。设成 `debug` 后会输出一批 `twitter debug:` 日志，包含 token 状态、限流余量、cookie jar 内容：

```yaml
environment:
  LOGGER_LEVEL: debug
```

然后：

```bash
docker compose logs --tail=80 rsshub | grep -i twitter
```

⚠️ **debug 日志会明文打印 `auth_token`**（源码里 `twitter debug: twitter cookie for token ${auth.token}` 那句没做掩码）。**别把 debug 日志贴到公开的地方**，贴之前先打码。

## 替代方案

**1. X 官方开发者 API**

```env
TWITTER_CONSUMER_KEY=...
TWITTER_CONSUMER_SECRET=...
```

官方措辞是 *Pay-Per-Use developer API*，也就是**要花钱**。可选再加 `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` 获得用户上下文。

`/twitter/user` 与 `/twitter/keyword` 还支持 `?forceWebApi=0/1` 强制走哪条路。

**2. 第三方兼容 API**

```env
TWITTER_THIRD_PARTY_API=https://你的服务
```

只对这几个端点生效：`UserByScreenName` / `UserByRestId` / `UserTweets` / `UserTweetsAndReplies` / `ListLatestTweetsTimeline` / `SearchTimeline` / `UserMedia`。实现方式是把 `${base}${gqlMap[endpoint]}` 拼起来，所以对方必须实现 x.com 的 GraphQL 路径——现成的公开服务我没找到。

## 一个诚实的补充

RSSHub 的 issue 区有过这样的报告（[#19420](https://github.com/DIYgod/RSSHub/issues/19420)）：token 格式正确、就是浏览器里那一份，却只返回 200 空内容。该 issue 已关闭，之后代码也重构过（`token2Cookie` + 自动换 ct0 这套看着就是为修这类问题）。

**本文只在源码层面验证了"格式"，长期稳定性需要你自己观察。** 如果填对了还是空的，先开 debug 日志看 token 有没有被限流吃掉。
