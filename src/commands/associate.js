// src/commands/associate.js

import { Command } from 'commander';
import chalk from 'chalk';
import { invoke, buildGetParams, renderJsonOutput } from '../lib/helpers.js';
import api from '../lib/api.js';
import { buildAssociationUrl, flattenIds, renderChangeTable } from './all-corp-notes/_shared.js';

/**
 * Creates the 'associate' command for creating to-many associations.
 * API: PUT /entity/{entityType}/{entity-id}/{to-many-association-name}/{entity-id},*
 */
export default function createAssociateCommand() {
  const associate = new Command('associate')
    .description('Associate to-many child entities with a parent entity.')
    .argument('<entityType>', 'The type of the parent entity (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the parent entity')
    .argument('<toManyFieldName>', 'The to-many association field name (e.g., primarySkills, notes)')
    .argument('<ids...>', 'Comma-separated or space-separated child entity IDs to associate')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', '*')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, toManyFieldName, ids, options) => {
      const allIds = flattenIds(ids);

      if (allIds.length === 0) {
        console.error(chalk.red('Error: No IDs provided to associate.'));
        console.error(chalk.yellow('Usage: bh associate <entityType> <entityId> <toManyField> <id1> <id2> ...'));
        process.exit(1);
      }

      invoke(async ({ chalk }) => {
        const url = buildAssociationUrl(entityType, entityId, toManyFieldName, allIds);
        const params = buildGetParams(options, { fields: options.fields });

        const response = await api.put(url, null, { params });
        const changes = response.data;

        if (options.output === 'json') {
          renderJsonOutput(changes);
        } else if (Array.isArray(changes)) {
          await renderChangeTable(changes, toManyFieldName);
        } else {
          renderJsonOutput(changes);
        }
      }, {
        spinnerMsg: `Associating ${allIds.length} ${toManyFieldName} with ${entityType} ${entityId}...`,
        successMsg: 'Successfully associated records!',
        failMsg: `Failed to associate ${toManyFieldName}.`,
      });
    });

  return associate;
}
