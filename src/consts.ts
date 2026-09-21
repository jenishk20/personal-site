/**
 * Everything you'll want to edit in one place.
 *
 * The site URL deliberately does NOT live here — it's `site` in
 * astro.config.mjs, and everything else derives from it. One edit, one place.
 */

export const SITE = {
    title: 'Jenish Kothari',
    tagline:
        'I post-train small open models to do work that usually needs frontier models, in production and in the open.',
    description:
        'Jenish Kothari is a software engineer at Adobe working on post-training: SFT, reasoning distillation, DPO and GRPO. Writing about small local models, execution-verified evals, and agentic systems.',
    author: 'Jenish Kothari',
    email: 'kotharijenish2001@gmail.com',
    locale: 'en',
} as const;

export const NAV = [
    { href: '/', label: 'Home' },
    { href: '/writing/', label: 'Writing' },
    { href: '/projects/', label: 'Projects' },
    { href: '/about/', label: 'About' },
] as const;

export const SOCIALS = {
    github: 'https://github.com/jenishk20',
    huggingface: 'https://huggingface.co/jk200201',
    x: 'https://x.com/JenishKothari11',
    linkedin: 'https://www.linkedin.com/in/jenishkothari/',
    kaggle: 'https://www.kaggle.com/jenishkothari',
} as const;

/**
 * Tag slug -> display label. The slug must match a `.tag-<slug>` class in
 * global.css, otherwise the tag renders grey via `.tag-default`.
 */
export const TAGS: Record<string, string> = {
    'post-training': 'Post-training',
    evals: 'Evals',
    local: 'Local',
    systems: 'Systems',
    research: 'Research',
    agents: 'Agents',
    career: 'Career',
    interviews: 'Interviews',
    failures: 'Failures',
};
