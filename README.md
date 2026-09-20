# jenishkothari.com

Static personal site. Markdown in, HTML out, no client-side framework. Built with
[Astro](https://astro.build), deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Running it

```bash
npm run dev
```

Then open http://localhost:4321. Hot reload is on; drafts are visible in dev and
excluded from production builds.

```bash
npm run build     # -> dist/
npm run preview   # serve dist/ locally
```

> **Note:** `npm` on this machine resolves to `~/.quarantine/bin/npm`, a shim from
> [package-quarantine](https://github.com/jenishk20/package-quarantine) that fails
> when the `quarantine` binary isn't on `PATH`. If `npm` errors with
> `exec: quarantine: not found`, use `/usr/local/bin/npm` directly.

## Writing a post

Drop a Markdown file in `src/content/writing/`. The filename becomes the URL, so
`src/content/writing/my-post.md` is served at `/my-post/`.

```markdown
---
title: The title, as it appears in the <h1> and the <title>
description: One or two sentences. Used in meta tags, RSS, and index listings.
date: 2026-08-11
tag: post-training
draft: false
---

Body text here.
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | Any parseable date, e.g. `2026-08-11` |
| `description` | no | Strongly recommended — it's your search result snippet |
| `tag` | no | One slug from `TAGS` in `src/consts.ts` |
| `draft` | no | `true` hides it from production and every index |
| `likes` | no | `false` hides the like button on that page |
| `updated` | no | Renders as "updated <date>" |

Short-form posts go in `src/content/notes/` with the same frontmatter, and are served
under `/notes/<slug>/`.

## Layout

```
src/
  consts.ts              site URL, nav, socials, tag labels  <- edit this first
  content.config.ts      frontmatter schema
  content/
    writing/*.md         essays        -> /<slug>/
    notes/*.md           short notes   -> /notes/<slug>/
  layouts/
    Base.astro           <head>, nav, footer, JSON-LD
    Post.astro           article shell: title, meta line, view count, likes
  components/
    PostList.astro       the tagged index table
    Tag.astro            coloured category pill
    PostStats.astro      view counter + like button (one API request)
  pages/
    index.astro          homepage
    start-here.astro     the curated hub table
    projects.astro       projects, models, datasets
    about.astro          bio, experience, recognition
    now.astro            what you're doing this month
    writing/index.astro  post index
    notes/index.astro    note index
    [...slug].astro      renders writing posts at the root
    tags/[tag].astro     per-tag index
    rss.xml.js           feed
  lib/stats.ts           build-time HF / GitHub metric fetching
  styles/global.css      the entire design system
functions/
  api/counters/[slug].js likes + views (Cloudflare Pages Function)
public/                  favicon, robots.txt, images
```

## Before the first deploy

1. Set your real domain in **two** places: `SITE.url` in `src/consts.ts` and `site`
   in `astro.config.mjs`. Also update the `Sitemap:` line in `public/robots.txt`.
2. Rewrite `src/pages/now.astro` — it has placeholder bullets.
3. Review `src/content/writing/reasoning-distillation-vs-sql-distillation.md`. It's
   marked `draft: true` and assembled from your README; put it in your own voice
   before setting `draft: false`.
4. Decide the AI policy in `public/robots.txt`. It currently allows search
   indexing and retrieval/citation (`search=yes, ai-input=yes`) but declines model
   training (`ai-train=no`). Flip the last one to `yes` if you'd rather opt in.

## Deploying to Cloudflare Pages

Push this directory to a GitHub repo, then in the Cloudflare dashboard:
**Workers & Pages → Create → Pages → Connect to Git**.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `personal-site` (if the repo root is one level up) |

Every push to `main` deploys; every other branch gets a preview URL.

### Wiring up likes and view counts

The counter needs a KV namespace bound as `COUNTERS`. Without it the endpoint returns
503 and the button simply never appears — the site is not broken, the feature is just
off.

```bash
npx wrangler kv namespace create COUNTERS
```

Then in the Pages project: **Settings → Bindings → Add → KV namespace**, variable
name `COUNTERS`, pointing at the namespace you just created. Add it for both Production
and Preview.

Test it locally against a real (local) KV before deploying:

```bash
npm run build
npx wrangler pages dev dist --kv COUNTERS --port 8788
curl -X POST http://localhost:8788/api/counters/how-this-site-is-built \
  -H 'content-type: application/json' -d '{"type":"view"}'
```

Counts are stored as `likes:<slug>` and `views:<slug>`. Repeats are suppressed by
storing a truncated SHA-256 of the visitor's IP plus the slug — 90 days for likes,
12 hours for views — so no IP addresses are retained.

A page load POSTs `{"type":"view"}` once, which records the view and returns both
counters in the same response, so the whole feature costs one request per visit.
The view number renders in the meta line under the title; it stays hidden at zero
and when the API is unreachable.

**Known limitation:** KV has no atomic increment, so simultaneous likes or views on
the same post can drop a count. See `src/content/notes/kv-has-no-atomic-increment.md` for the
D1 migration if that ever matters.

## Download and star counts

`src/lib/stats.ts` fetches Hugging Face downloads and GitHub stars **at build time**,
so the numbers are baked into static HTML — no client JS, no API key, and visitors
never hit a rate limit. `src/pages/projects.astro` uses it.

Hugging Face returns two download numbers that differ by roughly an order of
magnitude, and they are shown as separate columns rather than merged:

| Field | Meaning |
|---|---|
| `downloads` | trailing 30 days — a moving window that decays after a spike |
| `downloadsAllTime` | cumulative — only goes up |

Quoting one while labelling it the other is the most common way a download count ends
up wrong. If an API call fails, the module falls back to a recorded measurement
(`HF_FALLBACK`, verified on the date in `MEASURED_AT`) and the page notes that it did,
so an offline build never silently prints a zero.

GitHub stars only render above `STAR_DISPLAY_THRESHOLD` (default 10) — a repo showing
"1 star" reads worse than one showing nothing. Set it to 0 to always show.

To keep the numbers fresh, add a Cloudflare **Deploy hook** and call it on a schedule;
each rebuild re-reads the APIs.

## Adding comments later

The site has no comment system. When you want one,
[Giscus](https://giscus.app) backs comments with GitHub Discussions on this repo —
no database, no moderation infrastructure, and the GitHub login requirement keeps
spam out. Add a `comments: true` field to the schema in `src/content.config.ts` and
render the Giscus script conditionally in `Post.astro`.

## Design notes

The whole look is `src/styles/global.css`, about 400 lines with no CSS framework.
The values that carry it:

- `--max-width: 720px` — wide enough for a data table, narrow enough to read
- 14px body at 1.6 line-height — reads like a document, not a blog
- Headings at 600 weight with `-0.3px` tracking (`-0.5px` on `h1`)
- One accent colour, identical for `:visited`, so read links don't turn purple
- Dark mode via `prefers-color-scheme` and CSS variables only — no toggle, no flash
- Category colours are CSS variables; adding a tag means one variable, one
  `.tag-<slug>` rule, and one line in `TAGS`

Change `--accent` and `--max-width` first. Nearly everything else follows from them.
