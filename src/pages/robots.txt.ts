import type { APIRoute } from 'astro';

/**
 * Generated rather than a static file in public/, so the Sitemap line always
 * matches `site` in astro.config.mjs instead of drifting when the domain
 * changes.
 *
 * Content-Signal opts in to being indexed and cited (search + retrieval) but
 * declines model training. Change `ai-train` to `yes` to opt in — that's a
 * deliberate choice, so the conservative default is set here.
 */
export const GET: APIRoute = ({ site }) => {
    const sitemap = new URL('sitemap-index.xml', site).href;

    const body = `User-agent: *
Allow: /

Content-Signal: search=yes, ai-input=yes, ai-train=no

Sitemap: ${sitemap}
`;

    return new Response(body, {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
};
