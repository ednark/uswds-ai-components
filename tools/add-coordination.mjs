#!/usr/bin/env node
/**
 * Backfill agentCoordination metadata into all component tiles.
 *
 * For every tile: computes default compositionCost from tile size and
 * requiresJs, then merges curated overrides from coordination-overrides.json
 * (component-level first, then variant-level). Writes the tile's embedded
 * agent-meta JSON block back in place.
 *
 * Usage: node tools/add-coordination.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const config = JSON.parse(readFileSync(join(ROOT, 'registry.config.json'), 'utf-8'));
const { agentMetaId, tileDir = 'infinite' } = config;
const TILE_DIR = join(ROOT, tileDir);
const overrides = JSON.parse(readFileSync(join(__dirname, 'coordination-overrides.json'), 'utf-8'));

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

function costDefaults(bytes, requiresJs) {
  const estimatedTokens = Math.ceil(bytes / 4);
  let costTier;
  if (requiresJs === 'required') {
    costTier = estimatedTokens > 2000 ? 'expensive' : 'moderate';
  } else if (requiresJs === 'optional') {
    costTier = 'moderate';
  } else {
    costTier = estimatedTokens > 1000 ? 'moderate' : 'cheap';
  }
  const renderingTimeMs = requiresJs === 'required' ? 60 : requiresJs === 'optional' ? 35 : 15;
  const recommendedModel = costTier === 'expensive' ? 'sonnet' : 'haiku';
  return { costTier, estimatedTokens, renderingTimeMs, recommendedModel };
}

function mergeCoordination(base, override) {
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) merged[key] = value;
    else if (value && typeof value === 'object') merged[key] = { ...(merged[key] || {}), ...value };
    else merged[key] = value;
  }
  return merged;
}

const files = findHtmlFiles(TILE_DIR);
let updated = 0;
let skipped = 0;

// Surface 4: derive compositionRecipes membership from recipes/*.json so tiles
// advertise which recipes they participate in (indexed as a facet).
const recipeMembership = {};
try {
  const recipesDir = join(TILE_DIR, 'recipes');
  for (const item of readdirSync(recipesDir)) {
    if (!item.endsWith('.json') || item === 'index.json') continue;
    const recipe = JSON.parse(readFileSync(join(recipesDir, item), 'utf-8'));
    for (const c of recipe.components || []) {
      (recipeMembership[c.component] ||= []).push(recipe.recipe);
    }
  }
} catch {
  console.warn('  (no recipes dir — skipping compositionRecipes derivation)');
}

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

  const bytes = Buffer.byteLength(html, 'utf-8');
  const requiresJs = meta.discovery?.requiresJs || 'no';
  const defaults = {
    prerequisiteComponents: [],
    incompatibleWith: [],
    compositionCost: costDefaults(bytes, requiresJs),
  };

  const componentDir = relPath.split('/')[0];
  const componentOverride = overrides.component?.[componentDir]?.coordination;
  const variantOverride = overrides.variants?.[relPath]?.coordination;

  let coordination = defaults;
  if (componentOverride) coordination = mergeCoordination(coordination, componentOverride);
  if (variantOverride) coordination = mergeCoordination(coordination, variantOverride);

  const memberOf = [...new Set(recipeMembership[componentDir] || [])];
  if (memberOf.length) {
    coordination.compositionRecipes = [
      ...new Set([...(coordination.compositionRecipes || []), ...memberOf]),
    ];
  }

  const existing = meta.coordination;
  if (
    existing &&
    JSON.stringify(existing) === JSON.stringify(coordination)
  ) {
    skipped++;
    continue;
  }

  meta.coordination = coordination;
  const newHtml = html.replace(block.full, `${block.open}\n${JSON.stringify(meta, null, 2)}\n${block.close}`);

  if (!DRY_RUN) writeFileSync(file, newHtml);
  updated++;
  const tier = coordination.compositionCost.costTier;
  console.log(`  ✓ ${relPath} (${tier}${componentOverride ? ', curated' : ', default'})`);
}

console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'} ${updated} tiles, skipped ${skipped}`);
