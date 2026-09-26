// src/commands/entitlements.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../lib/api.js';

/**
 * Creates the 'entitlements' command for checking entity permissions.
 * API: GET /entitlements/{entityType}
 * Returns array: ["CREATE", "READ", "READ_DEPARTMENT", "UPDATE", "DELETE"]
 */
export default function createEntitlementsCommand() {
  const entitlements = new Command('entitlements')
    .description('Check permissions/entitlements for a Bullhorn entity type.')
    .argument('<entityType>', 'The type of entity to check (e.g., Candidate, JobOrder)')
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, options) => {
      const spinner = ora(`Checking entitlements for ${entityType}...`).start();

      try {
        const url = `/entitlements/${entityType}`;
        const response = await api.get(url);
        const permissions = response.data;

        spinner.succeed(chalk.green(`Retrieved ${permissions.length} entitlement(s).`));

        if (options.output === 'json') {
          console.log(JSON.stringify(permissions, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nEntitlements for ${entityType}:\n`));
          const Table = (await import('cli-table3')).default;
          const table = new Table({
            head: [chalk.cyan.bold('#'), chalk.cyan.bold('Permission'), chalk.cyan.bold('Granted')],
          });
          permissions.forEach((perm, index) => {
            table.push([
              index + 1,
              chalk.bold(perm),
              chalk.green('yes'),
            ]);
          });
          console.log(table.toString());

          // Summary
          const hasCreate = permissions.includes('CREATE');
          const hasRead = permissions.includes('READ');
          const hasUpdate = permissions.includes('UPDATE');
          const hasDelete = permissions.includes('DELETE');
          console.log(
            chalk.blue(
              `\nSummary: CREATE=${hasCreate ? '✓' : '✗'}, READ=${hasRead ? '✓' : '✗'}, UPDATE=${hasUpdate ? '✓' : '✗'}, DELETE=${hasDelete ? '✓' : '✗'}`
            )
          );
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to check entitlements for ${entityType}.`));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 404) {
            console.error(chalk.yellow('This entity type does not exist or is not accessible.'));
          } else if (status === 403) {
            console.error(chalk.yellow('You do not have permission to check entitlements for this entity.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return entitlements;
}
