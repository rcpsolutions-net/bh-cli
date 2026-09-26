// src/commands/file.js

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'file' command group for file operations.
 * Subcommands: get, upload, list, attach, detach
 *
 * API endpoints:
 *   GET  /file/{entityType}/{entityId}/{fileId}       — download file (base64)
 *   PUT  /file/{entityType}                            — upload file
 *   GET  /entity/{entityType}/{entityId}/fileAttachments — list attachments
 *   PUT  /entity/{entityType}/{entityId}/fileAttachments/{fileId} — attach
 *   DELETE /entity/{entityType}/{entityId}/fileAttachments/{fileId} — detach
 */
export default function createFileCommand() {
  const file = new Command('file')
    .alias('files')
    .description('Manage file attachments and downloads for entities.');

  // --- Subcommand: file get ---
  file
    .command('get <entityType> <entityId> [fileId]')
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

          if (records.length === 0) {
            spinner.warn(chalk.yellow('No file attachments found.'));
            return;
          }

          spinner.succeed(chalk.green(`Found ${records.length} file attachment(s).`));

          if (options.output === 'json') {
            console.log(JSON.stringify(records, null, 2));
          } else {
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

  // --- Subcommand: file upload ---
  file
    .command('upload <entityType> <entityId>')
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
          console.log(chalk.green(`Attachment ID: ${data.id || 'N/A'}`));
          console.log(chalk.cyan(`File name: ${data.fileName || fileName}`));
          console.log(chalk.blue(`MIME type: ${data.mimeType || mimeType}`));
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

  // --- Subcommand: file attach ---
  file
    .command('attach <entityType> <entityId> <fileId>')
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

  // --- Subcommand: file detach ---
  file
    .command('detach <entityType> <entityId> <fileId>')
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

  return file;
}
