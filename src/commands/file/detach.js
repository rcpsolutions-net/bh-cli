// src/commands/file/detach.js — File detach subcommand.

import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';

export default function buildDetachCommand(parent) {
  parent.command('detach <entityType> <entityId> <fileId>')
    .description('Detach (remove) a file attachment from an entity.')
    .option('-f, --force', 'Skip confirmation prompt')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, fileId, options) => {
      const inquirer = (await import('inquirer')).default;

      if (!options.force) {
        const confirm = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to detach file ${fileId} from ${entityType} ${entityId}?`,
            default: false,
          },
        ]);
        if (!confirm.confirm) {
          console.log(chalk.yellow('Detachment cancelled.'));
          return;
        }
      }

      await invoke(async ({ chalk }) => {
        const response = await api.delete(`/entity/${entityType}/${entityId}/fileAttachments/${fileId}`);

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          console.log(chalk.green(`File ${fileId} detached from ${entityType} ${entityId}.`));
        }
      }, { spinnerMsg: `Detaching file ${fileId} from ${entityType} ${entityId}...`, successMsg: 'File detached successfully!', failMsg: 'Failed to detach file.' });
    });
}
