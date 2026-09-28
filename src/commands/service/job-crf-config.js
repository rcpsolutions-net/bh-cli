// src/commands/service/job-crf-config.js — Manage JobCustomerRequiredFieldConfiguration version service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildJobCustomerRequiredFieldConfigCommand() {
  const cmd = new Command('job-crf-config')
    .alias('job-customer-required-field-config')
    .description('Manage JobCustomerRequiredFieldConfiguration version service.');

  cmd.command('create [jobOrderId]')
    .description('Create a job CRF configuration version via POST /services/JobCustomerRequiredFieldConfiguration.')
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

      const spinner = ora('Creating JobCustomerRequiredFieldConfiguration via POST /services/JobCustomerRequiredFieldConfiguration...').start();
      try {
        const response = await api.post('/services/JobCustomerRequiredFieldConfiguration', payload);
        spinner.succeed(chalk.green('JobCustomerRequiredFieldConfiguration created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create JobCustomerRequiredFieldConfiguration.'));
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
