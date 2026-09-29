// src/commands/pay-bill/pay-bill-cycle.js — PayBillCycle entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildPayBillCycleCommand(parent) {
  const payBillCycle = parent.command('pay-bill-cycle')
    .description('Manage PayBillCycle entities (pay cycles).');

  buildGetEndpoint(payBillCycle, 'pay-bill-cycle', {
    entityName: 'PayBillCycle',
    fieldsDefault: 'id,name,dateAdded,dateUpdated',
  });

  return payBillCycle;
}
