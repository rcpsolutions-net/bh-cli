// src/commands/service/placement-crf-config.js — Manage PlacementCustomerRequiredFieldConfiguration version service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildPlacementCustomerRequiredFieldConfigCommand() {
  const cmd = new Command('placement-crf-config')
    .alias('placement-customer-required-field-config')
    .description('Manage PlacementCustomerRequiredFieldConfiguration version service.');

  cmd.command('create [placementId]')
    .description('Create a placement CRF configuration version via POST /services/PlacementCustomerRequiredFieldConfiguration.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (placementIdArg, options) => {
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
      if (placementIdArg) payload.placement = { id: Number(placementIdArg) };

      const spinner = ora('Creating PlacementCustomerRequiredFieldConfiguration via POST /services/PlacementCustomerRequiredFieldConfiguration...').start();
      try {
        const response = await api.post('/services/PlacementCustomerRequiredFieldConfiguration', payload);
        spinner.succeed(chalk.green('PlacementCustomerRequiredFieldConfiguration created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create PlacementCustomerRequiredFieldConfiguration.'));
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
