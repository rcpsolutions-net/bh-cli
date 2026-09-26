// src/commands/get.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

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
    .option(
      '-f, --fields <list>',
      'Comma-separated list of fields to return (e.g., "id,name,email")',
      '*'
    )
    .option(
      '-c, --count <number>',
      'Number of records to return per page (for to-many fetches)',
      '25'
    )
    .option(
      '--start <number>',
      'The starting index for pagination (for to-many fetches)',
      '0'
    )
    .option(
      '-s, --sort <field>',
      'Field to sort by (prepend with - for descending, e.g., "-dateAdded")'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .option(
      '--effectiveOn <date>',
      'Date to fetch the effective-dated version of the entity (YYYY-MM-DD format)'
    )
    .option(
      '--layout <name>',
      'Layout name to use for the response (e.g., "CandidateSummary")'
    )
    .option(
      '--show-editable',
      'Include editable field information in the response'
    )
    .option(
      '--show-read-only',
      'Include read-only field information in the response'
    )
    .option(
      '--privateLabelId <id>',
      'Filter by private label ID'
    )
    .option(
      '--meta <level>',
      'Include metadata (off, basic, or full)',
      'off'
    )
    .option(
      '--jsonp <name>',
      'JSONP callback function name'
    )
    .action(async (entityType, entityId, toManyFieldName, options) => {
      const spinner = ora(
        toManyFieldName
          ? `Fetching ${toManyFieldName} for ${entityType} ${entityId}...`
          : `Fetching ${entityType} ${entityId}...`
      ).start();

      try {
        let url, params;

        if (toManyFieldName) {
          // To-many association fetch: GET /entity/{entityType}/{id}/{toManyFieldName}s
          url = `/entity/${entityType}/${entityId}/${toManyFieldName}s`;
          params = {
            fields: options.fields,
            count: options.count,
            start: options.start,
          };
          if (options.sort) {
            params.sort = options.sort;
          }
        } else {
          // Single entity fetch: GET /entity/{entityType}/{id}
          url = `/entity/${entityType}/${entityId}`;
          params = {
            fields: options.fields,
          };
        }

        // Add effectiveOn for effective-dated entities
        if (options.effectiveOn) {
          params.effectiveOn = options.effectiveOn;
        }

        // Add layout parameter
        if (options.layout) {
          params.layout = options.layout;
        }

        // Add showEditable/showReadOnly flags
        if (options.showEditable) {
          params.showEditable = true;
        }
        if (options.showReadOnly) {
          params.showReadOnly = true;
        }

        // Add privateLabelId
        if (options.privateLabelId) {
          params.privateLabelId = options.privateLabelId;
        }

        // Add meta parameter
        if (options.meta && options.meta !== 'off') {
          params.meta = options.meta;
        }

        // Add JSONP callback
        if (options.jsonp) {
          params.callback = options.jsonp;
        }

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
            console.log(JSON.stringify(records, null, 2));
          } else {
            console.log(chalk.cyan.bold(`\n${toManyFieldName} for ${entityType} ${entityId}:\n`));
            const headers = Object.keys(records[0] || {});
            const table = new Table({
              head: headers.map(h => chalk.cyan.bold(h)),
            });
            for (const record of records) {
              table.push(
                headers.map(h => {
                  const val = record[h];
                  return typeof val === 'object' && val !== null
                    ? JSON.stringify(val)
                    : String(val ?? '');
                })
              );
            }
            console.log(table.toString());
          }
        } else {
          // Single entity response: { data: {...} }
          const record = response.data.data;

          spinner.succeed(chalk.green('Fetch successful!'));

          if (options.output === 'json') {
            console.log(JSON.stringify(record, null, 2));
          } else {
            console.log(chalk.cyan.bold(`\nDetails for ${entityType} ${entityId}:\n`));
            const table = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of Object.entries(record)) {
              table.push([
                chalk.bold(key),
                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
              ]);
            }
            console.log(table.toString());
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch record.'));

        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 404) {
            console.error(chalk.yellow('The record you are trying to fetch does not exist.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return get;
}
