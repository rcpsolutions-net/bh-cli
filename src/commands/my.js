// src/commands/my.js

import { Command } from 'commander';
import { buildEntitySubcommand } from './all-corp-notes/_shared.js';

/**
 * Creates the 'my' command group for user-owned entity queries.
 * API: GET /my{Entity}s/?fields=...&departmentIds=...&count=...&start=...&sort=...&query=...&where=...
 */
export default function createMyCommand() {
  const my = new Command('my')
    .alias('my-entities')
    .description('Query entities owned by the current user (e.g., my-candidates, my-notes).');

  const entities = [
    { name: 'candidates',      desc: 'Candidates owned by current user' },
    { name: 'client-contacts', desc: 'Client contacts owned by current user' },
    { name: 'placements',      desc: 'Placements owned by current user' },
    { name: 'notes',           desc: 'Notes owned by current user' },
  ];

  for (const entity of entities) {
    my.addCommand(buildEntitySubcommand(entity, 'my'));
  }

  return my;
}
