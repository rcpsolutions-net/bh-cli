// src/commands/search.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'search' command for querying entity records.
 */
export default function createSearchCommand() {
  const search = new Command('search')
    .description('Search for entity records using a Lucene query.')
    .argument('<entityType>', 'The type of entity to search (e.g., Candidate, JobOrder)')
    .requiredOption(
      '-q, --query <luceneQuery>', 
      'The Lucene query string (e.g., "isDeleted:0 AND name:John*")'
    )
    .option(
      '-f, --fields <list>', 
      'Comma-separated list of fields to return', 
      'id,name' // A more sensible default than '*' for a list view
    )
    .option(
      '-c, --count <number>',
      'Number of records to return per page',
      '15' // Default to 15 records
    )
    .option(
        '--start <number>',
        'The starting index for pagination',
        '0'
    )
    .option(
      '-s, --sort <field>',
      'Field to sort by (prepend with - for descending, e.g., "-dateAdded")'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, options) => {
      const spinner = ora(`Searching for ${entityType} records...`).start();

      try {
        const url = `/search/${entityType}`;
        const params = {
          query: options.query,
          fields: options.fields,
          count: options.count,
          start: options.start,
        };

        // Only add the sort parameter if the user provided it
        if (options.sort) {
          params.sort = options.sort;
        }

        const response = await api.get(url, { params });
        const records = response.data.data;

        if (!records || records.length === 0) {
          spinner.warn(chalk.yellow('No records found matching your query.'));
          return;
        }

        spinner.succeed(chalk.green(`Found ${records.length} records.`));

        if (options.output === 'json') {
          console.log(JSON.stringify(records, null, 2));
        } else {
          // console.table is perfect for an array of objects
          console.table(records);
        }
      } catch (error) {
        spinner.fail(chalk.red('Search request failed.'));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 400) {
            console.error(chalk.yellow('This may be due to an invalid Lucene query syntax. Please check your --query value.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return search;
}