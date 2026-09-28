// src/commands/data-hub/get.js — Data Hub get subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

export default function buildDataHubGetCommand(parent) {
  parent.command('get <entityName> [entityId]')
    .description('Retrieve Data Hub information via GET /data-hub/{entityName}/{entityId}.')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityName, entityId, options) => {
      const url = entityId
        ? `/data-hub/${entityName}/${entityId}`
        : `/data-hub/${entityName}`;

      const spinner = ora(`Fetching Data Hub info for ${entityName}${entityId ? ` ${entityId}` : ''}...`).start();
      try {
        const response = await api.get(url);
        spinner.succeed(chalk.green('Data Hub info retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
          console.log(chalk.cyan.bold(`\nData Hub Info for ${entityName}${entityId ? ` ${entityId}` : ''}:\n`));
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
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch Data Hub info.'));
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
