// src/commands/service/placement-change-request.js — Manage PlacementChangeRequest service
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildPlacementChangeRequestCommand() {
  const cmd = new Command('placement-change-request')
    .description('Manage PlacementChangeRequest service (create/update/approve).');

  cmd.command('create [placementId]')
    .description('Create a placement change request via POST /services/PlacementChangeRequest.')
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

      const spinner = ora('Creating PlacementChangeRequest via POST /services/PlacementChangeRequest...').start();
      try {
        const response = await api.post('/services/PlacementChangeRequest', payload);
        spinner.succeed(chalk.green('PlacementChangeRequest created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create PlacementChangeRequest.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('update <changeRequestId>')
    .description('Update a placement change request via PUT /services/PlacementChangeRequest/{id}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (changeRequestId, options) => {
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

      const spinner = ora(`Updating PlacementChangeRequest ${changeRequestId}...`).start();
      try {
        const response = await api.put(`/services/PlacementChangeRequest/${changeRequestId}`, payload);
        spinner.succeed(chalk.green(`PlacementChangeRequest ${changeRequestId} updated!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update PlacementChangeRequest.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('approve <changeRequestId>')
    .description('Approve a placement change request via POST /services/PlacementChangeRequest/{id}/approve.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (changeRequestId, options) => {
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

      const spinner = ora(`Approving PlacementChangeRequest ${changeRequestId}...`).start();
      try {
        const response = await api.post(`/services/PlacementChangeRequest/${changeRequestId}/approve`, payload);
        spinner.succeed(chalk.green(`PlacementChangeRequest ${changeRequestId} approved!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to approve PlacementChangeRequest.'));
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
