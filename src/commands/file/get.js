// src/commands/file/get.js — File download/list subcommand.

import { Command } from 'commander';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';
import { formatFileAttachments } from './_shared.js';

export default function buildGetCommand(parent) {
  parent.command('get <entityType> <entityId> [fileId]')
    .description('Download a file attachment (returns base64) or list if no fileId given.')
    .option('-o, --output <format>', 'Output format (table, json, or base64)', 'json')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return (list mode)', 'id,name,fileSize,mimeType')
    .action(async (entityType, entityId, fileId, options) => {
      const helpers = await import('../../lib/helpers.js');

      if (fileId) {
        // Download mode: GET /file/{entityType}/{entityId}/{fileId}
        await helpers.invoke(async ({ chalk }) => {
          const response = await api.get(`/file/${entityType}/${entityId}/${fileId}`);
          const data = response.data;

          if (options.output === 'base64') {
            process.stdout.write(data);
          } else if (options.output === 'json') {
            helpers.renderJsonOutput({ data, base64: true });
          } else {
            console.log(chalk.cyan(`File ${fileId} downloaded (base64). Length: ${data?.length || 0} bytes`));
            helpers.renderJsonOutput({ data });
          }
        }, { spinnerMsg: `Downloading file ${fileId} for ${entityType} ${entityId}...`, successMsg: 'File downloaded successfully!', failMsg: 'Failed to download file.' });
      } else {
        // List mode: GET /entity/{entityType}/{entityId}/fileAttachments
        await helpers.invoke(async ({ chalk }) => {
          const params = { fields: options.fields };
          const response = await api.get(`/entity/${entityType}/${entityId}/fileAttachments`, { params });
          const records = response.data.data || [];

          formatFileAttachments(records, entityType, entityId);
        }, { spinnerMsg: `Listing file attachments for ${entityType} ${entityId}...`, successMsg: 'List complete.', failMsg: 'Failed to list file attachments.' });
      }
    });
}
