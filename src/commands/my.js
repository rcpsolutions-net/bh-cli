// src/commands/my.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'my' command group for user-owned entity queries.
 * API: GET /my{Entity}s/?fields=...&departmentIds=...&count=...&start=...&sort=...&query=...&where=...
 */
export default function createMyCommand() {
  const my = new Command('my')
    .alias('my-entities')
    .description('Query entities owned by the current user (e.g., my-candidates, my-notes).');

  const entities = [
    { name: 'candidates',  desc: 'Candidates owned by current user' },
    { name: 'client-contacts', desc: 'Client contacts owned by current user' },
    { name: 'placements',  desc: 'Placements owned by current user' },
    { name: 'notes',       desc: 'Notes owned by current user' },
  ];

  for (const entity of entities) {
    const entityName = entity.name.charAt(0).toUpperCase() + entity.name.slice(1).replace('-', '');
    const cmd = new Command(entity.name)
      .description(entity.desc)
      .option(
        '-f, --fields <list>',
        'Comma-separated list of fields to return',
        'id,name'
      )
      .option(
        '-c, --count <number>',
        'Number of records to return per page',
        '15'
      )
      .option(
        '--start <number>',
        'The starting index for pagination',
        '0'
      )
      .option(
        '-s, --sort <field>',
        'Field to sort by (prepend with - for descending, e.g., "-dateAdded")'
      )
      .option(
        '-w, --where <sqlWhere>',
        'SQL-like WHERE clause'
      )
      .option(
        '-q, --query <luceneQuery>',
        'Lucene query string'
      )
      .option(
        '-d, --department-ids <ids>',
        'Comma-separated list of department IDs (optional filter)'
      )
      .option(
        '-o, --output <format>',
        'Output format (table or json)',
        'table'
      )
      .action(async (options) => {
        const spinner = ora(`Fetching ${entity.name} owned by you...`).start();

        try {
          const url = `/my${entityName}s/`;
          const params = {
            fields: options.fields,
            count: options.count,
            start: options.start,
          };

          if (options.sort) params.sort = options.sort;
          if (options.where) params.where = options.where;
          if (options.query) params.query = options.query;
          if (options.departmentIds) params.departmentIds = options.departmentIds;

          const response = await api.get(url, { params });
          const records = response.data.data || [];

          if (records.length === 0) {
            spinner.warn(chalk.yellow(`No ${entity.name} records found.`));
            return;
          }

          spinner.succeed(chalk.green(`Fetched ${records.length} ${entity.name} record(s).`));

          if (options.output === 'json') {
            console.log(JSON.stringify(records, null, 2));
          } else {
            const headers = Object.keys(records[0] || {});
            const table = new Table({
              head: headers.map(h => chalk.cyan.bold(h)),
            });
            for (const record of records) {
              table.push(
                headers.map(h => {
                  const val = record[h];
                  return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
                })
              );
            }
            console.log(table.toString());
          }
        } catch (error) {
          spinner.fail(chalk.red(`Failed to fetch ${entity.name}.`));
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

    my.addCommand(cmd);
  }

  return my;
}
