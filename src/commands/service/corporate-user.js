// src/commands/service/corporate-user.js — Manage CorporateUser service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildCorporateUserCommand() {
  const cmd = new Command('corporate-user')
    .description('Manage CorporateUser service (create/update corporate users).');

  cmd.command('create [corpUserId]')
    .description('Create a new corporate user via POST /services/CorporateUser.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corpUserIdArg, options) => {
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
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (corpUserIdArg) payload.id = Number(corpUserIdArg);

      const spinner = ora('Creating CorporateUser via POST /services/CorporateUser...').start();
      try {
        const response = await api.post('/services/CorporateUser', payload);
        spinner.succeed(chalk.green('CorporateUser created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create CorporateUser.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('update [corpUserId]')
    .description('Update a corporate user via PUT /services/CorporateUser/{corpUserId}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corpUserIdArg, options) => {
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
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      const id = corpUserIdArg || payload?.id;
      if (!id) {
        console.error(chalk.red('Error: CorporateUser ID is required (pass as argument or in payload).'));
        process.exit(1);
      }

      const spinner = ora(`Updating CorporateUser ${id} via PUT /services/CorporateUser/${id}...`).start();
      try {
        const response = await api.put(`/services/CorporateUser/${id}`, payload);
        spinner.succeed(chalk.green(`CorporateUser ${id} updated!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update CorporateUser.'));
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
