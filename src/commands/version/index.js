// src/commands/version/index.js — Barrel: creates version command + adds all subcommands.

import { Command } from 'commander';
import buildListCommand from './list.js';
import buildCreateCommand from './create.js';
import buildUpdateCommand from './update.js';
import buildDeleteCommand from './delete.js';

/** Creates the parent version command with all 4 subcommands. */
export default function createVersionCommand() {
  const version = new Command('version')
    .alias('versions')
    .description('Manage effective-dated entity versions (Location, Branch, CustomObjects, etc.).');

  buildListCommand(version);
  buildCreateCommand(version);
  buildUpdateCommand(version);
  buildDeleteCommand(version);

  return version;
}
