---
title: Workers KV has no atomic increment
description: A counter on KV is read-then-write, so concurrent writers silently drop counts. D1 fixes it with one statement.
date: 2026-08-11
tag: systems
---

Building the like button on this site, the obvious storage is Workers KV: one key per
post, value is a number. The problem is that incrementing it looks like this:

```js
const n = Number(await kv.get(key)) ?? 0;
await kv.put(key, String(n + 1));
```

Two requests that read before either writes both see `n`, both write `n + 1`, and one
like disappears. KV has no compare-and-swap and no increment primitive, so there is no
way to close the window at the KV layer.

The fix, when it matters, is D1:

```sql
INSERT INTO likes (slug, count) VALUES (?, 1)
ON CONFLICT (slug) DO UPDATE SET count = count + 1;
```

That's a single atomic statement, and it also gets you `ORDER BY count DESC` for free
if you ever want a most-liked list.

I stayed on KV anyway. The race needs two likes within the same few milliseconds on
the *same post*, and the cost of losing one is that a number on a personal blog is off
by one. That's an acceptable trade for zero schema and zero migration — but it's worth
knowing you made it, rather than discovering it later.
