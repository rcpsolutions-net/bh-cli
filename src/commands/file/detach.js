// src/commands/file/detach.js — File detach subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';

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

      const spinner = ora(`Detaching file ${fileId} from ${entityType} ${entityId}...`).start();

      try {
        const url = `/entity/${entityType}/${entityId}/fileAttachments/${fileId}`;
        const response = await api.delete(url);

        spinner.succeed(chalk.green('File detached successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.green(`File ${fileId} detached from ${entityType} ${entityId}.`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to detach file.'));
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
