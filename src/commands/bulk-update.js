// src/commands/bulk-update.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'bulk-update' command for mass updating multiple entity records.
 * API: POST /massUpdate/{entityType}/{ids...}
 */
export default function createBulkUpdateCommand() {
  const bulkUpdate = new Command('bulk-update')
    .description('Mass update multiple entity records at once.')
    .argument('<entityType>', 'The type of entity to update (e.g., Candidate, Placement)')
    .requiredOption(
      '--ids <ids>',
      'Comma-separated list of entity IDs to update (e.g., "123,456,789")'
    )
    .argument('<fields...>', 'Space-separated key=value pairs for the fields to update (e.g., status=Active notes="Test")')
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, fields, options) => {
      const spinner = ora(`Bulk updating ${entityType} records...`).start();

      // --- 1. Parse the key=value pairs into a JSON object ---
      const requestBody = {};
      for (const field of fields) {
        const parts = field.split('=');
        if (parts.length < 2) {
          spinner.fail(chalk.red('Invalid field format.'));
          console.error(chalk.yellow(`Fields must be in 'key=value' format. You provided: "${field}"`));
          process.exit(1);
        }
        const key = parts[0];
        const value = parts.slice(1).join('=');
        requestBody[key] = value.replace(/^"(.*)"$/, '$1');
      }

      if (Object.keys(requestBody).length === 0) {
        spinner.fail(chalk.red('No fields provided.'));
        console.error(chalk.yellow('You must provide at least one key=value pair to bulk update.'));
        process.exit(1);
      }

      // --- 2. Parse the comma-separated IDs ---
      const ids = options.ids.split(',').map(id => id.trim());

      if (ids.length === 0) {
        spinner.fail(chalk.red('No IDs provided.'));
        console.error(chalk.yellow('You must provide at least one ID via --ids.'));
        process.exit(1);
      }

      // --- 3. Make the API request ---
      try {
        const url = `/massUpdate/${entityType}/${ids.join(',')}`;

        const response = await api.post(url, requestBody);
        const results = response.data.data || [];

        spinner.succeed(chalk.green(`Bulk update complete!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(results, null, 2));
        } else {
          if (results.length === 0) {
            console.log(chalk.yellow('No results returned from the API.'));
            return;
          }

          console.log(chalk.cyan.bold(`\nBulk update results for ${entityType}:\n`));
          const headers = Object.keys(results[0] || {});
          const table = new Table({
            head: headers.map(h => chalk.cyan.bold(h)),
          });
          for (const record of results) {
            table.push(
              headers.map(h => {
                const val = record[h];
                return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
              })
            );
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red(`Bulk update failed.`));

        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 400) {
            console.error(chalk.yellow('This may be due to unsupported entity type for mass update, missing required fields, or invalid data types.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return bulkUpdate;
}
