#!/usr/bin/env node
/**
 * Migrate USWDS AI Components tiles from metadata schema v1 (flat) to v2 (categorized).
 *
 * v1 (flat):
 *   { "agentPrompt": "...", "preserveElements": [...], "editableAreas": [...], ... }
 *
 * v2 (categorized):
 *   {
 *     "_schemaVersion": 2,
 *     "discovery": { "description": "...", "tier": "...", "tags": [...], ... },
 *     "selection": { "useWhen": [...], "avoidWhen": [...] },
 *     "instruction": { "agentPrompt": "...", "relatedComponents": [...], ... },
 *     "constraints": { "preserve": [...], "editable": [...], "limitations": [...] }
 *   }
 *
 * Usage:
 *   node tools/migrate-v2.mjs              # dry run (shows what would change)
 *   node tools/migrate-v2.mjs --write      # actually write changes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TILE_DIR = join(ROOT, 'infinite');
const AGENT_META_ID = 'uswds-agent-meta';
const DRY_RUN = !process.argv.includes('--write');

if (DRY_RUN) {
  console.log('DRY RUN — pass --write to apply changes\n');
}

function findHtmlFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    if (item === 'components.index.json' || item === 'facets.json') continue;
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// v1 flat fields that go into each v2 category
const DISCOVERY_FIELDS = [
  'uswdsComponentType', 'uswdsClass', 'section', 'variant',
  'requiresJs', 'interaction', 'a11y', 'govCompliance',
  'tier', 'tags', 'description',
];

const INSTRUCTION_FIELDS = [
  'agentPrompt', 'relatedComponents', 'variants', 'settings', 'tokenOverrides',
];

const SELECTION_FIELDS = ['useWhen', 'avoidWhen'];

// v1 -> v2 field name mappings for constraints
const CONSTRAINT_MAP = {
  'preserveElements': 'preserve',
  'editableAreas': 'editable',
  'knownLimitations': 'limitations',
};

function migrateV1toV2(meta) {
  const v2 = {
    _schemaVersion: 2,
  };

  // Discovery: structural/facet fields
  v2.discovery = {};
  for (const field of DISCOVERY_FIELDS) {
    if (meta[field] !== undefined) {
      v2.discovery[field] = meta[field];
    }
  }

  // Selection: when to use/avoid
  v2.selection = {};
  for (const field of SELECTION_FIELDS) {
    if (meta[field] !== undefined) {
      v2.selection[field] = meta[field];
    }
  }

  // Instruction: adaptation guidance
  v2.instruction = {};
  for (const field of INSTRUCTION_FIELDS) {
    if (meta[field] !== undefined) {
      v2.instruction[field] = meta[field];
    }
  }

  // Constraints: boundaries on adaptation
  v2.constraints = {};
  for (const [v1Name, v2Name] of Object.entries(CONSTRAINT_MAP)) {
    if (meta[v1Name] !== undefined) {
      v2.constraints[v2Name] = meta[v1Name];
    }
  }

  // Preserve file and title at top level
  v2.file = meta.file;
  v2.title = meta.title;
  if (meta.id) v2.id = meta.id;

  return v2;
}

// --- Main ---

const htmlFiles = findHtmlFiles(TILE_DIR);
console.log(`Found ${htmlFiles.length} tiles\n`);

let migrated = 0;
let alreadyV2 = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');
  const relPath = file.replace(TILE_DIR + '/', '');

  const metaRegex = new RegExp(
    `<script[^>]*id="${AGENT_META_ID}"[^>]*>([\\s\\S]*?)</script>`,
    'i'
  );
  const match = content.match(metaRegex);
  if (!match) {
    console.log(`  ~ ${relPath} (no metadata block)`);
    skipped++;
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (e) {
    console.log(`  ✗ ${relPath} (invalid JSON)`);
    skipped++;
    continue;
  }

  if (meta._schemaVersion && meta._schemaVersion >= 2) {
    alreadyV2++;
    continue;
  }

  const v2 = migrateV1toV2(meta);
  const newJson = JSON.stringify(v2, null, 2);
  const newBlock = `<script type="application/json" id="${AGENT_META_ID}">\n${newJson}\n</script>`;

  const newContent = content.replace(match[0], newBlock);

  if (DRY_RUN) {
    console.log(`  → ${relPath} (would migrate to v2)`);
  } else {
    writeFileSync(file, newContent);
    console.log(`  ✓ ${relPath} (migrated to v2)`);
  }
  migrated++;
}

console.log(`\nSummary:`);
console.log(`  Migrated: ${migrated}`);
console.log(`  Already v2: ${alreadyV2}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Total: ${htmlFiles.length}`);

if (DRY_RUN && migrated > 0) {
  console.log(`\nRun with --write to apply changes.`);
}
