import { createHash } from 'node:crypto';
import type { CollectionEntry } from 'astro:content';

// ====== 站点信息（改这里即可） ======
export const SITE_TITLE = 'yourname.dev';
export const SITE_TAGLINE = '代码、设计，以及介于两者之间的一切。';
export const SITE_URL = 'https://yourname.pages.dev';

export type Post = CollectionEntry<'blog'>;

/** 短链长度（自动生成的哈希 slug 的字符数）。文章特别多、怕撞车就调大一点。 */
export const SLUG_LENGTH = 6;

/** 用 sha256 生成确定性的短哈希：同一篇文章每次构建结果都一致。 */
function shortHash(input: string, length = SLUG_LENGTH): string {
  return createHash('sha256').update(input).digest('hex').slice(0, length);
}

/**
 * 文章的网址 slug：
 * - 写了 Properties 里的 slug 就用它；
 * - 没写就根据文件名（post.id）自动生成一个 6 位哈希短链，如 /posts/1a2b3c。
 */
export function slugOf(post: Post): string {
  return post.data.slug ?? shortHash(post.id);
}

/** 本地时区格式化日期，形如 2024-11-03。 */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
