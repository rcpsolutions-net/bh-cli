// src/commands/resume/parse-to-text.js — Parse resume to plain text format.

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import FormData from 'form-data';
import api from '../../lib/api.js';
import { readResumeFile, resolveFileName } from './_shared.js';

export default function buildParseToTextCommand(parent) {
  parent.command('parse-to-text')
    .description('Parse a resume file to plain text format.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      const filePath = options.file;
      if (!filePath) {
        console.error(chalk.red('Error: --file <filePath> is required.'));
        process.exit(1);
      }

      const fileBuffer = readResumeFile(filePath);
      const fileName = resolveFileName(options, filePath);
      const spinner = ora(`Parsing resume "${fileName}" to text...`).start();

      try {
        const url = '/resume/parseToText';
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, { headers: formData.getHeaders() });
        const data = response.data;

        spinner.succeed(chalk.green('Resume parsed to text successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.green(`Resume "${fileName}" parsed to text.`));
          if (typeof data === 'string') {
            console.log(data);
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to parse resume to text.'));
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
