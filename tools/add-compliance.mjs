#!/usr/bin/env node
/**
 * Backfill compliance, mobileUX, and supportedTokenProfiles metadata into
 * all component tiles.
 *
 * Defaults: section508/wcag21AA derived from the existing govCompliance
 * facet, mobile UX baseline (44px targets, 8px spacing), highContrast token
 * profile from the a11y.forcedColors flag. Curated overrides from
 * compliance-overrides.json are merged per component dir.
 *
 * Usage: node tools/add-compliance.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const config = JSON.parse(readFileSync(join(ROOT, 'registry.config.json'), 'utf-8'));
const { agentMetaId, tileDir = 'infinite' } = config;
const TILE_DIR = join(ROOT, tileDir);
const overrides = JSON.parse(readFileSync(join(__dirname, 'compliance-overrides.json'), 'utf-8'));

function findHtmlFiles(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) findHtmlFiles(fullPath, files);
    else if (item.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function extractMetaBlock(html) {
  const re = new RegExp(`(<script[^>]*id="${agentMetaId}"[^>]*>)([\\s\\S]*?)(</script>)`, 'i');
  const match = html.match(re);
  if (!match) return null;
  return { full: match[0], open: match[1], json: match[2], close: match[3] };
}

function mergeDeep(base, override) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) merged[key] = value;
    else if (value && typeof value === 'object') merged[key] = mergeDeep(merged[key] || {}, value);
    else merged[key] = value;
  }
  return merged;
}

function defaultsFor(meta) {
  const gov = meta.discovery?.govCompliance || [];
  const a11y = meta.discovery?.a11y || {};
  return {
    compliance: {
      nistControls: [],
      fedRampLevel: 'IL2+',
      section508: gov.includes('Section 508'),
      wcag21AA: gov.includes('WCAG 2.1 AA'),
      piiHandling: 'none',
      auditTrailCompatible: false,
      dataMaskingCompatible: false,
    },
    mobileUX: {
      touchTargetSize: '44px',
      requiredMinSpacing: '8px',
      orientationLocked: false,
      fullscreenSafe: true,
    },
    supportedTokenProfiles: a11y.forcedColors ? ['highContrast'] : [],
  };
}

const files = findHtmlFiles(TILE_DIR);
let updated = 0;
let skipped = 0;

for (const file of files) {
  const relPath = file.replace(TILE_DIR + '/', '');
  const html = readFileSync(file, 'utf-8');
  const block = extractMetaBlock(html);

  if (!block) {
    console.warn(`  ~ ${relPath}: no ${agentMetaId} block, skipping`);
    skipped++;
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(block.json);
  } catch (e) {
    console.error(`  ✗ ${relPath}: invalid JSON in meta block: ${e.message}`);
    skipped++;
    continue;
  }

  const defaults = defaultsFor(meta);
  const componentDir = relPath.split('/')[0];
  const override = overrides.components?.[componentDir] || {};

  const patch = mergeDeep(defaults, override);

  let changed = false;
  meta.discovery ||= {};
  for (const key of ['compliance', 'mobileUX']) {
    if (JSON.stringify(meta.discovery[key]) !== JSON.stringify(patch[key])) {
      meta.discovery[key] = patch[key];
      changed = true;
    }
  }
  if (JSON.stringify(meta.discovery.supportedTokenProfiles) !== JSON.stringify(patch.supportedTokenProfiles)) {
    meta.discovery.supportedTokenProfiles = patch.supportedTokenProfiles;
    delete meta.supportedTokenProfiles;
    changed = true;
  }

  if (!changed) {
    skipped++;
    continue;
  }

  if (!DRY_RUN) {
    const newHtml = html.replace(block.full, `${block.open}\n${JSON.stringify(meta, null, 2)}\n${block.close}`);
    writeFileSync(file, newHtml);
  }
  updated++;
}

console.log(`${DRY_RUN ? 'Would update' : 'Updated'} ${updated} tiles, skipped ${skipped}`);
