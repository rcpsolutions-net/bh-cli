// src/commands/get.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'get' command for fetching a single entity record.
 */
export default function createGetCommand() {
  const get = new Command('get')
    .description('Fetch a single entity record by its ID.')
    .argument('<entityType>', 'The type of entity (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the entity record')
    .option(
      '-f, --fields <list>', 
      'Comma-separated list of fields to return (e.g., "id,name,email")', 
      '*' // Default value is '*' for all fields
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table' // Default output is a table
    )
    .action(async (entityType, entityId, options) => {
      const spinner = ora(`Fetching ${entityType} ${entityId}...`).start();

      try {
        const url = `/entity/${entityType}/${entityId}`;
        const params = {
          fields: options.fields,
        };

        const response = await api.get(url, { params });
        const record = response.data.data;

        spinner.succeed(chalk.green('Fetch successful!'));

        if (options.output === 'json') {
          // Pretty-print the JSON output
          console.log(JSON.stringify(record, null, 2));
        } else {
          // 'table' output for a single object
          console.log(chalk.cyan.bold(`\nDetails for ${entityType} ${entityId}:\n`));
          // Format the single object into an array of key-value pairs for console.table
          const formattedData = Object.entries(record).map(([key, value]) => ({
            Field: chalk.bold(key),
            Value: typeof value === 'object' && value !== null ? JSON.stringify(value) : value,
          }));
          console.table(formattedData);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch record.'));
        
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

  return get;
}
