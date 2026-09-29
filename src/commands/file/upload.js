// src/commands/file/upload.js — File upload subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';
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

      const payload = {
        entityId: Number(entityId),
        fileName,
        mimeType,
        fileData: base64Data,
      };

      await invoke(async ({ chalk }) => {
        const response = await api.put(`/file/${entityType}`, payload);

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          formatUploadResult(response.data, fileName);
        }
      }, { spinnerMsg: `Uploading file "${fileName}" to ${entityType} ${entityId}...`, successMsg: `File "${fileName}" uploaded successfully!`, failMsg: 'Failed to upload file.' });
    });
}
