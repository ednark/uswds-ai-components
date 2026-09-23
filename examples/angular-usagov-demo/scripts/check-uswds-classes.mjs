#!/usr/bin/env node
// Fails if a template uses a class that is not in the pinned USWDS release (stylesheet,
// Twig templates, or component JS) and not declared in the app's own component CSS. Enforces the registry rule "do not guess
// USWDS class names" (and catches invented classes like make-link or demo-footer-grid).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const uswdsDir = join(root, 'node_modules/@uswds/uswds');
const uswdsCss = readFileSync(join(uswdsDir, 'dist/css/uswds.css'), 'utf8');
const { version } = JSON.parse(readFileSync(join(uswdsDir, 'package.json'), 'utf8'));

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((ext) => name.endsWith(ext))) out.push(full);
  }
  return out;
}

function cssClasses(css) {
  const found = new Set();
  for (const [, raw] of css.matchAll(/\.((?:\\.|[\w-])+)/g)) {
    found.add(raw.replace(/\\(.)/g, '$1'));
  }
  return found;
}

const known = cssClasses(uswdsCss);

// Behavior hooks with no CSS rule of their own (e.g. usa-character-count__field, icon-lock)
// are still official markup: accept classes from the package's Twig templates and JS.
for (const file of walk(join(uswdsDir, 'packages'), ['.twig', 'index.js'])) {
  let source = readFileSync(file, 'utf8').replaceAll('${PREFIX}', 'usa');
  // Resolve class-name constants, e.g. `${CHARACTER_COUNT_CLASS}__sr-status`.
  for (const [, name, value] of source.matchAll(/const (\w+) = `(usa-[\w-]+)`;/g)) {
    source = source.replaceAll(`\${${name}}`, value);
  }
  for (const [, value] of source.matchAll(/class="([^"]*)"/g)) {
    value.split(/\s+/).filter((cls) => /^[\w:-]+$/.test(cls)).forEach((cls) => known.add(cls));
  }
  if (file.endsWith('.js')) {
    for (const [cls] of source.matchAll(/usa-[\w-]+/g)) known.add(cls);
  }
}
const appCss = walk(join(root, 'src'), ['.css']).map((file) => readFileSync(file, 'utf8'));
const local = cssClasses(appCss.join('\n'));

const used = new Map();
const note = (cls, file) => {
  if (!cls || cls.includes('{') || cls.includes('(')) return;
  if (!used.has(cls)) used.set(cls, new Set());
  used.get(cls).add(relative(root, file));
};

for (const file of walk(join(root, 'src'), ['.html', '.ts'])) {
  const source = readFileSync(file, 'utf8');
  for (const [, value] of source.matchAll(/\sclass="([^"]*)"/g)) {
    value.split(/\s+/).forEach((cls) => note(cls, file));
  }
  for (const [, cls] of source.matchAll(/\[class\.([\w:-]+)\]/g)) note(cls, file);
  // String literals assembled in TypeScript, e.g. `usa-icon usa-icon--size-${n}`.
  for (const [, cls] of source.matchAll(/['`](usa-[\w-]+)/g)) note(cls, file);
}

// Skip template-literal prefixes such as `usa-icon--size-` (checked via their expansions).
const missing = [...used].filter(([cls]) => !known.has(cls) && !local.has(cls) && !cls.endsWith('-'));

if (missing.length) {
  console.error(`✖ ${missing.length} class(es) not found in USWDS ${version} or component CSS:`);
  for (const [cls, files] of missing) console.error(`  ${cls}  (${[...files].join(', ')})`);
  process.exit(1);
}
console.log(`✔ ${used.size} classes checked: all exist in USWDS ${version} or component CSS (${local.size} component-scoped).`);
