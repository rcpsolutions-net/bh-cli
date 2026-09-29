// src/commands/service/direct-deposit.js
import { Command } from 'commander';
import chalk from 'chalk';
import api from '../../lib/api.js';
import { invoke, renderJsonOutput, renderTableOutput } from '../../lib/helpers.js';
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

      const method = (options.method || 'POST').toUpperCase();

      await invoke(async ({ chalk }) => {
        const url = '/services/DirectDepositAccount';
        let response;
        if (method === 'PUT') {
          response = await api.put(url, payload);
        } else {
          response = await api.post(url, payload);
        }

        if (options.output === 'json') {
          renderJsonOutput(response.data);
        } else {
          console.log(chalk.cyan.bold(`\nDirect Deposit Changes for Candidate ${payload.candidate.id}:\n`));
          renderChangesTable(response.data);
        }
      }, { spinnerMsg: `Sending DirectDepositAccount update for candidate ${payload.candidate.id} via ${method}...`, successMsg: 'Direct deposit update successful!', failMsg: 'Failed to update DirectDepositAccount.' });
    });

  // Subcommand: get
  dd.command('get <candidateId>')
    .description('Retrieve current direct deposit accounts for a candidate.')
    .option('-o, --output <format>', 'Output format: table or json', 'table')
    .action(async (candidateId, options) => {
      await invoke(async ({ chalk }) => {
        const response = await api.get('/query/DirectDepositAccount', {
          params: {
            where: `candidate.id = ${candidateId}`,
            fields: 'id,bankName,accountNumber,transitNumber,directDepositAccountTypeLookup,amount,remainder,paymentOrder,currencyUnit',
          },
        });

        const records = response.data?.data || [];

        if (options.output === 'json') {
          renderJsonOutput(records);
        } else if (records.length === 0) {
          console.log(chalk.yellow(`No direct deposit accounts found for candidate ${candidateId}.`));
        } else {
          console.log(chalk.cyan.bold(`\nDirect Deposit Accounts for Candidate ${candidateId}:\n`));
          renderTableOutput(records, null, (record) => [
            record.id || '-',
            record.bankName || '-',
            record.transitNumber || '-',
            record.accountNumber || '-',
            record.directDepositAccountTypeLookup?.label || record.directDepositAccountTypeLookup || '-',
            record.amount !== undefined && record.amount !== null ? `$${record.amount}` : '-',
            record.remainder ? chalk.green('true') : 'false',
            record.paymentOrder ?? '-',
          ]);
        }
      }, { spinnerMsg: `Fetching direct deposit accounts for candidate ${candidateId}...`, successMsg: 'Done.', failMsg: 'Failed to fetch direct deposit accounts.' });
    });

  return dd;
}
