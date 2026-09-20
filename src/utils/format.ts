/** "11 Aug 2026" — short, unambiguous, and locale-stable across builds. */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** "Aug 2026", for grouping index pages by month. */
export function formatMonth(date: Date): string {
    return date.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** Newest first, and drop drafts unless we're in `astro dev`. */
export function publish<T extends { data: { date: Date; draft?: boolean } }>(
    entries: T[],
): T[] {
    return entries
        .filter((e) => import.meta.env.DEV || !e.data.draft)
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
