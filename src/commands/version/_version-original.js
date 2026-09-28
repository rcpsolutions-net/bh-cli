// src/commands/version.js

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Parses key=value pairs from command-line arguments.
 * Handles nested fields like "address.city=NYC" and "owner.id=123".
 */
function parseFieldArgs(fieldArgs) {
  const result = {};
  for (const arg of fieldArgs) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex === -1) {
      console.error(chalk.red(`Error: Field argument must be in key=value format: ${arg}`));
      process.exit(1);
    }
    const key = arg.substring(0, eqIndex).trim();
    const value = arg.substring(eqIndex + 1).trim();
    // Try to parse as number
    const parsed = Number(value);
    result[key] = Number.isNaN(parsed) ? value : parsed;
  }
  return result;
}

/**
 * Creates the 'version' command group for effective-dated entity operations.
 * API: POST /entity/{entityType} (new version),
 *      POST /entity/{entityType}/{id} (update version),
 *      DELETE /entity/{entityType}/{id} (delete version)
 * Supported effective-dated entities: Location, LocationGroup, Branch, BranchGroup,
 * CustomObject1-35, and any custom object configured as effective-dated.
 */
export default function createVersionCommand() {
  const version = new Command('version')
    .alias('versions')
    .description('Manage effective-dated entity versions (Location, Branch, CustomObjects, etc.).');

  // Subcommand: list all versions
  version.command('list <entityType> <entityId>')
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

  // Subcommand: create new version
  version.command('create <entityType>')
    .description('Create a new version of an effective-dated entity via POST /entity/{entityType}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing version fields')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[fieldArgs...]', 'Key=value pairs for version fields (e.g., "effectiveDate=2024-01-01" "title=Office")')
    .action(async (entityType, fieldArgs, options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (fieldArgs && fieldArgs.length > 0) {
        payload = parseFieldArgs(fieldArgs);
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or key=value field arguments.'));
        process.exit(1);
      }

      const spinner = ora(`Creating new version for ${entityType}...`).start();
      try {
        const response = await api.post(`/entity/${entityType}`, payload);
        spinner.succeed(chalk.green(`New version created for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nVersion Created for ${entityType}:\n`));
          const changedEntityId = response.data?.changedEntityId || '-';
          const changedVersionId = response.data?.changedVersionId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [
              chalk.cyan.bold('Changed Entity ID'),
              chalk.cyan.bold('Changed Version ID'),
              chalk.cyan.bold('Change Type'),
            ],
          });
          table.push([
            String(changedEntityId),
            String(changedVersionId),
            chalk.green(changeType),
          ]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create version.'));
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

  // Subcommand: update specific version
  version.command('update <entityType> <entityId>')
    .description('Update a specific version of an effective-dated entity via POST /entity/{entityType}/{entityId}.')
    .option('-v, --versionId <versionId>', 'The version ID to update (required)')
    .option('-f, --file <filePath>', 'Path to JSON file containing version fields')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[fieldArgs...]', 'Key=value pairs for version fields (e.g., "customText1=updated"')
    .action(async (entityType, entityId, fieldArgs, options) => {
      if (!options.versionId) {
        console.error(chalk.red('Error: --versionId <versionId> is required for version update.'));
        process.exit(1);
      }

      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (fieldArgs && fieldArgs.length > 0) {
        payload = parseFieldArgs(fieldArgs);
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, --versionId, or key=value field arguments.'));
        process.exit(1);
      }

      // Ensure versionId is in the payload
      payload.versionId = Number(options.versionId);

      const spinner = ora(`Updating version ${options.versionId} for ${entityType} ${entityId}...`).start();
      try {
        const response = await api.post(`/entity/${entityType}/${entityId}`, payload);
        spinner.succeed(chalk.green(`Version ${options.versionId} updated for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nVersion Updated for ${entityType}:\n`));
          const changedEntityId = response.data?.changedEntityId || '-';
          const changedVersionId = response.data?.changedVersionId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [
              chalk.cyan.bold('Changed Entity ID'),
              chalk.cyan.bold('Changed Version ID'),
              chalk.cyan.bold('Change Type'),
            ],
          });
          table.push([
            String(changedEntityId),
            String(changedVersionId),
            chalk.green(changeType),
          ]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update version.'));
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

  // Subcommand: delete version
  version.command('delete <entityType> <entityId>')
    .description('Delete a specific version of an effective-dated entity via DELETE /entity/{entityType}/{entityId}.')
    .option('-v, --versionId <versionId>', 'The version ID to delete (required)')
    .option('-f, --force', 'Skip confirmation prompt')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, options) => {
      if (!options.versionId) {
        console.error(chalk.red('Error: --versionId <versionId> is required for version delete.'));
        process.exit(1);
      }

      if (!options.force) {
        const { confirm } = await (await import('inquirer')).prompt([{
          name: 'confirm',
          type: 'confirm',
          message: chalk.yellow(`Are you sure you want to delete version ${options.versionId} of ${entityType} ${entityId}?`),
          default: false,
        }]);
        if (!confirm) {
          console.log(chalk.yellow('Aborted.'));
          return;
        }
      }

      const payload = { versionId: Number(options.versionId) };
      const spinner = ora(`Deleting version ${options.versionId} for ${entityType} ${entityId}...`).start();
      try {
        const response = await api.delete(`/entity/${entityType}/${entityId}`, { data: payload });
        spinner.succeed(chalk.green(`Version ${options.versionId} deleted for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.green(`Version ${options.versionId} successfully deleted for ${entityType} ${entityId}.`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to delete version.'));
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

  return version;
}
