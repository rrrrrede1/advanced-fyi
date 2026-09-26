import { createHash } from 'node:crypto';
import type { CollectionEntry } from 'astro:content';

// ====== 站点信息 ======
// 站点地址的唯一来源是 astro.config.mjs 里的 `site`。
// 改那一处，页面标题、页头 logo、页脚、canonical 都会跟着变。
const siteUrl = import.meta.env.SITE ?? 'http://localhost:4321';

export const SITE_URL = siteUrl;

/** 想在页面上显示跟域名不同的名字时填这里；留空则自动取域名。 */
const SITE_TITLE_OVERRIDE = '';

export const SITE_TITLE = SITE_TITLE_OVERRIDE || new URL(siteUrl).hostname;

export const SITE_TAGLINE = '写点技术，也写点别的。';

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
