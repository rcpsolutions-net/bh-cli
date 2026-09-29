// src/commands/all-corp-notes/_shared.js — Shared helpers for all-corp-notes, my, department, associate, disassociate.

import { Command } from 'commander';
import { buildGetParams, renderJsonOutput, renderTableOutput, invoke } from '../../lib/helpers.js';
import api from '../../lib/api.js';

// ── Associate / Disassociate helpers ────────────────────────────────

/**
 * Build the URL for an associate/disassociate operation.
 * @param {string} entityType   — e.g. 'Candidate'
 * @param {string} entityId     — parent entity ID
 * @param {string} toManyField  — e.g. 'primarySkills'
 * @param {string[]} ids        — child entity IDs
 * @returns {string}
 */
export function buildAssociationUrl(entityType, entityId, toManyField, ids) {
  return `/entity/${entityType}/${entityId}/${toManyField}/${ids.join(',')}`;
}

/**
 * Flatten comma-separated argument groups into a single ID array.
 * @param {string[]} idsArgs — raw CLI arguments (may contain commas)
 * @returns {string[]}
 */
export function flattenIds(idsArgs) {
  const ids = [];
  for (const id of idsArgs) {
    const parts = String(id).split(',').filter(Boolean);
    ids.push(...parts);
  }
  return ids;
}

/**
 * Build a table row for associate/disassociate change summary.
 */
export function formatChangeRow(index, item) {
  return [
    index + 1,
    item.changedEntityType || '-',
    item.changedEntityId || '-',
    item.changeType || '-',
  ];
}

/**
 * Render the change summary table for associate/disassociate operations.
 */
export async function renderChangeTable(changes, toManyFieldName) {
  // Custom table layout with chalk-styled cells — not available in helpers.renderTableOutput.
  const Table = (await import('cli-table3')).default;
  const chalk = (await import('chalk')).default;

  console.log(chalk.cyan.bold(`\n${changes.length} ${toManyFieldName} record(s) changed:\n`));
  const table = new Table({
    head: [chalk.cyan.bold('#'), chalk.cyan.bold('Entity Type'), chalk.cyan.bold('Entity ID'), chalk.cyan.bold('Change Type')],
  });
  for (let i = 0; i < changes.length; i++) {
    table.push(formatChangeRow(i, changes[i]));
  }
  console.log(table.toString());
}

// ── my / department entity loop helper ───────────────────────────────

/**
 * Build a "my-{entity}" or "department-{entity}" subcommand.
 * Used by both my.js and department.js to generate subcommands from an entity list.
 *
 * @param {{name: string, desc: string}} entityInfo — single entity descriptor
 * @param {string}  urlPrefix   — URL prefix (e.g. 'my' or 'department')
 * @returns {Command}
 */
export function buildEntitySubcommand(entityInfo, urlPrefix) {
  const entityName = entityInfo.name.charAt(0).toUpperCase() + entityInfo.name.slice(1).replace('-', '');
  const displayName = urlPrefix === 'my' ? `${entityInfo.name} owned by you` : `${entityInfo.name}`;

  return new Command(entityInfo.name)
    .description(entityInfo.desc)
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name')
    .option('-c, --count <number>', 'Number of records to return per page', '15')
    .option('--start <number>', 'The starting index for pagination', '0')
    .option('-s, --sort <field>', 'Field to sort by (prepend with - for descending)')
    .option('-w, --where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-q, --query <luceneQuery>', 'Lucene query string')
    .option('-d, --department-ids <ids>', 'Comma-separated list of department IDs (optional filter)')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (options) => {
      invoke(async ({ chalk }) => {
        const url = `/${urlPrefix}${entityName}s/`;
        const params = buildGetParams(options, { departmentIds: options.departmentIds });

        if (options.query) params.query = options.query;

        const response = await api.get(url, { params });
        const records = response.data.data || [];

        if (records.length === 0) {
          console.warn(chalk.yellow(`No ${entityInfo.name} records found.`));
          return;
        }

        if (options.output === 'json') {
          renderJsonOutput(records);
        } else {
          console.log(chalk.cyan(`\n${records.length} ${entityInfo.name} record(s):\n`));
          renderTableOutput(records);
        }
      }, {
        spinnerMsg: `Fetching ${displayName}...`,
        failMsg: `Failed to fetch ${entityInfo.name}.`,
      });
    });
}
