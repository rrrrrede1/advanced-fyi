# Obsidian 博客（复刻 cs.fyi 风格）

一个用 [Astro](https://astro.build) 构建的极简静态博客，风格复刻自 [cs.fyi](https://cs.fyi/)。专为「在 Obsidian 里写作、用 Git 发布」的工作流设计：

- 文章 = Markdown 文件，顶部就是 **Obsidian 的 Properties**（`title` / `tags` / `date`…）
- `tags` 属性自动生成 `/explore` 标签页和 `/tags/xxx/` 标签页
- **中文标题显示 + 短链接分享**：标题用中文 `title`，网址自动用短链（写了 `slug` 就用 slug，没写就自动生成 6 位哈希短链）
- **RSS 订阅**：`/rss.xml` 和 `/index.xml`，含全文
- 一键部署到 Cloudflare Pages，连接 GitHub 后每次 push 自动发布

## 目录结构

```
blog/                          ← 仓库根目录
├── astro.config.mjs           站点地址（唯一来源）+ 构建配置
├── package.json               依赖与脚本
├── tsconfig.json
├── src/
│   ├── content.config.ts      文章属性（Properties）的 schema
│   ├── lib.ts                 站点名 / 副标题 / 短链与日期工具
│   ├── feed.ts                RSS feed 生成逻辑
│   ├── styles/global.css      全部样式（cs.fyi 风格）
│   ├── layouts/Base.astro     公共 head / 页眉 / 页脚
│   ├── content/blog/*.md      ★ 你的文章就写在这里（Obsidian 打开这个文件夹）
│   └── pages/
│       ├── index.astro        首页（文章列表）
│       ├── explore.astro      标签总览页
│       ├── posts/[slug].astro 文章详情页
│       ├── tags/[tag].astro   单个标签页
│       ├── 404.astro          404 页
│       ├── rss.xml.ts         RSS 端点（/rss.xml）
│       └── index.xml.ts       RSS 端点（/index.xml，Hugo 风格）
└── public/
    ├── logo.png               页眉图标（已裁掉透明留白）
    └── favicon.png            标签页图标（由 logo.png 合成）
```

## 站点信息怎么改（改这里就够）

**站点地址只有一个来源**：`astro.config.mjs` 里的 `site`。

```js
// astro.config.mjs
site: 'https://infiniteblack.dev/',
```

改这一处，下面这些会**全部自动跟着变**：

- 页面 `<title>`
- 页脚版权里的域名
- `<link rel="canonical">`、`og:url`
- **RSS feed 里的绝对链接**

其余文案都在 `src/lib.ts`：

| 变量 | 作用 | 当前值 |
|------|------|--------|
| `SITE_URL` | 站点地址 | 取自 `astro.config.mjs` 的 `site` |
| `SITE_TITLE` | 页面上显示的站点名 | 自动取域名（`infiniteblack.dev`） |
| `SITE_TITLE_OVERRIDE` | 想在页面显示跟域名不同的名字时填这里 | 空（空则用域名） |
| `SITE_TAGLINE` | 首页大标题下的副标题 | `代码、设计，以及介于两者之间的一切。` |
| `SLUG_LENGTH` | 自动短链的字符数 | `6` |

> `Base.astro` 还会输出 `og:title` / `og:description` / `og:url`，所以分享到社交平台时预览卡片显示的是你的中文标题。
>
> 改完 `astro.config.mjs` 或 `lib.ts` 后如果 dev server 没反应，`Ctrl+C` 重启 `npm run dev`。

## 本地运行

```bash
npm install        # 第一次先装依赖
npm run dev        # 本地开发，打开 http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 本地预览构建结果
```

> Windows 提示：如果 PowerShell 提示 `npm.ps1 cannot be loaded`，改用 `npm.cmd install`，或在 VS Code 的终端里执行（通常不受该策略影响）。

## 怎么写一篇文章（Obsidian 工作流）

1. 用 Obsidian 打开 `src/content/blog/` 这个文件夹（作为你的库，或库的子文件夹）。
2. 新建一篇 Markdown 笔记，顶部用 **Properties** 写：

```yaml
---
title: 我的中文标题
date: 2024-11-03
tags:
  - web
  - tutorial
---
正文内容，Markdown 语法。
```

3. 保存 → `git add` → `git commit` → `git push`，Cloudflare Pages 会自动构建发布。

## Properties 字段说明（对应 Obsidian 属性）

| 属性 | 必填 | 说明 |
|------|:---:|------|
| `title` | ✅ | 显示用标题，可以写中文 |
| `date` | ✅ | 发布日期，`2024-11-03` 这样的字符串即可 |
| `tags` | 可选 | 标签，支持列表 / `[a, b]` / 单个字符串三种写法；对应 Obsidian 的 `tags` 属性，驱动 Explore 页 |
| `slug` | 可选 | 自定义短链接；不写就自动生成 6 位哈希短链 |
| `description` | 可选 | 文章摘要（用于 `<meta description>` 和 RSS） |
| `draft` | 可选 | `true` 表示草稿，不发布 |

> 注意：只有 Properties 里的 `tags` 会被识别；正文里的 `#行内标签` 不会计入 Explore 页。想改字段名（比如用 `publishDate`），改 `src/content.config.ts` 里的 schema 即可。

## 中文标题 + 短链接是怎么做到的

分享链接的长短取决于「路径」，而不是标题：

- **显示标题**用 `title`（中文，随便写）
- **网址路径**用 `slug`

`slug` 的取值规则：

1. 写了 `slug` → 直接用（见示例 `如何搭建一个极简博客.md` → `/posts/how-to-build-a-minimal-blog/`）
2. 没写 `slug` → **自动生成一个 6 位哈希短链**，如 `/posts/1a2b3c`（基于文件名做 sha256，同一篇文章每次构建结果都稳定不变）

所以每篇文章都会自动有一个干净好分享的短链，中文文件名也不用担心变成 `%E5%A6%82%E4%BD%95...` 那堆编码，更不用每篇手写 slug。

> 哈希长度在 `src/lib.ts` 顶部的 `SLUG_LENGTH` 里调；文章特别多、怕撞车就改成 `8`。真撞车了构建会给出明确报错。

## 文章排序与示例文章

- 文章按 `date` **倒序**排列（最新在前），首页、标签页、RSS 都是这个顺序
- `draft: true` 的文章不会出现在任何页面和 RSS 里
- `src/content/blog/` 里目前还留着最早的示例文章（`hello-world.md`、`如何搭建一个极简博客.md`），可以直接删掉

## 页眉图标（logo）与 favicon

两个图标来自同一份 icons8 下载，保证视觉统一：

| 文件 | 用途 |
|------|------|
| `public/logo.png` | 页眉图标。**已裁掉透明留白**（原图 100×100 里，图形本体只占 82×44） |
| `public/favicon.png` | 标签页图标。由 logo.png 合成：深色圆角底 + 白色图形 |

页眉用 CSS `mask` 渲染，**颜色由 CSS 决定**，会自动跟随主题
（浅色模式深色、深色模式白色），不用准备两套图。

- 显示尺寸 40×22px，在 `global.css` 的 `.site-header .logo` 里调
- 悬停效果：`opacity: 0.7 → 1`（就是"亮起来"）

### 换图标

1. 下载新图标覆盖 `public/logo.png`
   - ⚠️ **背景必须透明**（mask 只取形状和透明度），否则会变成实心方块
2. **裁掉透明留白**，否则 `contain` 会把空白也算进去，图标显得很小
3. 重新生成 favicon（也可以把文件给我，我帮你处理）
4. 如果新图标是**方形**的，把 `.site-header .logo` 的
   `width: 40px; height: 22px` 改成接近方形，例如 `28px` / `28px`

### 为什么不需要"变亮版"

- mask 把图标当"形状"，颜色来自 `background-color: var(--fg)`，所以 icons8「不能改颜色」不是问题
- 悬停的"变亮"是 CSS 的 `opacity` 变化，不需要第二个文件
- 100×100 完全够：页眉只显示 40px 宽，2 倍屏也只需 80px
  - 想要相反效果（默认实心、悬停变淡）就把 `opacity: 0.7` 和 `1` 对调

### 想保留图标原本的配色？

把 CSS 的 mask 换成 `<img>` 写法（这时颜色就固定为文件本身的颜色）：

```astro
<a class="logo" href="/" aria-label={SITE_TITLE}>
  <img src="/logo.png" alt="" width="40" height="22" />
</a>
```

### icons8 授权（重要）

icons8 的免费图标**可以商用**，但有条件（[官方说明](https://icons8.com/license)、[帮助中心](https://intercom.help/icons8-7fb7577e8170/en/articles/4732904-how-and-where-can-i-use-your-icons)）：

- 免费版只有 **PNG、最大 100×100**
- **必须在使用处提供一个指向 icons8.com 的链接**（署名）
- 禁止转售/再分发图标本身；付费订阅可去掉署名要求

**页脚已经加好署名了**（见 `src/layouts/Base.astro`），指向你下载的那个图标页面。
如果以后换成别家的图标，记得把这一行替换成对应的来源或删掉。

## RSS 订阅

构建时会生成两个路径，内容完全相同，只是路径习惯不同：

| 路径 | 说明 |
|------|------|
| `/rss.xml` | 标准路径。页脚有链接，`<head>` 里也有 `rel="alternate"`，阅读器可自动发现 |
| `/index.xml` | Hugo 风格的同名副本 |

线上地址就是 `https://infiniteblack.dev/rss.xml` 和 `https://infiniteblack.dev/index.xml`。

feed 里包含**全文**：Markdown 会被转成 HTML 放进 `content:encoded`，所以在阅读器里能直接读完，不用跳回网页。同时每篇也带 `description`、`categories`（来自 `tags`）、绝对链接。

### 相关文件

| 文件 | 作用 |
|------|------|
| `src/feed.ts` | feed 生成逻辑（两个路径共用一份） |
| `src/pages/rss.xml.ts` | `/rss.xml` 端点 |
| `src/pages/index.xml.ts` | `/index.xml` 端点 |

### 想调整

- **只要一个路径**：删掉 `src/pages/index.xml.ts`（或 `rss.xml.ts`）
- **不要全文、只要摘要**：删掉 `src/feed.ts` 里的 `content:` 那行，并卸载 `markdown-it`
- **改订阅源标题/描述**：用的是 `src/lib.ts` 里的 `SITE_TITLE` / `SITE_TAGLINE`
- **更多字段（封面图、作者、播客等）**：见 [@astrojs/rss 文档](https://docs.astro.build/en/recipes/rss/)

> 安全细节：`markdown-it` 用的是默认的 `html: false`，所以正文里的裸 HTML 会被**转义**而不是原样输出，避免不受信任的标签进到 feed。

## 部署到 Cloudflare Pages

1. 把本项目 push 到一个 GitHub 仓库（仓库根目录就是 `blog/`）。
2. 打开 [Cloudflare Pages](https://developers.cloudflare.com/pages/) → **Create a project** → **Connect to Git** → 选择该仓库。
3. 构建设置选 **Astro** 预设（Build command: `npm run build`，Build output directory: `dist`）。
4. 保存并部署。之后每次 push 到 GitHub 会自动重新构建。

> `astro.config.mjs` 里的 `site` 已经指向 `https://infiniteblack.dev/`，换成自己的域名时记得同步改。

### 自定义域名

Pages 项目 → **Custom domains** → **Set up a domain**。注意**一个域名同一时间只能挂在一个 Pages 项目上**，所以如果想把旧站挪到子域名（比如 `archive.infiniteblack.dev`），顺序应该是：

1. 旧项目先加上子域名并验证能访问
2. 再把主域名从旧项目摘掉
3. 最后把主域名挂到新项目

详见 [Cloudflare Pages — Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)。

## 设计说明（cs.fyi 的简洁风格）

- 单栏窄行宽（`--max-width: 760px`）、居中，没有侧边栏和卡片
- 系统无衬线字体，正文 17px，行高 1.7
- 近黑正文 + 白底 + 灰色次要文字，几乎没有彩色
- 链接与正文同色、悬停下划线；日期灰色
- **页眉**：`padding: 16px 0`（约 57px 高）。想更扁就调小，比如 `12px 0`；想更宽松就调大
- 文章列表用极细分隔线
- **代码块**：纯色浅灰底 + 圆角；大屏（≥880px）时向两侧各扩出 40px，方便看长代码
- **表格**：极简下划线样式（无边框、无斑马纹）
- **页脚**：一行 —— 版权 · RSS · 图标署名

要改配色/字体/宽度，只改 `src/styles/global.css` 顶部 `:root` 里的变量即可。

## 依赖

| 包 | 用途 |
|----|------|
| `astro` | 站点框架 |
| `@astrojs/rss` | 生成 RSS feed |
| `markdown-it` | 把文章 Markdown 转成 HTML 塞进 RSS 全文 |

## 授权（License）

本项目采用**代码与内容分离**的双重授权：

| 范围 | 协议 | 文件 |
|------|------|------|
| **代码**（模板、样式、构建配置等） | AGPL-3.0 | [`LICENSE`](LICENSE) |
| **文章内容**（`src/content/blog/` 下的 Markdown） | CC BY-NC-SA 4.0 | [`LICENSE-CONTENT`](LICENSE-CONTENT) |
| **页眉图标 / favicon** | icons8 免费许可（需署名，页脚已加） | [icons8.com/license](https://icons8.com/license) |

### 代码：AGPL-3.0 的一个实际影响

AGPL 第 13 条要求：如果你**修改**了这个站点并把它作为网络服务提供给他人访问，需要让访问者能拿到修改后的源码。

对个人博客来说这很好满足——**只要仓库是公开的**（比如放在 GitHub 上），就已经符合了。

### 内容：CC BY-NC-SA 4.0 意味着什么

别人可以**非商业地**转载、改编你的文章，但必须：

1. 署名（给出作者和原文链接）
2. 不用于商业目的
3. 改编后以同样的协议分享

> 注意：这个协议**不允许**别人把你的文章拿去商用（包括你自己以后要商用也得另作安排）。
> 如果想禁止演绎，可换成 CC BY-NC-ND 4.0；想保留全部权利就直接写「保留所有权利」。

## 致谢

- 设计风格参考自 [cs.fyi](https://cs.fyi/) —— 仅参考了布局与排版的**思路**，样式与代码均为独立实现，未复制其代码或文章内容。

## 常见问题

- **不想要暗色模式**：删掉 `global.css` 里 `@media (prefers-color-scheme: dark)` 整段。
- **想开启代码语法高亮**：删掉 `astro.config.mjs` 里的 `syntaxHighlight: false`。
- **想给标签页也用短英文 URL**：把 `tags` 写成英文（如 `web`），中文标签也能用，只是 URL 会带百分号编码。
- **想改页眉高度**：改 `global.css` 里 `.site-header` 的 `padding`。
- **想改文章排序**：改 `src/pages/index.astro` 里的 `.sort(...)`（目前是按 `date` 倒序）。
- **想只发布一部分文章**：给不想发的文章加 `draft: true`。
- **想加 sitemap.xml**：装 `@astrojs/sitemap` 并在 `astro.config.mjs` 里注册（会用到 `site` 配置）。
