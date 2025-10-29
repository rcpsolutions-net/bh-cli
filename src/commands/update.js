// src/commands/update.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'update' command for modifying an existing entity record.
 */
export default function createUpdateCommand() {
  const update = new Command('update')
    .description('Update an existing entity record by its ID.')
    .argument('<entityType>', 'The type of entity to update (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the entity record to update')
    .argument('<fields...>', 'Space-separated key=value pairs for the fields to update')
    .action(async (entityType, entityId, fields) => {
      const spinner = ora(`Updating ${entityType} ${entityId}...`).start();

      // --- 1. Parse the key=value pairs into a JSON object ---
      // This logic is identical to the 'create' command.
      const requestBody = {};
      for (const field of fields) {
        const parts = field.split('=');
        if (parts.length < 2) {
          spinner.fail(chalk.red('Invalid field format.'));
          console.error(chalk.yellow(`Fields must be in 'key=value' format. You provided: "${field}"`));
          process.exit(1);
        }
        const key = parts[0];
        const value = parts.slice(1).join('=');
        requestBody[key] = value.replace(/^"(.*)"$/, '$1');
      }

      if (Object.keys(requestBody).length === 0) {
        spinner.fail(chalk.red('No fields provided.'));
        console.error(chalk.yellow('You must provide at least one key=value pair to update an entity.'));
        process.exit(1);
      }

      // --- 2. Make the API request ---
      try {
        const url = `/entity/${entityType}/${entityId}`;
        
        // Per Bullhorn's API docs, updates are done via POST
        const response = await api.post(url, requestBody);
        
        const updatedEntityId = response.data?.changedEntityId;
        if (updatedEntityId !== Number(entityId)) {
          throw new Error('API response did not confirm the update for the correct entity ID.');
        }

        spinner.succeed(chalk.green('Successfully updated record!'));
        console.log(chalk.blue(`${entityType} ${updatedEntityId} has been updated.`));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to update ${entityType}.`));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 400) {
            console.error(chalk.yellow('This may be due to invalid field names, incorrect data types, or read-only fields.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return update;
}