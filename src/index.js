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

const program = new Command();

program
  .name('bh')
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