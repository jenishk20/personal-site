---
title: How this site is built
description: A static site with no client-side framework, one 400-line stylesheet, and a like button running on 60 lines of edge function. Notes on the setup, in case it's useful.
date: 2026-08-11
tag: systems
---

This site is deliberately boring. Markdown files go in, static HTML comes out, and
the only JavaScript that reaches your browser is the like button at the bottom of
this page.

## The stack

[Astro](https://astro.build) builds the pages. It's a static site generator — I
write `.md` files with a bit of frontmatter, run `npm run build`, and get a folder
of plain HTML. No React, no hydration, no client-side router. Astro ships zero
JavaScript by default, which is the entire reason I picked it.

Hosting is [Cloudflare Pages](https://pages.cloudflare.com), which builds from a
Git push and serves the output from the edge for free.

```bash
npm run dev     # localhost:4321, hot reload
npm run build   # -> dist/
```

## Why not a framework with a client runtime

The page you're reading is a few kilobytes of HTML and one stylesheet. There is
nothing on it that needs a virtual DOM. A framework that ships 40 KB of runtime to
render static prose is paying a real cost — parse time, execution time, a hydration
pass — for capability this page never uses.

That isn't an argument against those frameworks generally. It's an argument that a
writing site is the wrong place to spend the budget.

## The design

One stylesheet, no CSS framework, no build step for the CSS beyond what Astro does
automatically. The choices that matter:

| Decision | Value | Why |
|---|---|---|
| Measure | 720px | Long enough for a table, short enough to read |
| Body text | 14px / 1.6 | Reads like a document rather than a blog |
| Headings | 600 weight, -0.3px tracking | Negative tracking is most of the "designed" feeling |
| Links | One accent, same when visited | Avoids the half-read purple mess |
| Dark mode | `prefers-color-scheme` | CSS variables only, no toggle, no flash |

Everything is a CSS custom property, so changing the accent colour is a one-line
edit.

## The like button

Static sites are supposed to be the ones that can't have state, but this is a solved
problem now. Cloudflare Pages lets you drop a file in `functions/` and it becomes an
endpoint on the same domain:

```
GET  /api/like/<slug>   ->  { count }
POST /api/like/<slug>   ->  { count }
```

Counts live in Workers KV, keyed by post slug. Repeat likes are filtered by a hash of
the visitor's IP plus the slug, so I never store an address. The client half is about
40 lines: fetch the count, render it, POST on click.

It degrades properly. If the KV binding is missing the endpoint returns 503 and the
button never appears, rather than rendering a control that fails when you press it.

One honest caveat: KV has no atomic increment, so two people liking the same post in
the same instant can cost one count. Moving to D1 and a single `UPDATE ... SET count
= count + 1` fixes it. At my traffic, it hasn't been worth the migration.

## What I skipped

No comments, for now — a comment section that sits at zero looks worse than not
having one. No analytics. No cookie banner, because there's nothing to consent to.
No newsletter popup.

There is [an RSS feed](/rss.xml), a sitemap, and `Person` structured data, all of
which are close to free and make the site legible to search engines and to the
models that will read it.
