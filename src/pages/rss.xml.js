import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context) {
    const posts = await getCollection('writing', ({ data }) => !data.draft);

    const items = posts
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
        .map((entry) => ({
            title: entry.data.title,
            description: entry.data.description ?? '',
            pubDate: entry.data.date,
            link: `/${entry.id}/`,
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
