// src/commands/file/upload.js — File upload subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { formatUploadResult } from './_shared.js';

export default function buildUploadCommand(parent) {
  parent.command('upload <entityType> <entityId>')
    .description('Upload a file attachment to an entity.')
    .option('-f, --file <filePath>', 'Path to the file to upload (required)')
    .option('-n, --name <fileName>', 'Display name for the attachment')
    .option('-t, --type <mimeType>', 'MIME type of the file (e.g., application/pdf)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, options) => {
      const filePath = options.file;
      if (!filePath) {
        console.error(chalk.red('Error: --file <filePath> is required.'));
        process.exit(1);
      }
      if (!existsSync(filePath)) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
      }

      const fileBuffer = readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const fileName = options.name || filePath.split('/').pop() || 'unnamed';
      const mimeType = options.type || 'application/octet-stream';

      const spinner = ora(`Uploading file "${fileName}" to ${entityType} ${entityId}...`).start();

      try {
        const url = `/file/${entityType}`;
        const payload = {
          entityId: Number(entityId),
          fileName,
          mimeType,
          fileData: base64Data,
        };

        const response = await api.put(url, payload);
        const data = response.data;

        spinner.succeed(chalk.green(`File "${fileName}" uploaded successfully!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          formatUploadResult(data, fileName);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to upload file.'));
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
