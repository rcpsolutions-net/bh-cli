// src/commands/create.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'create' command for creating a new entity record.
 */
export default function createCreateCommand() {
  const create = new Command('create')
    .description('Create a new entity record.')
    .argument('<entityType>', 'The type of entity to create (e.g., Candidate, Note)')
    .argument('<fields...>', 'Space-separated key=value pairs (e.g., firstName="John Doe" status=New)')
    .action(async (entityType, fields) => {
      const spinner = ora(`Creating new ${entityType}...`).start();

      // --- 1. Parse the key=value pairs into a JSON object ---
      const requestBody = {};
      for (const field of fields) {
        const parts = field.split('=');
        if (parts.length < 2) {
          spinner.fail(chalk.red('Invalid field format.'));
          console.error(chalk.yellow(`Fields must be in 'key=value' format. You provided: "${field}"`));
          process.exit(1);
        }
        const key = parts[0];
        // Join the rest back together in case the value contained '='
        const value = parts.slice(1).join('='); 
        
        // Basic unquoting for values with spaces
        requestBody[key] = value.replace(/^"(.*)"$/, '$1');
      }

      if (Object.keys(requestBody).length === 0) {
        spinner.fail(chalk.red('No fields provided.'));
        console.error(chalk.yellow('You must provide at least one key=value pair to create an entity.'));
        process.exit(1);
      }

      // --- 2. Make the API request ---
      try {
        const url = `/entity/${entityType}`;
        
        // Bullhorn's create method is a POST
        const response = await api.post(url, requestBody);
        
        const newEntityId = response.data?.changedEntityId;
        if (!newEntityId) {
            throw new Error('API response did not include the new entity ID.');
        }

        spinner.succeed(chalk.green('Successfully created record!'));
        console.log(chalk.blue(`New ${entityType} ID: ${newEntityId}`));

      } catch (error) {
        spinner.fail(chalk.red(`Failed to create ${entityType}.`));
        
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 400) {
              console.error(chalk.yellow('This may be due to missing required fields or incorrect data types.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return create;
}