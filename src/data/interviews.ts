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
    /**
     * YYYY-MM. Drives sorting and the date column. Leave it off rather than
     * guessing: undated rows sort last and print "unrecorded", which is honest,
     * where an invented month would quietly become a fact on the page.
     */
    when?: string;
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
        source: 'cold-apply',
        reached: 'onsite',
        rounds: 4,
        outcome: 'rejected',
        ghosted: true,
        writeup: 'four-rounds-at-amazon-seattle-hq',
        takeaway:
            'Flew to Seattle HQ for four rounds. The recruiter stopped replying; I found out by inference.',
    },

    {
        company: 'DeepInfra',
        role: 'SWE, experienced',
        team: 'Inference',
        type: 'full-time',
        when: '2026-04',
        source: 'cold-apply',
        reached: 'onsite',
        rounds: 5,
        outcome: 'rejected',
        writeup: 'five-rounds-at-deepinfra',
        takeaway:
            'Lost it on a hard tile-placement problem with a cofounder. Told the reason was seniority; still in touch with the team.',
    },

    {
        company: 'Adobe',
        role: 'Software Engineer Intern',
        team: 'Workfront, Reviews & Approvals',
        type: 'internship',
        when: '2024-11',
        source: 'cold-apply',
        reached: 'offer',
        outcome: 'offer',
        rounds: 3,
        writeup: 'three-rounds-at-adobe',
        takeaway:
            'Took it, and it converted into a SWE-II return offer with no second loop. One loop, two offers.',
    },

    // Pending loops live in the QUEUE below, not here.
];

/**
 * QUEUE. One per day: move a block into `interviews` above, fill in every TODO,
 * then commit and push that single row.
 *
 * Nothing here renders. A loop only counts once it is in the array.
 *
 * Fill the TODOs or delete the line. An undated row is fine and prints
 * "unrecorded"; an invented date is not, because /interviews/ computes all of
 * its statistics from these rows, so a guess becomes a published fact.
 *
 * Deliberately not queued: Google. Team match after clearing L3 is not an
 * outcome yet, and it stays off the page until there is an offer.
 *
 * Also not queued: Adobe full-time. That offer converted from the internship
 * with no loop of its own, and a row reading `reached: 'offer'` with no rounds
 * behind it would add an offer to a page that counts interview loops. It is
 * recorded on the Adobe internship row instead: one loop, two offers.
 *
 * FULL-TIME
 *
 * // {
 * //     company: 'Bloomberg',
 * //     role: 'Software Engineer',   // TODO confirm the title
 * //     type: 'full-time',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO referral | cold-apply | recruiter | career-fair
 * //     reached: 'phone',            // TODO oa or phone?
 * //     outcome: 'rejected',
 * // },
 *
 * // {
 * //     company: 'Meta',
 * //     role: 'Production Engineer, new grad',
 * //     type: 'full-time',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'phone',
 * //     outcome: 'rejected',
 * //     takeaway: 'Never got past the tech screen.',
 * // },
 *
 * // {
 * //     company: 'Stripe',
 * //     role: 'Software Engineer',   // TODO confirm the title
 * //     type: 'full-time',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'phone',            // TODO oa or phone?
 * //     outcome: 'rejected',
 * // },
 *
 * // {
 * //     company: 'Mercor',
 * //     role: 'SWE',                 // TODO one loop or two? Split SWE and ML into
 * //     type: 'full-time',           //      separate rows if they were separate loops.
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'phone',
 * //     rounds: 1,
 * //     outcome: 'rejected',         // TODO rejected | withdrew | no-response
 * // },
 *
 * // {
 * //     company: 'Nebius',
 * //     role: 'ML',                  // TODO same question as Mercor
 * //     type: 'full-time',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'phone',
 * //     rounds: 1,
 * //     outcome: 'rejected',         // TODO rejected | withdrew | no-response
 * // },
 *
 * INTERNSHIPS
 *
 * // {
 * //     company: 'Amazon',
 * //     role: 'SDE Intern',
 * //     type: 'internship',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'onsite',
 * //     outcome: 'rejected',
 * //     takeaway:
 * //         'The full loop, and the first of two Amazon rejections. The SDE1 loop came later.',
 * // },
 *
 *
 * // {
 * //     company: 'Dell Technologies',
 * //     role: 'Software Engineer Intern',
 * //     team: 'Boston, MA',
 * //     type: 'internship',
 * //     when: '',                    // TODO YYYY-MM (the co-op started Aug 2025)
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'offer',
 * //     outcome: 'offer',
 * //     takeaway: 'Took it. Fall 2025 co-op in Boston.',
 * // },
 *
 * // {
 * //     company: 'ServiceNow',
 * //     role: 'Software Engineer Intern',
 * //     type: 'internship',
 * //     when: '',                    // TODO YYYY-MM
 * //     source: 'cold-apply',        // TODO
 * //     reached: 'offer',
 * //     outcome: 'offer',
 * //     takeaway: '',                // TODO declined it, or was it for a term you could not take?
 * // },
 */
