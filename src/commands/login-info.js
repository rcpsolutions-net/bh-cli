// src/commands/login-info.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import axios from 'axios';

/**
 * Creates the 'login-info' command for diagnostics.
 * API: GET https://rest.bullhornstaffing.com/rest-services/loginInfo?username={username}
 * Returns oauthUrl, restUrl, and other data center resolution info.
 * This endpoint is public (no auth required).
 */
export default function createLoginInfoCommand() {
  const loginInfo = new Command('login-info')
    .alias('logininfo')
    .description('Resolve data center information for a Bullhorn username (diagnostics).');

  loginInfo
    .argument('<username>', 'Bullhorn username')
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'json'
    )
    .action(async (username, options) => {
      const spinner = ora(`Resolving data center for "${username}"...`).start();

      try {
        const url = 'https://rest.bullhornstaffing.com/rest-services/loginInfo';
        const params = { username };

        // This call does NOT require authentication — uses public endpoint
        const response = await axios.get(url, { params });
        const data = response.data;

        spinner.succeed(chalk.green('Data center resolved successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nData Center Information:\n'));
          const table = new Table();
          const entries = Object.entries(data).filter(([k, v]) => typeof v !== 'object');
          for (const [key, value] of entries) {
            table.push([chalk.bold(key), String(value ?? '')]);
          }
          // Also show nested objects as sub-entries
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
              table.push([chalk.bold(key), JSON.stringify(value)]);
            }
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to resolve data center.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || error.response.data?.error_description || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return loginInfo;
}
