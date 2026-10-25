import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Shared frontmatter for anything that reads like a post.
 *
 *   title       required
 *   date        required, any parseable date string ("2026-08-11")
 *   description one or two sentences; used in <meta>, RSS, and index pages
 *   tag         one of the slugs in TAGS (src/consts.ts)
 *   draft       true keeps it off every index and out of the build
 *   likes       false hides the like button on that page
 *   updated     optional; shown as "updated <date>"
 *   series      slug of a series in src/data/series.ts, e.g. "post-training-101"
 *   part        this post's number within that series
 */
const postSchema = z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    tag: z.string().optional(),
    draft: z.boolean().default(false),
    likes: z.boolean().default(true),
    updated: z.coerce.date().optional(),
    series: z.string().optional(),
    part: z.number().int().positive().optional(),
});

const writing = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
    schema: postSchema,
});

export const collections = { writing };
