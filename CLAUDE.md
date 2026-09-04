# Working in this repository

A solo-author static blog: Astro 7 + TypeScript, deployed to **Netlify** by its
dashboard's own Git integration, served from the domain root. Independent from the
sibling GitHub Pages blog (`CreativeDigitalGrowth/CreativeDigitalGrowth.github.io`),
the sibling Cloudflare Pages blog (`CreativeDigitalGrowth/cloudflare-blog`) and the
sibling GitLab Pages blog (`creativedigitalgrowth.gitlab.io`) — not a mirror, no shared
content, no shared git history. The visual design is also deliberately different from
all three siblings — see the note at the top of `src/styles/global.css`. Full detail in
[`docs/architecture.md`](docs/architecture.md).

## Development

Start the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, `astro dev logs`.

```bash
npm run dev      # localhost:4321/ — drafts visible
npm run build    # production build + Pagefind index
npm run preview  # serves dist/ — the only faithful test of search and base paths
npm run check    # TypeScript + Astro diagnostics; keep this at 0 errors
```

**On this Windows machine**, Smart App Control blocks Astro's native compiler binary.
After every `npm install` or `npm ci`:

```bash
npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi
```

## Rules that are easy to get wrong

**Never write a root-absolute internal path.** It happens to work today — this is a
root-served site with `base: '/'` — but that is hosting, not design. Use the helpers in
`src/lib/url.ts` so the site can move again without a rewrite:

| Helper | For |
| --- | --- |
| `withBase(p)` | paths you author — `/about/` → `/about/` here, `/blog/about/` under a base |
| `absFromBuiltPath(p, site)` | paths Astro produced (`Astro.url.pathname`, `ImageMetadata.src`, `paginate()` URLs) — **already based** |
| `absUrl(p, site)` | absolute URL from a path you author |

Do not try to collapse these into one function that detects whether a path "already has
the base". That was tried on a sibling project and shipped two bugs: `/blog/my-post/`
is genuinely ambiguous because a `/blog/` route sits under a `/blog/` base.

**`paginate()` URLs already include the base.** Passing them through `withBase()`
doubles it the moment a base is configured. `Pagination.astro` takes them raw.

**Query posts through `getPosts()`** in `src/lib/posts.ts`, never `getCollection`
directly. That single call is where drafts are filtered out of production builds and
where date ordering happens.

**Frontmatter image paths are relative to the Markdown file** —
`../../assets/images/uploads/…` — because `image()` resolves them that way and the CMS
is configured to write exactly that. Both `media_folder` and `public_folder` in
`public/admin/config.yml` must stay in sync with wherever posts live.

**Site-wide settings live in `src/consts.ts` and nowhere else.** If you find yourself
hardcoding a title, an author name or a page size, put it there instead.

**The CMS schema and the Zod schema must match.** `public/admin/config.yml` field names
and `src/content.config.ts` are one contract; changing either alone breaks editing or
breaks the build.

**`public/admin/config.yml` is YAML.** Quote any string containing `: ` — an unquoted
colon-space silently breaks the whole CMS.

**`netlify.toml` is the one sibling difference worth remembering.** The Cloudflare blog
deliberately keeps build settings out of the repo, in its dashboard only. This repo does
the opposite on purpose — Netlify's own convention is a committed `netlify.toml`, so
build command, publish directory and Node version travel with the code. If a build
setting needs to change, change it here, not by hunting for a dashboard override.

## Before calling a change done

```bash
npm run check    # expect 0 errors
npm run build
grep -rhoE 'https?://[^"< ]+' dist --include=*.html | grep -v 'creativedigitalgrowth.netlify.app' | sort -u
```

The grep must print only genuinely external URLs (giscus, google maps, unpkg). If the
change is visible in a browser, verify with `npm run preview` rather than `npm run dev`
— search, `/admin/` and draft exclusion all behave differently between the two.

## Deployment

Push to `main` → Netlify's dashboard Git integration (**Site configuration → Build &
deploy**, connected to `CreativeDigitalGrowth/netlify-blog`) picks it up via its own
GitHub App installation and builds and deploys it itself, using the settings in
`netlify.toml` — `npm run build` (which triggers the `postbuild` Pagefind index), then
publishing `dist/`. Saving in the CMS is a push, so publishing and deploying are the
same action. There is no GitHub Actions workflow and no Netlify CLI involved anywhere in
this pipeline. See [`docs/deployment.md`](docs/deployment.md).

No repository secrets exist or are needed — build authorization is entirely between
Netlify and its own GitHub App installation, not a token stored in this repo.

Local git authenticates as `mohiseen-aumni`, the same account used for the sibling
GitHub Pages and Cloudflare Pages blogs. The repository exists on GitHub, is public, and
is live at `CreativeDigitalGrowth/netlify-blog`.

## Documentation

Full docs: https://docs.astro.build

- [Routing and dynamic routes](https://docs.astro.build/en/guides/routing/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Images](https://docs.astro.build/en/guides/images/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)

Netlify-specific: https://docs.netlify.com/site-deploys/create-deploys/ and
https://docs.netlify.com/configure-builds/file-based-configuration/
