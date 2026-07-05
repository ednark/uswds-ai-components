#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const generator = join(__dirname, '..', '_base', 'generate-index.mjs');
const result = spawnSync('node', [generator], {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
process.exit(result.status || 0);
