#!/usr/bin/env node
// Audit: does each tile's inline CSS cover the usa-* component classes its DOM uses?
// Reports the self-containment gap that external consumers (and plain browsers)
// hit when a tile relies on external USWDS CSS.
//
// Usage: node tools/audit-css-coverage.mjs [--json]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

function findHtml(dir, files = []) {
  for (const item of readdirSync(dir)) {
    if (item.endsWith('.resolved.html')) continue;
    const full = join(dir, item);
    if (statSync(full).isDirectory()) findHtml(full, files);
    else if (item.endsWith('.html')) files.push(full);
  }
  return files;
}

const rows = [];
for (const f of findHtml(join(ROOT, '..', 'infinite'))) {
  const html = readFileSync(f, 'utf8');
  // Strip style blocks, then collect classes actually used in the DOM.
  const dom = html.replace(/<style>[\s\S]*?<\/style>/g, '');
  const used = new Set();
  for (const m of dom.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (/^usa-[a-z0-9-]+$/.test(c)) used.add(c);
  }
  // Component classes referenced in the tile's inline CSS.
  const styled = new Set([...dom.matchAll(/\.usa-[a-z0-9-]+/g)].map(x => x[0].slice(1)));
  const covered = [...used].filter(c => styled.has(c));
  const uncovered = [...used].filter(c => !styled.has(c));
  rows.push({
    tile: f.split('/infinite/')[1],
    classesUsed: used.size,
    covered: covered.length,
    uncovered,
  });
}

const none = rows.filter(r => r.classesUsed > 0 && r.covered === 0);
const partial = rows.filter(r => r.classesUsed > 0 && r.covered > 0 && r.uncovered.length > 0);
const full = rows.filter(r => r.classesUsed > 0 && r.uncovered.length === 0);
const noUse = rows.filter(r => r.classesUsed === 0);

const json = process.argv.includes('--json');
const out = {
  tiles: rows.length,
  summary: {
    fullyInlineStyled: full.length,
    partiallyStyled: partial.length,
    zeroInlineRules: none.length,
    noComponentClasses: noUse.length,
  },
  zeroInlineRules: none,
  partial: partial,
};
if (json) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`tiles: ${rows.length}`);
  console.log(`  component classes fully inline-styled: ${full.length}`);
  console.log(`  PARTIALLY styled (some classes uncovered): ${partial.length}`);
  console.log(`  component classes used but ZERO inline rules: ${none.length}`);
  console.log(`  no usa-* classes in DOM: ${noUse.length}`);
  console.log('\n=== ZERO inline rules ===');
  for (const r of none) console.log(`${r.tile.padEnd(45)} classes: ${r.uncovered.join(', ')}`);
  console.log('\n=== PARTIAL (uncovered classes) ===');
  for (const r of partial) console.log(`${r.tile.padEnd(45)} uncovered: ${r.uncovered.join(', ')}`);
}