import { Command } from 'commander';
import chalk from 'chalk';
import pkg from '../package.json' with { type: 'json' };

import createGetCommand from './commands/get.js';
import createAuthCommand from './commands/auth.js';
import createSearchCommand from './commands/search.js';
import createCreateCommand from './commands/create.js';
import createUpdateCommand from './commands/update.js';
import createDeleteCommand from './commands/delete.js';
import createEntitiesCommand from './commands/entities.js';
import createMetaCommand from './commands/meta.js';
import createQueryCommand from './commands/query.js';
import createServiceCommand from './commands/service/index.js';
import createAssociateCommand from './commands/associate.js';
import createDisassociateCommand from './commands/disassociate.js';
import createSoftDeleteCommand from './commands/soft-delete.js';
import createEntitlementsCommand from './commands/entitlements.js';
import createAssociationCommand from './commands/association.js';
import createDepartmentCommand from './commands/department.js';
import createMyCommand from './commands/my.js';
import createAllCorpNotesCommand from './commands/all-corp-notes.js';
import createLoginInfoCommand from './commands/login-info.js';
import createFileCommand from './commands/file.js';
import createResumeCommand from './commands/resume.js';
import createVersionCommand from './commands/version.js';
import createDataHubCommand from './commands/data-hub.js';
import createBulkUpdateCommand from './commands/bulk-update.js';
import createPayBillCommand from './commands/pay-bill/index.js';
import createHelpCommand from './commands/help.js';

const program = new Command();

program
  .name('bullhorn')
  .version(pkg.version)
  .description(chalk.cyan.bold(pkg.description));

program.addCommand(createAuthCommand()); 
program.addCommand(createGetCommand());
program.addCommand(createSearchCommand());
program.addCommand(createCreateCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createDeleteCommand());
program.addCommand(createEntitiesCommand());
program.addCommand(createMetaCommand());
program.addCommand(createQueryCommand());
program.addCommand(createServiceCommand());
program.addCommand(createAssociateCommand());
program.addCommand(createDisassociateCommand());
program.addCommand(createSoftDeleteCommand());
program.addCommand(createEntitlementsCommand());
program.addCommand(createAssociationCommand());
program.addCommand(createDepartmentCommand());
program.addCommand(createMyCommand());
program.addCommand(createAllCorpNotesCommand());
program.addCommand(createLoginInfoCommand());
program.addCommand(createFileCommand());
program.addCommand(createResumeCommand());
program.addCommand(createVersionCommand());
program.addCommand(createDataHubCommand());
program.addCommand(createBulkUpdateCommand());
program.addCommand(createPayBillCommand());
program.addCommand(createHelpCommand());

program
  .command('test')
  .description('A simple test command to check if the CLI is working.')
  .action(() => {
    console.log(chalk.green('✅ Bullhorn CLI is set up correctly!'));
  });

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('An unexpected error occurred:', error.message));

    process.exit(1);
  }
}

main();