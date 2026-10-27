/**
 * Multi-part series. A post joins one by setting `series` and `part` in its
 * frontmatter; the header, contents list and part-to-part navigation are then
 * added by Post.astro.
 *
 * `parts` is the plan, published or not. A part links only once a post with that
 * number is published, so the plan can be shown in full without leaving 404s.
 * Keep it in step with the series table in the project's own README.
 */

export interface SeriesPart {
    part: number;
    /** The question the part answers, as in the project README. */
    question: string;
    /** The maths introduced in that part. */
    maths: string;
}

export interface Series {
    slug: string;
    name: string;
    /** One sentence, shown under the series name on every part. */
    blurb: string;
    repo: string;
    parts: SeriesPart[];
}

export const SERIES: Record<string, Series> = {
    'post-training-101': {
        slug: 'post-training-101',
        name: 'Post-Training 101',
        blurb:
            'Post-training a small open model to write SQL, one technique at a time, in public.',
        repo: 'https://github.com/jenishk20/glassbox-sql',
        parts: [
            { part: 1, question: 'Understanding the data and the benchmark', maths: 'None yet: the data first' },
            { part: 2, question: 'How good are Qwen2.5-Coder-7B Base and Instruct, with and without the evidence hint?', maths: 'How answers are scored; 95% intervals; softmax and greedy decoding; the McNemar test' },
            { part: 3, question: 'What is each prompt ingredient worth?', maths: 'Testing each change for significance; repetition penalty on logits' },
            { part: 4, question: 'How good are frontier models on the same prompt?', maths: 'Tokens to dollars; cost per correct answer' },
            { part: 5, question: 'Supervised fine-tuning', maths: 'Cross-entropy loss; LoRA’s low-rank update' },
            { part: 6, question: 'Distilling reasoning from a larger model', maths: 'Rejection sampling; distillation as minimising KL divergence' },
            { part: 7, question: 'More samples, better answers: voting and pass@k', maths: 'Majority-vote probability; pass@k' },
            { part: 8, question: 'Direct Preference Optimization', maths: 'The Bradley-Terry model; deriving the DPO loss' },
            { part: 9, question: 'Reinforcement learning with GRPO', maths: 'Policy gradient; the group-relative advantage' },
            { part: 10, question: 'The final exam: BIRD’s hidden test set', maths: 'What carries over from dev to test' },
        ],
    },
};
