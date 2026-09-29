// src/commands/version/list.js — List all versions subcommand.

import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke } from '../../lib/helpers.js';

export default function buildListCommand(parent) {
  parent.command('list <entityType> <entityId>')
    .alias('all')
    .description('List all versions of an effective-dated entity via GET /entity/{entityType}/{entityId}/versions.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', '*')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (entityType, entityId, options) => {
      const helpers = await import('../../lib/helpers.js');

      await helpers.invoke(async ({ chalk }) => {
        const response = await api.get(`/entity/${entityType}/${entityId}/versions`, {
          params: { fields: options.fields },
        });

        const records = response.data?.data || [];

        if (options.output === 'json') {
          helpers.renderJsonOutput(records);
        } else if (records.length === 0) {
          console.log(chalk.yellow(`No versions found for ${entityType} ${entityId}.`));
        } else {
          console.log(chalk.cyan.bold(`\nAll Versions for ${entityType} ${entityId}:\n`));
          helpers.renderTableOutput(records);
        }
      }, { spinnerMsg: `Fetching all versions for ${entityType} ${entityId}...`, successMsg: 'Done.', failMsg: 'Failed to fetch versions.' });
    });
}
