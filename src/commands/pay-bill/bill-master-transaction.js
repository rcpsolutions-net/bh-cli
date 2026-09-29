// src/commands/pay-bill/bill-master-transaction.js — BillMasterTransaction entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildBillMasterTransactionCommand(parent) {
  const billMasterTransaction = parent.command('bill-master-transaction')
    .description('Manage BillMasterTransaction entities (billing transactions).');

  buildGetEndpoint(billMasterTransaction, 'bill-master-transaction', {
    entityName: 'BillMasterTransaction',
    fieldsDefault: 'id,billMasterId,amount,transactionDate',
  });

  return billMasterTransaction;
}
