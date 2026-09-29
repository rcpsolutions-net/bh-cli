// src/commands/pay-bill/payable-charge.js — PayableCharge entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildPayableChargeCommand(parent) {
  const payableCharge = parent.command('payable-charge')
    .description('Manage PayableCharge entities (payable charges).');

  buildGetEndpoint(payableCharge, 'payable-charge', {
    entityName: 'PayableCharge',
    fieldsDefault: 'id,billMasterId,amount,chargeDate',
  });

  return payableCharge;
}
