// Copies KaTeX's stylesheet and fonts into public/katex/ before every build and
// dev start, so SeriesHeader can link them only on pages that need maths.
// Importing the CSS from a component instead would bundle it into the shared
// [...slug] stylesheet, and every post would download it. public/katex/ is
// generated, so it is gitignored; the version comes from package-lock.json.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const dist = join(dirname(createRequire(import.meta.url).resolve('katex/package.json')), 'dist');
const out = new URL('../public/katex/', import.meta.url).pathname;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(dist, 'katex.min.css'), join(out, 'katex.min.css'));
cpSync(join(dist, 'fonts'), join(out, 'fonts'), { recursive: true });
console.log('katex: copied stylesheet and fonts to public/katex/');
