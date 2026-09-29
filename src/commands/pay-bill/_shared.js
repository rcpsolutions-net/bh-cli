// src/commands/pay-bill/_shared.js — Shared helpers for pay-bill subcommands.
// Internal files import directly from this module, never through the barrel.

import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

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

// ── Generic "get [id]" endpoint factory ───────────────────────────────

/**
 * Create a parent subcommand with a standard `get [id]` subcommand.
 * Usage:
 *   const cmd = buildGetEndpoint(parent, 'timesheet', { entityName: 'Timesheet' });
 */
export function buildGetEndpoint(parent, name, { entityName, pluralEntityName, fieldsDefault = '', successMsgs } = {}) {
  const cmd = parent.command(name).description(`Manage ${entityName || name} entities.`);

  const getCmd = cmd.command('get [id]')
    .description(`Get a ${entityName || name} by ID, or list all.`)
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', fieldsDefault)
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const helpers = await import('../../lib/helpers.js');
      const msgIdx = id ? 0 : 1;
      const msgs = successMsgs || { single: 'Fetch successful!', plural: 'Listing complete!' };

      await helpers.invoke(async ({ chalk }) => {
        const url = id ? `/entity/${entityName || name}/${id}` : `/query/${entityName || name}`;
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? (response.data?.data ?? response.data) : (response.data?.data || []);

        if (options.output === 'json') {
          helpers.renderJsonOutput(data);
        } else {
          const records = id ? [data] : data;
          renderTable(records, `${entityName || name}${id ? '' : 's'}`);
        }
      }, {
        spinnerMsg: id ? `Fetching ${entityName || name} ${id}...` : `Listing ${(entityName || name) + 's'}...`,
        successMsg: msgs[msgIdx] || msgs.single || msgs.plural,
        failMsg: `Failed to fetch ${entityName || name}.`,
      });
    });

  return getCmd;
}
