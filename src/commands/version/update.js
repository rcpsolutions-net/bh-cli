// src/commands/version/update.js — Update specific version subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput } from '../../lib/helpers.js';
import { parseFieldArgs, formatVersionResult } from './_shared.js';

export default function buildUpdateCommand(parent) {
  parent.command('update <entityType> <entityId>')
    .description('Update a specific version of an effective-dated entity via POST /entity/{entityType}/{entityId}.')
    .option('-v, --versionId <versionId>', 'The version ID to update (required)')
    .option('-f, --file <filePath>', 'Path to JSON file containing version fields')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[fieldArgs...]', 'Key=value pairs for version fields (e.g., "customText1=updated"')
    .action(async (entityType, entityId, fieldArgs, options) => {
      if (!options.versionId) {
        console.error(chalk.red('Error: --versionId <versionId> is required for version update.'));
        process.exit(1);
      }

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
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, --versionId, or key=value field arguments.'));
        process.exit(1);
      }

      payload.versionId = Number(options.versionId);

      await invoke(async ({ chalk }) => {
        const response = await api.post(`/entity/${entityType}/${entityId}`, payload);

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          formatVersionResult(response, `Version Updated for ${entityType}`);
        }
      }, { spinnerMsg: `Updating version ${options.versionId} for ${entityType} ${entityId}...`, successMsg: `Version ${options.versionId} updated for ${entityType}!`, failMsg: 'Failed to update version.' });
    });
}
