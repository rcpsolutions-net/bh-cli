// src/commands/service/corporate-user-delegation.js — Manage CorporateUserDelegation service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildCorporateUserDelegationCommand() {
  const cmd = new Command('corporate-user-delegation')
    .description('Manage CorporateUserDelegation service (delegated access).');

  cmd.command('set <corporateUserId> <delegateId>')
    .description('Set delegation via PUT /services/CorporateUser/{corpId}/delegation/{delegateId}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corporateUserId, delegateId, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        payload = {};
      }

      const spinner = ora(`Setting delegation for CorporateUser ${corporateUserId} → ${delegateId}...`).start();
      try {
        const response = await api.put(
          `/services/CorporateUser/${corporateUserId}/delegation/${delegateId}`,
          payload,
        );
        spinner.succeed(chalk.green('Delegation set!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to set delegation.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('remove <corporateUserId> <delegateId>')
    .description('Remove delegation via DELETE /services/CorporateUser/{corpId}/delegation/{delegateId}.')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corporateUserId, delegateId, options) => {
      const spinner = ora(`Removing delegation for CorporateUser ${corporateUserId} → ${delegateId}...`).start();
      try {
        const response = await api.delete(`/services/CorporateUser/${corporateUserId}/delegation/${delegateId}`);
        spinner.succeed(chalk.green('Delegation removed!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to remove delegation.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}
