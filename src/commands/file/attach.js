// src/commands/file/attach.js — File attach subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';

export default function buildAttachCommand(parent) {
  parent.command('attach <entityType> <entityId> <fileId>')
    .description('Attach an existing file to an entity.')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, fileId, options) => {
      const spinner = ora(`Attaching file ${fileId} to ${entityType} ${entityId}...`).start();

      try {
        const url = `/entity/${entityType}/${entityId}/fileAttachments/${fileId}`;
        const response = await api.put(url);

        spinner.succeed(chalk.green('File attached successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.green(`File ${fileId} attached to ${entityType} ${entityId}.`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to attach file.'));
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
