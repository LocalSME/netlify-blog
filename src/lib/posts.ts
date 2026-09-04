import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from './url';

export type Post = CollectionEntry<'blog'>;

/**
 * Every publishable post, newest first.
 * Drafts are visible while running `astro dev` and dropped from production builds.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Post URL path, base-aware at the point of use via withBase(). */
export function postPath(post: Post): string {
  return `/blog/${post.id}/`;
}

/** Newer / older neighbours in the date-sorted list. */
export function getAdjacent(posts: Post[], current: Post) {
  const i = posts.findIndex((p) => p.id === current.id);
  return {
    newer: i > 0 ? posts[i - 1] : undefined,
    older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : undefined,
  };
}

/**
 * Related posts, scored by shared category (weighted) then shared tags.
 * Falls back to the most recent posts so the section is never empty on a small blog.
 */
export function getRelated(posts: Post[], current: Post, limit = 3): Post[] {
  const currentTags = new Set(current.data.tags.map(slugify));
  const scored = posts
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 0;
      if (slugify(p.data.category) === slugify(current.data.category)) score += 3;
      for (const tag of p.data.tags) if (currentTags.has(slugify(tag))) score += 1;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || b.post.data.date.valueOf() - a.post.data.date.valueOf());

  return scored.slice(0, limit).map((s) => s.post);
}

type Term = { name: string; slug: string; count: number };

/** Distinct categories with post counts, most used first. */
export function getCategories(posts: Post[]): Term[] {
  return tally(posts.map((p) => p.data.category));
}

/** Distinct tags with post counts, most used first. */
export function getTags(posts: Post[]): Term[] {
  return tally(posts.flatMap((p) => p.data.tags));
}

function tally(values: string[]): Term[] {
  const map = new Map<string, Term>();
  for (const value of values) {
    const slug = slugify(value);
    if (!slug) continue;
    const existing = map.get(slug);
    if (existing) existing.count += 1;
    else map.set(slug, { name: value, slug, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Rough reading time, used in post meta lines. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
