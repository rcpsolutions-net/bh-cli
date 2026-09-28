// src/commands/version/list.js — List all versions subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

export default function buildListCommand(parent) {
  parent.command('list <entityType> <entityId>')
    .alias('all')
    .description('List all versions of an effective-dated entity via GET /entity/{entityType}/{entityId}/versions.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', '*')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (entityType, entityId, options) => {
      const spinner = ora(`Fetching all versions for ${entityType} ${entityId}...`).start();

      try {
        const response = await api.get(`/entity/${entityType}/${entityId}/versions`, {
          params: { fields: options.fields },
        });

        const records = response.data?.data || [];
        spinner.succeed(chalk.green(`Fetched ${records.length} version(s).`));

        if (options.output === 'json') {
          console.log(JSON.stringify(records, null, 2));
        } else {
          if (records.length === 0) {
            console.log(chalk.yellow(`No versions found for ${entityType} ${entityId}.`));
            return;
          }

          console.log(chalk.cyan.bold(`\nAll Versions for ${entityType} ${entityId}:\n`));
          const headers = Object.keys(records[0] || {});
          const table = new Table({
            head: headers.map(h => chalk.cyan.bold(h)),
          });
          for (const record of records) {
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
        spinner.fail(chalk.red('Failed to fetch versions.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });
}
