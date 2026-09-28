// src/commands/resume/_shared.js — Shared helpers for resume subcommands.

import { readFileSync } from 'node:fs';
import chalk from 'chalk';

/** Read a file path and return its buffer, or exit with error. */
export function readResumeFile(filePath) {
  if (!filePath) {
    console.error(chalk.red('Error: --file <filePath> is required.'));
    process.exit(1);
  }
  try {
    return readFileSync(filePath);
  } catch {
    console.error(chalk.red(`Error: File not found: ${filePath}`));
    process.exit(1);
  }
}

/** Extract a display name from options or path. */
export function resolveFileName(options, filePath) {
  return options.name || (filePath ? filePath.split('/').pop() : 'resume');
}
