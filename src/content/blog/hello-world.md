---
title: 你好，世界
date: 2024-11-03
tags:
  - web
  - tutorial
description: 我的第一篇博客，聊聊这个站点是怎么搭起来的。
---

这是我的第一篇博客。这个站点用 [Astro](https://astro.build) 构建，文章用 Markdown 写在 Obsidian 里，每次推送到 GitHub 就会自动发布到 Cloudflare Pages。

## 为什么用 Markdown

在 Obsidian 里写笔记和写博客其实是同一件事：都是 Markdown，都带 YAML 属性。所以我只需要把笔记放到这个仓库里，剩下的交给构建流程。

## 一个代码块

```js
const hello = (name) => `你好，${name}`;
console.log(hello('世界'));
```

## 小结

- 内容用 Markdown 写
- 标签用 Obsidian 的 `tags` 属性
- 发布用 Git + Cloudflare Pages

> 写作是为了思考，而不是为了记录。
