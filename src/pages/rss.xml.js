import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

/**
 * One feed for everything — essays and notes together. Readers who subscribe
 * want the whole output, not a per-section feed they have to hunt for.
 */
export async function GET(context) {
    const writing = await getCollection('writing', ({ data }) => !data.draft);
    const notes = await getCollection('notes', ({ data }) => !data.draft);

    const items = [
        ...writing.map((p) => ({ entry: p, link: `/${p.id}/` })),
        ...notes.map((p) => ({ entry: p, link: `/notes/${p.id}/` })),
    ]
        .sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
        .map(({ entry, link }) => ({
            title: entry.data.title,
            description: entry.data.description ?? '',
            pubDate: entry.data.date,
            link,
            categories: entry.data.tag ? [entry.data.tag] : undefined,
        }));

    return rss({
        title: SITE.title,
        description: SITE.description,
        site: context.site,
        items,
        customData: `<language>en-us</language>`,
    });
}
