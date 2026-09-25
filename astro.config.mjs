// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages 的最终地址（用于生成规范的 canonical / 站点地图）
  site: 'https://infiniteblack.dev/',

  // 输出干净的目录式 URL（/posts/xxx/ 而不是 /posts/xxx.html）
  build: {
    format: 'directory',
  },

  markdown: {
    // 关闭语法高亮，保持 cs.fyi 那样的纯色代码块。
    // 想开启高亮的话，删掉下面这行即可（默认使用 Shiki）。
    syntaxHighlight: false,
  },
});
