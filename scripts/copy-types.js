#!/usr/bin/env node
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Copy index.d.ts to index.d.cts for CommonJS compatibility
try {
  copyFileSync(
    join(root, 'dist', 'index.d.ts'),
    join(root, 'dist', 'index.d.cts')
  );
  console.log('✓ Copied type definitions for CJS compatibility');
} catch (err) {
  console.error('Error copying type definitions:', err.message);
  process.exit(1);
}
