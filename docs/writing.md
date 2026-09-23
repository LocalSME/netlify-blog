# Writing and publishing posts

Two ways to write: the CMS in a browser, or Markdown files in your editor. They produce
identical results — the CMS is just an editor for the same files.

## The CMS

Open <https://localsme.netlify.app/admin/> and choose **"Sign
In Using Access Token"** (see [setup.md](setup.md#2-access-token-for-the-cms)).

**New Post → fill the fields → uncheck Draft → Save.**

Saving is a commit to `main`. The commit triggers Netlify's Git integration, and the
post is live in about a minute.

### Locally

```bash
npm run dev
```

Then open **http://localhost:4321/admin/index.html** — note the explicit `index.html`.
Astro's dev server does not serve directory indexes for files in `public/`, so plain
`/admin/` returns the 404 page. On the built and deployed site `/admin/` works normally.

Choose **"Work with Local Repository"** and select the project folder. Sveltia uses the
browser's File System Access API to read and write your working copy directly, so saves
land as ordinary file changes you can inspect with `git diff` before committing. Needs a
Chromium-based browser.

The third option, *"Sign In with GitHub"*, needs an OAuth backend this project
deliberately does not have. Ignore it.

## Frontmatter

Files live in `src/content/blog/`. **The filename is the URL slug** — `my-post.md`
publishes at `/blog/my-post/`. Keep filenames lowercase and hyphenated.

```yaml
---
title: "Post title"
description: "One or two sentences."
date: "2026-08-20T07:15:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/something.jpg"
category: "Engineering"
tags: [astro, performance]
draft: false
---
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Also the `<h1>` and the CMS-generated slug |
| `description` | string | yes | Card excerpt, meta description, social card, RSS |
| `date` | date | yes | ISO 8601. Drives ordering, prev/next and the feed |
| `author` | string | yes | Byline and JSON-LD |
| `featured_image` | image | yes | Path **relative to the Markdown file** — see below |
| `category` | string | yes | Exactly one. Creates `/category/<slug>/` |
| `tags` | string[] | no | Defaults to `[]`. Each creates `/tag/<slug>/` |
| `draft` | boolean | no | Defaults to `false` |
| `map_embed` | string | no | Google Maps embed snippet — see below |

The schema in [`src/content.config.ts`](../src/content.config.ts) is enforced at build
time. A missing field, a wrong type or a broken image path **fails the build** rather
than shipping something broken — and a failed build leaves the previous version live.

## Location maps

Leave **Location map** empty and nothing renders. Fill it in and a **Location** heading
plus a full-width map appear directly below the post body.

Get the value from Google Maps: find the place → **Share** → **Embed a map** → **COPY
HTML**. Paste the whole thing in; it looks like this:

```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18!..." width="600" height="450"
        style="border:0;" allowfullscreen="" loading="lazy"></iframe>
```

Only the `src` is used. Everything else — the hardcoded `600×450`, inline styles, any
other attributes — is discarded and the site supplies its own, so the map always fills
the column width: 16:9 on desktop, 4:3 on phones where a wide strip is too short to be
usable. A bare URL works too if you would rather paste just that.

Anything that is not an `https` URL renders nothing rather than something broken, so a
typo costs you a missing map, not a broken page.

**One privacy trade-off worth knowing:** a Google map is a third-party embed. On posts
that use it, the reader's browser contacts Google. Every other page on this site makes
no third-party requests at all. The map loads lazily, so it costs nothing until the
reader scrolls to it.

## Drafts

`draft: true` posts are visible with `npm run dev` and removed entirely from production
builds: no page, no RSS item, no archive entry, no search hit, no sitemap entry. There
is no unlisted URL for them to leak through.

```bash
npm run dev      # drafts visible
npm run build    # drafts excluded
npm run preview  # serves the build — exactly what deploys
```

New posts created in the CMS **default to Draft**, so a half-written post saved from a
phone cannot go live by accident. Uncheck the box to publish.

> One caveat: a draft's *cover image* is still copied into the build output (unoptimised
> and unreferenced), because Astro resolves `image()` for every file in the collection.
> No page links to it, but it is reachable at a hashed URL. Draft *text* never ships.

## Images

Upload through the CMS and they land in `src/assets/images/uploads/`, referenced from
frontmatter as a path relative to the Markdown file:

```yaml
featured_image: "../../assets/images/uploads/something.jpg"
```

That relative form is what lets Astro resize, convert and emit a `srcset`. A 1600×900
JPEG of a few dozen KB becomes a smaller WebP with 320/640/960/1200w variants.

In-body images work the same way:

```markdown
![Descriptive alt text](../../assets/images/uploads/something.jpg)
```

Body images are optimised too, though Astro emits a single full-width WebP rather than a
`srcset` for Markdown images.

### Remote image URLs

Pasting an image URL instead of uploading works too:

```yaml
featured_image: "https://example.com/photo.jpg"
```

Astro downloads it **at build time**, resizes it and re-serves it from this site, so it
gets the same optimisation as an upload and readers make no third-party request. The
social-card tags point at the local copy as well.

Two consequences worth knowing:

- The build fetches that URL. If the host is unreachable, the image is **not** optimised
  — it falls back to loading from its original host and the build logs a warning. The
  build still succeeds and the page still renders; you just lose the optimisation and
  the reader makes a third-party request.
- The image is snapshotted at build time — changing it at the source does nothing until
  the next build.

Uploading is still the more robust option. A URL is a convenience, not the default.

**Do not put images in `public/`.** Anything there is copied verbatim and never
optimised. The only images that belong in `public/` are `favicon.png`, `logo.png` and
`social-card.png`, which must exist at fixed URLs.

Always write real alt text. Decorative images take `alt=""`.

## Categories and tags

- **Category** — exactly one per post, broad.
- **Tags** — two or three, specific, reused across posts.

Both are slugified for URLs: `"Web Performance"` → `/tag/web-performance/`. Reuse exact
spellings — `Engineering` and `engineering` produce the same archive, but `Eng` does not.

Archives paginate at 6 posts per page (`POSTS_PER_PAGE` in `src/consts.ts`).

## Post furniture, and what triggers it

Most of a post page assembles itself:

| Feature | Appears when |
| --- | --- |
| Table of contents | The post has ≥ 3 `##`/`###` headings (`TOC_MIN_HEADINGS`) |
| Prev / next | Always, by date order — ends of the list show only one side |
| Related posts | Always, ranked by shared category (weight 3) then shared tags (weight 1) |
| Reading time | Always, at ~220 words per minute |
| Share links | Always — X, LinkedIn, copy-link. Plain links, no third-party widgets |
| Comments | Once Giscus is configured; otherwise a short notice |

Use `##` for sections and `###` for subsections. Deeper levels are excluded from the
table of contents on purpose — a four-level outline usually means the post should have
been two posts.

Every heading gets an `id` automatically, so any section can be linked to directly.

## Before you publish

```bash
npm run build && npm run preview
```

`preview` is the one worth remembering: it serves the built output, so search and the
base path behave exactly as they will once live. Search **cannot** work under
`npm run dev` — the Pagefind index is generated from `dist/` by the `postbuild` step.
