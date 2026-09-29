// src/commands/department.js

import { Command } from 'commander';
import { buildEntitySubcommand } from './all-corp-notes/_shared.js';

/**
 * Creates the 'department' command group for department-scoped queries.
 * API: GET /department{Entity}s/?fields=...&departmentIds=...&count=...&start=...&sort=...&query=...&where=...
 */
export default function createDepartmentCommand() {
  const department = new Command('department')
    .alias('departments')
    .description('Query entities scoped to specific departments (e.g., department-candidates, department-notes).');

  const entities = [
    { name: 'candidates',      desc: 'Department-scoped candidates' },
    { name: 'client-contacts', desc: 'Department-scoped client contacts' },
    { name: 'placements',      desc: 'Department-scoped placements' },
    { name: 'notes',           desc: 'Department-scoped notes' },
  ];

  for (const entity of entities) {
    department.addCommand(buildEntitySubcommand(entity, 'department'));
  }

  return department;
}
