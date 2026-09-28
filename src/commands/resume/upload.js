// src/commands/resume/upload.js — Resume upload subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { readResumeFile, resolveFileName } from './_shared.js';

export default function buildUploadCommand(parent) {
  parent.command('upload <entityType> <entityId>')
    .description('Upload a resume file for an entity (typically Candidate).')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, options) => {
      const filePath = options.file;
      if (!filePath) {
        console.error(chalk.red('Error: --file <filePath> is required.'));
        process.exit(1);
      }

      const fileBuffer = readResumeFile(filePath);
      const base64Data = fileBuffer.toString('base64');
      const fileName = resolveFileName(options, filePath);

      const spinner = ora(`Uploading resume "${fileName}" for ${entityType} ${entityId}...`).start();

      try {
        const url = `/resume/${entityType}/${entityId}`;
        const payload = { fileName, fileData: base64Data };
        const response = await api.post(url, payload);
        const data = response.data;

        spinner.succeed(chalk.green('Resume uploaded successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.green(`Resume "${fileName}" uploaded for ${entityType} ${entityId}.`));
          if (data.id) console.log(chalk.cyan(`Attachment ID: ${data.id}`));
          if (data.fileName) console.log(chalk.blue(`File name: ${data.fileName}`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to upload resume.'));
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
