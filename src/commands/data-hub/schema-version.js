// src/commands/data-hub/schema-version.js — Schema version management subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';

export default function buildSchemaVersionCommand(parent) {
  const schemaVersionCmd = parent.command('schema-version')
    .alias('schema-versions')
    .description('Manage Data Hub entity type schema versions via POST/PUT /data-hub/entityTypeSchemaVersion.');

  // schema-version create
  schemaVersionCmd.command('create')
    .description('Create or update a schema version via POST /data-hub/entityTypeSchemaVersion.')
    .option('-f, --file <filePath>', 'Path to JSON file containing schema version data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-e, --entity-type <name>', 'Entity type name or ID')
    .option('-s, --source-system <name>', 'Source system name (if associating by name)')
    .option('-n, --name <name>', 'Schema version name')
    .option('--schema <schema>', 'JSON schema string')
    .option('--description <description>', 'Schema description')
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
      } else if (options.name || options.schema) {
        payload = { name: options.name || '', schema: options.schema || '' };
        if (options.description) payload.description = options.description;
        if (options.entityType) {
          const etId = Number(options.entityType);
          if (options.sourceSystem) {
            payload.entityType = {
              name: options.entityType,
              sourceSystem: { name: options.sourceSystem },
            };
          } else {
            payload.entityType = Number.isNaN(etId) ? { name: options.entityType } : { id: etId };
          }
        }
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name + --schema.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating schema version...').start();
      try {
        const response = await api.post('/data-hub/entityTypeSchemaVersion', payload);
        spinner.succeed(chalk.green('Schema version created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nSchema Version Result:\n'));
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
        spinner.fail(chalk.red('Failed to create/update schema version.'));
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

  // schema-version get
  schemaVersionCmd.command('get')
    .description('Get schema version info via GET /data-hub/entityTypeSchemaVersion/{schemaVersionId}.')
    .argument('<schemaVersionId>', 'Schema version ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (schemaVersionId, options) => {
      const spinner = ora(`Fetching schema version ${schemaVersionId}...`).start();
      try {
        const response = await api.get(`/data-hub/entityTypeSchemaVersion/${schemaVersionId}`);
        spinner.succeed(chalk.green('Schema version retrieved!'));

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
        spinner.fail(chalk.red('Failed to fetch schema version.'));
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
