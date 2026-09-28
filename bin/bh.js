#!/usr/bin/env node
// Backward-compatibility shim: bh → bullhorn
// Deprecated. Use 'bullhorn' instead.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Print deprecation warning once
console.error('Warning: "bh" is deprecated. Use "bullhorn" instead.');

// Forward all arguments to bullhorn.js
const child = spawn(process.execPath, [join(__dirname, 'bullhorn.js'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false,
});

child.on('close', (code) => process.exit(code));
