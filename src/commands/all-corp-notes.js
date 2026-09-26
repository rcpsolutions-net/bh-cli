// src/commands/all-corp-notes.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'all-corp-notes' command for querying all Notes across a ClientCorporation.
 * API: GET /allCorpNotes/?fields=...&layout=...&clientCorpId=...&start=...&count=...
 * Returns all Notes with _score.
 */
export default function createAllCorpNotesCommand() {
  const allCorpNotes = new Command('all-corp-notes')
    .description('Query all Notes across a ClientCorporation (includes _score).');

  allCorpNotes
    .option(
      '--clientCorpId <id>',
      'ClientCorporation ID (required)',
    )
    .option(
      '-f, --fields <list>',
      'Comma-separated list of fields to return',
      'id,title,body,dateAdded'
    )
    .option(
      '-l, --layout <name>',
      'Layout name (e.g., "NoteSummary")'
    )
    .option(
      '-c, --count <number>',
      'Number of records to return per page',
      '25'
    )
    .option(
      '--start <number>',
      'The starting index for pagination',
      '0'
    )
    .option(
      '-s, --sort <field>',
      'Field to sort by (prepend with - for descending)'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (options) => {
      const clientCorpId = options.clientCorpId;
      if (!clientCorpId) {
        console.error(chalk.red('Error: --clientCorpId is required.'));
        process.exit(1);
      }

      const spinner = ora(`Fetching all corporation notes for ClientCorporation ${clientCorpId}...`).start();

      try {
        const url = '/allCorpNotes/';
        const params = {
          fields: options.fields,
          count: options.count,
          start: options.start,
        };

        params.clientCorpId = clientCorpId;
        if (options.layout) params.layout = options.layout;
        if (options.sort) params.sort = options.sort;

        const response = await api.get(url, { params });
        const records = response.data.data || [];

        if (records.length === 0) {
          spinner.warn(chalk.yellow('No notes found for this ClientCorporation.'));
          return;
        }

        spinner.succeed(chalk.green(`Fetched ${records.length} note(s).`));

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
        spinner.fail(chalk.red('Failed to fetch all corporation notes.'));
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

  return allCorpNotes;
}
