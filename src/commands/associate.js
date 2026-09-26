// src/commands/associate.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'associate' command for creating to-many associations.
 * API: PUT /entity/{entityType}/{entity-id}/{to-many-association-name}/{entity-id},*
 */
export default function createAssociateCommand() {
  const associate = new Command('associate')
    .description('Associate to-many child entities with a parent entity.')
    .argument('<entityType>', 'The type of the parent entity (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the parent entity')
    .argument('<toManyFieldName>', 'The to-many association field name (e.g., primarySkills, notes)')
    .argument('<ids...>', 'Comma-separated or space-separated child entity IDs to associate')
    .option(
      '-f, --fields <list>',
      'Comma-separated list of fields to return',
      '*'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'json'
    )
    .action(async (entityType, entityId, toManyFieldName, ids, options) => {
      // Normalize: flatten comma-separated groups
      const allIds = [];
      for (const id of ids) {
        const parts = String(id).split(',').filter(Boolean);
        allIds.push(...parts);
      }

      if (allIds.length === 0) {
        console.error(chalk.red('Error: No IDs provided to associate.'));
        console.error(chalk.yellow('Usage: bh associate <entityType> <entityId> <toManyField> <id1> <id2> ...'));
        process.exit(1);
      }

      const spinner = ora(
        `Associating ${allIds.length} ${toManyFieldName} with ${entityType} ${entityId}...`
      ).start();

      try {
        const url = `/entity/${entityType}/${entityId}/${toManyFieldName}/${allIds.join(',')}`;
        const params = { fields: options.fields };

        const response = await api.put(url, null, { params });

        spinner.succeed(chalk.green('Successfully associated records!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const changes = response.data;
          if (Array.isArray(changes)) {
            console.log(
              chalk.cyan.bold(`\nAssociated ${changes.length} ${toManyFieldName} record(s):\n`)
            );
            const Table = (await import('cli-table3')).default;
            const table = new Table({
              head: [chalk.cyan.bold('#'), chalk.cyan.bold('Entity Type'), chalk.cyan.bold('Entity ID'), chalk.cyan.bold('Change Type')],
            });
            changes.forEach((item, index) => {
              table.push([
                index + 1,
                item.changedEntityType || '-',
                item.changedEntityId || '-',
                chalk.green(item.changeType || '-'),
              ]);
            });
            console.log(table.toString());
          } else {
            console.log(JSON.stringify(changes, null, 2));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to associate ${toManyFieldName}.`));
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

  return associate;
}
