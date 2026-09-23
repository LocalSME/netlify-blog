# One-time setup

Everything on this page is done once. Sections degrade gracefully — missing pieces mean
a notice or a fallback, not a broken build.

Unlike the sibling Cloudflare blog, **the Netlify hosting side is not done yet** for
this project. The code is complete and builds clean locally, but nothing is live.

| Step | Status |
| --- | --- |
| GitHub repository created under `LocalSME` | ✅ done |
| Code pushed to `main` | ✅ done |
| Netlify Git integration connected | ❌ not done |
| Fine-grained PAT for the CMS | ❌ not created |
| Giscus comments | ❌ not configured |
| Contact form endpoint | ❌ not set |
| Author identity in `src/consts.ts` | ❌ still placeholder text |

---

## 0. GitHub repository ✅

Done. `LocalSME/netlify-blog` already existed on GitHub as a plain mirror of the
CreativeDigitalGrowth original, owned outright by the `LocalSME` account — unlike that
original's collaborator-based setup, there is no admin/collaborator split to manage
here. This working tree (a fresh clone of that mirror, rebranded into an independent
project with its own working directory — see [CLAUDE.md](../CLAUDE.md)) has been
committed and pushed to it directly:

```bash
cd "C:\Claude\localsme-netlify-blog"
git add -A
git commit -m "Rebrand from CreativeDigitalGrowth to LocalSME"
git push origin main
```

## 1. Netlify Git integration

Not done yet — this is a manual, one-time action taken directly in the Netlify
dashboard, and it needs step 0 above finished first (Netlify can only connect to a repo
that already exists on GitHub).

1. Sign in at <https://app.netlify.com> with the account that should own this site.
2. **Add new site → Import an existing project → Deploy with GitHub**, authorise
   Netlify's GitHub App if prompted, and pick `LocalSME/netlify-blog`.
3. Netlify reads build settings from the committed [`netlify.toml`](../netlify.toml)
   automatically — build command `npm run build`, publish directory `dist`, Node 22.
   Nothing needs to be typed into the dashboard's build-settings form; leave it on
   "read from netlify.toml" if it asks.
4. Deploy. Netlify assigns a random `<adjective-noun-nnnn>.netlify.app` subdomain by
   default. Change it to match the rest of this project: **Site configuration →
   General → Site details → Change site name → `localsme`**, which gives
   the live URL used throughout this repo's docs and code:
   <https://localsme.netlify.app>. If that name is already taken (Netlify
   site names are global), pick another and update `site` in
   [`astro.config.mjs`](../astro.config.mjs), `site_url`/`display_url` in
   [`public/admin/config.yml`](../public/admin/config.yml) and
   [`public/robots.txt`](../public/robots.txt) to match — three places, all listed here
   on purpose.

That connection installs a Netlify-owned GitHub App with read access to this repo, and
from then on Netlify watches `main` itself and rebuilds on every push — no GitHub
Actions workflow, no Netlify CLI, no repository secrets involved anywhere.

## 2. Access token for the CMS

The CMS signs in with a GitHub Personal Access Token. There is no OAuth backend, no
serverless function and no client secret anywhere in this repository.

Two kinds of token work, and which one you can use depends on **who owns the repo**.

### Fine-grained (tighter — use it if you can)

<https://github.com/settings/personal-access-tokens/new>

| Field | Value |
| --- | --- |
| Resource owner | `LocalSME` |
| Repository access | **Only select repositories → `netlify-blog`** |
| Repository permissions → **Contents** | **Read and write** |
| Repository permissions → Metadata | Read-only (added automatically) |
| Expiration | Set one. 90 days is a reasonable default |

Two defaults catch people out: *Repository access* starts on **Public repositories**,
which is read-only, and *Contents* starts on **No access** — read-only there passes the
login check but makes every save fail.

> **The catch.** A fine-grained token can only be scoped to repositories owned by its
> **resource owner**. Collaborator access does not count: if you are signed in as an
> account that merely *collaborates* on this repo, it will not appear in the list and no
> permission setting will help. Sign in as the owner, or use a classic token below.

### Classic (the fallback that always works)

<https://github.com/settings/tokens> → **Generate new token (classic)** → tick
**`public_repo`** only.

Because this repository is public, `public_repo` is enough — do not grant full `repo`.
This works from any account with push access, regardless of who owns the repo, which is
why it is the reliable option when the fine-grained route refuses.

