// src/commands/resume/parse-to-candidate.js — Parse resume to candidate data.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import FormData from 'form-data';
import api from '../../lib/api.js';
import { readResumeFile, resolveFileName } from './_shared.js';

export default function buildParseToCandidateCommand(parent) {
  parent.command('parse-to-candidate')
    .description('Parse a resume file to extract Candidate, Education, WorkHistory, and Skills data.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)', '')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-d, --data <json>', 'JSON string of resume data (alternative to --file)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .option('--populate-description <type>', 'Include resume description (text or html)')
    .action(async (options) => {
      const filePath = options.file;
      let fileBuffer;

      if (filePath) {
        try {
          const fs = await import('node:fs');
          if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`Error: File not found: ${filePath}`));
            process.exit(1);
          }
          fileBuffer = fs.readFileSync(filePath);
        } catch {
          console.error(chalk.red(`Error: File not found: ${filePath}`));
          process.exit(1);
        }
      } else if (options.data) {
        fileBuffer = Buffer.from(options.data);
      } else {
        console.error(chalk.red('Error: --file <filePath> or --data <json> is required.'));
        process.exit(1);
      }

      const fileName = resolveFileName(options, filePath);
      const spinner = ora(`Parsing resume "${fileName}" to candidate data...`).start();

      try {
        const url = '/resume/parseToCandidate';
        const params = { format: 'DOC' };
        if (options.populateDescription) {
          params.populateDescription = options.populateDescription;
        }

        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, { params, headers: formData.getHeaders() });
        const data = response.data;

        spinner.succeed(chalk.green('Resume parsed successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          if (data.candidate) {
            console.log(chalk.cyan.bold('\nParsed Candidate Data:'));
            const candTable = new Table({
              head: [chalk.cyan.bold('Field'), chalk.cyan.bold('Value')],
            });
            const candidateKeys = Object.keys(data.candidate).filter(k => !['notes', 'candidateWorkHistories', 'candidateEducations', 'primarySkills'].includes(k));
            for (const key of candidateKeys) {
              const val = data.candidate[key];
              candTable.push([chalk.bold(key), typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')]);
            }
            console.log(candTable.toString());
          }
          if (data.candidateWorkHistories && data.candidateWorkHistories.length > 0) {
            console.log(chalk.cyan.bold(`\nParsed Work History (${data.candidateWorkHistories.length} records):`));
            const whHeaders = Object.keys(data.candidateWorkHistories[0] || {});
            const whTable = new Table({ head: whHeaders.map(h => chalk.cyan.bold(h)) });
            for (const wh of data.candidateWorkHistories) {
              whTable.push(whHeaders.map(h => typeof wh[h] === 'object' ? JSON.stringify(wh[h]) : String(wh[h] ?? '')));
            }
            console.log(whTable.toString());
          }
          if (data.candidateEducations && data.candidateEducations.length > 0) {
            console.log(chalk.cyan.bold(`\nParsed Education (${data.candidateEducations.length} records):`));
            const edHeaders = Object.keys(data.candidateEducations[0] || {});
            const edTable = new Table({ head: edHeaders.map(h => chalk.cyan.bold(h)) });
            for (const ed of data.candidateEducations) {
              edTable.push(edHeaders.map(h => typeof ed[h] === 'object' ? JSON.stringify(ed[h]) : String(ed[h] ?? '')));
            }
            console.log(edTable.toString());
          }
          if (data.primarySkills && data.primarySkills.length > 0) {
            console.log(chalk.cyan.bold(`\nParsed Skills (${data.primarySkills.length}):`));
            console.log(data.primarySkills.map(s => `  ${s.name || s.id}`).join('\n'));
          }
          if (data.description) {
            console.log(chalk.cyan.bold('\nResume Description:'));
            console.log(typeof data.description === 'string' ? data.description : JSON.stringify(data.description));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to parse resume.'));
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
}
