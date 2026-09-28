// src/commands/pay-bill/index.js — Barrel: creates pay-bill command + adds all subcommands.

import { Command } from 'commander';
import buildAccountingPeriodCommand from './accounting-period.js';
import buildAccountingPeriodSettingCommand from './accounting-period-setting.js';
import buildBillMasterCommand from './bill-master.js';
import buildBillMasterTransactionCommand from './bill-master-transaction.js';
import buildDirectDepositAccountTypeLookupCommand from './direct-deposit-account-type-lookup.js';
import buildInvoiceStatementCommand from './invoice-statement.js';
import buildInvoiceTermCommand from './invoice-term.js';
import buildPayableChargeCommand from './payable-charge.js';
import buildPayBillCycleCommand from './pay-bill-cycle.js';
import buildSalesTaxRateCommand from './sales-tax-rate.js';
import buildTimesheetCommand from './timesheet.js';
import buildTimesheetEntryCommand from './timesheet-entry.js';

/** Creates the parent pay-bill command with all 12 subcommands. */
export default function createPayBillCommand() {
  const payBill = new Command('pay-bill')
    .description('Manage Pay & Bill / Timesheet entities.');

  buildAccountingPeriodCommand(payBill);
  buildAccountingPeriodSettingCommand(payBill);
  buildBillMasterCommand(payBill);
  buildBillMasterTransactionCommand(payBill);
  buildDirectDepositAccountTypeLookupCommand(payBill);
  buildInvoiceStatementCommand(payBill);
  buildInvoiceTermCommand(payBill);
  buildPayableChargeCommand(payBill);
  buildPayBillCycleCommand(payBill);
  buildSalesTaxRateCommand(payBill);
  buildTimesheetCommand(payBill);
  buildTimesheetEntryCommand(payBill);

  return payBill;
}