The trade-off is real: `public_repo` grants write access to **every public repository
you can push to**, not just this one. A fine-grained token scoped to a single repo is
strictly tighter. Prefer fine-grained when the owner account is available to you.

**Pull requests access is not needed either way** — `publish_mode: simple` in
`public/admin/config.yml` commits straight to `main`.

Whichever you use, commits are authored by the account that issued the token.

Then open <https://localsme.netlify.app/admin/>, choose
**"Sign In Using Access Token"** and paste it.

> There is no "Sign In with GitHub" button on the login screen. It starts an OAuth flow
> that needs a server to hold a client secret, which a static site cannot have, so it
> hung on "Signing in…" forever. Sveltia offers no config option to disable it, so a
> small fail-open script in `public/admin/index.html` hides it. See
> [troubleshooting.md](troubleshooting.md#cms-sign-in-with-github-hangs-on-signing-in).

**Treat the token like a password.** It can read and write everything in this
repository. Do not paste it anywhere else, do not commit it, and revoke it from the
same settings page the moment you suspect it has leaked. See [SECURITY.md](../SECURITY.md).

## 3. Giscus comments

Comments are GitHub Discussions rendered by [Giscus](https://giscus.app). Until it is
configured, post pages show a one-line notice instead of the widget — nothing breaks.

1. **Settings → General → Features → ✅ Discussions**
2. Open the **Discussions** tab and make sure a category exists. The default expected by
   `src/consts.ts` is **Announcements**; any category works as long as the names match.
3. Install the app at <https://github.com/apps/giscus> and grant it access to
   `LocalSME/netlify-blog` **only**.
4. Go to <https://giscus.app>, enter `LocalSME/netlify-blog`, pick the
   category, and choose *Discussion title contains page pathname* for the mapping.
5. Copy the generated `data-repo-id` and `data-category-id` into `src/consts.ts`:

```ts
export const GISCUS = {
  repo: 'LocalSME/netlify-blog',
  repoId: 'R_kg...',        // ← paste
  category: 'Announcements',
  categoryId: 'DIC_kw...',  // ← paste
  // ...
} as const;
```

Because comments are public Discussions, consider whether
[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) says what you want it to say.

## 4. Contact form endpoint

Netlify has its own built-in form handling (add `data-netlify="true"` to a `<form>` and
it just works, no JavaScript or endpoint needed), but that isn't what's wired up here —
this project keeps the same third-party-endpoint approach as the sibling blogs, so all
four sites work identically regardless of host. `CONTACT_FORM_ENDPOINT` in
`src/consts.ts` is deliberately empty — no endpoint was invented for you.

Create a form at <https://formspree.io> (or any equivalent), then:

```ts
export const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
```

The form markup — including a honeypot field — is already written in
`src/pages/contact.astro` and appears automatically once the value is set. Until then
`/contact/` shows the mailto link instead.

If you would rather use Netlify's native form handling instead, that's a deliberate
swap to make later, not the current default — say so and it can be wired up.

## 5. Author identity

All in [`src/consts.ts`](../src/consts.ts). Nothing else hardcodes these:

```ts
export const SITE_TITLE = 'Field Notes';          // ← yours
export const SITE_DESCRIPTION = '...';            // ← yours
export const AUTHOR_NAME = 'Your Name';           // ← yours
export const AUTHOR_BIO = '...';                  // ← yours
export const AUTHOR_EMAIL = 'you@example.com';    // ← yours
export const SOCIAL_LINKS = [ ... ];              // ← yours
```

Also worth replacing: the About page prose in `src/pages/about.astro`, the sample post
in `src/content/blog/`, and `public/social-card.png` (the default Open Graph image,
1200×630).

## 6. Optional: licensing

No licence file is included, because the choice is yours to make and it is a legally
meaningful one. Without a licence, the content is "all rights reserved" by default.

Blogs commonly split the two: a permissive code licence (MIT) plus a content licence
(e.g. CC BY 4.0) for the posts. If you want that, say so and it can be added.

## 7. Optional: custom domain

A custom domain needs `site` in `astro.config.mjs`, `site_url`/`display_url` in
`public/admin/config.yml`, and the `Sitemap:` line in `public/robots.txt` all updated to
the new domain, plus adding the domain on the Netlify side: **Site configuration →
Domain management → Add a domain**. If the domain's nameservers point at Netlify DNS,
certificate provisioning is automatic; otherwise it walks through the records to add at
your registrar.

Because this is already a root-served project, no base path has to change. See
[architecture.md](architecture.md#base-paths).
