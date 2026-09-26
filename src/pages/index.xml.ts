import type { APIContext } from 'astro';
import { buildFeed } from '../feed';

// 和 /rss.xml 内容相同，只是多提供一个 Hugo 风格的路径
export async function GET(context: APIContext) {
  return buildFeed(context.site);
}
