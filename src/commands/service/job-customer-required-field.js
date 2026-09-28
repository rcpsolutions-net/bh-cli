// src/commands/service/job-customer-required-field.js — Manage JobCustomerRequiredField service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildJobCustomerRequiredFieldCommand() {
  const cmd = new Command('job-customer-required-field')
    .description('Manage JobCustomerRequiredField service (job-specific required fields).');

  cmd.command('create [jobOrderId]')
    .description('Create a job customer required field via POST /services/JobCustomerRequiredField.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (jobOrderIdArg, options) => {
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
      if (jobOrderIdArg) payload.jobOrder = { id: Number(jobOrderIdArg) };

      const spinner = ora('Creating JobCustomerRequiredField via POST /services/JobCustomerRequiredField...').start();
      try {
        const response = await api.post('/services/JobCustomerRequiredField', payload);
        spinner.succeed(chalk.green('JobCustomerRequiredField created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create JobCustomerRequiredField.'));
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
