# Field Notes

A static blog for a single author. Astro + TypeScript, Markdown content collections,
Sveltia CMS at `/admin`, Pagefind search, Giscus comments, deployed to Netlify by its
own dashboard Git integration.

**Live:** <https://creativedigitalgrowth.netlify.app/>

Independent from the sibling GitHub Pages, Cloudflare Pages and GitLab Pages blogs —
same engine, own content, own git history, own visual design. This one is a
neo-brutalist theme (thick borders, zero radius, hard offset shadows) — see the note at
the top of [`src/styles/global.css`](src/styles/global.css).

No server, no database, no tracking scripts, no cookie banner, no CSS framework. Three
runtime dependencies. The only client-side JavaScript is a theme toggle, a copy-link
button, the search page and the comment widget.

## Documentation

| Document | What it covers |
| --- | --- |
| [docs/setup.md](docs/setup.md) | **Start here.** One-time setup — Netlify Git integration, CMS token, Giscus, contact form, author details |
| [docs/writing.md](docs/writing.md) | Writing and publishing posts, frontmatter reference, drafts, images |
| [docs/architecture.md](docs/architecture.md) | How the site is built and why the awkward parts are that way |
| [docs/deployment.md](docs/deployment.md) | CI/CD, required Netlify configuration, verifying a deploy, rollback |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Every failure hit while building this, with the fix |
| [SECURITY.md](SECURITY.md) | Threat model, token hygiene, why deletion is not erasure |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Ground rules for comments |
| [CLAUDE.md](CLAUDE.md) | Conventions for anyone (or anything) editing this repository |

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321/ — **drafts visible** |
| `npm run build` | Production build into `dist/`, then Pagefind indexes it (`postbuild`) |
| `npm run preview` | Serve `dist/` — the only faithful test of search, `/admin/` and base paths |
| `npm run check` | TypeScript + Astro diagnostics |

### Windows: Smart App Control

If a build fails with *"An Application Control policy has blocked this file"*, Windows
Smart App Control is refusing Astro's unsigned native compiler binary. Install the WASI
fallback:

```bash
npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi
```

Re-run it after every `npm install` or `npm ci`. Netlify's build runners are unaffected.
Details in [troubleshooting.md](docs/troubleshooting.md).

## Writing a post

Open [`/admin/`](https://creativedigitalgrowth.netlify.app/admin/) → **New Post** →
uncheck **Draft** → **Save**. That commits to `main`, which Netlify builds and deploys.

Or write the file directly — posts are Markdown in `src/content/blog/`, and the filename
is the URL slug:

```yaml
---
title: "Post title"
description: "One or two sentences, used for cards, meta description and social."
date: "2026-08-20T07:15:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/something.jpg"
category: "Engineering"
tags: [astro, performance]
draft: false
---
```

Frontmatter is validated at build time — a typo fails the build instead of shipping
broken output, and a failed build leaves the previous version live.

`draft: true` posts render in `npm run dev` and are dropped entirely from production:
no page, no feed entry, no archive listing, no search hit. Full reference in
[writing.md](docs/writing.md).

## Base-path safety

This is a **root-served** site, so `base` is `/` and a root-absolute `/foo/` link
happens to work. That is a coincidence of the current hosting, not a licence to
hardcode paths: every internal link still goes through
[`src/lib/url.ts`](src/lib/url.ts) — `withBase()` for paths you author,
`absFromBuiltPath()` for paths Astro produced, `absUrl()` for absolute URLs.

Keeping that discipline is what lets the site move under a base path, or onto a custom
domain, as a config change rather than a rewrite.

To verify after any change, build and confirm every absolute URL points at this site:

```bash
grep -rhoE 'https?://[^"< ]+' dist --include=*.html --include=*.xml   | grep -v 'creativedigitalgrowth.netlify.app' | sort -u
```

## Status

Code, content structure and CMS are complete and build clean (`npm run check`, 0
errors). **Not yet deployed** — the Netlify side of the one-time setup (connecting the
dashboard's Git integration to this repository) has not been done yet. See
[docs/setup.md](docs/setup.md) for the exact steps.

Outstanding setup — none of it blocking, all of it in
[docs/setup.md](docs/setup.md): the Netlify Git integration, the CMS token, Giscus IDs,
contact form endpoint and author details are still unset. The site works without them;
comments and the contact form show a short notice instead.
