// src/commands/query.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'query' command for querying entity records with SQL-like syntax.
 */
export default function createQueryCommand() {
  const query = new Command('query')
    .description('Query for entity records using a SQL-like WHERE clause.')
    .argument('<entityType>', 'The type of entity to query (e.g., Candidate, JobOrder)')
    .requiredOption(
      '-w, --where <sqlWhere>', 
      'The SQL-like WHERE clause (e.g., "id > 100 AND name = \'John\'")'
    )
    .option(
      '-f, --fields <list>', 
      'Comma-separated list of fields to return', 
      'id' // A minimal, safe default
    )
    .option(
      '-c, --count <number>',
      'Number of records to return per page',
      '15'
    )
    .option(
        '--start <number>',
        'The starting index for pagination',
        '0'
    )
    .option(
      '--orderBy <field>',
      'Field to sort by (add DESC for descending, e.g., "name DESC")'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, options) => {
      const spinner = ora(`Querying for ${entityType} records...`).start();

      try {
        const url = `/query/${entityType}`;
        const params = {
          where: options.where,
          fields: options.fields,
          count: options.count,
          start: options.start,
        };

        // Only add the orderBy parameter if the user provided it
        if (options.orderBy) {
          params.orderBy = options.orderBy;
        }

        const response = await api.post(url, { params });
        const records = response.data.data;

        if (!records || records.length === 0) {
          spinner.warn(chalk.yellow('No records found matching your WHERE clause.'));
          return;
        }

        spinner.succeed(chalk.green(`Found ${records.length} records.`));

        if (options.output === 'json') {
          console.log(JSON.stringify(records, null, 2));
        } else {
          console.table(records);
        }
      } catch (error) {
        spinner.fail(chalk.red('Query request failed.'));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 400) {
            console.error(chalk.yellow('This may be due to an invalid SQL-like WHERE clause. Check your syntax.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return query;
}
