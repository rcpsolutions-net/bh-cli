// src/commands/query.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';
import { buildGetParams, renderJsonOutput, renderTableOutput, formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'query' command for querying entity records with SQL-like syntax.
 */
export default function createQueryCommand() {
  const query = new Command('query')
    .description('Query for entity records using a SQL-like WHERE clause.')
    .argument('<entityType>', 'The type of entity to query (e.g., Candidate, JobOrder)')
    .requiredOption('-w, --where <sqlWhere>', 'The SQL-like WHERE clause (e.g., "id > 100 AND name = \'John\'")')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id')
    .option('-c, --count <number>', 'Number of records to return per page', '15')
    .option('--start <number>', 'The starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending, e.g., "name DESC")')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .option('--effectiveOn <date>', 'Date to fetch the effective-dated version (YYYY-MM-DD)')
    .option('--layout <name>', 'Layout name (e.g., "CandidateSummary")')
    .option('--show-editable', 'Include editable field information')
    .option('--show-read-only', 'Include read-only field information')
    .option('--privateLabelId <id>', 'Filter by private label ID')
    .option('--meta <level>', 'Include metadata (off, basic, or full)', 'off')
    .option('--jsonp <name>', 'JSONP callback function name')
    .action(async (entityType, options) => {
      const spinner = ora(`Querying for ${entityType} records...`).start();

      try {
        const params = buildGetParams(options, { where: options.where });
        const response = await api.get(`/query/${entityType}`, { params });
        const records = response.data.data;

        if (!records || records.length === 0) {
          spinner.warn(chalk.yellow('No records found matching your WHERE clause.'));
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
        spinner.fail(chalk.red('Query request failed.'));

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

  return query;
}
