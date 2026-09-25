# Jenish Kothari's personal site

Static site: Markdown in, HTML out. No client-side framework, no build-time CMS,
and no JavaScript shipped to the browser beyond a ~850 byte inline script for the
like button. Built with [Astro](https://astro.build), deployed on
[Cloudflare Pages](https://pages.cloudflare.com), live at
[jenishkothari.pages.dev](https://jenishkothari.pages.dev).

## Running it

```bash
npm run dev        # http://localhost:4321, hot reload, drafts visible
npm run build      # -> dist/
npm run preview    # serve dist/ as static files
```

> **`npm` on this machine is a shim.** It resolves to `~/.quarantine/bin/npm`
> from [package-quarantine](https://github.com/jenishk20/package-quarantine),
> which fails when the `quarantine` binary is not on `PATH`. If you see
> `exec: quarantine: not found`, call `/usr/local/bin/npm` directly.

`npm run dev` has no Cloudflare runtime, so `/api/counters/*` returns nothing and
the like button and view counts stay hidden. That is the designed fallback, not a
bug. To exercise them, see [Likes and view counts](#likes-and-view-counts).

## Writing a post

Drop a Markdown file in `src/content/writing/`. The filename becomes the URL:
`src/content/writing/my-post.md` is served at `/my-post/`.

```markdown
---
title: The title, as it appears in the <h1> and the <title>
description: One or two sentences. Used in meta tags, RSS, and index listings.
date: 2026-08-11
tag: interviews
draft: false
---

Body text here.
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `date` | yes | Any parseable date, e.g. `2026-08-11` |
| `description` | no | Strongly recommended. It is the search-result snippet |
| `tag` | no | One slug from `TAGS` in `src/consts.ts` |
| `draft` | no | `true` hides it from production and every index |
| `likes` | no | `false` hides the like button on that page |
| `updated` | no | Renders as "updated <date>" |

The schema is `src/content.config.ts`. An unknown `tag` does not fail the build,
it just renders grey, so check the slug against `TAGS`.

House style: **no em dashes anywhere.** Use a comma, a full stop, or a colon.

## Adding an interview

`/interviews/` derives every statistic from `src/data/interviews.ts`, so the
headline numbers can never disagree with the table below them. Add a row and the
counts, the offer rate, the "ended at" histogram and the by-source conversion all
update themselves. Never type a number into the prose on that page.

```ts
{
    company: 'Bloomberg',
    role: 'Software Engineer',
    type: 'full-time',          // or 'internship'; the two are tabled separately
    when: '2026-03',            // YYYY-MM, optional
    source: 'cold-apply',       // referral | cold-apply | recruiter | career-fair
    reached: 'phone',           // application | oa | phone | onsite | team-match | offer
    outcome: 'rejected',        // offer | rejected | withdrew | no-response
    ghosted: true,              // nobody ever closed the loop
    writeup: 'five-rounds-at-deepinfra',   // slug in src/content/writing/
    takeaway: 'One line. The part people actually read.',
}
```

Only `company`, `role`, `type`, `reached` and `outcome` are required. **Leave a
field off rather than guessing at it.** The stats skip unknowns and print how many
they skipped, and an undated row sorts last and reads "unrecorded". A guessed
month would silently become a fact on a page whose entire premise is that its
numbers are counted rather than claimed.

Full-time and internship loops are tabled apart on purpose: their conversion rates
are not comparable, and one blended number would hide the only interesting
comparison on the page. `writeup` links only if that post is published, so a draft
never leaves a 404.

## Layout

```
src/
  consts.ts              title, nav, socials, email, tag labels  <- edit this first
  content.config.ts      frontmatter schema
  content/writing/*.md   posts -> /<slug>/
  data/interviews.ts     the interview log; /interviews/ is computed from it
  layouts/
    Base.astro           <head>, nav, footer, JSON-LD, canonical
    Post.astro           article shell: title, meta line, view count, likes
  components/
    PostList.astro       the tagged index table
    Tag.astro            coloured category pill
    PostStats.astro      view counter + like button (one API request)
    ContestCharts.astro  Codeforces + LeetCode, side by side
    RatingChart.astro    the SVG line chart itself
  pages/
    index.astro          homepage
    start-here.astro     the curated hub table
    projects.astro       projects, models, datasets
    interviews.astro     the interview log
    about.astro          bio, experience, recognition
    writing/index.astro  post index
    tags/[tag].astro     per-tag index
    [...slug].astro      renders posts at the root
    robots.txt.ts        generated, so the Sitemap line tracks `site`
    rss.xml.js           feed
    404.astro
  lib/stats.ts           build-time HF / GitHub / Codeforces / LeetCode fetching
  utils/format.ts        date formatting, draft filtering
  styles/global.css      the entire design system (~770 lines, no framework)
functions/
  api/counters/[slug].js likes + views (Cloudflare Pages Function)
public/                  favicons, images
```

## The site URL lives in exactly one place

`site` in `astro.config.mjs`. Canonical tags, Open Graph, the sitemap, RSS,
`robots.txt` and the JSON-LD ids all derive from it. There is deliberately no
`SITE.url` in `consts.ts` and no static `public/robots.txt`, because both used to
exist and both drifted. Changing the domain is one edit.

## Deploying

Every push to `main` deploys. Other branches get a preview URL.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

### `.npmrc` is load-bearing

`legacy-peer-deps=false` is committed, and CI will not build without it. The
machine-level `~/.npmrc` sets `legacy-peer-deps=true`, which makes locally
generated lockfiles omit auto-installed peer dependencies. Cloudflare then runs
`npm ci` with the default (strict) setting, finds the lockfile out of sync with
`package.json`, and fails with `EUSAGE`. The committed file overrides the machine
one so both sides resolve identically.

If you ever need to check whether the lockfile is genuinely CI-clean, the machine
config will lie to you. Bypass it:

```bash
npm clean-install --progress=false --userconfig /dev/null
```

`npm ci --dry-run` is **not** a valid test here: it skips the lockfile sync check
that is the actual failure.

### Retrying a failed deploy rebuilds the old commit

Cloudflare's "Retry deployment" replays the same frozen SHA, so it can never pick
up a fix. Use **Create deployment**, or push a new commit.

### It is a Pages project, not a Worker

If the deploy command is `npx wrangler deploy`, it is a Worker and it will fail
against this `wrangler.toml`. Pages projects deploy from the build output
directory. `wrangler.toml` sets `pages_build_output_dir = "dist"` and declares the
KV binding, which is why the dashboard reports that bindings are managed by
configuration file.

## Likes and view counts

One endpoint, `functions/api/counters/[slug].js`, serves both. It needs a KV
namespace bound as `COUNTERS`. Without it the endpoint returns 503 and neither the
button nor the view count ever appears: the page degrades to plain static rather
than showing a broken control.

```bash
npx wrangler kv namespace create COUNTERS
```

The binding is declared in `wrangler.toml`, so it applies to Production and
Preview without touching the dashboard.

Test against a real local KV before deploying:

```bash
npm run build
npx wrangler pages dev dist --kv COUNTERS --port 8788
curl -X POST http://localhost:8788/api/counters/five-rounds-at-deepinfra \
  -H 'content-type: application/json' -d '{"type":"view"}'
```

A page load POSTs `{"type":"view"}` once. That records the view and returns both
counters in the same response, so the whole feature costs one request per visit.
The view number renders in the meta line under the title, hidden at zero and when
the API is unreachable.

Counts are stored as `likes:<slug>` and `views:<slug>`. Repeats are suppressed by
storing a truncated SHA-256 of the visitor's IP plus the slug, 90 days for likes
and 12 hours for views, so no IP addresses are retained.

**Known limitation:** KV has no atomic increment, so simultaneous likes or views
on the same post can drop a count. At this traffic level that is a rounding error.
If it ever matters, move the two keys to D1 and use `UPDATE ... SET n = n + 1`.

**There is no comment system, by decision.** Comments on interview and failure
writeups are a reputational liability on a site that doubles as a portfolio, and
moderating them is unpaid work. Likes and view counts carry the signal.

## Live metrics

`src/lib/stats.ts` fetches Hugging Face downloads, GitHub stars, and Codeforces
and LeetCode ratings **at build time**, so numbers are baked into static HTML: no
client JS, no API key, and visitors never hit a rate limit. Calls are memoised per
build and time out after 8 seconds.

Hugging Face returns two download numbers that differ by roughly an order of
magnitude, and they are shown as separate columns rather than merged:

| Field | Meaning |
|---|---|
| `downloads` | trailing 30 days: a moving window that decays after a spike |
| `downloadsAllTime` | cumulative, only goes up |

Quoting one while labelling it the other is the most common way a download count
ends up wrong.

If a call fails, the module falls back to a recorded measurement verified on
`MEASURED_AT`, and the page says that it did, so an offline build never silently
prints a zero. GitHub stars only render above `STAR_DISPLAY_THRESHOLD` (10),
because a repo showing "1 star" reads worse than one showing nothing.

To keep the numbers fresh, add a Cloudflare **Deploy hook** and call it on a
schedule. Each rebuild re-reads the APIs.

## Charts

`RatingChart.astro` emits inline SVG at build time. No hover layer, because there
is no client JavaScript to power one, so every number a reader might want is
printed on the chart or in the caption.

Two things there are easy to break:

- **`compact` narrows the viewBox, it does not scale the chart down.** An SVG
  scales its text with everything else, so rendering a 680px viewBox at half width
  would render 10px labels at 5px.
- **Label collisions are invisible in source.** The peak and current markers
  merge when they are equal, the right gutter is sized from the label text, and
  grid ticks within 11px of the reference line are dropped so Codeforces does not
  print 1500 on top of 1600. Changing the domain, the tick step or a threshold can
  reintroduce an overlap that only shows up in the rendered output. Measure with
  `getBBox()` rather than eyeballing it.

`--chart-line` is a fixed `#8a5cf5` in both themes. It is not `--accent`, whose
dark-mode step fails contrast validation against the dark surface.

## Design notes

The whole look is `src/styles/global.css`. The values that carry it:

- `--max-width: 720px`, wide enough for a data table, narrow enough to read
- 14px body at 1.6 line-height, so it reads like a document rather than a blog
- Headings at 600 weight with `-0.3px` tracking (`-0.5px` on `h1`)
- One accent colour, identical for `:visited`, so read links do not turn purple
- Dark mode via `prefers-color-scheme` and CSS variables only: no toggle, no flash
- Tables go responsive by stacking, driven by a `data-label` attribute on **every
  cell**. Keep them per-cell. A positional CSS version was briefly used for
  hand-editability and silently mislabelled the second table on the site as soon
  as one appeared with different columns.

Change `--accent` and `--max-width` first. Nearly everything else follows.

## Repository visibility

Keep this repository **private**. Two reasons:

1. `draft: true` posts and staged interview rows are fully readable in a public
   repo before they are published.
2. The history contains a link to an unannounced project, and a commit message
   explaining that it was being kept off the site. GitHub keeps unreachable
   commits fetchable by SHA after a force-push, so rewriting history does not
   remove them. If this should ever be public as a portfolio piece, publish a
   fresh repository with a squashed history instead.
