/**
 * The interview log. One object per loop; /interviews/ renders the tables and
 * computes every statistic from these rows, so the headline numbers can never
 * disagree with the table underneath them.
 *
 * Add entries in any order — the page sorts by date, newest first.
 *
 * Only `company`, `role`, `type`, `when`, `reached` and `outcome` are required.
 * Leave a field off rather than guessing at it; the stats skip unknowns and say
 * how many they skipped.
 */

/** How far the loop got before it ended. Order matters: it drives the funnel. */
export const STAGES = [
    'application',
    'oa',
    'phone',
    'onsite',
    'team-match',
    'offer',
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
    application: 'Application',
    oa: 'Online assessment',
    phone: 'Phone screen',
    onsite: 'Onsite',
    'team-match': 'Team match',
    offer: 'Offer',
};

export type Outcome = 'offer' | 'rejected' | 'withdrew' | 'no-response';

/** How the loop started. The single most useful field for other candidates. */
export type Source = 'referral' | 'cold-apply' | 'recruiter' | 'career-fair';

export const SOURCE_LABELS: Record<Source, string> = {
    referral: 'Referral',
    'cold-apply': 'Cold application',
    recruiter: 'Recruiter reached out',
    'career-fair': 'Career fair',
};

export interface Interview {
    company: string;
    role: string;
    /** Team or org, if it was a specific one. */
    team?: string;
    type: 'full-time' | 'internship';
    /** YYYY-MM. Used for sorting and for the date column. */
    when: string;
    source?: Source;
    /** Furthest stage reached. */
    reached: Stage;
    rounds?: number;
    outcome: Outcome;
    /** True when nobody ever closed the loop, whatever the outcome. */
    ghosted?: boolean;
    /** Slug of a post in src/content/writing/, if this loop has a write-up. */
    writeup?: string;
    /** One line. The part people actually read. */
    takeaway?: string;
}

export const interviews: Interview[] = [
    {
        company: 'AWS',
        role: 'SDE1',
        team: 'S3 Glacier',
        type: 'full-time',
        when: '2026-08',
        reached: 'onsite',
        rounds: 4,
        outcome: 'rejected',
        ghosted: true,
        writeup: 'four-rounds-at-seattle-hq',
        takeaway:
            'Flew to Seattle HQ for four rounds. The recruiter stopped replying; I found out by inference.',
    },

    // Add the rest here. Template:
    //
    // {
    //     company: '',
    //     role: '',
    //     type: 'full-time',            // or 'internship'
    //     when: '2025-09',
    //     source: 'referral',           // referral | cold-apply | recruiter | career-fair
    //     reached: 'phone',             // application | oa | phone | onsite | team-match | offer
    //     outcome: 'rejected',          // offer | rejected | withdrew | no-response
    //     takeaway: '',
    // },
];
