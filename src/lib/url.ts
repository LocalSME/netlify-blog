/**
 * Base-path helpers.
 *
 * The site is deployed under a sub-path (`base` in astro.config.mjs), so no internal
 * link, asset reference or absolute URL may be written as a root-absolute `/foo/`
 * string. Everything goes through these helpers.
 *
 * Two kinds of path show up in this codebase and they must not be confused:
 *   - a *site path* we author by hand, e.g. '/about/' — needs the base adding;
 *   - a *built path* Astro hands back, e.g. Astro.url.pathname or ImageMetadata.src
 *     — already carries the base.
 * There is no reliable way to tell them apart by inspection (this blog has a /blog/
 * route under a /blog/ base), so each has its own function instead of a guess.
 */

/** Astro injects the configured base here — "/blog/" in this project, "/" at root. */
const BASE = import.meta.env.BASE_URL;

/**
 * Prefix a site path with the configured base.
 * withBase('/about/') -> '/blog/about/'
 */
export function withBase(path = '/'): string {
  const joined = `${BASE}/${path}`.replace(/\/{2,}/g, '/');
  if (joined === '/') return '/';
  // Leave file paths alone; give directory paths the trailing slash Astro expects.
  const isFile = /\.[a-z0-9]+$/i.test(joined);
  return isFile || joined.endsWith('/') ? joined : `${joined}/`;
}

/** True for `https://…` / `http://…` — a path that is already somewhere else. */
export function isAbsoluteUrl(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path);
}

/**
 * Absolute URL for a site path we author — base is applied.
 * An input that is already an absolute URL is returned untouched, so a remote
 * featured image does not get the site origin glued onto the front of it.
 */
export function absUrl(path: string, site: URL | undefined): string {
  if (isAbsoluteUrl(path)) return path;
  return new URL(withBase(path), site ?? 'http://localhost/').href;
}

/**
 * Absolute URL for a path Astro already resolved (Astro.url.pathname,
 * ImageMetadata.src, paginate() URLs). The base is present, so only the origin
 * needs adding.
 */
export function absFromBuiltPath(path: string, site: URL | undefined): string {
  return new URL(path, site ?? 'http://localhost/').href;
}

/** Lowercase, hyphenated, URL-safe slug used for category and tag routes. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
