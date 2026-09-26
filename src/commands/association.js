// src/commands/association.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'association' command for bulk association lookups.
 * API: POST /association/{entity}/{association field}
 * Body: { ids: [...], count, start, showTotalMatched }
 * Returns: [[entityId, associatedEntityId], ...]
 */
export default function createAssociationCommand() {
  const association = new Command('association')
    .description('Bulk lookup associations between entities (returns [[parentId, childId], ...]).')
    .argument('<entityType>', 'The type of the parent entity (e.g., Candidate, JobOrder)')
    .argument('<toManyFieldName>', 'The to-many association field name (e.g., primarySkills, notes)')
    .option('--ids <ids>', 'Comma-separated parent entity IDs to look up', '')
    .option('-c, --count <number>', 'Number of records to return per page', '100')
    .option('--start <number>', 'The starting index for pagination', '0')
    .option('--show-total-matched', 'Include total matched count in response', false)
    .option(
      '-f, --fields <list>',
      'Comma-separated list of fields to return (for child entities)',
      '*'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, toManyFieldName, options) => {
      // Parse IDs
      const parentIds = options.ids
        ? String(options.ids).split(',').map(Number).filter(n => !Number.isNaN(n))
        : [];

      if (parentIds.length === 0) {
        console.error(chalk.red('Error: --ids is required.'));
        console.error(
          chalk.yellow('Usage: bh association <entityType> <toManyField> --ids <parentIds>')
        );
        process.exit(1);
      }

      const spinner = ora(
        `Looking up ${toManyFieldName} for ${parentIds.length} ${entityType}(s)...`
      ).start();

      try {
        const url = `/association/${entityType}/${toManyFieldName}`;
        const body = {
          ids: parentIds,
          count: Number(options.count),
          start: Number(options.start),
          showTotalMatched: options.showTotalMatched,
        };

        if (options.fields && options.fields !== '*') {
          body.fields = options.fields;
        }

        const response = await api.post(url, body);
        const associations = response.data;

        spinner.succeed(chalk.green(`Retrieved association data.`));

        if (options.output === 'json') {
          console.log(JSON.stringify(associations, null, 2));
        } else {
          if (!associations || associations.length === 0) {
            console.log(chalk.yellow('No associations found.'));
            return;
          }
          console.log(chalk.cyan.bold(`\nAssociations for ${entityType} ${toManyFieldName}:\n`));
          const Table = (await import('cli-table3')).default;
          const table = new Table({
            head: [chalk.cyan.bold('#'), chalk.cyan.bold('Parent ID'), chalk.cyan.bold('Child ID')],
          });
          associations.forEach((pair, index) => {
            table.push([
              index + 1,
              pair[0] ?? '-',
              pair[1] ?? '-',
            ]);
          });
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to lookup ${toManyFieldName}.`));
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

  return association;
}
