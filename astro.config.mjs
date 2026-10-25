import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
    // THE single source of truth for the site URL. Canonical tags, Open Graph,
    // the sitemap, RSS, robots.txt and the JSON-LD ids are all derived from it,
    // so changing it here is the only edit needed when the domain changes.
    site: 'https://jenishkothari.pages.dev',

    integrations: [sitemap(), mdx()],

    // Post URLs live at the root (/my-post/) rather than under /blog/,
    // and every route gets a trailing slash so links stay stable.
    trailingSlash: 'always',

    build: {
        format: 'directory',
    },

    markdown: {
        // $inline$ and $$display$$ maths, typeset to HTML at build time. No maths
        // library ships to the browser; only KaTeX's stylesheet and the fonts the
        // page actually uses. MDX inherits this config.
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
        shikiConfig: {
            // Dual themes: Astro emits both, and a media query in global.css
            // switches to the dark values.
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
            wrap: false,
        },
    },

    devToolbar: {
        enabled: false,
    },
});
