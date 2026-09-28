// src/commands/service/_shared.js — Shared helpers for service subcommands
import { readFileSync, existsSync } from 'node:fs';
import chalk from 'chalk';
import Table from 'cli-table3';

export function renderChangesTable(changes) {
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

export function resolveAccountType(typeInput) {
  if (!typeInput) return { id: 1, label: 'Checking' };
  const key = String(typeInput).trim().toLowerCase();
  if (ACCOUNT_TYPES[key]) {
    return ACCOUNT_TYPES[key];
  }
  return { id: 1, label: String(typeInput) };
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
