/**
 * Likes and views — Cloudflare Pages Function.
 *
 *   GET  /api/counters/<slug>            -> { likes, views }   (no mutation)
 *   POST /api/counters/<slug>            -> { likes, views }
 *        body: {"type":"view"}  or  {"type":"like"}
 *
 * Both counters live behind one route so a page load costs a single request:
 * the client POSTs type=view on load and gets the like count back in the same
 * response.
 *
 * Requires a KV namespace bound as COUNTERS. Without it every call returns 503,
 * the like button never renders, and the view count stays hidden — the page is
 * not broken, the feature is just off.
 *
 * Note on atomicity: KV has no atomic increment, so two writers in the same few
 * milliseconds can cost one count. Acceptable for a personal site; if it ever
 * matters, move to D1 and use `UPDATE ... SET n = n + 1`, which is atomic.
 */

const VIEW_TTL_SECONDS = 60 * 60 * 12; // one unique view per visitor per 12h
const LIKE_TTL_SECONDS = 60 * 60 * 24 * 90; // remember a liker for 90 days
const MAX_SLUG_LENGTH = 128;

const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });

/** Slugs come from the URL and become KV keys, so constrain them hard. */
const isValidSlug = (slug) =>
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    /^[a-z0-9._~-]+$/i.test(slug);

async function fingerprint(prefix, ip, slug) {
    const data = new TextEncoder().encode(`${prefix}:${ip}:${slug}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return (
        prefix +
        ':' +
        [...new Uint8Array(digest)]
            .slice(0, 16)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );
}

async function readCount(kv, key) {
    const raw = await kv.get(key);
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function readBoth(kv, slug) {
    const [likes, views] = await Promise.all([
        readCount(kv, `likes:${slug}`),
        readCount(kv, `views:${slug}`),
    ]);
    return { likes, views };
}

export async function onRequestGet({ env, params }) {
    if (!env.COUNTERS) return json({ error: 'not_configured' }, 503);
    if (!isValidSlug(params.slug)) return json({ error: 'bad_slug' }, 400);
    return json(await readBoth(env.COUNTERS, params.slug));
}

export async function onRequestPost({ env, params, request }) {
    if (!env.COUNTERS) return json({ error: 'not_configured' }, 503);

    const slug = params.slug;
    if (!isValidSlug(slug)) return json({ error: 'bad_slug' }, 400);

    let type = 'view';
    try {
        const body = await request.json();
        if (body && typeof body.type === 'string') type = body.type;
    } catch {
        // No body — default to a view.
    }

    if (type !== 'view' && type !== 'like') {
        return json({ error: 'bad_type' }, 400);
    }

    const kv = env.COUNTERS;
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const isLike = type === 'like';
    const key = isLike ? `likes:${slug}` : `views:${slug}`;
    const fpKey = await fingerprint(isLike ? 'l' : 'v', ip, slug);

    // Already counted this visitor for this counter — return current totals.
    if (await kv.get(fpKey)) {
        return json({ ...(await readBoth(kv, slug)), counted: false });
    }

    const next = (await readCount(kv, key)) + 1;
    await Promise.all([
        kv.put(key, String(next)),
        kv.put(fpKey, '1', {
            expirationTtl: isLike ? LIKE_TTL_SECONDS : VIEW_TTL_SECONDS,
        }),
    ]);

    return json({ ...(await readBoth(kv, slug)), counted: true });
}

/** Anything other than GET/POST. */
export async function onRequest({ request, next }) {
    if (request.method === 'GET' || request.method === 'POST') return next();
    return json({ error: 'method_not_allowed' }, 405);
}
