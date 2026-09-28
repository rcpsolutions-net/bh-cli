// src/commands/service/index.js — Barrel: re-exports all service subcommand builders
import { Command } from 'commander';
import buildDirectDepositCommand from './direct-deposit.js';
import buildCallCommand from './call.js';
import buildCorporateUserCommand from './corporate-user.js';
import buildCorporateUserDelegationCommand from './corporate-user-delegation.js';
import buildPlacementChangeRequestCommand from './placement-change-request.js';
import buildBillableChargeCommand from './billable-charge.js';
import buildCustomerRequiredFieldMetaCommand from './customer-required-field-meta.js';
import buildPlacementCustomerRequiredFieldCommand from './placement-customer-required-field.js';
import buildJobCustomerRequiredFieldCommand from './job-customer-required-field.js';
import buildPlacementCustomerRequiredFieldConfigCommand from './placement-crf-config.js';
import buildJobCustomerRequiredFieldConfigCommand from './job-crf-config.js';
import buildEventsCommand from './events.js';

/**
 * Creates the 'service' command group for Bullhorn business services.
 */
export default function createServiceCommand() {
  const service = new Command('service')
    .alias('services')
    .description('Interact with Bullhorn REST API business services (DirectDepositAccount, etc.)');

  service.addCommand(buildDirectDepositCommand());
  service.addCommand(buildCallCommand());
  service.addCommand(buildCorporateUserCommand());
  service.addCommand(buildCorporateUserDelegationCommand());
  service.addCommand(buildPlacementChangeRequestCommand());
  service.addCommand(buildBillableChargeCommand());
  service.addCommand(buildCustomerRequiredFieldMetaCommand());
  service.addCommand(buildPlacementCustomerRequiredFieldCommand());
  service.addCommand(buildJobCustomerRequiredFieldCommand());
  service.addCommand(buildPlacementCustomerRequiredFieldConfigCommand());
  service.addCommand(buildJobCustomerRequiredFieldConfigCommand());
  service.addCommand(buildEventsCommand());

  return service;
}
