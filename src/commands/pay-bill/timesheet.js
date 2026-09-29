// src/commands/pay-bill/timesheet.js — Timesheet entity commands.

import { Command } from 'commander';
import { buildGetEndpoint } from './_shared.js';

export default function buildTimesheetCommand(parent) {
  const timesheet = parent.command('timesheet')
    .description('Manage Timesheet entities (timesheet entries).');

  buildGetEndpoint(timesheet, 'timesheet', {
    entityName: 'Timesheet',
    fieldsDefault: 'id,candidateId,clientContactId,jobOrderId,totalHours,amount,status',
  });

  return timesheet;
}
