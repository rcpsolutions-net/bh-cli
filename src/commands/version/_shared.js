// src/commands/version/_shared.js — Shared helpers for version subcommands.

import chalk from 'chalk';
import Table from 'cli-table3';

/** Parse key=value pairs from command-line arguments. Handles nested fields like "address.city=NYC". */
export function parseFieldArgs(fieldArgs) {
  const result = {};
  for (const arg of fieldArgs) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex === -1) {
      console.error(chalk.red(`Error: Field argument must be in key=value format: ${arg}`));
      process.exit(1);
    }
    const key = arg.substring(0, eqIndex).trim();
    const value = arg.substring(eqIndex + 1).trim();
    const parsed = Number(value);
    result[key] = Number.isNaN(parsed) ? value : parsed;
  }
  return result;
}

/** Format a version API response for table output. */
export function formatVersionResult(response, label) {
  console.log(chalk.cyan.bold(`\n${label}:\n`));
  const changedEntityId = response.data?.changedEntityId || '-';
  const changedVersionId = response.data?.changedVersionId || '-';
  const changeType = response.data?.changeType || 'UNKNOWN';
  const table = new Table({
    head: [chalk.cyan.bold('Changed Entity ID'), chalk.cyan.bold('Changed Version ID'), chalk.cyan.bold('Change Type')],
  });
  table.push([String(changedEntityId), String(changedVersionId), chalk.green(changeType)]);
  console.log(table.toString());
}
