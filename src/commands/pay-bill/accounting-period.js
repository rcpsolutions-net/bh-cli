// src/commands/pay-bill/accounting-period.js — AccountingPeriod entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildAccountingPeriodCommand(parent) {
  const accountingPeriod = parent.command('accounting-period')
    .description('Manage AccountingPeriod entities (payroll cycles).');

  buildGetEndpoint(accountingPeriod, 'accounting-period', {
    entityName: 'AccountingPeriod',
    fieldsDefault: 'id,name,dateAdded,dateUpdated',
  });

  return accountingPeriod;
}
