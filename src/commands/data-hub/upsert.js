// src/commands/data-hub/upsert.js — Data Hub upsert subcommand.

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';

export default function buildUpsertCommand(parent) {
  const upsert = parent.command('upsert')
    .description('Upsert up to 100 records to Data Hub via POST /data-hub/data.');

  upsert
    .option('-f, --file <filePath>', 'Path to JSON file containing batch payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-s, --source-system <name>', 'Source system name (alternative to --file)')
    .option('-e, --entity-type <name>', 'Entity type name (alternative to --file)')
    .option('-v, --schema-version <name>', 'Schema version name (alternative to --file)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[records...]', 'Key=value pairs for individual records (alternative to --file)')
    .action(async (records, options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.sourceSystem && options.entityType) {
        const batch = {
          sourceSystem: options.sourceSystem,
          entityType: options.entityType,
          schemaVersion: options.schemaVersion || '',
          items: [],
        };

        if (records && records.length > 0) {
          for (const recStr of records) {
            const pairs = recStr.split(',').map(p => {
              const eqIdx = p.indexOf('=');
              const k = p.substring(0, eqIdx);
              const v = eqIdx >= 0 ? p.substring(eqIdx + 1) : '';
              return [k.trim(), v.trim()];
            });
            const item = { sourceId: '' };
            for (const [k, v] of pairs) {
              if (k === 'sourceId') {
                item.sourceId = v;
              } else {
                item[k] = v;
              }
            }
            batch.items.push(item);
          }
        }
        payload = [batch];
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --source-system + --entity-type + records.'));
        process.exit(1);
      }

      const spinner = ora('Upsertting records to Data Hub...').start();
      try {
        const response = await api.post('/data-hub/data', payload);
        spinner.succeed(chalk.green('Data Hub upsert successful!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const result = response.data;
          console.log(chalk.cyan.bold('\nData Hub Upsert Results:\n'));
          if (Array.isArray(result?.data)) {
            for (const batchResult of result.data) {
              console.log(`  Entity Type: ${batchResult.entityType || 'N/A'}`);
              console.log(`  Source System: ${batchResult.sourceSystem || 'N/A'}`);
              console.log(`  Successful Items: ${batchResult.successfulItems?.length || 0}`);
              if (batchResult.successfulItems?.length > 0) {
                for (const item of batchResult.successfulItems) {
                  console.log(`    sourceId=${item.sourceId} → dataId=${item.dataId}`);
                }
              }
              if (batchResult.failedItems?.length > 0) {
                console.log(chalk.yellow(`  Failed Items: ${batchResult.failedItems.length}`));
                for (const fail of batchResult.failedItems) {
                  console.log(`    sourceId=${fail.sourceId}: ${fail.message || 'Unknown error'}`);
                }
              }
              if (result.messages?.length > 0) {
                console.log(chalk.yellow(`  Messages: ${result.messages.join('; ')}`));
              }
              console.log('');
            }
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to upsert records to Data Hub.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 413) {
            console.error(chalk.yellow('Data Hub accepts a maximum of 100 records per request.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });
}
