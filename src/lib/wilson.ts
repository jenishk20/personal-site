/**
 * The 95% Wilson score interval for an accuracy of correct/n.
 *
 * A direct port of `wilson_interval` in glassbox-sql's src/glassbox/stats.py, so
 * every interval drawn on this site is the one the harness printed. If one
 * changes, change the other.
 */
export function wilson(correct: number, n: number, z = 1.96): { p: number; lo: number; hi: number } {
    if (n === 0) return { p: 0, lo: 0, hi: 0 };
    const p = correct / n;
    const denom = 1 + (z * z) / n;
    const centre = (p + (z * z) / (2 * n)) / denom;
    const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
    return { p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}
