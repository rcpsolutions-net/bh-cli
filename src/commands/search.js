// src/commands/search.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';
import { buildGetParams, renderJsonOutput, renderTableOutput, formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'search' command for querying entity records using Lucene queries.
 */
export default function createSearchCommand() {
  const search = new Command('search')
    .description('Search for entity records using a Lucene query.')
    .argument('<entityType>', 'The type of entity to search (e.g., Candidate, JobOrder)')
    .requiredOption('-q, --query <luceneQuery>', 'The Lucene query string (e.g., "isDeleted:0 AND name:John*")')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name')
    .option('-c, --count <number>', 'Number of records to return per page', '15')
    .option('--start <number>', 'The starting index for pagination', '0')
    .option('-s, --sort <field>', 'Field to sort by (prepend with - for descending)')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .option('--effectiveOn <date>', 'Date to fetch the effective-dated version (YYYY-MM-DD)')
    .option('--layout <name>', 'Layout name (e.g., "CandidateSummary")')
    .option('--show-editable', 'Include editable field information')
    .option('--show-read-only', 'Include read-only field information')
    .option('--privateLabelId <id>', 'Filter by private label ID')
    .option('--meta <level>', 'Include metadata (off, basic, or full)', 'off')
    .option('--jsonp <name>', 'JSONP callback function name')
    .action(async (entityType, options) => {
      const spinner = ora(`Searching for ${entityType} records...`).start();

      try {
        const params = buildGetParams(options, { query: options.query });
        const response = await api.get(`/search/${entityType}`, { params });
        const records = response.data.data;

        if (!records || records.length === 0) {
          spinner.warn(chalk.yellow('No records found matching your query.'));
          return;
        }

        spinner.succeed(chalk.green(`Found ${records.length} records.`));

        if (options.output === 'json') {
          renderJsonOutput(records);
        } else {
          const headers = Object.keys(records[0] || {});
          renderTableOutput(records, headers);
        }
      } catch (error) {
        spinner.fail(chalk.red('Search request failed.'));

        const apiErr = formatApiError(error, entityType);
        if (apiErr) {
          console.error(chalk.red(`Error ${apiErr.status}: ${apiErr.message}`));
          if (apiErr.hint) console.error(apiErr.hint);
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return search;
}