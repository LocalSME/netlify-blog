# Troubleshooting

Most entries here are a failure that actually happened while building or deploying a
sibling of this site, with the fix that worked, adapted to Netlify's pipeline. The two
Netlify-pipeline entries are written for the current deploy mechanism (Netlify's
dashboard Git integration) rather than a specific incident on this exact repo, since it
has not deployed yet — they describe where to look based on how it's documented to work.

---

## `npm run dev` / `npm run build`: "An Application Control policy has blocked this file"

```
Cannot find native binding.
  Caused by: An Application Control policy has blocked this file.
  \\?\...\node_modules\@astrojs\compiler-binding-win32-x64-msvc\astro.win32-x64-msvc.node
```

**Cause.** Windows **Smart App Control** is on, and it refuses to load Astro 7's
unsigned native compiler binary. Nothing to do with this project — it affects any
package with a native `.node` addon.

**Fix.** Install Astro's own WASI fallback. Astro loads it automatically when the native
binding fails:

```bash
npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi
```

- `--force` is required because npm refuses a `wasm32` package on an `x64` machine.
- `--no-save` keeps a machine-specific workaround out of `package.json`.

**It must be re-run after every `npm install` or `npm ci`**, because npm prunes packages
that are not in `package.json`. If a build suddenly starts failing again right after
adding a dependency, this is why.

Builds are slower under WASI but produce identical output. Netlify's build runners are
Linux with the native binding and are unaffected.

The alternative — turning Smart App Control off — is a one-way system-wide security
change and is your call, not something to do casually.

---

## CMS shows "The configuration file could not be parsed"

**Cause.** `public/admin/config.yml` is not valid YAML. The overwhelmingly common
culprit is an unquoted `: ` (colon followed by a space) inside a `hint` or `description`
string, which YAML reads as a nested mapping:

```yaml
hint: One category per post. Existing ones: Notes, Workflow    # ✗ breaks
hint: "One category per post. Existing ones: Notes, Workflow"  # ✓ fine
```

**Fix.** Quote the value. To find the problem before loading the CMS:

```bash
npx js-yaml public/admin/config.yml > /dev/null && echo VALID
```

The browser console gives the exact line and column, which is faster than reading the
file.

---

## `/admin/` returns the 404 page on the dev server

**Cause.** Astro's dev server does not serve directory indexes for files in `public/`.

**Fix.** Use the explicit filename in development:

```
http://localhost:4321/admin/index.html
```

The built site serves `/admin/` correctly — confirmed with `npm run preview`, which
serves `dist/` exactly as it will be deployed. Not a bug, just a dev-server difference
worth knowing before you go looking for one.

---

## Search does nothing / shows the "index not available" note

**Cause.** The Pagefind index is generated from `dist/` by the `postbuild` step. Under
`npm run dev` there is no `dist/`, so there is nothing to search.

**Fix.** Test search against a build:

```bash
npm run build && npm run preview
```

If it also fails on the built site, check that `dist/pagefind/` exists and that the
build log shows `Indexed N pages`. `Indexed 0 pages` means the `data-pagefind-body`
attribute went missing from `src/pages/blog/[slug].astro`.

---

## Search results 404 when clicked

**Cause.** Pagefind indexes `dist/`, which *is* the deploy root, so its stored URLs
start at `/` with no base path.

**Fix.** `src/pages/search.astro` already handles this with a `processResult` hook that
re-adds the base, plus `bundlePath`. If you change `base` in `astro.config.mjs`, nothing
needs editing — both values are derived from `withBase()`. If you hand-roll a different
search UI, you must reimplement the prefix.

---

## Links or images 404 on the live site but work locally

**Cause.** A root-absolute path (`/about/`, `/images/x.png`) was written somewhere
instead of going through the base-path helpers.

This site is currently served from the domain root, so such a path happens to work —
which hides the mistake until the site moves under a base path again, at which point
every one of them breaks at once.

