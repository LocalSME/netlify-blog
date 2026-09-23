# Deployment

**Live URL:** <https://localsme.netlify.app> — once the Netlify site is
created via the dashboard's Git integration connected to this repo (**not done yet** —
see [setup.md](setup.md#1-netlify-git-integration)).
**GitHub repo:** `LocalSME/netlify-blog` — public, pushed, what the CMS
commits to and what Netlify's Git integration watches.
**Netlify site:** connected directly to that repo from the Netlify dashboard (**Add new
site → Import an existing project**) — see
[setup.md](setup.md#1-netlify-git-integration) for how to make that connection.

## How it works

```
push to main (including a CMS save)
  └─ Netlify's dashboard-connected Git integration picks it up via webhook,
     through its own GitHub App installation
     └─ Netlify builds it server-side using netlify.toml: `npm run build`
        │  `postbuild` runs Pagefind over dist/ automatically — same npm lifecycle
        │  hook as before, it just runs on Netlify's build machine now
        └─ Netlify publishes the output directory (`dist`, set in netlify.toml)
```

Saving a post in the CMS **is** a push to `main`, so publishing and deploying are the
same action. There is no GitHub Actions workflow and no Netlify CLI anywhere in this
pipeline — Netlify authenticates to GitHub through its own GitHub App installation, not
a token stored in this repo, and there are no repository secrets involved at all.

### Why the npm `postbuild` hook matters

Netlify runs `npm run build` directly (per `netlify.toml`) rather than `astro build`, so
the `postbuild` script fires automatically: npm runs `pagefind --site dist` right after
Astro finishes, and the search index ends up inside `dist/` before Netlify publishes it.
No extra build step to configure, and no way to deploy a site whose search index is
stale.

## What's configurable, and where

Unlike the sibling Cloudflare blog, build settings for this project live in a committed
file rather than the dashboard only — that is Netlify's own convention, and it means
these values show up in `git diff` and code review:

**[`netlify.toml`](../netlify.toml)**, at the repo root:

| Setting | Value here |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 (matches `engines.node` in `package.json`) |
| Environment variables | none required by this project today |

The dashboard's own **Site configuration → Build & deploy → Build settings** normally
shows the same values, read from this file; a value entered directly in the dashboard
would override the file, so don't set one there unless you mean to diverge from what's
committed. The one-time setup was connecting the dashboard to this GitHub repo (**Add
new site → Import an existing project → GitHub**, not yet done; see
[setup.md](setup.md#1-netlify-git-integration)).

Anyone used to the sibling GitHub Pages blog's GitHub-Actions-based flow should look
here, not in a workflow file, for anything that would otherwise be a workflow-file
setting — that's the real "where do I configure X" gotcha moving between the two.

## Verifying a deployment

Check the Netlify dashboard: **the site → Deploys**, which shows the build log, status,
and a preview URL per deploy. There is no GitHub Actions run to check alongside it — a
build either succeeds or fails entirely on Netlify's side, and its log is the only place
to see why.

A smoke test against the live site is the check that actually matters — it tests what
visitors get rather than what the local build produced. Run this once the site is live:

```bash
B=https://localsme.netlify.app
for p in "" "blog/" "about/" "contact/" "search/" "admin/" "rss.xml" "sitemap-index.xml" "pagefind/pagefind-ui.js"; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L "$B/$p")  /$p"
done
```

All should return `200`. Then confirm nothing leaked:

```bash
# drafts must be absent — swap in the slug of an actual draft post once one exists
curl -s -o /dev/null -w '%{http_code}\n' -L "$B/blog/<draft-slug>/"   # expect 404

# no root-absolute internal references
curl -s -L "$B/" | grep -ohE 'https?://[^"]+' | grep -v 'localsme.netlify.app' | sort -u
```

## Rollback

A failed build never reaches the deploy step, so the previous version stays live — the
build is the safety net.

To undo a bad *successful* deploy, the fast path needs no rebuild: **Netlify dashboard →
the site → Deploys → pick an older deploy → "Publish deploy"**. Every deploy Netlify has
ever built stays available to republish instantly, with no rebuild required.

The from-source alternative is slower but keeps GitHub history and the live deployment
in sync — revert the commit and push; Netlify rebuilds automatically:

```bash
git revert <sha>
git push
```

There is no workflow run to re-run instead, the way there would be with GitHub Actions
— reverting and pushing is the only from-source path here.

## Local equivalents

```bash
npm run build     # what Netlify runs, including Pagefind
npm run preview   # serves dist/ — the only faithful local test of search and base paths
```

`npm run dev` does **not** exercise search (no index), the `/admin/` directory index, or
draft exclusion. Use `preview` before assuming a deploy will behave.

## Access

Two independent access paths, not one.

**GitHub.** Pushing requires write access to `LocalSME/netlify-blog`.
Changing repository settings — Discussions, collaborators, and which GitHub Apps are
installed — requires **admin**, held by `LocalSME`. The `LocalSME`
account has Write only — same pattern as the sibling GitHub Pages and Cloudflare Pages
repos.

```bash
gh api repos/LocalSME/netlify-blog --jq '.permissions'
```

**Netlify.** Separately, whoever has access to the Netlify team controls what's actually
deployed and how it's built — environment variables, custom domains, rollbacks, and also
whether Netlify's GitHub App can even see this repo in the first place. GitHub write
access alone cannot make a deploy happen if the Git integration were ever disconnected;
Netlify team access alone cannot change what code exists in the repo. Both matter,
independently.
