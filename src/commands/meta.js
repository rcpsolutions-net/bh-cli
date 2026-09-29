// src/commands/meta.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';
import { buildGetParams, renderJsonOutput, formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'meta' command to fetch entity metadata from the Bullhorn API.
 */
export default function createMetaCommand() {
  const meta = new Command('meta')
    .description('Get metadata for a Bullhorn entity (fields, types, etc.).')
    .argument('<entityType>', 'The entity to get metadata for (e.g., Candidate)')
    .option('-f, --fields <list>', 'Comma-separated list of fields to get metadata for (default: all fields)', '*')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (entityType, options) => {
      const spinner = ora(`Fetching metadata for ${entityType}...`).start();

      try {
        const params = buildGetParams(options);
        const response = await api.get(`/meta/${entityType}`, { params });
        const metadata = response.data;

        spinner.succeed(chalk.green('Successfully fetched metadata!'));

        if (options.output === 'json') {
          renderJsonOutput(metadata);
          return;
        }

        // --- Table Output (meta-specific) ---
        console.log(chalk.cyan.bold(`\nFields for ${metadata.label || entityType}:\n`));

        if (metadata.fields && metadata.fields.length > 0) {
          const table = new Table({
            head: ['Name', 'Type', 'Data Type', 'Label', 'Required', 'Read-Only'],
            colWidths: [30, 15, 15, 35, 10, 11],
          });

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

          console.log(table.toString());
        } else {
          console.log(chalk.yellow('No field information returned for this entity.'));
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch metadata.'));

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

  return meta;
}