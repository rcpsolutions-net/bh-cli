// src/commands/resume/download.js — Resume download subcommand.

import { writeFileSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';

export default function buildDownloadCommand(parent) {
  parent.command('download <entityType> <entityId>')
    .description('Download a resume for an entity.')
    .option('-o, --output <format>', 'Output format (json or base64)', 'json')
    .option('-d, --destination <path>', 'Save to file path instead of printing to stdout')
    .action(async (entityType, entityId, options) => {
      const spinner = ora(`Downloading resume for ${entityType} ${entityId}...`).start();

      try {
        const url = `/resume/${entityType}/${entityId}`;
        const response = await api.get(url);
        const data = response.data;

        spinner.succeed(chalk.green('Resume downloaded successfully!'));

        if (options.output === 'base64') {
          if (options.destination) {
            writeFileSync(options.destination, data, 'base64');
            console.log(chalk.green(`Resume saved to ${options.destination}`));
          } else {
            process.stdout.write(data);
          }
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to download resume.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 404) {
            console.error(chalk.yellow('No resume found for this entity.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });
}
