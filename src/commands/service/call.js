// src/commands/service/call.js — Execute arbitrary Bullhorn business service endpoint
import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import api from '../../lib/api.js';
import { renderChangesTable } from './_shared.js';

export default function buildCallCommand() {
  return new Command('call')
    .alias('run')
    .alias('exec')
    .description('Execute an arbitrary Bullhorn business service endpoint (/services/{serviceName}).')
    .argument('<serviceName>', 'Name of the service (e.g. DirectDepositAccount)')
    .option('-X, --method <method>', 'HTTP method: GET, POST, PUT, DELETE', 'POST')
    .option('-f, --file <filePath>', 'Path to JSON file with request body')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (serviceName, options) => {
      const method = options.method.toUpperCase();
      let bodyData;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        try {
          bodyData = JSON.parse(readFileSync(options.file, 'utf-8'));
        } catch (err) {
          console.error(chalk.red(`Error reading or parsing JSON file: ${err.message}`));
          process.exit(1);
        }
      } else if (options.data) {
        try {
          bodyData = JSON.parse(options.data);
        } catch (err) {
          console.error(chalk.red(`Error parsing JSON data: ${err.message}`));
          process.exit(1);
        }
      }

      const spinner = ora(`Calling /services/${serviceName} with ${method}...`).start();

      try {
        const url = `/services/${serviceName}`;
        let response;
        if (method === 'GET') {
          response = await api.get(url);
        } else if (method === 'PUT') {
          response = await api.put(url, bodyData);
        } else if (method === 'DELETE') {
          response = await api.delete(url, { data: bodyData });
        } else {
          response = await api.post(url, bodyData);
        }

        spinner.succeed(chalk.green(`Service ${serviceName} call successful!`));

        if (options.output === 'table' && (Array.isArray(response.data) || typeof response.data === 'object')) {
          renderChangesTable(response.data);
        } else {
          console.log(JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to call service ${serviceName}.`));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data);
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });
}
