// src/commands/help.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';
import { COMMANDS_LIST, ENTITIES_LIST, ENTITY_COMMAND_MAP } from './help-entities.js';

/**
 * Creates the 'help' command for looking up Bullhorn API documentation.
 * Helps users understand how to use bh-cli commands for specific entities and operations.
 */
export default function createHelpCommand() {
  const help = new Command('help')
    .description('Look up Bullhorn API documentation and CLI command guidance.')
    .argument('[entityType]', 'Entity type to look up (e.g., Candidate, JobOrder)')
    .option(
      '-c, --commands',
      'List all CLI commands'
    )
    .option(
      '-e, --entities',
      'List all supported Bullhorn entities'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, options) => {
      // List all bh-cli commands
      if (options.commands) {
        console.log(chalk.cyan.bold('\n=== Bullhorn CLI Commands ===\n'));

        const table = new Table({
          head: [chalk.cyan.bold('Command'), chalk.cyan.bold('Description')],
        });
        for (const cmd of COMMANDS_LIST) {
          table.push([chalk.bold(cmd.command), cmd.description]);
        }
        console.log(table.toString());
        return;
      }

      // List all supported Bullhorn entities
      if (options.entities) {
        const table = new Table({
          head: [chalk.cyan.bold('Entity'), chalk.cyan.bold('Category'), chalk.cyan.bold('Access')],
        });
        for (const entity of ENTITIES_LIST) {
          table.push([chalk.bold(entity.name), entity.category, entity.crud]);
        }
        console.log(table.toString());
        return;
      }

      // No entity type provided — show summary
      if (!entityType) {
        console.log(chalk.cyan.bold('\n=== Bullhorn CLI Help ===\n'));
        console.log(chalk.yellow('Usage:'));
        console.log('  bullhorn help [entityType] [options]\n');

        console.log(chalk.cyan.bold('Options:'));
        console.log('  -c, --commands       List all CLI commands');
        console.log('  -e, --entities       List all supported Bullhorn entities');
        console.log('  -o, --output <format>  Output format: table (default) or json');
        console.log('  -h, --help           Display help for command\n');

        console.log(chalk.cyan.bold('Examples:'));
        console.log('  bullhorn help --commands          # List all commands');
        console.log('  bullhorn help --entities          # List all entities');
        console.log('  bullhorn help Candidate           # Get Candidate documentation');
        console.log('  bullhorn help Location --output json  # Get Location docs as JSON');
        console.log('');
        return;
      }

      // Look up specific entity documentation
      const spinner = ora(`Looking up documentation for ${entityType}...`).start();

      try {
        // First, try to get entity metadata
        const metaResponse = await api.get(`/meta/${entityType}`, { params: { fields: '*' } });
        const meta = metaResponse.data;

        spinner.succeed(chalk.green(`Found metadata for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(meta, null, 2));
          return;
        }

        // Display entity information
        console.log(chalk.cyan.bold(`\n=== ${entityType} ===\n`));

        // Display entity fields
        if (meta && meta.fields) {
          console.log(chalk.cyan.bold('Fields:'));
          const fieldTable = new Table({
            head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Type'), chalk.cyan.bold('Required'), chalk.cyan.bold('Read-Only')],
          });
          for (const field of meta.fields) {
            fieldTable.push([
              chalk.bold(field.name),
              field.type || '-',
              field.required ? 'Yes' : 'No',
              field.readonly ? 'Yes' : 'No',
            ]);
          }
          console.log(fieldTable.toString());
        }

        // Display bh-cli commands for this entity
        console.log(chalk.cyan.bold('\nAvailable Bullhorn CLI commands:'));

        const commands = [];
        for (const entry of ENTITY_COMMAND_MAP) {
          if (entry.entities.includes(entityType)) {
            const cmds = entry.buildCommands(entityType);
            for (const cmd of cmds) {
              commands.push(cmd);
            }
          }
        }

        if (commands.length > 0) {
          const cmdTable = new Table({
            head: [chalk.cyan.bold('Command'), chalk.cyan.bold('Description')],
          });
          for (const cmd of commands) {
            cmdTable.push([chalk.bold(cmd.command), cmd.description]);
          }
          console.log(cmdTable.toString());
        } else {
          console.log(chalk.yellow(`No specific bh-cli commands found for ${entityType}. Use generic commands:`));
          console.log(chalk.cyan(`  bullhorn get ${entityType} <id>`));
          console.log(chalk.cyan(`  bullhorn search ${entityType} -q "<query>"`));
          console.log(chalk.cyan(`  bullhorn query ${entityType} -w "<where>"`));
          console.log(chalk.cyan(`  bullhorn create ${entityType} <fields...>`));
          console.log(chalk.cyan(`  bullhorn update ${entityType} <id> <fields...>`));
          console.log(chalk.cyan(`  bullhorn delete ${entityType} <id> --force`));
        }

        // Display common options
        console.log(chalk.cyan.bold('\nCommon options for all commands:'));
        const optionsTable = new Table({
          head: [chalk.cyan.bold('Option'), chalk.cyan.bold('Description')],
        });
        optionsTable.push([chalk.bold('--fields <list>'), 'Comma-separated fields to return']);
        optionsTable.push([chalk.bold('--count <n>'), 'Records per page (pagination size)']);
        optionsTable.push([chalk.bold('--start <n>'), 'Pagination offset']);
        optionsTable.push([chalk.bold('--sort <field>'), 'Sort field (prefix with - for descending)']);
        optionsTable.push([chalk.bold('--orderBy <field>'), 'Sort field (SQL-style, add DESC for descending)']);
        optionsTable.push([chalk.bold('--effectiveOn <date>'), 'Fetch effective-dated version (YYYY-MM-DD)']);
        optionsTable.push([chalk.bold('--layout <name>'), 'Layout name (e.g., "CandidateSummary")']);
        optionsTable.push([chalk.bold('--show-editable'), 'Include editable field information']);
        optionsTable.push([chalk.bold('--show-read-only'), 'Include read-only field information']);
        optionsTable.push([chalk.bold('--privateLabelId <id>'), 'Filter by private label ID']);
        optionsTable.push([chalk.bold('--meta <level>'), 'Include metadata (off, basic, full)']);
        optionsTable.push([chalk.bold('--jsonp <name>'), 'JSONP callback function name']);
        optionsTable.push([chalk.bold('-o, --output <format>'), 'Output format: table (default) or json']);
        console.log(optionsTable.toString());

      } catch (error) {
        spinner.fail(chalk.red(`Failed to look up ${entityType}.`));
        if (error.response && error.response.status === 404) {
          console.error(chalk.yellow(`${entityType} is not a recognized Bullhorn entity.`));
        } else if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return help;
}
