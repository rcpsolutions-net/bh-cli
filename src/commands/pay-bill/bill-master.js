// src/commands/pay-bill/bill-master.js — BillMaster entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildBillMasterCommand(parent) {
  const billMaster = parent.command('bill-master')
    .description('Manage BillMaster entities (billing masters).');

  buildGetEndpoint(billMaster, 'bill-master', {
    entityName: 'BillMaster',
    fieldsDefault: 'id,billNumber,candidateId,clientContactId,totalAmount',
  });

  return billMaster;
}
