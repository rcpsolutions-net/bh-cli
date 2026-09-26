// src/commands/pay-bill.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'pay-bill' command group for Pay & Bill / Timesheet entities.
 * Covers: AccountingPeriod, AccountingPeriodSetting, BillMaster, BillMasterTransaction,
 *         DirectDepositAccountTypeLookup, InvoiceStatement, InvoiceTerm,
 *         PayableCharge, PayBillCycle, SalesTaxRate, Timesheet, TimesheetEntry
 */
export default function createPayBillCommand() {
  const payBill = new Command('pay-bill')
    .description('Manage Pay & Bill / Timesheet entities.');

  // Helper function to build params from common options
  function buildParams(options, extraParams = {}) {
    const params = { ...extraParams };
    if (options.fields) params.fields = options.fields;
    if (options.count) params.count = options.count;
    if (options.start) params.start = options.start;
    if (options.orderBy) params.orderBy = options.orderBy;
    if (options.where) params.where = options.where;
    if (options.query) params.query = options.query;
    return params;
  }

  // Helper function to render table from records
  function renderTable(records, label) {
    if (!records || records.length === 0) {
      console.log(chalk.yellow('No records found.'));
      return;
    }
    console.log(chalk.cyan.bold(`\n${label}:\n`));
    const headers = Object.keys(records[0] || {});
    const table = new Table({
      head: headers.map(h => chalk.cyan.bold(h)),
    });
    for (const record of records) {
      table.push(
        headers.map(h => {
          const val = record[h];
          return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
        })
      );
    }
    console.log(table.toString());
  }

  // --- AccountingPeriod ---
  const accountingPeriod = payBill.command('accounting-period')
    .description('Manage AccountingPeriod entities (payroll cycles).');

  accountingPeriod
    .command('get [id]')
    .description('Get an AccountingPeriod by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name,dateAdded,dateUpdated')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching AccountingPeriod ${id}...` : 'Listing AccountingPeriods...').start();
      try {
        const url = id ? `/entity/AccountingPeriod/${id}` : '/query/AccountingPeriod';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `AccountingPeriod${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch AccountingPeriod.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- AccountingPeriodSetting ---
  const accountingPeriodSetting = payBill.command('accounting-period-setting')
    .description('Manage AccountingPeriodSetting entities (payroll settings).');

  accountingPeriodSetting
    .command('get [id]')
    .description('Get an AccountingPeriodSetting by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,accountingPeriodId,settingName,settingValue')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching AccountingPeriodSetting ${id}...` : 'Listing AccountingPeriodSettings...').start();
      try {
        const url = id ? `/entity/AccountingPeriodSetting/${id}` : '/query/AccountingPeriodSetting';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `AccountingPeriodSetting${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch AccountingPeriodSetting.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- BillMaster ---
  const billMaster = payBill.command('bill-master')
    .description('Manage BillMaster entities (billing masters).');

  billMaster
    .command('get [id]')
    .description('Get a BillMaster by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,billNumber,candidateId,clientContactId,totalAmount')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching BillMaster ${id}...` : 'Listing BillMasters...').start();
      try {
        const url = id ? `/entity/BillMaster/${id}` : '/query/BillMaster';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `BillMaster${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch BillMaster.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- BillMasterTransaction ---
  const billMasterTransaction = payBill.command('bill-master-transaction')
    .description('Manage BillMasterTransaction entities (billing transactions).');

  billMasterTransaction
    .command('get [id]')
    .description('Get a BillMasterTransaction by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,billMasterId,amount,transactionDate')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching BillMasterTransaction ${id}...` : 'Listing BillMasterTransactions...').start();
      try {
        const url = id ? `/entity/BillMasterTransaction/${id}` : '/query/BillMasterTransaction';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `BillMasterTransaction${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch BillMasterTransaction.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- DirectDepositAccountTypeLookup ---
  const directDepositAccountTypeLookup = payBill.command('direct-deposit-account-type-lookup')
    .description('Manage DirectDepositAccountTypeLookup entities (pay types).');

  directDepositAccountTypeLookup
    .command('get [id]')
    .description('Get a DirectDepositAccountTypeLookup by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching DirectDepositAccountTypeLookup ${id}...` : 'Listing DirectDepositAccountTypeLookups...').start();
      try {
        const url = id ? `/entity/DirectDepositAccountTypeLookup/${id}` : '/query/DirectDepositAccountTypeLookup';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `DirectDepositAccountTypeLookup${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch DirectDepositAccountTypeLookup.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- InvoiceStatement ---
  const invoiceStatement = payBill.command('invoice-statement')
    .description('Manage InvoiceStatement entities (invoicing).');

  invoiceStatement
    .command('get [id]')
    .description('Get an InvoiceStatement by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,invoiceStatementNumber,candidateId,clientContactId,totalAmount,status')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching InvoiceStatement ${id}...` : 'Listing InvoiceStatements...').start();
      try {
        const url = id ? `/entity/InvoiceStatement/${id}` : '/query/InvoiceStatement';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `InvoiceStatement${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch InvoiceStatement.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- InvoiceTerm ---
  const invoiceTerm = payBill.command('invoice-term')
    .description('Manage InvoiceTerm entities (invoice terms).');

  invoiceTerm
    .command('get [id]')
    .description('Get an InvoiceTerm by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,invoiceStatementId,termName,termValue')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching InvoiceTerm ${id}...` : 'Listing InvoiceTerms...').start();
      try {
        const url = id ? `/entity/InvoiceTerm/${id}` : '/query/InvoiceTerm';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `InvoiceTerm${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch InvoiceTerm.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- PayableCharge ---
  const payableCharge = payBill.command('payable-charge')
    .description('Manage PayableCharge entities (payable charges).');

  payableCharge
    .command('get [id]')
    .description('Get a PayableCharge by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,billMasterId,amount,chargeDate')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching PayableCharge ${id}...` : 'Listing PayableCharges...').start();
      try {
        const url = id ? `/entity/PayableCharge/${id}` : '/query/PayableCharge';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `PayableCharge${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch PayableCharge.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- PayBillCycle ---
  const payBillCycle = payBill.command('pay-bill-cycle')
    .description('Manage PayBillCycle entities (pay cycles).');

  payBillCycle
    .command('get [id]')
    .description('Get a PayBillCycle by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name,dateAdded,dateUpdated')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching PayBillCycle ${id}...` : 'Listing PayBillCycles...').start();
      try {
        const url = id ? `/entity/PayBillCycle/${id}` : '/query/PayBillCycle';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `PayBillCycle${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch PayBillCycle.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- SalesTaxRate ---
  const salesTaxRate = payBill.command('sales-tax-rate')
    .description('Manage SalesTaxRate entities (sales tax).');

  salesTaxRate
    .command('get [id]')
    .description('Get a SalesTaxRate by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,name,rate,dateAdded')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching SalesTaxRate ${id}...` : 'Listing SalesTaxRates...').start();
      try {
        const url = id ? `/entity/SalesTaxRate/${id}` : '/query/SalesTaxRate';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `SalesTaxRate${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch SalesTaxRate.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- Timesheet ---
  const timesheet = payBill.command('timesheet')
    .description('Manage Timesheet entities (timesheet entries).');

  timesheet
    .command('get [id]')
    .description('Get a Timesheet by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,candidateId,clientContactId,jobOrderId,totalHours,amount,status')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching Timesheet ${id}...` : 'Listing Timesheets...').start();
      try {
        const url = id ? `/entity/Timesheet/${id}` : '/query/Timesheet';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `Timesheet${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch Timesheet.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- TimesheetEntry ---
  const timesheetEntry = payBill.command('timesheet-entry')
    .description('Manage TimesheetEntry entities (timesheet line items).');

  timesheetEntry
    .command('get [id]')
    .description('Get a TimesheetEntry by ID, or list all.')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', 'id,timesheetId,amount,units,jobOrderId')
    .option('-c, --count <number>', 'Number of records to return', '25')
    .option('--start <number>', 'Starting index for pagination', '0')
    .option('--orderBy <field>', 'Field to sort by (add DESC for descending)')
    .option('--where <sqlWhere>', 'SQL-like WHERE clause')
    .option('-o, --output <format>', 'Output format (table or json)', 'table')
    .action(async (id, options) => {
      const spinner = ora(id ? `Fetching TimesheetEntry ${id}...` : 'Listing TimesheetEntries...').start();
      try {
        const url = id ? `/entity/TimesheetEntry/${id}` : '/query/TimesheetEntry';
        const params = buildParams(options);

        const response = await api.get(url, { params });
        const data = id ? response.data : response.data.data;

        spinner.succeed(chalk.green(id ? 'Fetch successful!' : 'Listing complete!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          const records = id ? [data] : (data.data || []);
          renderTable(records, `TimesheetEntry${id ? '' : 's'}`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch TimesheetEntry.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return payBill;
}
