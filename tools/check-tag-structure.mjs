#!/usr/bin/env node
/**
 * Tag-structure audit — verifies each tile's *element* structure against the
 * pinned design system's own templates (tier 4: module/design-system source).
 *
 * Class existence is checked by validate-registry.mjs (stylesheet ground truth).
 * This tool covers the other half of a markup contract: which ELEMENT a class
 * belongs to. Design-system CSS and JS depend on both, e.g. USWDS's
 * `button.usa-accordion__button[aria-controls]` selector fails if the class
 * lands on a `<p>` (the banner toggle defect class), and
 * `ul.usa-nav__primary > li.usa-nav__primary-item` fails if the child is a
 * `<div>`.
 *
 * Method: harvest tag-qualified class usage from the package's Twig templates
 * (rendered markup, control tags stripped), then assert that every
 * design-system class a tile applies sits on a tag the design system uses it
 * with. Template inheritance/loops are resolved by harvesting every template
 * independently, so the union of observed tags is the contract.
 *
 * Usage: node tools/check-tag-structure.mjs [--json]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const TILE_DIR = join(ROOT, 'infinite');
const PKG_DIR = join(ROOT, 'node_modules/@uswds/uswds/packages');
const prefixes = ['usa-'];

function walk(dir, exts, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Extract (tag, classes) for every opening tag carrying a class attribute. */
function tokenize(html) {
  const out = [];
  const re = /<([a-zA-Z][\w-]*)\s([^>]*)>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    if (/^\/\s*$/.test(attrs)) continue;
    const cm = attrs.match(/class\s*=\s*"([^"]*)"/);
    if (!cm) continue;
    const classes = cm[1].split(/\s+/).filter(Boolean);
    if (!classes.length) continue;
    out.push({ tag, classes });
  }
  return out;
}

// --- Ground truth: tag-qualified class usage from design-system templates ---

const contract = new Map(); // class -> Set(tag)
for (const file of walk(PKG_DIR, ['.twig'])) {
  let s = readFileSync(file, 'utf8');
  s = s
    .replace(/\{%[\s\S]*?%\}/g, '') // control tags (for, if, set...)
    .replace(/\{\{[\s\S]*?\}\}/g, 'X') // expressions -> placeholder text
    .replace(/\{#[\s\S]*?#\}/g, ''); // comments
  for (const { tag, classes } of tokenize(s)) {
    for (const c of classes) {
      if (!prefixes.some((p) => c.startsWith(p))) continue;
      if (!contract.has(c)) contract.set(c, new Set());
      contract.get(c).add(tag);
    }
  }
}

// --- Audit tiles ---

const findings = [];
for (const file of walk(TILE_DIR, ['.html'])) {
  if (file.endsWith('.resolved.html')) continue;
  const raw = readFileSync(file, 'utf8');
  const dom = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(code|pre)[\s\S]*?<\/\1>/gi, '');
  const seen = new Set();
  for (const { tag, classes } of tokenize(dom)) {
    for (const c of classes) {
      if (!prefixes.some((p) => c.startsWith(p))) continue;
      const key = `${c}@${tag}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const allowed = contract.get(c);
      if (!allowed) continue; // class-existence gate handles unknown classes
      if (!allowed.has(tag)) {
        findings.push({ file: relative(ROOT, file), cls: c, tag, expected: [...allowed].sort().join(' | ') });
      }
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  console.log(`tag-structure: ${findings.length} element contract mismatch(es)`);
  for (const f of findings) console.log(`  ✗ ${f.file}: .${f.cls} on <${f.tag}>; design system uses it on <${f.expected}>`);
}
