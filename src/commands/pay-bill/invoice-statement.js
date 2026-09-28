// src/commands/pay-bill/invoice-statement.js — InvoiceStatement entity commands.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { buildParams, renderTable } from './_shared.js';

export default function buildInvoiceStatementCommand(parent) {
  const invoiceStatement = parent.command('invoice-statement')
    .description('Manage InvoiceStatement entities (invoicing).');

  invoiceStatement
    .command('get [id]')
    .description('Get an InvoiceStatement by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,invoiceStatementNumber,candidateId,clientContactId,totalAmount,status')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching InvoiceStatement ${id}...` : 'Listing InvoiceStatements...').start();
      try {
        const url = id ? `/entity/InvoiceStatement/${id}` : '/query/InvoiceStatement';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? (response.data?.data ?? response.data) : (response.data?.data || []);

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(id ? data : data, null, 2));
        } else {
          const records = id ? [data] : data;
          renderTable(records, `InvoiceStatement${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch InvoiceStatement.'));
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
}
