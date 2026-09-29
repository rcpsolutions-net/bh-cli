// src/commands/version/delete.js — Delete version subcommand.

import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';

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

      await invoke(async ({ chalk }) => {
        const response = await api.delete(`/entity/${entityType}/${entityId}`, { data: payload });

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          console.log(chalk.green(`Version ${options.versionId} successfully deleted for ${entityType} ${entityId}.`));
        }
      }, { spinnerMsg: `Deleting version ${options.versionId} for ${entityType} ${entityId}...`, successMsg: `Version ${options.versionId} deleted for ${entityType}!`, failMsg: 'Failed to delete version.' });
    });
}
