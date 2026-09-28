// src/commands/data-hub/index.js — Barrel: creates data-hub command + adds all subcommands.

import { Command } from 'commander';
import buildUpsertCommand from './upsert.js';
import buildDataHubGetCommand from './get.js';
import buildSourceSystemCommand from './source-system.js';
import buildEntityTypeCommand from './entity-type.js';
import buildSchemaVersionCommand from './schema-version.js';

/** Creates the parent data-hub command with all subcommands. */
export default function createDataHubCommand() {
  const dataHub = new Command('data-hub')
    .alias('datahub')
    .description('Manage Bullhorn Data Hub operations (upsert, source systems, entity types, schema versions).');

  buildUpsertCommand(dataHub);
  buildDataHubGetCommand(dataHub);
  buildSourceSystemCommand(dataHub);
  buildEntityTypeCommand(dataHub);
  buildSchemaVersionCommand(dataHub);

  return dataHub;
}
