// src/commands/meta.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3'; // <-- Import the new library
import api from '../lib/api.js';

/**
 * Creates the 'meta' command to fetch entity metadata from the Bullhorn API.
 */
export default function createMetaCommand() {
  const meta = new Command('meta')
    .description('Get metadata for a Bullhorn entity (fields, types, etc.).')
    .argument('<entityType>', 'The entity to get metadata for (e.g., Candidate)')
    .option(
      '-f, --fields <list>',
      'Comma-separated list of fields to get metadata for (default: all fields)',
      '*' // Default to all fields
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table' // Default to table for readability
    )
    .action(async (entityType, options) => {
      const spinner = ora(`Fetching metadata for ${entityType}...`).start();

      try {
        const url = `/meta/${entityType}`;
        const params = {};

        if (options.fields) {
          params.fields = options.fields;
        }

        const response = await api.get(url, { params });
        const metadata = response.data;

        spinner.succeed(chalk.green('Successfully fetched metadata!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(metadata, null, 2));
          return;
        }

        // --- Table Output ---
        console.log(chalk.cyan.bold(`\nFields for ${metadata.label || entityType}:\n`));
        
        if (metadata.fields && metadata.fields.length > 0) {
         
        // 1. Define the table headers
          const table = new Table({
            head: ['Name', 'Type', 'Data Type', 'Label', 'Required', 'Read-Only'],
            colWidths: [30, 15, 15, 35, 10, 11], // Adjust column widths as needed
          });

          // 2. Populate the table with rows
          for (const field of metadata.fields) {
            table.push([
              chalk.bold(field.name),
              field.type,
              field.dataType,
              field.label,
              field.required ? chalk.green('✔') : chalk.red('✖'),
              field.readOnly ? chalk.yellow('✔') : ''
            ]);
          }

          // 3. Print the table
          console.log(table.toString());

        } else {
          console.log(chalk.yellow('No field information returned for this entity.'));
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch metadata.'));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 404) {
            console.error(chalk.yellow(`The entity type "${entityType}" may be invalid.`));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return meta;
}