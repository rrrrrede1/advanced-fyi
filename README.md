# Obsidian 博客（复刻 cs.fyi 风格）

一个用 [Astro](https://astro.build) 构建的极简静态博客，风格复刻自 [cs.fyi](https://cs.fyi/)。专为「在 Obsidian 里写作、用 Git 发布」的工作流设计：

- 文章 = Markdown 文件，顶部就是 **Obsidian 的 Properties**（`title` / `tags` / `date`…）
- `tags` 属性自动生成 `/explore` 标签页和 `/tags/xxx/` 标签页
- **中文标题显示 + 短链接分享**：标题用中文 `title`，网址自动用短链（写了 `slug` 就用 slug，没写就自动生成 6 位哈希短链）
- 一键部署到 Cloudflare Pages，连接 GitHub 后每次 push 自动发布

## 目录结构

```
blog/                          ← 仓库根目录
├── astro.config.mjs           站点配置（站点地址、URL 格式）
├── package.json
├── src/
│   ├── content.config.ts      文章属性（Properties）的 schema
│   ├── lib.ts                 站点名 / 副标题 / 工具函数
│   ├── styles/global.css      全部样式（cs.fyi 风格）
│   ├── layouts/Base.astro     公共头部 + 页脚
│   ├── content/blog/*.md      ★ 你的文章就写在这里（Obsidian 打开这个文件夹）
│   └── pages/
│       ├── index.astro        首页（文章列表）
│       ├── explore.astro      标签总览页
│       ├── posts/[slug].astro 文章详情页
│       └── tags/[tag].astro   单个标签页
└── public/
    ├── favicon.svg            站点图标（浏览器标签页）
    └── logo.svg               页眉图标（可替换成自己的）
```

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
| `description` | 可选 | 文章摘要（用于 `<meta description>`） |
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

## 页眉图标（logo）

页眉左侧是图标（复刻 cs.fyi 的做法）。图标放在 `public/`，用 CSS `mask` 渲染，
**颜色由 CSS 决定**，会自动跟随主题（浅色模式深色、深色模式白色），不用准备两套图。

- `public/logo.svg` —— 当前是**占位用**的无限符号，可以替换成自己的
- 显示尺寸 26×26px，在 `global.css` 的 `.site-header .logo` 里调
- 悬停效果：`opacity: 0.7 → 1`（就是"亮起来"）

### 换成自己下载的图标

1. 把图标放进 `public/`，例如 `public/logo.png`
   - ⚠️ **背景必须透明**，否则会渲染成一个实心方块（mask 只取图标的形状/透明度）
2. 打开 `src/styles/global.css`，把 `.site-header .logo` 里的两处
   `url("/logo.svg")` 改成 `url("/logo.png")`
3. 保存即可，**不需要**再做一张"变亮版"

### 为什么不需要"变亮版"，100×100 也完全够

- 页眉只显示 26px，2 倍屏（Retina）也只需要 52px，所以 **100×100 绰绰有余**，不会糊
- mask 把图标当"形状"，颜色来自 `background-color: var(--fg)`，所以 icons8「不能改颜色」不是问题
- 悬停的"变亮"是 CSS 的 `opacity` 变化，不需要第二个文件
  - 想要相反效果（默认实心、悬停变淡）就把 `opacity: 0.7` 和 `1` 对调

### 想保留图标原本的配色？

把 CSS 的 mask 换成 `<img>` 写法（这时颜色就固定为文件本身的颜色）：

```astro
<a class="logo" href="/" aria-label={SITE_TITLE}>
  <img src="/logo.png" alt="" width="26" height="26" />
</a>
```

### icons8 授权（重要）

icons8 的免费图标**可以商用**，但有条件（[官方说明](https://icons8.com/license)、[帮助中心](https://intercom.help/icons8-7fb7577e8170/en/articles/4732904-how-and-where-can-i-use-your-icons)）：

- 免费版只有 **PNG、最大 100×100**
- **必须在使用处提供一个指向 icons8.com 的链接**（署名）
- 禁止转售/再分发图标本身；付费订阅可去掉署名要求

所以一旦换成 icons8 的图标，记得在页脚署名。`src/layouts/Base.astro` 的页脚里
已经留了一段注释好的署名代码，取消注释即可。

## 部署到 Cloudflare Pages

1. 把本项目 push 到一个 GitHub 仓库（仓库根目录就是 `blog/`）。
2. 打开 [Cloudflare Pages](https://developers.cloudflare.com/pages/) → **Create a project** → **Connect to Git** → 选择该仓库。
3. 构建设置选 **Astro** 预设（Build command: `npm run build`，Build output directory: `dist`）。
4. 保存并部署。之后每次 push 到 GitHub 会自动重新构建。

> 部署后记得把 `astro.config.mjs` 里的 `site` 改成你的 `https://xxx.pages.dev` 地址。

## 设计说明（cs.fyi 的简洁风格）

- 单栏窄行宽（760px）、居中，没有侧边栏和卡片
- 系统无衬线字体，正文 17px，行高 1.7
- 近黑正文 + 白底 + 灰色次要文字，几乎没有彩色
- 链接与正文同色、悬停下划线；日期灰色
- 列表用极细分隔线；代码块纯色浅灰底 + 圆角
- 顶部只有 logo + 两个导航，底部一行版权

要改配色/字体/宽度，只改 `src/styles/global.css` 顶部 `:root` 里的变量即可。

## 常见问题

- **不想要暗色模式**：删掉 `global.css` 里 `@media (prefers-color-scheme: dark)` 整段。
- **想开启代码语法高亮**：删掉 `astro.config.mjs` 里的 `syntaxHighlight: false`。
- **想给标签页也用短英文 URL**：把 `tags` 写成英文（如 `web`），中文标签也能用，只是 URL 会带百分号编码。
