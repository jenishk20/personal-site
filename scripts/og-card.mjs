// Renders a 1200x630 link-preview image for a series part, in the site's own
// font and colours, using the locally installed Chrome:
//
//   node scripts/og-card.mjs understanding-the-data-and-the-benchmark
//
// Writes public/og/<slug>.png, which Post.astro picks up automatically. Run it
// once per part, after the title is final, and commit the PNG. Cloudflare's
// build has no Chrome, so the image is made here, not at deploy time.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const slug = process.argv[2];
if (!slug) throw new Error('usage: node scripts/og-card.mjs <post-slug>');

const file = ['mdx', 'md'].map((e) => join(root, 'src/content/writing', `${slug}.${e}`)).find(existsSync);
if (!file) throw new Error(`no post called ${slug}`);
const fm = readFileSync(file, 'utf8').split('---')[1];
const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim().replace(/^"|"$/g, '');
const title = field('title');
const seriesSlug = field('series');
const part = field('part');

const seriesSrc = readFileSync(join(root, 'src/data/series.ts'), 'utf8');
const block = seriesSrc.slice(seriesSrc.indexOf(`'${seriesSlug}': {`));
const name = block.match(/name: '([^']+)'/)?.[1] ?? '';
const blurb = block.match(/blurb:\s*'([^']+)'/)?.[1] ?? '';
const total = (block.slice(0, block.indexOf(']')).match(/\{ part: /g) ?? []).length;
const kicker = seriesSlug ? `${name} · Part ${part} of ${total}` : 'Jenish Kothari';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const font = join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url('file://${font}') format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; }
body { font-family: Inter, sans-serif; background: #fff; color: #333; padding: 72px 80px;
       display: flex; flex-direction: column; justify-content: space-between;
       border-top: 14px solid hsl(258, 88%, 66%); }
.kicker { font-size: 26px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: hsl(258, 70%, 52%); }
h1 { margin-top: 28px; font-size: 76px; line-height: 1.08; font-weight: 650; letter-spacing: -2px; color: #111; max-width: 1000px; }
.blurb { margin-top: 26px; font-size: 32px; line-height: 1.35; color: #555; max-width: 960px; }
.foot { font-size: 26px; color: #666; }
</style>
<div><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p class="blurb">${esc(blurb)}</p></div>
<div class="foot">jenishkothari.pages.dev</div>`;

const tmp = join(tmpdir(), `og-${slug}.html`);
writeFileSync(tmp, html);
const out = join(root, 'public/og', `${slug}.png`);
mkdirSync(join(root, 'public/og'), { recursive: true });
rmSync(out, { force: true });
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--window-size=1200,630', `--screenshot=${out}`, `file://${tmp}`,
], { stdio: 'ignore' });
console.log(`wrote public/og/${slug}.png`);
