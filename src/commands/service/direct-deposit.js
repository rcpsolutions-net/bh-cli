// src/commands/service/direct-deposit.js
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../../lib/api.js';
import { renderChangesTable, resolveAccountType, buildDirectDepositPayload } from './_shared.js';

export default function buildDirectDepositCommand() {
  const dd = new Command('direct-deposit')
    .alias('DirectDepositAccount')
    .alias('dd')
    .description('Update or inspect candidate DirectDepositAccount business service settings.');

  // Subcommand: update (Default)
  dd.command('update [candidateId]', { isDefault: true })
    .description('Update direct deposit accounts for a candidate via /services/DirectDepositAccount.')
    .option('-c, --candidate <id>', 'Candidate ID (can also be passed as first argument)')
    .option('-f, --file <filePath>', 'Path to JSON file containing direct deposit request payload or accounts array')
    .option('-d, --data <jsonData>', 'Raw JSON string of request payload or accounts array')
    .option('--clear', 'Clear all direct deposit accounts for the candidate (sends empty account list)')
    .option('-b, --bank <bankName>', 'Bank name (e.g., "Chase Bank")')
    .option('-a, --account <accountNumber>', 'Account number (e.g., "111")')
    .option('-t, --transit <transitNumber>', 'Transit / routing number (e.g., "021000021")')
    .option('-r, --routing <routingNumber>', 'Alias for --transit')
    .option('--type <accountType>', 'Account type: Checking, Savings, or "Pay Card" (default: Checking)', 'Checking')
    .option('--amount <amount>', 'Fixed deposit dollar amount', parseFloat)
    .option('--remainder', 'Designate this account for the remainder of pay', false)
    .option('--order <paymentOrder>', 'Payment order sequence number', parseInt)
    .option('--currency-unit <id>', 'Currency unit ID (default: 166 for USD)', parseInt, 166)
    .option('--minor-units <units>', 'Minor currency units (default: 0)', parseInt, 0)
    .option('-X, --method <method>', 'HTTP method to use: POST or PUT', 'POST')
    .option('-o, --output <format>', 'Output format: table or json', 'table')
    .action(async (candidateIdArg, options) => {
      let payload;
      try {
        payload = buildDirectDepositPayload(candidateIdArg, options);
      } catch (err) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }

      // 3. Send API request
      const method = (options.method || 'POST').toUpperCase();
      const spinner = ora(`Sending DirectDepositAccount update for candidate ${payload.candidate.id} via ${method}...`).start();

      try {
        const url = '/services/DirectDepositAccount';
        let response;
        if (method === 'PUT') {
          response = await api.put(url, payload);
        } else {
          response = await api.post(url, payload);
        }

        spinner.succeed(chalk.green('Direct deposit update successful!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nDirect Deposit Changes for Candidate ${payload.candidate.id}:\n`));
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update DirectDepositAccount.'));
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

  // Subcommand: get
  dd.command('get <candidateId>')
    .description('Retrieve current direct deposit accounts for a candidate.')
    .option('-o, --output <format>', 'Output format: table or json', 'table')
    .action(async (candidateId, options) => {
      const spinner = ora(`Fetching direct deposit accounts for candidate ${candidateId}...`).start();

      try {
        const response = await api.get('/query/DirectDepositAccount', {
          params: {
            where: `candidate.id = ${candidateId}`,
            fields: 'id,bankName,accountNumber,transitNumber,directDepositAccountTypeLookup,amount,remainder,paymentOrder,currencyUnit',
          },
        });

        const records = response.data?.data || [];
        spinner.succeed(chalk.green(`Fetched ${records.length} direct deposit account(s).`));

        if (options.output === 'json') {
          console.log(JSON.stringify(records, null, 2));
        } else {
          if (records.length === 0) {
            console.log(chalk.yellow(`No direct deposit accounts found for candidate ${candidateId}.`));
            return;
          }

          console.log(chalk.cyan.bold(`\nDirect Deposit Accounts for Candidate ${candidateId}:\n`));
          const table = new Table({
            head: [
              chalk.cyan.bold('ID'),
              chalk.cyan.bold('Bank'),
              chalk.cyan.bold('Routing #'),
              chalk.cyan.bold('Account #'),
              chalk.cyan.bold('Type'),
              chalk.cyan.bold('Amount'),
              chalk.cyan.bold('Remainder'),
              chalk.cyan.bold('Order'),
            ],
          });

          for (const acc of records) {
            const typeLabel = acc.directDepositAccountTypeLookup?.label || acc.directDepositAccountTypeLookup || '-';
            table.push([
              acc.id || '-',
              acc.bankName || '-',
              acc.transitNumber || '-',
              acc.accountNumber || '-',
              typeLabel,
              acc.amount !== undefined && acc.amount !== null ? `$${acc.amount}` : '-',
              acc.remainder ? chalk.green('true') : 'false',
              acc.paymentOrder ?? '-',
            ]);
          }

          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch direct deposit accounts.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || JSON.stringify(error.response.data);
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return dd;
}
