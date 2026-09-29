// src/commands/soft-delete.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import api from '../lib/api.js';
import { renderJsonOutput, formatApiError } from '../lib/helpers.js';

/**
 * Creates the 'soft-delete' command for setting isDeleted=true on an entity.
 * API: POST /entity/{entityType}/{entityId} with body { isDeleted: true }
 * Some entities only support soft delete (not hard delete).
 */
export default function createSoftDeleteCommand() {
  const softDelete = new Command('soft-delete')
    .alias('softdelete')
    .description('Soft delete an entity record (set isDeleted=true).')
    .argument('<entityType>', 'The type of entity to soft delete')
    .argument('<entityId>', 'The numeric ID of the entity record')
    .option('-f, --force', 'Bypass the confirmation prompt')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, options) => {
      if (!options.force) {
        const answer = await inquirer.prompt([
          { type: 'confirm', name: 'confirmSoftDelete', message: chalk.yellow(`Are you sure you want to SOFT-DELETE ${entityType} ${entityId}? This sets isDeleted=true.`), default: false }
        ]);
        if (!answer.confirmSoftDelete) { console.log(chalk.blue('Soft delete cancelled.')); return; }
      }

      const spinner = ora(`Soft deleting ${entityType} ${entityId}...`).start();

      try {
        const response = await api.post(`/entity/${entityType}/${entityId}`, { isDeleted: true });

        spinner.succeed(chalk.green('Successfully soft-deleted record.'));

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          const data = response.data;
          if (data?.changedEntityId) console.log(chalk.blue(`Soft-deleted ${entityType} ID: ${data.changedEntityId}`));
          if (data?.changedVersionId) console.log(chalk.blue(`Version ID: ${data.changedVersionId}`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to soft-delete ${entityType}.`));

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

  return softDelete;
}
