// src/commands/data-hub/source-system.js — Source system management subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

export default function buildSourceSystemCommand(parent) {
  const sourceSystemCmd = parent.command('source-system')
    .alias('source-systems')
    .description('Manage Data Hub source systems via POST/PUT /data-hub/sourceSystem.');

  // source-system create
  sourceSystemCmd.command('create')
    .description('Create or update a source system via POST /data-hub/sourceSystem.')
    .option('-f, --file <filePath>', 'Path to JSON file containing source system data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-n, --name <name>', 'Source system name')
    .option('-N, --display <display>', 'Display name for source system')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.name) {
        payload = { name: options.name };
        if (options.display) payload.display = options.display;
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating source system...').start();
      try {
        const response = await api.post('/data-hub/sourceSystem', payload);
        spinner.succeed(chalk.green('Source system created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nSource System Result:\n'));
          const changedEntityType = response.data?.changedEntityType || '-';
          const changedEntityId = response.data?.changedEntityId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [chalk.cyan.bold('Entity Type'), chalk.cyan.bold('Entity ID'), chalk.cyan.bold('Change Type')],
          });
          table.push([changedEntityType, String(changedEntityId), chalk.green(changeType)]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create/update source system.'));
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

  // source-system get
  sourceSystemCmd.command('get')
    .description('Get source system info via GET /data-hub/sourceSystem/{sourceSystemId}.')
    .argument('<sourceSystemId>', 'Source system ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (sourceSystemId, options) => {
      const spinner = ora(`Fetching source system ${sourceSystemId}...`).start();
      try {
        const response = await api.get(`/data-hub/sourceSystem/${sourceSystemId}`);
        spinner.succeed(chalk.green('Source system retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
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
        spinner.fail(chalk.red('Failed to fetch source system.'));
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
