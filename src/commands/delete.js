// src/commands/delete.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import api from '../lib/api.js';
import { formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'delete' command for removing an entity record.
 */
export default function createDeleteCommand() {
  const del = new Command('delete')
    .description('Delete an entity record.')
    .argument('<entityType>', 'The type of entity to delete')
    .argument('<entityId>', 'The numeric ID of the entity record')
    .option('-f, --force', 'Bypass the confirmation prompt')
    .action(async (entityType, entityId, options) => {
      if (!options.force) {
        const answer = await inquirer.prompt([
          { type: 'confirm', name: 'confirmDelete', message: chalk.yellow(`Are you sure you want to DELETE ${entityType} ${entityId}? This action cannot be undone.`), default: false }
        ]);
        if (!answer.confirmDelete) { console.log(chalk.blue('Deletion cancelled.')); return; }
      }

      const spinner = ora(`Deleting ${entityType} ${entityId}...`).start();

      try {
        await api.delete(`/entity/${entityType}/${entityId}`);
        spinner.succeed(chalk.green('Successfully deleted record.'));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to delete ${entityType}.`));

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

  return del;
}