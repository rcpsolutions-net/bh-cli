// src/commands/pay-bill/_shared.js — Shared helpers for pay-bill subcommands.
// Internal files import directly from this module, never through the barrel.

import chalk from 'chalk';
import Table from 'cli-table3';

/** Build query params from common options and optional extras. */
export function buildParams(options, extraParams = {}) {
  const params = { ...extraParams };
  if (options.fields) params.fields = options.fields;
  if (options.count) params.count = options.count;
  if (options.start) params.start = options.start;
  if (options.orderBy) params.orderBy = options.orderBy;
  if (options.where) params.where = options.where;
  if (options.query) params.query = options.query;
  return params;
}

/** Render records as a cli-table3 table. */
export function renderTable(records, label) {
  if (!records || records.length === 0) {
    console.log(chalk.yellow('No records found.'));
    return;
  }
  console.log(chalk.cyan.bold(`\n${label}:\n`));
  const headers = Object.keys(records[0] || {});
  const table = new Table({
    head: headers.map(h => chalk.cyan.bold(h)),
  });
  for (const record of records) {
    table.push(
      headers.map(h => {
        const val = record[h];
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
      }),
    );
  }
  console.log(table.toString());
}
