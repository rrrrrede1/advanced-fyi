import type { APIContext } from 'astro';
import { buildFeed } from '../feed';

export async function GET(context: APIContext) {
  return buildFeed(context.site);
}
