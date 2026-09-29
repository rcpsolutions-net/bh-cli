// src/commands/disassociate.js

import { Command } from 'commander';
import chalk from 'chalk';
import { invoke, buildGetParams, renderJsonOutput } from '../lib/helpers.js';
import api from '../lib/api.js';
import { buildAssociationUrl, flattenIds, renderChangeTable } from './all-corp-notes/_shared.js';

/**
 * Creates the 'disassociate' command for removing to-many associations.
 * API: DELETE /entity/{entityType}/{entity-id}/{to-many-association-name}/{entity-id},*
 */
export default function createDisassociateCommand() {
  const disassociate = new Command('disassociate')
    .description('Disassociate (remove) to-many child entities from a parent entity.')
    .argument('<entityType>', 'The type of the parent entity (e.g., Candidate, JobOrder)')
    .argument('<entityId>', 'The numeric ID of the parent entity')
    .argument('<toManyFieldName>', 'The to-many association field name (e.g., primarySkills, notes)')
    .argument('<ids...>', 'Comma-separated or space-separated child entity IDs to disassociate')
    .option('-f, --fields <list>', 'Comma-separated list of fields to return', '*')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, toManyFieldName, ids, options) => {
      const allIds = flattenIds(ids);

      if (allIds.length === 0) {
        console.error(chalk.red('Error: No IDs provided to disassociate.'));
        console.error(chalk.yellow('Usage: bh disassociate <entityType> <entityId> <toManyField> <id1> <id2> ...'));
        process.exit(1);
      }

      invoke(async ({ chalk }) => {
        const url = buildAssociationUrl(entityType, entityId, toManyFieldName, allIds);
        const params = buildGetParams(options, { fields: options.fields });

        const response = await api.delete(url, { params });
        const changes = response.data;

        if (options.output === 'json') {
          renderJsonOutput(changes);
        } else if (Array.isArray(changes)) {
          await renderChangeTable(changes, toManyFieldName);
        } else {
          renderJsonOutput(changes);
        }
      }, {
        spinnerMsg: `Disassociating ${allIds.length} ${toManyFieldName} from ${entityType} ${entityId}...`,
        successMsg: 'Successfully disassociated records!',
        failMsg: `Failed to disassociate ${toManyFieldName}.`,
      });
    });

  return disassociate;
}
