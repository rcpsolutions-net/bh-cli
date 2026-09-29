// src/commands/service.js

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import FormData from 'form-data';
import api from '../lib/api.js';
import inquirer from 'inquirer';

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

/* ========================================================================
 * CorporateUser service — POST/PUT /services/CorporateUser (2024.11)
 * ======================================================================== */
function buildCorporateUserCommand() {
  const cmd = new Command('corporate-user')
    .description('Manage CorporateUser service (create/update corporate users).');

  cmd.command('create [corpUserId]')
    .description('Create a new corporate user via POST /services/CorporateUser.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corpUserIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (corpUserIdArg) payload.id = Number(corpUserIdArg);

      const spinner = ora('Creating CorporateUser via POST /services/CorporateUser...').start();
      try {
        const response = await api.post('/services/CorporateUser', payload);
        spinner.succeed(chalk.green('CorporateUser created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create CorporateUser.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('update [corpUserId]')
    .description('Update a corporate user via PUT /services/CorporateUser/{corpUserId}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corpUserIdArg, options) => {
      let payload;
      const corpUserId = corpUserIdArg || (options.file || options.data ? null : null);
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      const id = corpUserIdArg || payload?.id;
      if (!id) {
        console.error(chalk.red('Error: CorporateUser ID is required (pass as argument or in payload).'));
        process.exit(1);
      }

      const spinner = ora(`Updating CorporateUser ${id} via PUT /services/CorporateUser/${id}...`).start();
      try {
        const response = await api.put(`/services/CorporateUser/${id}`, payload);
        spinner.succeed(chalk.green(`CorporateUser ${id} updated!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update CorporateUser.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * CorporateUserDelegation service — PUT/DELETE (2024.12 PUT, 2026.5 DELETE)
 * ======================================================================== */
function buildCorporateUserDelegationCommand() {
  const cmd = new Command('corporate-user-delegation')
    .description('Manage CorporateUserDelegation service (delegated access).');

  cmd.command('set <corporateUserId> <delegateId>')
    .description('Set delegation via PUT /services/CorporateUser/{corpId}/delegation/{delegateId}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corporateUserId, delegateId, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        payload = {};
      }

      const spinner = ora(`Setting delegation for CorporateUser ${corporateUserId} → ${delegateId}...`).start();
      try {
        const response = await api.put(
          `/services/CorporateUser/${corporateUserId}/delegation/${delegateId}`,
          payload,
        );
        spinner.succeed(chalk.green('Delegation set!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to set delegation.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('remove <corporateUserId> <delegateId>')
    .description('Remove delegation via DELETE /services/CorporateUser/{corpId}/delegation/{delegateId}.')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (corporateUserId, delegateId, options) => {
      const spinner = ora(`Removing delegation for CorporateUser ${corporateUserId} → ${delegateId}...`).start();
      try {
        const response = await api.delete(`/services/CorporateUser/${corporateUserId}/delegation/${delegateId}`);
        spinner.succeed(chalk.green('Delegation removed!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to remove delegation.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * PlacementChangeRequest service — POST/PUT + approve (2024.11)
 * ======================================================================== */
function buildPlacementChangeRequestCommand() {
  const cmd = new Command('placement-change-request')
    .description('Manage PlacementChangeRequest service (create/update/approve).');

  cmd.command('create [placementId]')
    .description('Create a placement change request via POST /services/PlacementChangeRequest.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (placementIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (placementIdArg) payload.placement = { id: Number(placementIdArg) };

      const spinner = ora('Creating PlacementChangeRequest via POST /services/PlacementChangeRequest...').start();
      try {
        const response = await api.post('/services/PlacementChangeRequest', payload);
        spinner.succeed(chalk.green('PlacementChangeRequest created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create PlacementChangeRequest.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('update <changeRequestId>')
    .description('Update a placement change request via PUT /services/PlacementChangeRequest/{id}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (changeRequestId, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }

      const spinner = ora(`Updating PlacementChangeRequest ${changeRequestId}...`).start();
      try {
        const response = await api.put(`/services/PlacementChangeRequest/${changeRequestId}`, payload);
        spinner.succeed(chalk.green(`PlacementChangeRequest ${changeRequestId} updated!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update PlacementChangeRequest.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('approve <changeRequestId>')
    .description('Approve a placement change request via POST /services/PlacementChangeRequest/{id}/approve.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (changeRequestId, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        payload = {};
      }

      const spinner = ora(`Approving PlacementChangeRequest ${changeRequestId}...`).start();
      try {
        const response = await api.post(`/services/PlacementChangeRequest/${changeRequestId}/approve`, payload);
        spinner.succeed(chalk.green(`PlacementChangeRequest ${changeRequestId} approved!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to approve PlacementChangeRequest.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * BillableCharge service — POST/PUT (2024.11)
 * ======================================================================== */
function buildBillableChargeCommand() {
  const cmd = new Command('billable-charge')
    .description('Manage BillableCharge service (create/update billable charges).');

  cmd.command('create [placementId]')
    .description('Create a billable charge via POST /services/BillableCharge.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (placementIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (placementIdArg) payload.placement = { id: Number(placementIdArg) };

      const spinner = ora('Creating BillableCharge via POST /services/BillableCharge...').start();
      try {
        const response = await api.post('/services/BillableCharge', payload);
        spinner.succeed(chalk.green('BillableCharge created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create BillableCharge.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  cmd.command('update <chargeId>')
    .description('Update a billable charge via PUT /services/BillableCharge/{id}.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (chargeId, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }

      const spinner = ora(`Updating BillableCharge ${chargeId}...`).start();
      try {
        const response = await api.put(`/services/BillableCharge/${chargeId}`, payload);
        spinner.succeed(chalk.green(`BillableCharge ${chargeId} updated!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to update BillableCharge.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * CustomerRequiredFieldMeta service — POST (2025.3)
 * ======================================================================== */
function buildCustomerRequiredFieldMetaCommand() {
  const cmd = new Command('customer-required-field-meta')
    .description('Manage CustomerRequiredFieldMeta service (create custom required field definitions).');

  cmd.command('create')
    .description('Create a customer required field meta entry via POST /services/CustomerRequiredFieldMeta.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }

      const spinner = ora('Creating CustomerRequiredFieldMeta via POST /services/CustomerRequiredFieldMeta...').start();
      try {
        const response = await api.post('/services/CustomerRequiredFieldMeta', payload);
        spinner.succeed(chalk.green('CustomerRequiredFieldMeta created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create CustomerRequiredFieldMeta.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * PlacementCustomerRequiredField service — POST (2025.3)
 * ======================================================================== */
function buildPlacementCustomerRequiredFieldCommand() {
  const cmd = new Command('placement-customer-required-field')
    .description('Manage PlacementCustomerRequiredField service (placement-specific required fields).');

  cmd.command('create [placementId]')
    .description('Create a placement customer required field via POST /services/PlacementCustomerRequiredField.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (placementIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (placementIdArg) payload.placement = { id: Number(placementIdArg) };

      const spinner = ora('Creating PlacementCustomerRequiredField via POST /services/PlacementCustomerRequiredField...').start();
      try {
        const response = await api.post('/services/PlacementCustomerRequiredField', payload);
        spinner.succeed(chalk.green('PlacementCustomerRequiredField created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create PlacementCustomerRequiredField.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * JobCustomerRequiredField service — POST (2025.3)
 * ======================================================================== */
function buildJobCustomerRequiredFieldCommand() {
  const cmd = new Command('job-customer-required-field')
    .description('Manage JobCustomerRequiredField service (job-specific required fields).');

  cmd.command('create [jobOrderId]')
    .description('Create a job customer required field via POST /services/JobCustomerRequiredField.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (jobOrderIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (jobOrderIdArg) payload.jobOrder = { id: Number(jobOrderIdArg) };

      const spinner = ora('Creating JobCustomerRequiredField via POST /services/JobCustomerRequiredField...').start();
      try {
        const response = await api.post('/services/JobCustomerRequiredField', payload);
        spinner.succeed(chalk.green('JobCustomerRequiredField created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create JobCustomerRequiredField.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * PlacementCustomerRequiredFieldConfiguration version service (2025.3)
 * ======================================================================== */
function buildPlacementCustomerRequiredFieldConfigCommand() {
  const cmd = new Command('placement-crf-config')
    .alias('placement-customer-required-field-config')
    .description('Manage PlacementCustomerRequiredFieldConfiguration version service.');

  cmd.command('create [placementId]')
    .description('Create a placement CRF configuration version via POST /services/PlacementCustomerRequiredFieldConfiguration.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (placementIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (placementIdArg) payload.placement = { id: Number(placementIdArg) };

      const spinner = ora('Creating PlacementCustomerRequiredFieldConfiguration via POST /services/PlacementCustomerRequiredFieldConfiguration...').start();
      try {
        const response = await api.post('/services/PlacementCustomerRequiredFieldConfiguration', payload);
        spinner.succeed(chalk.green('PlacementCustomerRequiredFieldConfiguration created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create PlacementCustomerRequiredFieldConfiguration.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * JobCustomerRequiredFieldConfiguration version service (2025.3)
 * ======================================================================== */
function buildJobCustomerRequiredFieldConfigCommand() {
  const cmd = new Command('job-crf-config')
    .alias('job-customer-required-field-config')
    .description('Manage JobCustomerRequiredFieldConfiguration version service.');

  cmd.command('create [jobOrderId]')
    .description('Create a job CRF configuration version via POST /services/JobCustomerRequiredFieldConfiguration.')
    .option('-f, --file <filePath>', 'Path to JSON file containing request payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (jobOrderIdArg, options) => {
      let payload;
      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else {
        console.error(chalk.red('Error: Provide --file <path> or --data <json>.'));
        process.exit(1);
      }
      if (jobOrderIdArg) payload.jobOrder = { id: Number(jobOrderIdArg) };

      const spinner = ora('Creating JobCustomerRequiredFieldConfiguration via POST /services/JobCustomerRequiredFieldConfiguration...').start();
      try {
        const response = await api.post('/services/JobCustomerRequiredFieldConfiguration', payload);
        spinner.succeed(chalk.green('JobCustomerRequiredFieldConfiguration created!'));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          renderChangesTable(response.data);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create JobCustomerRequiredFieldConfiguration.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
}

/* ========================================================================
 * Events service — CRUD event subscriptions (from bullhorn.github.io)
 * ======================================================================== */
function buildEventsCommand() {
  const cmd = new Command('events')
    .description('Manage Bullhorn REST API event subscriptions (create, list, consume, delete).');

  // Create subscription
  cmd.command('subscribe <subscriptionId>')
    .description('Create an event subscription via PUT /event/subscription/{subscriptionId}.')
    .option('-e, --entities <entities>', 'Comma-separated entity names (e.g. Candidate,Placement,JobOrder)')
    .option('-t, --event-types <types>', 'Comma-separated event types: INSERTED,UPDATED,DELETED (default: INSERTED,UPDATED,DELETED)', 'INSERTED,UPDATED,DELETED')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      const entities = options.entities || 'Candidate,ClientContact,Placement,JobOrder,Note,Task';
      const eventTypes = options.eventTypes;

      const spinner = ora(`Creating event subscription ${subscriptionId} for entities [${entities}]...`).start();
      try {
        const response = await api.put(`/event/subscription/${subscriptionId}`, null, {
          params: {
            type: 'entity',
            names: entities,
            eventTypes,
          },
        });
        spinner.succeed(chalk.green(`Event subscription ${subscriptionId} created!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold(`\nEvent Subscription Created:\n`));
          console.log(`  Subscription ID: ${response.data?.subscriptionId || subscriptionId}`);
          console.log(`  Entities: ${entities}`);
          console.log(`  Event Types: ${eventTypes}`);
          console.log(`  Created: ${response.data?.createdOn ? new Date(response.data.createdOn).toISOString() : 'N/A'}`);
          if (response.data?.jmsSelector) {
            console.log(`  JMSToken: ${response.data.jmsSelector}`);
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create event subscription.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // List subscriptions
  cmd.command('list')
    .description('List all event subscriptions via GET /event/subscription.')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (options) => {
      const spinner = ora('Fetching event subscriptions...').start();
      try {
        const response = await api.get('/event/subscription');
        const subscriptions = response.data?.data || response.data || [];
        spinner.succeed(chalk.green(`Fetched ${Array.isArray(subscriptions) ? subscriptions.length : 0} subscription(s).`));
        if (options.output === 'json') {
          console.log(JSON.stringify(subscriptions, null, 2));
        } else {
          if (Array.isArray(subscriptions) && subscriptions.length === 0) {
            console.log(chalk.yellow('No event subscriptions found.'));
            return;
          }
          const table = new Table({
            head: [
              chalk.cyan.bold('Subscription ID'),
              chalk.cyan.bold('Entities'),
              chalk.cyan.bold('Event Types'),
              chalk.cyan.bold('Created'),
            ],
          });
          for (const sub of (Array.isArray(subscriptions) ? subscriptions : [subscriptions])) {
            table.push([
              sub.subscriptionId || '-',
              sub.names || '-',
              sub.eventTypes || '-',
              sub.createdOn ? new Date(sub.createdOn).toISOString() : '-',
            ]);
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to list event subscriptions.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // Consume events
  cmd.command('consume <subscriptionId>')
    .description('Consume events from a subscription via GET /event/subscription/{subscriptionId}.')
    .option('-m, --max-events <max>', 'Maximum events to retrieve (default: 100)', parseInt, 100)
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      const maxEvents = options.maxEvents;
      const spinner = ora(`Consuming up to ${maxEvents} events from subscription ${subscriptionId}...`).start();
      try {
        const response = await api.get(`/event/subscription/${subscriptionId}`, {
          params: { maxEvents },
        });
        const events = response.data?.data || response.data || [];
        spinner.succeed(chalk.green(`Consumed ${Array.isArray(events) ? events.length : 0} event(s).`));
        if (options.output === 'json') {
          console.log(JSON.stringify(events, null, 2));
        } else {
          if (Array.isArray(events) && events.length === 0) {
            console.log(chalk.yellow('No events to consume.'));
            return;
          }
          const table = new Table({
            head: [
              chalk.cyan.bold('#'),
              chalk.cyan.bold('Entity'),
              chalk.cyan.bold('Event ID'),
              chalk.cyan.bold('Type'),
              chalk.cyan.bold('Entity ID'),
              chalk.cyan.bold('Updated Fields'),
              chalk.cyan.bold('Timestamp'),
            ],
          });
          for (const evt of (Array.isArray(events) ? events : [events])) {
            const updatedFields = evt.updatedProperties
              ? Array.isArray(evt.updatedProperties) ? evt.updatedProperties.join(', ') : String(evt.updatedProperties)
              : '-';
            table.push([
              events.length > 1 ? events.indexOf(evt) + 1 : 1,
              evt.entityName || '-',
              evt.eventId || '-',
              evt.entityEventType || '-',
              evt.entityId ?? '-',
              updatedFields,
              evt.eventTimestamp ? new Date(evt.eventTimestamp).toISOString() : '-',
            ]);
          }
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to consume events.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  // Delete subscription
  cmd.command('unsubscribe <subscriptionId>')
    .description('Delete an event subscription via DELETE /event/subscription/{subscriptionId}.')
    .option('-f, --force', 'Skip confirmation prompt')
    .option('-o, --output <format>', 'Output format: json or table', 'json')
    .action(async (subscriptionId, options) => {
      if (!options.force) {
        const { confirm } = await inquirer.prompt([{
          name: 'confirm',
          type: 'confirm',
          message: chalk.yellow(`Are you sure you want to delete event subscription ${subscriptionId}?`),
          default: false,
        }]);
        if (!confirm) {
          console.log(chalk.yellow('Aborted.'));
          return;
        }
      }

      const spinner = ora(`Deleting event subscription ${subscriptionId}...`).start();
      try {
        const response = await api.delete(`/event/subscription/${subscriptionId}`);
        spinner.succeed(chalk.green(`Event subscription ${subscriptionId} deleted!`));
        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.green(`Event subscription ${subscriptionId} successfully deleted.`));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to delete event subscription.'));
        if (error.response) {
          console.error(chalk.red(`Error ${error.response.status}: ${error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data)}`));
        } else {
          console.error(chalk.red('Unexpected error:', error.message));
        }
        process.exit(1);
      }
    });

  return cmd;
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

  // New services (Phase 3)
  service.addCommand(buildCorporateUserCommand());
  service.addCommand(buildCorporateUserDelegationCommand());
  service.addCommand(buildPlacementChangeRequestCommand());
  service.addCommand(buildBillableChargeCommand());
  service.addCommand(buildCustomerRequiredFieldMetaCommand());
  service.addCommand(buildPlacementCustomerRequiredFieldCommand());
  service.addCommand(buildJobCustomerRequiredFieldCommand());
  service.addCommand(buildPlacementCustomerRequiredFieldConfigCommand());
  service.addCommand(buildJobCustomerRequiredFieldConfigCommand());

  // Events
  service.addCommand(buildEventsCommand());

  return service;
}
