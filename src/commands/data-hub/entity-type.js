// src/commands/data-hub/entity-type.js — Entity type management subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

export default function buildEntityTypeCommand(parent) {
  const entityTypeCmd = parent.command('entity-type')
    .alias('entity-types')
    .description('Manage Data Hub entity types via POST/PUT /data-hub/entityType.');

  // entity-type create
  entityTypeCmd.command('create')
    .description('Create or update an entity type via POST /data-hub/entityType.')
    .option('-f, --file <filePath>', 'Path to JSON file containing entity type data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-s, --source-system <name>', 'Source system name or ID')
    .option('-n, --name <name>', 'Entity type name')
    .option('-N, --display <display>', 'Display name for entity type')
    .option('--private', 'Mark entity type as private', false)
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
        if (options.private) payload.isPrivate = true;
        if (options.sourceSystem) {
          const srcId = Number(options.sourceSystem);
          payload.sourceSystem = Number.isNaN(srcId) ? { name: options.sourceSystem } : { id: srcId };
        }
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating entity type...').start();
      try {
        const response = await api.post('/data-hub/entityType', payload);
        spinner.succeed(chalk.green('Entity type created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nEntity Type Result:\n'));
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
        spinner.fail(chalk.red('Failed to create/update entity type.'));
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

  // entity-type get
  entityTypeCmd.command('get')
    .description('Get entity type info via GET /data-hub/entityType/{entityTypeId}.')
    .argument('<entityTypeId>', 'Entity type ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityTypeId, options) => {
      const spinner = ora(`Fetching entity type ${entityTypeId}...`).start();
      try {
        const response = await api.get(`/data-hub/entityType/${entityTypeId}`);
        spinner.succeed(chalk.green('Entity type retrieved!'));

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
        spinner.fail(chalk.red('Failed to fetch entity type.'));
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
