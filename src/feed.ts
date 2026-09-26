import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_TAGLINE, slugOf } from './lib';

// html: false —— 源文件里的裸 HTML 会被转义，
// 避免把不受信任的标签原样塞进 feed。
const md = new MarkdownIt({ html: false, linkify: true });

/**
 * 生成 RSS feed。
 * rss.xml 和 index.xml 两个路径共用这份逻辑（见 src/pages/*.xml.ts）。
 */
export async function buildFeed(site: URL | undefined) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_TAGLINE,
    site: site as URL,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? '',
      link: `/posts/${slugOf(post)}/`,
      categories: post.data.tags,
      // 全文输出，阅读器里可以直接读完
      content: post.body ? md.render(post.body) : undefined,
    })),
    customData: '<language>zh-cn</language>',
  });
}
