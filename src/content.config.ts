import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 每一篇博客都对应 src/content/blog/ 下的一个 .md 文件，
// 文件顶部的 YAML 属性与 Obsidian 的 Properties 完全一致。
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    // 显示用标题（可以是中文）
    title: z.string(),
    // 发布日期：兼容 "2024-11-03" 这种字符串
    date: z.coerce.date(),
    // Obsidian 的 tags 属性：支持列表、内联数组、单个字符串三种写法
    tags: z
      .union([z.string(), z.array(z.string())])
      .transform((v) => (typeof v === 'string' ? [v] : v))
      .default([]),
    // 可选：自定义短链接 slug（不写就用文件名）
    slug: z.string().optional(),
    // 可选：文章摘要（用于 <meta description>）
    description: z.string().optional(),
    // 可选：草稿，true 时不发布
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
