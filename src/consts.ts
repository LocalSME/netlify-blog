/**
 * Single place to edit the blog's identity. Nothing else hardcodes these values.
 */
export const SITE_TITLE = 'Creative Digital Growth';
export const SITE_DESCRIPTION =
  'A small, fast, hand-built blog about the things worth writing down.';

/** Solo author details, used for bylines, JSON-LD and the About page. */
export const AUTHOR_NAME = 'Your Name';
export const AUTHOR_BIO =
  'One-line bio goes here — who you are and what you write about.';
export const AUTHOR_EMAIL = 'you@example.com';

/** Default social image, relative to /public. Used when a page has no image of its own. */
export const DEFAULT_OG_IMAGE = '/social-card.png';

/**
 * Optional pages. Set a flag to `true` and the page is built and its links appear in
 * the header, footer and elsewhere; leave it `false` and the route is not generated at
 * all, so the URL 404s rather than sitting unlinked but reachable.
 *
 * Nothing is deleted — flipping a flag back to `true` restores the page as it was.
 */
export const FEATURES = {
  /** About page at /about/. Edit its prose in src/pages/about/[...slug].astro. */
  about: false,
  /** Full-text search at /search/. Needs no configuration; works as soon as it is on. */
  search: false,
  /** Contact page at /contact/. Set CONTACT_FORM_ENDPOINT below for a working form. */
  contact: false,
} as const;

/** Posts per page for /blog/ and the category / tag archives. */
export const POSTS_PER_PAGE = 6;

/** Show an auto table of contents once a post has at least this many headings. */
export const TOC_MIN_HEADINGS = 3;

/**
 * Giscus (GitHub Discussions comments).
 * Fill these in from https://giscus.app after enabling Discussions and installing
 * the Giscus app on the repo. While `repoId` or `categoryId` are empty the comment
 * section renders a short notice instead of the widget.
 */
export const GISCUS = {
  repo: 'CreativeDigitalGrowth/netlify-blog',
  repoId: '',
  category: 'Announcements',
  categoryId: '',
  mapping: 'pathname',
  reactionsEnabled: '1',
  inputPosition: 'top',
} as const;

/**
 * Contact form endpoint. Create a form at https://formspree.io (or any equivalent
 * service) and paste the endpoint URL here. Until it is set, /contact/ shows a
 * mailto link instead of the form — nothing breaks.
 */
export const CONTACT_FORM_ENDPOINT = '';

/** Optional social links shown in the footer. Remove any you do not use. */
export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/CreativeDigitalGrowth' },
] as const;
