// src/commands/service.js

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

const ACCOUNT_TYPES = {
  checking: { id: 1, label: 'Checking' },
  '1': { id: 1, label: 'Checking' },
  savings: { id: 2, label: 'Savings' },
  '2': { id: 2, label: 'Savings' },
  'pay card': { id: 3, label: 'Pay Card' },
  paycard: { id: 3, label: 'Pay Card' },
  card: { id: 3, label: 'Pay Card' },
  '3': { id: 3, label: 'Pay Card' },
};

function resolveAccountType(typeInput) {
  if (!typeInput) return { id: 1, label: 'Checking' };
  const key = String(typeInput).trim().toLowerCase();
  if (ACCOUNT_TYPES[key]) {
    return ACCOUNT_TYPES[key];
  }
  return { id: 1, label: String(typeInput) };
}

function renderChangesTable(changes) {
  const table = new Table({
    head: [
      chalk.cyan.bold('#'),
      chalk.cyan.bold('Entity Type'),
      chalk.cyan.bold('Entity ID'),
      chalk.cyan.bold('Change Type'),
    ],
  });

  if (Array.isArray(changes)) {
    changes.forEach((item, index) => {
      table.push([
        index + 1,
        item.changedEntityType || 'DirectDepositAccount',
        item.changedEntityId || '-',
        chalk.green(item.changeType || 'UNKNOWN'),
      ]);
    });
  } else if (typeof changes === 'object' && changes !== null) {
    table.push([
      1,
      changes.changedEntityType || '-',
      changes.changedEntityId || '-',
      chalk.green(changes.changeType || 'UNKNOWN'),
    ]);
  }

  console.log(table.toString());
}

export function buildDirectDepositPayload(candidateIdArg, options = {}) {
  const candidateId = candidateIdArg || options.candidate;
  let payload = null;

  if (options.clear) {
    if (!candidateId) {
      throw new Error('Candidate ID is required when using --clear.');
    }
    return {
      candidate: { id: Number(candidateId) },
      directDepositAccounts: [],
    };
  }

  if (options.file) {
    if (!existsSync(options.file)) {
      throw new Error(`File not found: ${options.file}`);
    }
    const content = readFileSync(options.file, 'utf-8');
    payload = JSON.parse(content);
  } else if (options.data) {
    payload = JSON.parse(options.data);
  } else if (options.account || options.transit || options.routing) {
    const transit = options.transit || options.routing;
    if (!options.account || !transit) {
      throw new Error('Both account number (--account) and transit/routing number (--transit or --routing) are required when configuring via flags.');
    }
    if (!candidateId) {
      throw new Error('Candidate ID is required (pass as argument or via --candidate <id>).');
    }

    const accountEntry = {
      bankName: options.bank || '',
      accountNumber: String(options.account).trim(),
      transitNumber: String(transit).trim(),
      directDepositAccountTypeLookup: resolveAccountType(options.type),
      currencyUnit: {
        id: options.currencyUnit !== undefined ? Number(options.currencyUnit) : 166,
        minorUnits: options.minorUnits !== undefined ? Number(options.minorUnits) : 0,
      },
      remainder: !!options.remainder,
      paymentOrder: options.order !== undefined ? Number(options.order) : 1,
    };

    if (options.amount !== undefined && !Number.isNaN(options.amount)) {
      accountEntry.amount = Number(options.amount);
    }

    payload = {
      candidate: { id: Number(candidateId) },
      directDepositAccounts: [accountEntry],
    };
  } else {
    throw new Error('No direct deposit data provided. Use --file <path>, --data <json>, --clear, or configure with flags (--account, --transit, etc.).');
  }

  // Normalize payload structure if an array of accounts was passed
  if (Array.isArray(payload)) {
    if (!candidateId) {
      throw new Error('When passing an array of accounts, Candidate ID is required (pass as argument or via --candidate <id>).');
    }
    payload = {
      candidate: { id: Number(candidateId) },
      directDepositAccounts: payload,
    };
  } else if (candidateId && (!payload.candidate || !payload.candidate.id)) {
    payload.candidate = { id: Number(candidateId) };
  }

  if (!payload.candidate?.id) {
    throw new Error('Payload is missing candidate.id.');
  }

  if (!Array.isArray(payload.directDepositAccounts)) {
    throw new Error('Payload must contain a "directDepositAccounts" array.');
  }

  return payload;
}

function buildDirectDepositCommand() {
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

function buildCallCommand() {
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

/**
 * Creates the 'service' command group for Bullhorn business services.
 */
export default function createServiceCommand() {
  const service = new Command('service')
    .alias('services')
    .description('Interact with Bullhorn REST API business services (DirectDepositAccount, etc.)');

  service.addCommand(buildDirectDepositCommand());
  service.addCommand(buildCallCommand());

  return service;
}
