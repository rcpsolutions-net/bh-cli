// src/commands/version/delete.js — Delete version subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';

export default function buildDeleteCommand(parent) {
  parent.command('delete <entityType> <entityId>')
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
}
