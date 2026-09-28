// src/commands/version/create.js — Create new version subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import api from '../../lib/api.js';
import { parseFieldArgs, formatVersionResult } from './_shared.js';

export default function buildCreateCommand(parent) {
  parent.command('create <entityType>')
    .description('Create a new version of an effective-dated entity via POST /entity/{entityType}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing version fields')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[fieldArgs...]', 'Key=value pairs for version fields (e.g., "effectiveDate=2024-01-01" "title=Office")')
    .action(async (entityType, fieldArgs, options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (fieldArgs && fieldArgs.length > 0) {
        payload = parseFieldArgs(fieldArgs);
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or key=value field arguments.'));
        process.exit(1);
      }

      const spinner = ora(`Creating new version for ${entityType}...`).start();
      try {
        const response = await api.post(`/entity/${entityType}`, payload);
        spinner.succeed(chalk.green(`New version created for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          formatVersionResult(response, `Version Created for ${entityType}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create version.'));
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
}
