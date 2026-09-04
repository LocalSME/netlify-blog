import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postPath } from '../lib/posts';
import { absUrl, withBase } from '../lib/url';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // context.site is the bare origin from astro.config.mjs, so the channel link
    // has to have the base path put back on it. Item links stay root-absolute and
    // are resolved against it, giving https://host/base/blog/slug/ URLs.
    site: absUrl('/', context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      author: post.data.author,
      categories: [post.data.category, ...post.data.tags],
      link: withBase(postPath(post)),
    })),
    customData: '<language>en</language>',
  });
}
