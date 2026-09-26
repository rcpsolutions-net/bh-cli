// src/commands/help.js

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'help' command for looking up Bullhorn API documentation.
 * Helps users understand how to use bh-cli commands for specific entities and operations.
 */
export default function createHelpCommand() {
  const help = new Command('help')
    .description('Look up Bullhorn API documentation and bh-cli command guidance.')
    .argument('[entityType]', 'Entity type to look up (e.g., Candidate, JobOrder)')
    .option(
      '-c, --commands',
      'List all bh-cli commands'
    )
    .option(
      '-e, --entities',
      'List all supported Bullhorn entities'
    )
    .option(
      '-o, --output <format>',
      'Output format (table or json)',
      'table'
    )
    .action(async (entityType, options) => {
      // List all bh-cli commands
      if (options.commands) {
        console.log(chalk.cyan.bold('\n=== bh-cli Commands ===\n'));

        const commands = [
          { command: 'auth', description: 'Authenticate (login/logout/status)' },
          { command: 'get', description: 'Fetch entity record by ID (with to-many support)' },
          { command: 'search', description: 'Search entities using Lucene queries' },
          { command: 'query', description: 'Query entities using SQL-like WHERE clauses' },
          { command: 'create', description: 'Create new entity record' },
          { command: 'update', description: 'Update existing entity record' },
          { command: 'delete', description: 'Delete entity record' },
          { command: 'soft-delete', description: 'Soft delete (sets isDeleted=true)' },
          { command: 'meta', description: 'Get entity field metadata' },
          { command: 'entities', description: 'Display entity relationship flowchart' },
          { command: 'entitlements', description: 'Check entity permissions' },
          { command: 'association', description: 'Bulk lookup entity associations' },
          { command: 'associate', description: 'Associate to-many child entities' },
          { command: 'disassociate', description: 'Disassociate to-many child entities' },
          { command: 'department', description: 'Query department-scoped entities' },
          { command: 'my', description: 'Query user-owned entities' },
          { command: 'all-corp-notes', description: 'Query all corporation notes' },
          { command: 'login-info', description: 'Resolve data center (diagnostics)' },
          { command: 'file', description: 'Manage file attachments' },
          { command: 'resume', description: 'Manage resume upload/download/parsing' },
          { command: 'service', description: 'Call business services (13+ subcommands)' },
          { command: 'version', description: 'Manage effective-dated entity versions' },
          { command: 'data-hub', description: 'Data Hub operations (upsert, source systems)' },
          { command: 'bulk-update', description: 'Mass update multiple entities' },
          { command: 'pay-bill', description: 'Pay & Bill / Timesheet entities (12 subcommands)' },
          { command: 'help', description: 'Look up API documentation' },
        ];

        const table = new Table({
          head: [chalk.cyan.bold('Command'), chalk.cyan.bold('Description')],
        });
        for (const cmd of commands) {
          table.push([chalk.bold(cmd.command), cmd.description]);
        }
        console.log(table.toString());
        return;
      }

      // List all supported Bullhorn entities
      if (options.entities) {
        const entities = [
          // Core Staffing
          { name: 'Candidate', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'ClientContact', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'JobOrder', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'JobSubmission', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Placement', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Lead', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Opportunity', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Note', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Appointment', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Task', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Sendout', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'WebResponse', category: 'Core Staffing', crud: 'Full CRUD' },
          { name: 'Interview', category: 'Core Staffing', crud: 'Full CRUD' },
          // Lookup / Reference
          { name: 'BusinessSector', category: 'Lookup', crud: 'Read-only' },
          { name: 'Category', category: 'Lookup', crud: 'Read-only' },
          { name: 'Country', category: 'Lookup', crud: 'Read-only' },
          { name: 'Skill', category: 'Lookup', crud: 'Read-only' },
          { name: 'Specialty', category: 'Lookup', crud: 'Read-only' },
          { name: 'State', category: 'Lookup', crud: 'Read-only' },
          { name: 'TimeUnit', category: 'Lookup', crud: 'Read-only' },
          { name: 'CandidateSource', category: 'Lookup', crud: 'Read-only' },
          { name: 'CandidateType', category: 'Lookup', crud: 'Read-only' },
          { name: 'ClientRating', category: 'Lookup', crud: 'Read-only' },
          { name: 'EmploymentType', category: 'Lookup', crud: 'Read-only' },
          { name: 'CandidateStatus', category: 'Lookup', crud: 'Read-only' },
          // Pay & Bill
          { name: 'AccountingPeriod', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'AccountingPeriodSetting', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'BillMaster', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'BillMasterTransaction', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'DirectDepositAccount', category: 'Pay & Bill', crud: 'Via bh service' },
          { name: 'DirectDepositAccountTypeLookup', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'InvoiceStatement', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'InvoiceTerm', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'PayableCharge', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'PayBillCycle', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'SalesTaxRate', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'Timesheet', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          { name: 'TimesheetEntry', category: 'Pay & Bill', crud: 'Read (bh pay-bill)' },
          // Effective-Dated
          { name: 'Location', category: 'Effective-Dated', crud: 'Full CRUD + versions' },
          { name: 'LocationGroup', category: 'Effective-Dated', crud: 'Full CRUD + versions' },
          { name: 'Branch', category: 'Effective-Dated', crud: 'Full CRUD + versions' },
          { name: 'BranchGroup', category: 'Effective-Dated', crud: 'Full CRUD + versions' },
          // Business Services
          { name: 'CorporateUser', category: 'Business Services', crud: 'Via bh service' },
          { name: 'CorporateUserDelegation', category: 'Business Services', crud: 'Via bh service' },
          { name: 'PlacementChangeRequest', category: 'Business Services', crud: 'Via bh service' },
          { name: 'BillableCharge', category: 'Business Services', crud: 'Via bh service' },
          // Data Hub
          { name: 'EdsSourceSystem', category: 'Data Hub', crud: 'Via bh data-hub' },
          { name: 'EdsEntityType', category: 'Data Hub', crud: 'Via bh data-hub' },
          { name: 'EdsEntityTypeSchemaVersion', category: 'Data Hub', crud: 'Via bh data-hub' },
          { name: 'EdsData', category: 'Data Hub', crud: 'Via bh data-hub' },
          // Certification & Activity Goals
          { name: 'ActivityGoal', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'ActivityGoalConfiguration', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'ActivityGoalTarget', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'CandidateCertification', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'CandidateCertificationRequirement', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'Certification', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'CertificationGroup', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'CertificationFileAttachment', category: 'Certification / Activity', crud: 'Full CRUD' },
          { name: 'CertificationRequirement', category: 'Certification / Activity', crud: 'Full CRUD' },
          // Candidate Addenda
          { name: 'CandidateEducation', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateReference', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateReferenceQuestion', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateReferenceResponse', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateShiftPreference', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateTaxInfo', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateWorkHistory', category: 'Candidate Addenda', crud: 'Full CRUD' },
          { name: 'CandidateAvailability', category: 'Candidate Addenda', crud: 'Full CRUD' },
          // Other
          { name: 'NoteEntity', category: 'Other', crud: 'Full CRUD' },
          { name: 'GeneralLedgerAccount', category: 'Pay & Bill', crud: 'Read-only' },
          { name: 'PayrollClient', category: 'Pay & Bill', crud: 'Read-only' },
          // Staffing / HR (additional)
          { name: 'AppointmentAttendee', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ClientCorporation', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ClientCorporationAppointment', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ClientCorporationNote', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ClientCorporationTask', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'CorporationDepartment', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobOrderScreenerQuestion', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobShift', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobShiftSubmission', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobShiftAssignment', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobSubmissionCertificationRequirement', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'JobSubmissionHistory', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'LeadHistory', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'LocationVersion', category: 'Staffing / HR', crud: 'Full CRUD + versions' },
          { name: 'OpportunityHistory', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ScreenerQuestion', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'Shift', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ShiftPosition', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'ShiftType', category: 'Staffing / HR', crud: 'Full CRUD' },
          { name: 'StateTaxForm', category: 'Staffing / HR', crud: 'Read-only' },
          // Housing
          { name: 'HousingComplex', category: 'Housing', crud: 'Full CRUD' },
          { name: 'HousingComplexFurnitureDelivery', category: 'Housing', crud: 'Full CRUD' },
          { name: 'HousingComplexUnit', category: 'Housing', crud: 'Full CRUD' },
          { name: 'HousingComplexUtilityAccount', category: 'Housing', crud: 'Full CRUD' },
          { name: 'UserHousingComplexUnit', category: 'Housing', crud: 'Full CRUD' },
          // Issue tracking
          { name: 'Issue', category: 'Issue Tracking', crud: 'Full CRUD' },
          { name: 'IssueItems', category: 'Issue Tracking', crud: 'Full CRUD' },
          // Job Board
          { name: 'JobBoardPost', category: 'Job Board', crud: 'Full CRUD' },
          // Lookup / Reference (additional)
          { name: 'CustomAction', category: 'Lookup / Reference', crud: 'Full CRUD' },
          { name: 'Deduction', category: 'Lookup / Reference', crud: 'Full CRUD' },
          { name: 'DeductionCategoryLookup', category: 'Lookup / Reference', crud: 'Read-only' },
          { name: 'EmployeePay', category: 'Lookup / Reference', crud: 'Full CRUD' },
          { name: 'EmployerContribution', category: 'Lookup / Reference', crud: 'Full CRUD' },
          { name: 'EstaffMappableFlowback', category: 'Lookup / Reference', crud: 'Full CRUD' },
          { name: 'FederalTaxForm', category: 'Lookup / Reference', crud: 'Read-only' },
          { name: 'LocalTaxForm', category: 'Lookup / Reference', crud: 'Read-only' },
          // Pay & Bill (sub-entities — billing/payroll detail)
          { name: 'BatchGroup', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillingProfile', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillingProfileVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'BillingSyncBatch', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillingSyncBatchFileAttachment', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillingSyncError', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterDiscountRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterSurchargeRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionDiscountDetail', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionDiscountRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionDistributionBatch', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionSalesTaxDetail', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionSurchargeDetail', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'BillMasterTransactionSurchargeRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'Calendar', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'CalendarFrequencyLookup', category: 'Pay & Bill (sub-entities)', crud: 'Read-only' },
          { name: 'CalendarInstance', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'CitySalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationBillRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationBillRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'ClientCorporationPayRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationPayRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'ClientCorporationRateAgreementCard', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationRateAgreementCardLine', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationRateAgreementCardLineGroup', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ClientCorporationRateAgreementCardVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'CountySalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'CustomerRequiredFieldConfiguration', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'CustomerRequiredFieldConfigurationVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'CustomerRequiredFieldConfigurationVersionOption', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'CustomerRequiredFieldOption', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'DiscountRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'DiscountRateVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'DistrictSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'EarnCode', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'EarnCodeGroup', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ExpenseSheet', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'ExpenseSheetEntry', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'GeneralLedgerSegment', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'GeneralLedgerSegmentType', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'GeneralLedgerServiceCode', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'Holiday', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'HolidayCategoryLookup', category: 'Pay & Bill (sub-entities)', crud: 'Read-only' },
          { name: 'HolidayInstance', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoicePayment', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementDiscountRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementLineItem', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementLineItemDiscountRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementLineItemSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementLineItemSurchargeRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceStatementSurchargeRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'InvoiceTermVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'JobCode', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderBillRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderBillRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'JobOrderPayRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderPayRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'JobOrderRateCard', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderRateCardLine', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderRateCardLineGroup', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'JobOrderRateCardVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'LegalBusinessEntity', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'OtherSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PayMaster', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PayMasterTransaction', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementBillRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementBillRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'PlacementPayRuleset', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementPayRulesetVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'PlacementRateCard', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementRateCardLine', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementRateCardVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'SalesTaxGroup', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'SalesTaxRateVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'StateSalesTaxRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'SurchargeRate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'SurchargeRateVersion', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD + versions' },
          { name: 'SurchargeRateVersionEarnCode', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'TimeLaborEvalRule', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'TimeLaborEvalRuleTemplate', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'TransactionOrigin', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'TransactionStatus', category: 'Pay & Bill (sub-entities)', crud: 'Read-only' },
          { name: 'TransactionType', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'UnbilledRevenueDistributionBatch', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PayCheck', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementCertification', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementTimeAndExpense', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementTimeAndExpenseChangeRequest', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementCommission', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          { name: 'PlacementShiftSet', category: 'Pay & Bill (sub-entities)', crud: 'Full CRUD' },
          // Tearsheets
          { name: 'Tearsheet', category: 'Tearsheets', crud: 'Full CRUD' },
          { name: 'TearsheetMember', category: 'Tearsheets', crud: 'Full CRUD' },
          { name: 'TearsheetRecipient', category: 'Tearsheets', crud: 'Full CRUD' },
          // Workers Compensation
          { name: 'WorkersCompensation', category: 'Workers Compensation', crud: 'Full CRUD' },
          { name: 'WorkersCompensationRate', category: 'Workers Compensation', crud: 'Full CRUD' },
        ];

        const table = new Table({
          head: [chalk.cyan.bold('Entity'), chalk.cyan.bold('Category'), chalk.cyan.bold('Access')],
        });
        for (const entity of entities) {
          table.push([chalk.bold(entity.name), entity.category, entity.crud]);
        }
        console.log(table.toString());
        return;
      }

      // No entity type provided — show summary
      if (!entityType) {
        console.log(chalk.cyan.bold('\n=== bh-cli Help ===\n'));
        console.log(chalk.yellow('Usage:'));
        console.log('  bh help [entityType] [options]\n');

        console.log(chalk.cyan.bold('Options:'));
        console.log('  -c, --commands       List all bh-cli commands');
        console.log('  -e, --entities       List all supported Bullhorn entities');
        console.log('  -o, --output <format>  Output format: table (default) or json');
        console.log('  -h, --help           Display help for command\n');

        console.log(chalk.cyan.bold('Examples:'));
        console.log('  bh help --commands          # List all commands');
        console.log('  bh help --entities          # List all entities');
        console.log('  bh help Candidate           # Get Candidate documentation');
        console.log('  bh help Location --output json  # Get Location docs as JSON');
        console.log('');
        return;
      }

      // Look up specific entity documentation
      const spinner = ora(`Looking up documentation for ${entityType}...`).start();

      try {
        // First, try to get entity metadata
        const metaResponse = await api.get(`/meta/${entityType}`, { params: { fields: '*' } });
        const meta = metaResponse.data;

        spinner.succeed(chalk.green(`Found metadata for ${entityType}!`));

        if (options.output === 'json') {
          console.log(JSON.stringify(meta, null, 2));
          return;
        }

        // Display entity information
        console.log(chalk.cyan.bold(`\n=== ${entityType} ===\n`));

        // Display entity fields
        if (meta && meta.fields) {
          console.log(chalk.cyan.bold('Fields:'));
          const fieldTable = new Table({
            head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Type'), chalk.cyan.bold('Required'), chalk.cyan.bold('Read-Only')],
          });
          for (const field of meta.fields) {
            fieldTable.push([
              chalk.bold(field.name),
              field.type || '-',
              field.required ? 'Yes' : 'No',
              field.readonly ? 'Yes' : 'No',
            ]);
          }
          console.log(fieldTable.toString());
        }

        // Display bh-cli commands for this entity
        console.log(chalk.cyan.bold('\nAvailable bh-cli commands:'));

        const commands = [];
        if (['Candidate', 'ClientContact', 'JobOrder', 'Placement', 'Lead', 'Opportunity', 'Note', 'Appointment', 'Task', 'Sendout', 'WebResponse', 'Interview', 'CustomObject1', 'CustomObject2', 'CustomObject3', 'CustomObject4', 'CustomObject5', 'CustomObject6', 'CustomObject7', 'CustomObject8', 'CustomObject9', 'CustomObject10', 'CustomObject11', 'CustomObject12', 'CustomObject13', 'CustomObject14', 'CustomObject15', 'CustomObject16', 'CustomObject17', 'CustomObject18', 'CustomObject19', 'CustomObject20', 'CustomObject21', 'CustomObject22', 'CustomObject23', 'CustomObject24', 'CustomObject25', 'CustomObject26', 'CustomObject27', 'CustomObject28', 'CustomObject29', 'CustomObject30', 'CustomObject31', 'CustomObject32', 'CustomObject33', 'CustomObject34', 'CustomObject35'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
          commands.push({ command: `bh soft-delete ${entityType} <id> --force`, description: 'Soft delete' });
        }

        // Special entities
        if (entityType === 'Location' || entityType === 'LocationGroup' || entityType === 'Branch' || entityType === 'BranchGroup') {
          commands.push({ command: `bh get ${entityType} <id> --effectiveOn <date>`, description: 'Fetch with effective date' });
          commands.push({ command: `bh version list ${entityType} <id>`, description: 'List all versions' });
          commands.push({ command: `bh version create ${entityType} <fields...>`, description: 'Create new version' });
          commands.push({ command: `bh version update ${entityType} <id> --versionId <vid>`, description: 'Update specific version' });
          commands.push({ command: `bh version delete ${entityType} <id> --versionId <vid> --force`, description: 'Delete version' });
        }

        // Pay & Bill entities
        if (['AccountingPeriod', 'AccountingPeriodSetting', 'BillMaster', 'BillMasterTransaction', 'DirectDepositAccountTypeLookup', 'InvoiceStatement', 'InvoiceTerm', 'PayableCharge', 'PayBillCycle', 'SalesTaxRate', 'Timesheet', 'TimesheetEntry'].includes(entityType)) {
          commands.push({ command: `bh pay-bill ${entityType.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)} get [id]`, description: 'Get entity by ID or list all' });
        }

        // Business Services
        if (['CorporateUser', 'CorporateUserDelegation', 'PlacementChangeRequest', 'BillableCharge'].includes(entityType)) {
          commands.push({ command: `bh service ${entityType.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)} create|update <fields...>`, description: 'Create or update via service' });
        }

        // Data Hub entities
        if (['EdsSourceSystem', 'EdsEntityType', 'EdsEntityTypeSchemaVersion', 'EdsData'].includes(entityType)) {
          commands.push({ command: `bh data-hub upsert --source-system <id> --entity-type <id> <fields...>`, description: 'Upsert data records' });
          commands.push({ command: `bh data-hub get ${entityType} [id]`, description: 'Get hub info' });
        }

        // Certification & Activity Goal entities
        if (['ActivityGoal', 'ActivityGoalConfiguration', 'ActivityGoalTarget', 'CandidateCertification', 'CandidateCertificationRequirement', 'Certification', 'CertificationGroup', 'CertificationFileAttachment', 'CertificationRequirement'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Candidate Addenda entities
        if (['CandidateEducation', 'CandidateReference', 'CandidateReferenceQuestion', 'CandidateReferenceResponse', 'CandidateShiftPreference', 'CandidateTaxInfo', 'CandidateWorkHistory', 'CandidateAvailability'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // NoteEntity
        if (entityType === 'NoteEntity') {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Pay & Bill read-only entities (GeneralLedgerAccount, PayrollClient)
        if (['GeneralLedgerAccount', 'PayrollClient'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
        }

        // Staffing / HR — core entities (ClientCorporation, Lead, Opportunity, etc.)
        if (['ClientCorporation', 'Lead', 'Opportunity', 'ClientContact'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Staffing / HR — child/related entities (standard CRUD)
        if (['AppointmentAttendee', 'ClientCorporationAppointment', 'ClientCorporationNote', 'ClientCorporationTask', 'CorporationDepartment', 'JobOrderScreenerQuestion', 'JobShift', 'JobShiftSubmission', 'JobShiftAssignment', 'JobSubmissionCertificationRequirement', 'JobSubmissionHistory', 'OpportunityHistory', 'ScreenerQuestion', 'Shift', 'ShiftPosition', 'ShiftType'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Staffing / HR — effective-dated (LocationVersion)
        if (entityType === 'LocationVersion' || entityType === 'LeadHistory') {
          commands.push({ command: `bh get ${entityType} <id> --effectiveOn <date>`, description: 'Fetch with effective date' });
          commands.push({ command: `bh version list ${entityType} <id>`, description: 'List all versions' });
          commands.push({ command: `bh version create ${entityType} <fields...>`, description: 'Create new version' });
          commands.push({ command: `bh version update ${entityType} <id> --versionId <vid>`, description: 'Update specific version' });
          commands.push({ command: `bh version delete ${entityType} <id> --versionId <vid> --force`, description: 'Delete version' });
        }

        // Staffing / HR — read-only (StateTaxForm)
        if (entityType === 'StateTaxForm') {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
        }

        // Housing entities (standard CRUD)
        if (['HousingComplex', 'HousingComplexFurnitureDelivery', 'HousingComplexUnit', 'HousingComplexUtilityAccount', 'UserHousingComplexUnit'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Issue Tracking (standard CRUD)
        if (['Issue', 'IssueItems'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Job Board (standard CRUD)
        if (entityType === 'JobBoardPost') {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Lookup / Reference — full CRUD
        if (['CustomAction', 'Deduction', 'EmployeePay', 'EmployerContribution', 'EstaffMappableFlowback'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Lookup / Reference — read-only
        if (['DeductionCategoryLookup', 'FederalTaxForm', 'LocalTaxForm'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
        }

        // Pay & Bill (sub-entities) — pay-bill routing
        if (['BatchGroup', 'BillingProfile', 'BillingProfileVersion', 'BillingSyncBatch', 'BillingSyncBatchFileAttachment', 'BillingSyncError', 'BillMasterDiscountRate', 'BillMasterSurchargeRate', 'BillMasterTransactionDiscountDetail', 'BillMasterTransactionDiscountRate', 'BillMasterTransactionDistributionBatch', 'BillMasterTransactionSalesTaxDetail', 'BillMasterTransactionSalesTaxRate', 'BillMasterTransactionSurchargeDetail', 'BillMasterTransactionSurchargeRate', 'Calendar', 'CalendarFrequencyLookup', 'CalendarInstance', 'CitySalesTaxRate', 'ClientCorporationBillRuleset', 'ClientCorporationBillRulesetVersion', 'ClientCorporationPayRuleset', 'ClientCorporationPayRulesetVersion', 'ClientCorporationRateAgreementCard', 'ClientCorporationRateAgreementCardLine', 'ClientCorporationRateAgreementCardLineGroup', 'ClientCorporationRateAgreementCardVersion', 'CountySalesTaxRate', 'CustomerRequiredFieldConfiguration', 'CustomerRequiredFieldConfigurationVersion', 'CustomerRequiredFieldConfigurationVersionOption', 'CustomerRequiredFieldMeta', 'CustomerRequiredFieldOption', 'DiscountRate', 'DiscountRateVersion', 'DistrictSalesTaxRate', 'EarnCode', 'EarnCodeGroup', 'ExpenseSheet', 'ExpenseSheetEntry', 'GeneralLedgerSegment', 'GeneralLedgerSegmentType', 'GeneralLedgerServiceCode', 'Holiday', 'HolidayCategoryLookup', 'HolidayInstance', 'InvoicePayment', 'InvoiceStatementDiscountRate', 'InvoiceStatementLineItem', 'InvoiceStatementLineItemDiscountRate', 'InvoiceStatementLineItemSalesTaxRate', 'InvoiceStatementLineItemSurchargeRate', 'InvoiceStatementSalesTaxRate', 'InvoiceStatementSurchargeRate', 'InvoiceTermVersion', 'JobCode', 'JobOrderBillRuleset', 'JobOrderBillRulesetVersion', 'JobOrderPayRuleset', 'JobOrderPayRulesetVersion', 'JobOrderRateCard', 'JobOrderRateCardLine', 'JobOrderRateCardLineGroup', 'JobOrderRateCardVersion', 'LegalBusinessEntity', 'OtherSalesTaxRate', 'PayMaster', 'PayMasterTransaction', 'PlacementBillRuleset', 'PlacementBillRulesetVersion', 'PlacementPayRuleset', 'PlacementPayRulesetVersion', 'PlacementRateCard', 'PlacementRateCardLine', 'PlacementRateCardVersion', 'SalesTaxGroup', 'SalesTaxRateVersion', 'StateSalesTaxRate', 'SurchargeRate', 'SurchargeRateVersion', 'SurchargeRateVersionEarnCode', 'TimeLaborEvalRule', 'TimeLaborEvalRuleTemplate', 'TransactionOrigin', 'TransactionStatus', 'TransactionType', 'UnbilledRevenueDistributionBatch', 'PayCheck', 'PlacementCertification', 'PlacementTimeAndExpense', 'PlacementTimeAndExpenseChangeRequest', 'PlacementCommission', 'PlacementShiftSet'].includes(entityType)) {
          commands.push({ command: `bh pay-bill ${entityType.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)} get [id]`, description: 'Get entity by ID or list all' });
        }

        // Tearsheets (standard CRUD)
        if (['Tearsheet', 'TearsheetMember', 'TearsheetRecipient'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        // Workers Compensation (standard CRUD)
        if (['WorkersCompensation', 'WorkersCompensationRate'].includes(entityType)) {
          commands.push({ command: `bh get ${entityType} <id>`, description: 'Fetch entity record' });
          commands.push({ command: `bh search ${entityType} -q "<query>"`, description: 'Search entities' });
          commands.push({ command: `bh query ${entityType} -w "<where>"`, description: 'Query entities' });
          commands.push({ command: `bh create ${entityType} <fields...>`, description: 'Create new record' });
          commands.push({ command: `bh update ${entityType} <id> <fields...>`, description: 'Update record' });
          commands.push({ command: `bh delete ${entityType} <id> --force`, description: 'Delete record' });
        }

        if (commands.length > 0) {
          const cmdTable = new Table({
            head: [chalk.cyan.bold('Command'), chalk.cyan.bold('Description')],
          });
          for (const cmd of commands) {
            cmdTable.push([chalk.bold(cmd.command), cmd.description]);
          }
          console.log(cmdTable.toString());
        } else {
          console.log(chalk.yellow(`No specific bh-cli commands found for ${entityType}. Use generic commands:`));
          console.log(chalk.cyan(`  bh get ${entityType} <id>`));
          console.log(chalk.cyan(`  bh search ${entityType} -q "<query>"`));
          console.log(chalk.cyan(`  bh query ${entityType} -w "<where>"`));
          console.log(chalk.cyan(`  bh create ${entityType} <fields...>`));
          console.log(chalk.cyan(`  bh update ${entityType} <id> <fields...>`));
          console.log(chalk.cyan(`  bh delete ${entityType} <id> --force`));
        }

        // Display common options
        console.log(chalk.cyan.bold('\nCommon options for all commands:'));
        const optionsTable = new Table({
          head: [chalk.cyan.bold('Option'), chalk.cyan.bold('Description')],
        });
        optionsTable.push([chalk.bold('--fields <list>'), 'Comma-separated fields to return']);
        optionsTable.push([chalk.bold('--count <n>'), 'Records per page (pagination size)']);
        optionsTable.push([chalk.bold('--start <n>'), 'Pagination offset']);
        optionsTable.push([chalk.bold('--sort <field>'), 'Sort field (prefix with - for descending)']);
        optionsTable.push([chalk.bold('--orderBy <field>'), 'Sort field (SQL-style, add DESC for descending)']);
        optionsTable.push([chalk.bold('--effectiveOn <date>'), 'Fetch effective-dated version (YYYY-MM-DD)']);
        optionsTable.push([chalk.bold('--layout <name>'), 'Layout name (e.g., "CandidateSummary")']);
        optionsTable.push([chalk.bold('--show-editable'), 'Include editable field information']);
        optionsTable.push([chalk.bold('--show-read-only'), 'Include read-only field information']);
        optionsTable.push([chalk.bold('--privateLabelId <id>'), 'Filter by private label ID']);
        optionsTable.push([chalk.bold('--meta <level>'), 'Include metadata (off, basic, full)']);
        optionsTable.push([chalk.bold('--jsonp <name>'), 'JSONP callback function name']);
        optionsTable.push([chalk.bold('-o, --output <format>'), 'Output format: table (default) or json']);
        console.log(optionsTable.toString());

      } catch (error) {
        spinner.fail(chalk.red(`Failed to look up ${entityType}.`));
        if (error.response && error.response.status === 404) {
          console.error(chalk.yellow(`${entityType} is not a recognized Bullhorn entity.`));
        } else if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return help;
}
