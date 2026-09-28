// src/commands/file/_shared.js — Shared helpers for file subcommands.

import chalk from 'chalk';
import Table from 'cli-table3';

/** Format file attachment records as a table. */
export function formatFileAttachments(records, entityType, entityId) {
  if (records.length === 0) {
    console.log(chalk.yellow('No file attachments found.'));
    return;
  }
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

/** Format an upload response for non-JSON output. */
export function formatUploadResult(data, fileName) {
  console.log(chalk.green(`Attachment ID: ${data.id || 'N/A'}`));
  console.log(chalk.cyan(`File name: ${data.fileName || fileName}`));
  console.log(chalk.blue(`MIME type: ${data.mimeType || 'application/octet-stream'}`));
}
