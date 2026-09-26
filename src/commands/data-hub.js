// src/commands/data-hub.js

import { readFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import api from '../lib/api.js';

/**
 * Creates the 'data-hub' command group for Bullhorn Data Hub operations.
 * API endpoints:
 * - POST /data-hub/data (upsert records, up to 100 per batch)
 * - POST /data-hub/sourceSystem (create/update source system)
 * - POST /data-hub/entityType (create/update entity type)
 * - POST /data-hub/entityTypeSchemaVersion (create/update schema version)
 * - GET /data-hub/{entityName}/{entityId} (retrieve info)
 */
export default function createDataHubCommand() {
  const dataHub = new Command('data-hub')
    .alias('datahub')
    .description('Manage Bullhorn Data Hub operations (upsert, source systems, entity types, schema versions).');

  // Subcommand: upsert data records
  dataHub.command('upsert')
    .description('Upsert up to 100 records to Data Hub via POST /data-hub/data.')
    .option('-f, --file <filePath>', 'Path to JSON file containing batch payload')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-s, --source-system <name>', 'Source system name (alternative to --file)')
    .option('-e, --entity-type <name>', 'Entity type name (alternative to --file)')
    .option('-v, --schema-version <name>', 'Schema version name (alternative to --file)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .argument('[records...]', 'Key=value pairs for individual records (alternative to --file)')
    .action(async (records, options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.sourceSystem && options.entityType) {
        // Build payload from individual flags
        const batch = {
          sourceSystem: options.sourceSystem,
          entityType: options.entityType,
          schemaVersion: options.schemaVersion || '',
          items: [],
        };

        if (records && records.length > 0) {
          for (const recStr of records) {
            const pairs = recStr.split(',').map(p => {
              const [k, v] = p.split('=');
              return [k.trim(), v ? v.trim() : ''];
            });
            const item = { sourceId: '' };
            for (const [k, v] of pairs) {
              if (k === 'sourceId') {
                item.sourceId = v;
              } else {
                item[k] = v;
              }
            }
            batch.items.push(item);
          }
        }
        payload = [batch];
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --source-system + --entity-type + records.'));
        process.exit(1);
      }

      const spinner = ora('Upsertting records to Data Hub...').start();
      try {
        const response = await api.post('/data-hub/data', payload);
        spinner.succeed(chalk.green('Data Hub upsert successful!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const result = response.data;
          console.log(chalk.cyan.bold('\nData Hub Upsert Results:\n'));
          if (Array.isArray(result?.data)) {
            for (const batchResult of result.data) {
              console.log(`  Entity Type: ${batchResult.entityType || 'N/A'}`);
              console.log(`  Source System: ${batchResult.sourceSystem || 'N/A'}`);
              console.log(`  Successful Items: ${batchResult.successfulItems?.length || 0}`);
              if (batchResult.successfulItems?.length > 0) {
                for (const item of batchResult.successfulItems) {
                  console.log(`    sourceId=${item.sourceId} → dataId=${item.dataId}`);
                }
              }
              if (batchResult.failedItems?.length > 0) {
                console.log(chalk.yellow(`  Failed Items: ${batchResult.failedItems.length}`));
                for (const fail of batchResult.failedItems) {
                  console.log(`    sourceId=${fail.sourceId}: ${fail.message || 'Unknown error'}`);
                }
              }
              if (result.messages?.length > 0) {
                console.log(chalk.yellow(`  Messages: ${result.messages.join('; ')}`));
              }
              console.log('');
            }
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to upsert records to Data Hub.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 413) {
            console.error(chalk.yellow('Data Hub accepts a maximum of 100 records per request.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // Subcommand: get Data Hub info
  dataHub.command('get <entityName> [entityId]')
    .description('Retrieve Data Hub information about a source system, entity type, or schema version via GET /data-hub/{entityName}/{entityId}.')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityName, entityId, options) => {
      const url = entityId
        ? `/data-hub/${entityName}/${entityId}`
        : `/data-hub/${entityName}`;

      const spinner = ora(`Fetching Data Hub info for ${entityName}${entityId ? ` ${entityId}` : ''}...`).start();
      try {
        const response = await api.get(url);
        spinner.succeed(chalk.green('Data Hub info retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
          console.log(chalk.cyan.bold(`\nData Hub Info for ${entityName}${entityId ? ` ${entityId}` : ''}:\n`));
          if (typeof data === 'object' && data !== null) {
            const table = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of Object.entries(data)) {
              table.push([
                chalk.bold(key),
                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
              ]);
            }
            console.log(table.toString());
          } else {
            console.log(String(data ?? ''));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch Data Hub info.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // Subcommand: manage source systems
  const sourceSystemCmd = dataHub.command('source-system')
    .alias('source-systems')
    .description('Manage Data Hub source systems via POST/PUT /data-hub/sourceSystem.');

  // source-system create
  sourceSystemCmd.command('create')
    .description('Create or update a source system via POST /data-hub/sourceSystem.')
    .option('-f, --file <filePath>', 'Path to JSON file containing source system data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-n, --name <name>', 'Source system name')
    .option('-N, --display <display>', 'Display name for source system')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.name) {
        payload = { name: options.name };
        if (options.display) payload.display = options.display;
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating source system...').start();
      try {
        const response = await api.post('/data-hub/sourceSystem', payload);
        spinner.succeed(chalk.green('Source system created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nSource System Result:\n'));
          const changedEntityType = response.data?.changedEntityType || '-';
          const changedEntityId = response.data?.changedEntityId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [
              chalk.cyan.bold('Entity Type'),
              chalk.cyan.bold('Entity ID'),
              chalk.cyan.bold('Change Type'),
            ],
          });
          table.push([changedEntityType, String(changedEntityId), chalk.green(changeType)]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create/update source system.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // source-system get
  sourceSystemCmd.command('get')
    .description('Get source system info via GET /data-hub/sourceSystem/{sourceSystemId}.')
    .argument('<sourceSystemId>', 'Source system ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (sourceSystemId, options) => {
      const spinner = ora(`Fetching source system ${sourceSystemId}...`).start();
      try {
        const response = await api.get(`/data-hub/sourceSystem/${sourceSystemId}`);
        spinner.succeed(chalk.green('Source system retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
          if (typeof data === 'object' && data !== null) {
            const table = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of Object.entries(data)) {
              table.push([
                chalk.bold(key),
                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
              ]);
            }
            console.log(table.toString());
          } else {
            console.log(String(data ?? ''));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch source system.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // Subcommand: manage entity types
  const entityTypeCmd = dataHub.command('entity-type')
    .alias('entity-types')
    .description('Manage Data Hub entity types via POST/PUT /data-hub/entityType.');

  // entity-type create
  entityTypeCmd.command('create')
    .description('Create or update an entity type via POST /data-hub/entityType.')
    .option('-f, --file <filePath>', 'Path to JSON file containing entity type data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-s, --source-system <name>', 'Source system name or ID')
    .option('-n, --name <name>', 'Entity type name')
    .option('-N, --display <display>', 'Display name for entity type')
    .option('--private', 'Mark entity type as private', false)
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.name) {
        payload = { name: options.name };
        if (options.display) payload.display = options.display;
        if (options.private) payload.isPrivate = true;
        if (options.sourceSystem) {
          const srcId = Number(options.sourceSystem);
          payload.sourceSystem = Number.isNaN(srcId) ? { name: options.sourceSystem } : { id: srcId };
        }
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating entity type...').start();
      try {
        const response = await api.post('/data-hub/entityType', payload);
        spinner.succeed(chalk.green('Entity type created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nEntity Type Result:\n'));
          const changedEntityType = response.data?.changedEntityType || '-';
          const changedEntityId = response.data?.changedEntityId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [
              chalk.cyan.bold('Entity Type'),
              chalk.cyan.bold('Entity ID'),
              chalk.cyan.bold('Change Type'),
            ],
          });
          table.push([changedEntityType, String(changedEntityId), chalk.green(changeType)]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create/update entity type.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // entity-type get
  entityTypeCmd.command('get')
    .description('Get entity type info via GET /data-hub/entityType/{entityTypeId}.')
    .argument('<entityTypeId>', 'Entity type ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityTypeId, options) => {
      const spinner = ora(`Fetching entity type ${entityTypeId}...`).start();
      try {
        const response = await api.get(`/data-hub/entityType/${entityTypeId}`);
        spinner.succeed(chalk.green('Entity type retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
          if (typeof data === 'object' && data !== null) {
            const table = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of Object.entries(data)) {
              table.push([
                chalk.bold(key),
                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
              ]);
            }
            console.log(table.toString());
          } else {
            console.log(String(data ?? ''));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch entity type.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // Subcommand: manage schema versions
  const schemaVersionCmd = dataHub.command('schema-version')
    .alias('schema-versions')
    .description('Manage Data Hub entity type schema versions via POST/PUT /data-hub/entityTypeSchemaVersion.');

  // schema-version create
  schemaVersionCmd.command('create')
    .description('Create or update a schema version via POST /data-hub/entityTypeSchemaVersion.')
    .option('-f, --file <filePath>', 'Path to JSON file containing schema version data')
    .option('-d, --data <jsonData>', 'Raw JSON string for request body')
    .option('-e, --entity-type <name>', 'Entity type name or ID')
    .option('-s, --source-system <name>', 'Source system name (if associating by name)')
    .option('-n, --name <name>', 'Schema version name')
    .option('--schema <schema>', 'JSON schema string')
    .option('--description <description>', 'Schema description')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      let payload;

      if (options.file) {
        if (!existsSync(options.file)) {
          console.error(chalk.red(`Error: File not found: ${options.file}`));
          process.exit(1);
        }
        payload = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.data) {
        payload = JSON.parse(options.data);
      } else if (options.name || options.schema) {
        payload = { name: options.name || '', schema: options.schema || '' };
        if (options.description) payload.description = options.description;
        if (options.entityType) {
          const etId = Number(options.entityType);
          if (options.sourceSystem) {
            // Associate by name
            payload.entityType = {
              name: options.entityType,
              sourceSystem: { name: options.sourceSystem },
            };
          } else {
            // Associate by ID
            payload.entityType = Number.isNaN(etId) ? { name: options.entityType } : { id: etId };
          }
        }
      } else {
        console.error(chalk.red('Error: Provide --file <path>, --data <json>, or --name + --schema.'));
        process.exit(1);
      }

      const spinner = ora('Creating/updating schema version...').start();
      try {
        const response = await api.post('/data-hub/entityTypeSchemaVersion', payload);
        spinner.succeed(chalk.green('Schema version created/updated!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(chalk.cyan.bold('\nSchema Version Result:\n'));
          const changedEntityType = response.data?.changedEntityType || '-';
          const changedEntityId = response.data?.changedEntityId || '-';
          const changeType = response.data?.changeType || 'UNKNOWN';
          const table = new Table({
            head: [
              chalk.cyan.bold('Entity Type'),
              chalk.cyan.bold('Entity ID'),
              chalk.cyan.bold('Change Type'),
            ],
          });
          table.push([changedEntityType, String(changedEntityId), chalk.green(changeType)]);
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create/update schema version.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // schema-version get
  schemaVersionCmd.command('get')
    .description('Get schema version info via GET /data-hub/entityTypeSchemaVersion/{schemaVersionId}.')
    .argument('<schemaVersionId>', 'Schema version ID')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (schemaVersionId, options) => {
      const spinner = ora(`Fetching schema version ${schemaVersionId}...`).start();
      try {
        const response = await api.get(`/data-hub/entityTypeSchemaVersion/${schemaVersionId}`);
        spinner.succeed(chalk.green('Schema version retrieved!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          const data = response.data?.data || response.data;
          if (typeof data === 'object' && data !== null) {
            const table = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            for (const [key, value] of Object.entries(data)) {
              table.push([
                chalk.bold(key),
                typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
              ]);
            }
            console.log(table.toString());
          } else {
            console.log(String(data ?? ''));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch schema version.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  return dataHub;
}
