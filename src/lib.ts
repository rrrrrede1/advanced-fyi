import type { CollectionEntry } from 'astro:content';

// ====== 站点信息（改这里即可） ======
export const SITE_TITLE = 'yourname.dev';
export const SITE_TAGLINE = '代码、设计，以及介于两者之间的一切。';
export const SITE_URL = 'https://yourname.pages.dev';

export type Post = CollectionEntry<'blog'>;

/** 文章的网址 slug：优先用 Properties 里的 slug，否则用文件名（不含扩展名）。 */
export function slugOf(post: Post): string {
  return post.data.slug ?? post.id;
}

/** 本地时区格式化日期，形如 2024-11-03。 */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
