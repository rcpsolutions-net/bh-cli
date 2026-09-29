// src/commands/pay-bill/invoice-term.js — InvoiceTerm entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildInvoiceTermCommand(parent) {
  const invoiceTerm = parent.command('invoice-term')
    .description('Manage InvoiceTerm entities (invoice terms).');

  buildGetEndpoint(invoiceTerm, 'invoice-term', {
    entityName: 'InvoiceTerm',
    fieldsDefault: 'id,invoiceStatementId,termName,termValue',
  });

  return invoiceTerm;
}