**Fix.** Use `withBase()` — see [architecture.md](architecture.md#base-paths). To find
every offender:

```bash
npm run build
grep -rnE '(href|src)="/[a-z]' src/ --include=*.astro
```

Every hit should be inside `src/lib/url.ts` or a deliberate in-page anchor.

---

## Pagination links contain the base path twice (e.g. `/blog/blog/2/`)

**Cause.** `paginate()` returns URLs that **already include the base**. Wrapping them in
`withBase()` doubles it.

**Fix.** Pass `page.url.prev` / `page.url.next` straight through, as
`Pagination.astro` does. The rule: anything Astro produced (`Astro.url.pathname`,
`ImageMetadata.src`, `paginate()` URLs) is already based — use `absFromBuiltPath()` if
you need it absolute, never `withBase()`.

---

## Netlify doesn't pick up a push

A commit lands on `main` (including a CMS save) but the live site does not change after
a few minutes.

**Cause.** Almost always one of three things: the dashboard's Git integration has been
disconnected or reconfigured, the GitHub App installation Netlify uses to read this repo
has lost access, or the build actually ran and failed — which looks identical to
"nothing happened" if you only check the live site.

**Fix.** Check the Netlify dashboard first — **the site → Deploys** — for a build that
ran and failed, with the actual error in its log. If no new deploy shows up at all for
the commit:

- Confirm the site is still connected: **Site configuration → Build & deploy → Git
  repository** should still show `CreativeDigitalGrowth/netlify-blog`.
- Check the GitHub App installation itself — <https://github.com/settings/installations>
  (or the organization equivalent under `CreativeDigitalGrowth`) — and confirm Netlify
  is still installed with access to this repository.
- Confirm the push actually reached GitHub: `git log --oneline origin/main` should show
  the commit.

There is no Actions run or workflow log to check instead — the Netlify dashboard's
deploy log is the only record of what happened.

---

## Netlify build fails

**Cause.** Same range of causes as any failed `npm run build` — a schema error, a broken
dependency, a Node version mismatch — but surfaced in the Netlify dashboard rather than
a local terminal.

**Fix.** **The site → Deploys → the failed deploy** shows the full build log. Reproduce
locally to iterate faster:

```bash
npm ci
npm run build
```

If it fails locally too, the log tells you exactly what to fix — see the schema and
image-related entries below for the common cases. If it succeeds locally but fails on
Netlify, compare `netlify.toml` (build command, publish directory, Node version) against
what actually runs locally, and check whether a dashboard-level environment variable is
overriding it — see [setup.md](setup.md#1-netlify-git-integration).

---

## CMS: "Sign In with GitHub" hangs on "Signing in…"

**This button cannot work on this site, and that is by design.** Use **"Sign In Using
Access Token"** instead.

**Cause.** The GitHub button starts an *OAuth* flow, which needs a server to hold the
OAuth client secret — a secret cannot live in a static site. When `base_url` is absent
from `public/admin/config.yml`, Sveltia falls back to Netlify's hosted OAuth provider,
which this site is not registered with. The popup never returns a token, so the screen
sits on "Signing in…" forever rather than showing an error.

Sveltia offers no configuration option to hide it, so `public/admin/index.html` carries
a small script that removes it from the login screen. That script is deliberately
**fail-open**: unless it finds exactly one OAuth button and exactly one token button, it
does nothing. The worst case after a Sveltia update is the button reappearing, never the
wrong one vanishing.

Delete that script if an OAuth backend is ever configured.

**Fix.** Click **"Sign In Using Access Token"** and paste a fine-grained PAT — see
[setup.md](setup.md#2-access-token-for-the-cms). This is the intended route.

**If you would rather have the GitHub button work**, it needs an OAuth backend:

1. A GitHub OAuth App (client ID + client secret).
2. The [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) worker deployed
   somewhere to hold the secret (a Cloudflare Worker or a Netlify Function both work —
   it's a small stateless proxy, not tied to either host).
3. `base_url: https://<wherever-you-deployed-it>` added to the `backend` block in
   `public/admin/config.yml`.

That is a deliberate trade: it adds a hosted service and a long-lived secret to
maintain, which this project was set up specifically to avoid. The token route needs
neither.

---

## CMS "View on Live Site" link 404s

The link points at `https://creativedigitalgrowth.netlify.app/<slug>/` — one `blog/`
short of the real URL, `https://creativedigitalgrowth.netlify.app/blog/<slug>/`.

**Cause.** Sveltia keeps only the **origin** of `site_url` when building preview links.
From the bundle:

```js
_baseURL = new URL(_siteURL).origin              // the "/blog" path is discarded
…
return `${baseURL.replace(/\/$/, '')}/${previewPath.replace(/^\//, '')}`
```

So the link is `origin + "/" + preview_path`. The base path in `site_url` never reaches
it, and adding a trailing slash to `site_url` changes nothing — `.origin` drops the path
either way.

**Fix.** `preview_path` must spell out the whole path **from the origin**:

```yaml
preview_path: blog/{{slug}}/
```

On a GitHub Pages *project* site the base has to be repeated — `blog/blog/{{slug}}/` —
because the origin excludes it. This is a root-served Netlify site, so the origin is the
site root and the route alone is correct.

`site_url` and `display_url` still carry the full URL: only `site_url`'s origin is used
for preview links, but `display_url` is used verbatim for the "visit site" link.

If the site ever moves under a base path again, that base must be prepended here —
`preview_path` is origin-relative and Astro's `base` does not reach it.

---

## Local looks different from the live site

Work through these in order.

**1. Is git actually behind?** Saving in the CMS commits to GitHub, not to your working
copy — those posts only reach you when you pull.

```bash
git fetch origin main
git status -sb                      # "behind N" means pull
git log --oneline HEAD..origin/main # what you are missing
git pull --ff-only origin main
```

**2. `npm run dev` shows one *more* post than live.** That is drafts. Dev includes them,
production excludes them.

**3. A stale dev server.** A long-running `astro dev` that was started before a `git
pull` can end up in a bad state — reporting the right post count while rendering the
wrong number of cards. Stop it, clear the cache, restart:

```bash
rm -rf .astro
npm run dev
```

**4. `npm run preview` shows old content.** It serves `dist/`, which is only as fresh as
your last `npm run build`. Rebuild first.

**5. A remote image host is unreachable from your machine.** See the next entry.

To settle it definitively, compare a clean build against the live sitemap:

```bash
rm -rf dist .astro && npm run build
find dist -name index.html | sed 's#^dist##; s#/index.html#/#' | sort > /tmp/local.txt
curl -s https://creativedigitalgrowth.netlify.app/sitemap-0.xml   | grep -oE '<loc>[^<]*</loc>' | sed -E 's#</?loc>##g; s#https://creativedigitalgrowth.netlify.app##'   | sort > /tmp/live.txt
diff /tmp/local.txt /tmp/live.txt
```

Only `/admin/` and `/search/` should appear as local-only — both exist live but are
deliberately kept out of the sitemap.

---

## Build is slow, or warns "Could not fetch … at build time"

```
[image] Could not fetch https://picsum.photos/id/727/1920/1280.webp at build time —
embedding it unoptimised, loaded from its original host.
```

**Cause.** A post uses a remote `featured_image`. Astro has to fetch it at build time to
read its dimensions, and your network cannot reach that host. Check directly:

```bash
curl -s -o /dev/null -w '%{http_code}
' --max-time 20 https://picsum.photos/id/727/1920/1280.webp
```

A `522` or a timeout confirms it. This is environment-specific — Netlify's build
environment may reach a host your machine cannot, which is exactly why a local build can
differ from a successful deploy.

**This is a warning, not an error.** `src/lib/remote-image.ts` catches the failure and
falls back to loading the image from its original host, unoptimised. The build still
completes and every page is still produced. Failures are cached per URL, so one dead
host costs one timeout for the whole build rather than one per page.

If a host is permanently unreachable, upload the image through the CMS instead — an
upload has no build-time network dependency at all.

---

## CMS: "You don't have access to the … repository"

Shown after pasting a token on the login screen, even though the repository exists and
the config names it correctly.

**Cause.** Sveltia verifies access with a single call:

```js
const { permissions } = await GET(`/repos/${owner}/${repo}`);
if (!permissions?.pull) throw repository_no_access;
```

(`owner`/`repo` here resolve to `CreativeDigitalGrowth`/`netlify-blog`, the values in
`public/admin/config.yml`'s `backend.repo`.)

For a **public** repo GitHub returns the repository either way, but it only includes a
`permissions` object when the request is authenticated *and the token actually covers
that repo*. Without it there is no `.pull`, and you get this message. So the error means
"this token cannot reach this repo", not "this repo does not exist".

**The usual reason: a fine-grained token issued by the wrong account.** Fine-grained
tokens can only be scoped to repositories owned by their **resource owner** —
collaborator access does not count. A token issued by an account that merely
collaborates here can never reach this repo, whatever permissions it is given.

**Fix.** Either issue the fine-grained token as the repository *owner*, or use a classic
token with the `public_repo` scope, which works from any account with push access. See
[setup.md](setup.md#2-access-token-for-the-cms) for both, and the trade-off between them.

**Check a token without guessing** (`-rsp` keeps it out of shell history):

```bash
read -rsp "Paste token (hidden): " T; echo
curl -s -H "Authorization: Bearer $T"   https://api.github.com/repos/CreativeDigitalGrowth/netlify-blog   | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.message?'FAIL: '+j.message:'permissions: '+JSON.stringify(j.permissions))})"
unset T
```

`permissions: {"pull":true,"push":true,…}` means the token is good. `null` or
`FAIL: Not Found` means it cannot see the repo.

Other things to check if the token *is* correctly scoped: **Contents** must be **Read
and write** (read-only passes login but fails every save), and *Repository access*
must not be left on its **Public repositories** default, which is read-only.

---

## A new post does not appear on the site

Two causes, in order of likelihood.

**1. It is still a draft.** New posts created in the CMS default to **Draft**, on
purpose, so a half-written post cannot publish itself. Drafts build fine and are then
excluded from the output — so the deploy goes *green* and the post still does not
appear, which is the confusing part.

Check the committed file:

```bash
gh api repos/CreativeDigitalGrowth/netlify-blog/contents/src/content/blog/<slug>.md --jq '.content' | base64 -d | head
```

If it says `draft: true`, untick **Draft** in the CMS and save again.

**2. The build failed, so nothing deployed.** A failed build leaves the previous
version live — which looks identical to "my post did not appear".

Check **the site → Deploys** in the Netlify dashboard. A failed deploy there is the
answer, and its log shows why — see the next entry for the most common cause.

---

## Build fails: `MissingImageDimension` on a remote image

```
MissingImageDimension: Missing width and height attributes for https://example.com/x.webp.
When using remote images, both dimensions are required in order to avoid CLS.
Caught error rendering /blog/<slug>/
```

**Cause.** A `featured_image` pointing at a URL rather than an upload. Astro cannot know
a remote image's dimensions without fetching it, and rendering without them would cause
layout shift — so it refuses.

**Fix.** `src/components/FeaturedImage.astro` passes `inferSize` for remote sources so
Astro fetches them at build time, and `image.remotePatterns` in `astro.config.mjs`
authorises optimising them. Remote URLs work everywhere a local upload does.

If it recurs, it means a `<Image>` is being used directly on a `featured_image` value
somewhere instead of going through `FeaturedImage.astro`. Route it through the
component rather than adding `inferSize` at the call site.

---

## `git push` rejected, or "Everything up-to-date" when you expected a push

Check what you actually have:

```bash
gh api repos/CreativeDigitalGrowth/netlify-blog --jq '.permissions'
git status -sb
git log --oneline origin/main..HEAD
```

`"push": false` means read-only access — the local git credentials are `mohiseen-aumni`
while the repository is owned by `CreativeDigitalGrowth`. Either be granted Write, or authenticate
as the owner:

```bash
gh auth login
gh auth switch --user CreativeDigitalGrowth
```

Before any push into a repository that already has commits, confirm it is a
fast-forward so nothing is destroyed:

```bash
git fetch origin main
git merge-base --is-ancestor origin/main HEAD && echo "clean fast-forward"
```

If that fails, **do not use `--force`.** Rebase onto the remote history instead.

---

## Build fails on a post you just wrote

That is the schema doing its job. `content.config.ts` validates every post at build time
and the error names the file and the field. Common causes:

- `featured_image` path wrong — it is relative **to the Markdown file**, so
  `../../assets/images/uploads/…`, not `/assets/…`.
- `date` not parseable as a date.
- `tags` written as a string instead of a list.
- A required field missing entirely.

A failed build deploys nothing, so the live site keeps the previous version.

---

## Type errors after upgrading Astro

```bash
npm run check
```

If `z` is reported as deprecated, import it from `astro/zod` rather than `astro:content`
— that changed in Astro 7 and is already applied in `content.config.ts`.
