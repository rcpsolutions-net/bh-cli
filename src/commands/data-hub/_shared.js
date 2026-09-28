// src/commands/data-hub/_shared.js — Shared helpers for data-hub subcommands.

import chalk from 'chalk';
import Table from 'cli-table3';

/** Format a Data Hub API response for table output. */
export function formatHubResult(response, label) {
  console.log(chalk.cyan.bold(`\n${label}:\n`));
  const changedEntityType = response.data?.changedEntityType || '-';
  const changedEntityId = response.data?.changedEntityId || '-';
  const changeType = response.data?.changeType || 'UNKNOWN';
  const table = new Table({
    head: [chalk.cyan.bold('Entity Type'), chalk.cyan.bold('Entity ID'), chalk.cyan.bold('Change Type')],
  });
  table.push([changedEntityType, String(changedEntityId), chalk.green(changeType)]);
  console.log(table.toString());
}

/** Format a Data Hub GET response for table output. */
export function formatHubInfo(data, label) {
  if (typeof data === 'object' && data !== null) {
    const table = new Table({
      head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
    });
    for (const [key, value] of Object.entries(data)) {
      table.push([
        chalk.bold(key),
        typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
      ]);
    }
    console.log(table.toString());
  } else {
    console.log(String(data ?? ''));
  }
}
