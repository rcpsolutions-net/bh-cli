// src/commands/pay-bill/accounting-period-setting.js — AccountingPeriodSetting entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildAccountingPeriodSettingCommand(parent) {
  const accountingPeriodSetting = parent.command('accounting-period-setting')
    .description('Manage AccountingPeriodSetting entities (payroll settings).');

  buildGetEndpoint(accountingPeriodSetting, 'accounting-period-setting', {
    entityName: 'AccountingPeriodSetting',
    fieldsDefault: 'id,accountingPeriodId,settingName,settingValue',
  });

  return accountingPeriodSetting;
}
