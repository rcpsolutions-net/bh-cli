// src/commands/entities.js

import { Command } from 'commander';
import chalk from 'chalk';

/**
 * Creates the 'entities' command to display an entity relationship flowchart.
 */
export default function createEntitiesCommand() {
  const entities = new Command('entities')
    .description('Display a flowchart of major Bullhorn entities and their relationships.');

  entities.action(() => {
    // Define some colors for readability
    const entity = chalk.cyan.bold;
    const relationship = chalk.gray;
    const header = chalk.yellow.bold;

    // Use a template literal to easily create the multi-line string
    const flowchart = `
${header('Bullhorn Core Entity Flowchart')}

                  ${entity('[ ClientCorporation ]')}
                      ${relationship('(The Company)')}
                            ${relationship('|')}
                            ${relationship('| has...')}
                            ${relationship('|')}
                  ${relationship('+-----------------+')}
                  ${relationship('|')}                 ${relationship('|')}
        ${entity('[ ClientContact ]')}       ${entity('[ JobOrder ]')}
         ${relationship('(Contact Person)')}        ${relationship('(Job Opening)')}
                  ${relationship('|')}                 ${relationship('|')}
                  ${relationship('| opens...')}          ${relationship('| is submitted to...')}
                  ${relationship('+-----------------+')}
                                      ${relationship('|')}
                                      ${relationship('|')}
                               ${entity('[ JobSubmission ]')}
                                 ${relationship('(Application)')}
                                ${relationship('/')}            ${relationship('\\')}
                               ${relationship('/')}              ${relationship('\\ is for...')}
                              ${relationship('/')}                ${relationship('\\')}
                             ${relationship('/')}                  ${relationship('\\')}
              ${entity('[ Candidate ]')}                 ${relationship('... and results in a...')}
              ${relationship('(The Person)')}                        ${relationship('|')}
                                                  ${relationship('|')}
                                            ${entity('[ Placement ]')}
                                               ${relationship('(A Hire)')}

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

${header('Commonly Associated Entities:')}
  ${entity('[ Note ]')} ${relationship('can be attached to =>')} ${entity('[ Candidate ]')}, ${entity('[ JobOrder ]')}, ${entity('[ ClientContact ]')}, etc.
`;

    // Print the flowchart to the console
    console.log(flowchart);
  });

  return entities;
}