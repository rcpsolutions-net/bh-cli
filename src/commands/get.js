// src/commands/get.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';
import { buildGetParams, renderJsonOutput, renderTableOutput, formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'get' command for fetching a single entity record.
 * Also supports to-many association fetch when a toManyFieldName is provided.
 * API: GET /entity/{entityType}/{id}/{toManyFieldName}s?fields=...
 */
export default function createGetCommand() {
  const get = new Command('get')
    .description('Fetch a single entity record, optionally with to-many associations.')
    .argument('<entityType>', 'The type of entity (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the entity record')
    .argument('[toManyFieldName]', 'Optional to-many association field (e.g., primarySkills, notes)')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return (e.g., "id,name,email")', '*')
    .option('-c, --count <number>', 'Number of records to return per page (for to-many fetches)', '25')
    .option('--start <number>', 'The starting index for pagination (for to-many fetches)', '0')
    .option('-s, --sort <field>', 'Field to sort by (prepend with - for descending, e.g., "-dateAdded")')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .option('--effectiveOn <date>', 'Date to fetch the effective-dated version (YYYY-MM-DD)')
    .option('--layout <name>', 'Layout name (e.g., "CandidateSummary")')
    .option('--show-editable', 'Include editable field information in the response')
    .option('--show-read-only', 'Include read-only field information in the response')
    .option('--privateLabelId <id>', 'Filter by private label ID')
    .option('--meta <level>', 'Include metadata (off, basic, or full)', 'off')
    .option('--jsonp <name>', 'JSONP callback function name')
    .action(async (entityType, entityId, toManyFieldName, options) => {
      const spinner = ora(
        toManyFieldName
          ? `Fetching ${toManyFieldName} for ${entityType} ${entityId}...`
          : `Fetching ${entityType} ${entityId}...`
      ).start();

      try {
        const url = toManyFieldName
          ? `/entity/${entityType}/${entityId}/${toManyFieldName}s`
          : `/entity/${entityType}/${entityId}`;

        // To-many gets pagination defaults; single-entity gets none.
        const extra = toManyFieldName ? { count: options.count, start: options.start } : undefined;
        const params = buildGetParams(options, extra);

        const response = await api.get(url, { params });

        if (toManyFieldName) {
          // To-many response: { data: [...] }
          const records = response.data.data || [];

          if (records.length === 0) {
            spinner.warn(chalk.yellow(`No ${toManyFieldName} records found.`));
            return;
          }

          spinner.succeed(chalk.green(`Fetched ${records.length} ${toManyFieldName} record(s).`));

          if (options.output === 'json') {
            renderJsonOutput(records);
          } else {
            console.log(chalk.cyan.bold(`\n${toManyFieldName} for ${entityType} ${entityId}:\n`));
            const headers = Object.keys(records[0] || {});
            renderTableOutput(records, headers);
          }
        } else {
          // Single entity response: { data: {...} }
          const record = response.data.data;

          if (!record) {
            spinner.warn(chalk.yellow('No data returned from API.'));
            return;
          }

          spinner.succeed(chalk.green('Fetch successful!'));

          if (options.output === 'json') {
            renderJsonOutput(record);
          } else {
            console.log(chalk.cyan.bold(`\nDetails for ${entityType} ${entityId}:\n`));
            const rows = Object.entries(record);
            const table = new (await import('cli-table3')).default({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of rows) {
              table.push([chalk.bold(key), typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')]);
            }
            console.log(table.toString());
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch record.'));

        const apiErr = formatApiError(error, entityType);
        if (apiErr) {
          console.error(chalk.red(`Error ${apiErr.status}: ${apiErr.message}`));
          if (apiErr.hint) console.error(apiErr.hint);
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return get;
}
