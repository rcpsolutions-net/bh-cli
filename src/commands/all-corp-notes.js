// src/commands/all-corp-notes.js

import { Command } from 'commander';
import { invoke, buildAllCorpNotesParams, renderJsonOutput, renderTableOutput } from '../lib/helpers.js';
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
    .option('--clientCorpId <id>', 'ClientCorporation ID (required)')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,title,body,dateAdded')
    .option('-l, --layout <name>', 'Layout name (e.g., "NoteSummary")')
    .option('-c, --count <number>', 'Number of records to return per page', '25')
    .option('--start <number>', 'The starting index for pagination', '0')
    .option('-s, --sort <field>', 'Field to sort by (prepend with - for descending)')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (options) => {
      if (!options.clientCorpId) {
        console.error(chalk.red('Error: --clientCorpId is required.'));
        process.exit(1);
      }

      invoke(async ({ chalk }) => {
        const url = '/allCorpNotes/';
        const params = buildAllCorpNotesParams(options, { clientCorpId: options.clientCorpId });

        const response = await api.get(url, { params });
        const records = response.data.data || [];

        if (records.length === 0) {
          console.warn(chalk.yellow('No notes found for this ClientCorporation.'));
          return;
        }

        if (options.output === 'json') {
          renderJsonOutput(records);
        } else {
          console.log(chalk.cyan(`\n${records.length} note(s):\n`));
          renderTableOutput(records);
        }
      }, {
        spinnerMsg: `Fetching all corporation notes for ClientCorporation ${options.clientCorpId}...`,
        failMsg: 'Failed to fetch all corporation notes.',
      });
    });

  return allCorpNotes;
}
