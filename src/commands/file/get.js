// src/commands/file/get.js — File download/list subcommand.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';
import { formatFileAttachments } from './_shared.js';

export default function buildGetCommand(parent) {
  parent.command('get <entityType> <entityId> [fileId]')
    .description('Download a file attachment (returns base64) or list if no fileId given.')
    .option('-o, --output <format>', 'Output format (table, json, or base64)', 'json')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return (list mode)', 'id,name,fileSize,mimeType')
    .action(async (entityType, entityId, fileId, options) => {
      if (fileId) {
        // Download mode: GET /file/{entityType}/{entityId}/{fileId}
        const spinner = ora(`Downloading file ${fileId} for ${entityType} ${entityId}...`).start();

        try {
          const url = `/file/${entityType}/${entityId}/${fileId}`;
          const response = await api.get(url);
          const data = response.data;

          spinner.succeed(chalk.green('File downloaded successfully!'));

          if (options.output === 'base64') {
            process.stdout.write(data);
          } else if (options.output === 'json') {
            console.log(JSON.stringify({ data, base64: true }, null, 2));
          } else {
            console.log(chalk.cyan(`File ${fileId} downloaded (base64). Length: ${data?.length || 0} bytes`));
            console.log(JSON.stringify({ data }, null, 2));
          }
        } catch (error) {
          spinner.fail(chalk.red('Failed to download file.'));
          if (error.response) {
            const status = error.response.status;
            const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
            console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          } else {
            console.error(chalk.red('An unexpected error occurred:', error.message));
          }
          process.exit(1);
        }
      } else {
        // List mode: GET /entity/{entityType}/{entityId}/fileAttachments
        const spinner = ora(`Listing file attachments for ${entityType} ${entityId}...`).start();

        try {
          const url = `/entity/${entityType}/${entityId}/fileAttachments`;
          const params = { fields: options.fields };

          const response = await api.get(url, { params });
          const records = response.data.data || [];

          spinner.succeed(chalk.green(`Found ${records.length} file attachment(s).`));
          formatFileAttachments(records, entityType, entityId);
        } catch (error) {
          spinner.fail(chalk.red('Failed to list file attachments.'));
          if (error.response) {
            const status = error.response.status;
            const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
            console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          } else {
            console.error(chalk.red('An unexpected error occurred:', error.message));
          }
          process.exit(1);
        }
      }
    });
}
