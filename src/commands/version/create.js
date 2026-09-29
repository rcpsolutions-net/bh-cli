// src/commands/version/create.js — Create new version subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';
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

      await invoke(async ({ chalk }) => {
        const response = await api.post(`/entity/${entityType}`, payload);

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          formatVersionResult(response, `Version Created for ${entityType}`);
        }
      }, { spinnerMsg: `Creating new version for ${entityType}...`, successMsg: `New version created for ${entityType}!`, failMsg: 'Failed to create version.' });
    });
}
