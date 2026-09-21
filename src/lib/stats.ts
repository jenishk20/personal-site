/**
 * Build-time metrics from the Hugging Face and GitHub APIs.
 *
 * These run during `astro build`, not in the browser: the numbers are baked
 * into the static HTML, so there is no client JS, no API key, and no rate limit
 * exposure from visitors.
 *
 * Every fetch falls back to a recorded value if the API is unreachable, so an
 * offline or rate-limited build still produces a correct-looking page rather
 * than a blank or a zero. Fallbacks are real measurements — see MEASURED_AT.
 */

const TIMEOUT_MS = 8000;

/** When the fallback numbers below were last verified against the live APIs. */
export const MEASURED_AT = '2026-08-12';

/**
 * Hugging Face reports two different download numbers and they differ by an
 * order of magnitude:
 *
 *   downloads         trailing 30 days  — a moving window, decays after a spike
 *   downloadsAllTime  cumulative        — only goes up
 *
 * Label whichever one you display. Conflating them is the most common way a
 * download count ends up wrong.
 */
export type DownloadWindow = 'month' | 'allTime';

export interface HFStats {
    downloads30d: number | null;
    downloadsAllTime: number | null;
    likes: number | null;
    /** False when the API call failed and fallback values are in use. */
    live: boolean;
}

export interface RepoStats {
    stars: number | null;
    forks: number | null;
    live: boolean;
}

export interface CFStats {
    rating: number | null;
    maxRating: number | null;
    rank: string | null;
    maxRank: string | null;
    live: boolean;
}

export interface LCStats {
    ranking: number | null;
    solved: number | null;
    live: boolean;
}

/**
 * Recorded on MEASURED_AT. Codeforces has a real public API; LeetCode does not,
 * so that one goes through the same GraphQL endpoint the site itself uses and
 * may be refused from a CI IP — hence the fallback matters more there.
 */
const CF_FALLBACK = { rating: 1435, maxRating: 1618, rank: 'specialist', maxRank: 'expert' };
const LC_FALLBACK = { ranking: 2957, solved: 1894 };

/** Recorded all-time downloads, used only when the API is unreachable. */
const HF_FALLBACK: Record<string, { allTime: number; month: number; likes: number }> = {
    'jk200201/qwen2.5-coder-7b-bird-cot': { allTime: 3700, month: 377, likes: 2 },
    'jk200201/qwen2.5-coder-7b-bird-cot-GGUF': { allTime: 542, month: 73, likes: 1 },
    'jk200201/qwen2.5-coder-7b-bird-cot-lora': { allTime: 35, month: 1, likes: 0 },
    'jk200201/bird-cot-sft': { allTime: 110, month: 55, likes: 1 },
    'jk200201/spider-dpo-1040': { allTime: 603, month: 384, likes: 2 },
};

// One request per artifact per build, even if several pages ask for it.
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key) as Promise<T>;
}

async function getJSON(url: string): Promise<any | null> {
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
            headers: { 'user-agent': 'jenishkothari.com build' },
        });
        if (!res.ok) {
            console.warn(`[stats] ${res.status} from ${url}`);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.warn(`[stats] failed ${url}: ${(err as Error).message}`);
        return null;
    }
}

/**
 * @param kind 'models' or 'datasets' — Hugging Face uses separate endpoints.
 */
export function hf(kind: 'models' | 'datasets', id: string): Promise<HFStats> {
    return cached(`hf:${kind}:${id}`, async () => {
        const url =
            `https://huggingface.co/api/${kind}/${id}` +
            `?expand[]=downloads&expand[]=downloadsAllTime&expand[]=likes`;
        const data = await getJSON(url);

        if (!data) {
            const fb = HF_FALLBACK[id];
            return {
                downloads30d: fb?.month ?? null,
                downloadsAllTime: fb?.allTime ?? null,
                likes: fb?.likes ?? null,
                live: false,
            };
        }

        return {
            downloads30d: typeof data.downloads === 'number' ? data.downloads : null,
            downloadsAllTime:
                typeof data.downloadsAllTime === 'number' ? data.downloadsAllTime : null,
            likes: typeof data.likes === 'number' ? data.likes : null,
            live: true,
        };
    });
}

/** @param repo "owner/name" */
export function github(repo: string): Promise<RepoStats> {
    return cached(`gh:${repo}`, async () => {
        const data = await getJSON(`https://api.github.com/repos/${repo}`);
        if (!data) return { stars: null, forks: null, live: false };
        return {
            stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : null,
            forks: typeof data.forks_count === 'number' ? data.forks_count : null,
            live: true,
        };
    });
}

export function codeforces(handle: string): Promise<CFStats> {
    return cached(`cf:${handle}`, async () => {
        const data = await getJSON(
            `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
        );
        const u = data?.status === 'OK' ? data?.result?.[0] : null;
        if (!u) return { ...CF_FALLBACK, live: false };
        return {
            rating: typeof u.rating === 'number' ? u.rating : null,
            maxRating: typeof u.maxRating === 'number' ? u.maxRating : null,
            rank: u.rank ?? null,
            maxRank: u.maxRank ?? null,
            live: true,
        };
    });
}

export function leetcode(username: string): Promise<LCStats> {
    return cached(`lc:${username}`, async () => {
        const query =
            'query($u:String!){matchedUser(username:$u){profile{ranking}' +
            ' submitStatsGlobal{acSubmissionNum{difficulty count}}}}';
        try {
            const res = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                signal: AbortSignal.timeout(TIMEOUT_MS),
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'jenishkothari.com build',
                },
                body: JSON.stringify({ query, variables: { u: username } }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const m = (await res.json())?.data?.matchedUser;
            if (!m) throw new Error('no user');
            const all = m.submitStatsGlobal?.acSubmissionNum?.find(
                (x: any) => x.difficulty === 'All',
            );
            return {
                ranking: m.profile?.ranking ?? null,
                solved: all?.count ?? null,
                live: true,
            };
        } catch (err) {
            console.warn(`[stats] leetcode failed: ${(err as Error).message}`);
            return { ...LC_FALLBACK, live: false };
        }
    });
}

/** "expert" -> "Expert" */
export function titleCase(s: string | null): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/**
 * Stars are only rendered above this threshold. A repo showing "1 star" reads
 * worse than one showing nothing, and omitting a metric is a presentation
 * choice rather than a false claim. Set to 0 to always show.
 */
export const STAR_DISPLAY_THRESHOLD = 10;

/** 377 -> "377", 3700 -> "3.7k", 1240000 -> "1.2M" */
export function formatCount(n: number | null | undefined): string {
    if (n === null || n === undefined) return '—';
    if (n < 1000) return String(n);
    if (n < 1_000_000) {
        const k = n / 1000;
        return `${k < 10 ? k.toFixed(1).replace(/\.0$/, '') : Math.round(k)}k`;
    }
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
