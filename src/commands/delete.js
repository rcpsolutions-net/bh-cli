// src/commands/delete.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import api from '../lib/api.js';

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
      // --- 1. Safety Check: Confirm deletion ---
      if (!options.force) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDelete',
            message: chalk.yellow(`Are you sure you want to DELETE ${entityType} ${entityId}? This action cannot be undone.`),
            default: false,
          },
        ]);

        if (!answer.confirmDelete) {
          console.log(chalk.blue('Deletion cancelled.'));
          return;
        }
      }

      // --- 2. Make the API request ---
      const spinner = ora(`Deleting ${entityType} ${entityId}...`).start();

      try {
        const url = `/entity/${entityType}/${entityId}`;
        await api.delete(url);

        spinner.succeed(chalk.green('Successfully deleted record.'));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to delete ${entityType}.`));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          
          if (status === 404) {
             console.error(chalk.yellow('The record you are trying to delete does not exist.'));
          } else if (status === 400) {
              console.error(chalk.yellow('The record may have dependencies that prevent it from being deleted.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return del;
}