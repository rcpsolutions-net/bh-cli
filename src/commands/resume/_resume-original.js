// src/commands/resume.js

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import FormData from 'form-data';
import api from '../lib/api.js';

/**
 * Creates the 'resume' command group for resume upload/download.
 * Subcommands: upload, download
 *
 * API endpoints:
 *   POST /resume/{entityType}/{entityId}  — upload resume
 *   GET  /resume/{entityType}/{entityId}  — download resume
 */
export default function createResumeCommand() {
  const resume = new Command('resume')
    .description('Manage candidate/resume uploads and downloads.');

  // --- Subcommand: resume upload ---
  resume
    .command('upload <entityType> <entityId>')
    .description('Upload a resume file for an entity (typically Candidate).')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (entityType, entityId, options) => {
      const filePath = options.file;
      if (!filePath) {
        console.error(chalk.red('Error: --file <filePath> is required.'));
        process.exit(1);
      }
      if (!existsSync(filePath)) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
      }

      const fileBuffer = readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const fileName = options.name || filePath.split('/').pop() || 'resume';

      const spinner = ora(`Uploading resume "${fileName}" for ${entityType} ${entityId}...`).start();

      try {
        const url = `/resume/${entityType}/${entityId}`;
        const payload = {
          fileName,
          fileData: base64Data,
        };

        const response = await api.post(url, payload);
        const data = response.data;

        spinner.succeed(chalk.green('Resume uploaded successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.green(`Resume "${fileName}" uploaded for ${entityType} ${entityId}.`));
          if (data.id) {
            console.log(chalk.cyan(`Attachment ID: ${data.id}`));
          }
          if (data.fileName) {
            console.log(chalk.blue(`File name: ${data.fileName}`));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to upload resume.'));
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

  // --- Subcommand: resume download ---
  resume
    .command('download <entityType> <entityId>')
    .description('Download a resume for an entity.')
    .option('-o, --output <format>', 'Output format (json or base64)', 'json')
    .option('-d, --destination <path>', 'Save to file path instead of printing to stdout')
    .action(async (entityType, entityId, options) => {
      const spinner = ora(`Downloading resume for ${entityType} ${entityId}...`).start();

      try {
        const url = `/resume/${entityType}/${entityId}`;
        const response = await api.get(url);
        const data = response.data;

        spinner.succeed(chalk.green('Resume downloaded successfully!'));

        if (options.output === 'base64') {
          if (options.destination) {
            writeFileSync(options.destination, data, 'base64');
            console.log(chalk.green(`Resume saved to ${options.destination}`));
          } else {
            process.stdout.write(data);
          }
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to download resume.'));
        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.errorMessage || 'No specific error message provided.';
          console.error(chalk.red(`Error ${status}: ${errorMsg}`));
          if (status === 404) {
            console.error(chalk.yellow('No resume found for this entity.'));
          }
        } else {
          console.error(chalk.red('An unexpected error occurred:', error.message));
        }
        process.exit(1);
      }
    });

  // --- Subcommand: resume parse-to-candidate ---
  resume
    .command('parse-to-candidate')
    .description('Parse a resume file to extract Candidate, Education, WorkHistory, and Skills data.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)', '')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-d, --data <json>', 'JSON string of resume data (alternative to --file)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .option('--populate-description <type>', 'Include resume description (text or html)')
    .action(async (options) => {
      const filePath = options.file;
      let fileBuffer;

      if (filePath && existsSync(filePath)) {
        fileBuffer = readFileSync(filePath);
      } else if (options.data) {
        // If data is provided as a string, treat it as file content
        fileBuffer = Buffer.from(options.data);
      } else {
        console.error(chalk.red('Error: --file <filePath> or --data <json> is required.'));
        process.exit(1);
      }

      const fileName = options.name || (filePath ? filePath.split('/').pop() : 'resume');
      const spinner = ora(`Parsing resume "${fileName}" to candidate data...`).start();

      try {
        const url = '/resume/parseToCandidate';
        const params = { format: 'DOC' };
        if (options.populateDescription) {
          params.populateDescription = options.populateDescription;
        }

        // Bullhorn expects form-data with the file attached
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, {
          params,
          headers: formData.getHeaders(),
        });
        const data = response.data;

        spinner.succeed(chalk.green('Resume parsed successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          // Display parsed data in a structured way
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
            const whTable = new Table({
              head: whHeaders.map(h => chalk.cyan.bold(h)),
            });
            for (const wh of data.candidateWorkHistories) {
              whTable.push(whHeaders.map(h => typeof wh[h] === 'object' ? JSON.stringify(wh[h]) : String(wh[h] ?? '')));
            }
            console.log(whTable.toString());
          }
          if (data.candidateEducations && data.candidateEducations.length > 0) {
            console.log(chalk.cyan.bold(`\nParsed Education (${data.candidateEducations.length} records):`));
            const edHeaders = Object.keys(data.candidateEducations[0] || {});
            const edTable = new Table({
              head: edHeaders.map(h => chalk.cyan.bold(h)),
            });
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

  // --- Subcommand: resume parse-to-hrxml ---
  resume
    .command('parse-to-hrxml')
    .description('Parse a resume file to HRXML format.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      const filePath = options.file;
      if (!filePath || !existsSync(filePath)) {
        console.error(chalk.red('Error: --file <filePath> is required and must exist.'));
        process.exit(1);
      }

      const fileBuffer = readFileSync(filePath);
      const fileName = options.name || filePath.split('/').pop() || 'resume';
      const spinner = ora(`Parsing resume "${fileName}" to HRXML...`).start();

      try {
        const url = '/resume/parseToHrXml';

        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, {
          headers: formData.getHeaders(),
        });
        const data = response.data;

        spinner.succeed(chalk.green('Resume parsed to HRXML successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.green(`Resume "${fileName}" parsed to HRXML.`));
          console.log(JSON.stringify(data, null, 2));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to parse resume to HRXML.'));
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

  // --- Subcommand: resume parse-to-html ---
  resume
    .command('parse-to-html')
    .description('Parse a resume file to HTML format.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      const filePath = options.file;
      if (!filePath || !existsSync(filePath)) {
        console.error(chalk.red('Error: --file <filePath> is required and must exist.'));
        process.exit(1);
      }

      const fileBuffer = readFileSync(filePath);
      const fileName = options.name || filePath.split('/').pop() || 'resume';
      const spinner = ora(`Parsing resume "${fileName}" to HTML...`).start();

      try {
        const url = '/resume/parseToHtml';

        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, {
          headers: formData.getHeaders(),
        });
        const data = response.data;

        spinner.succeed(chalk.green('Resume parsed to HTML successfully!'));

        if (options.output === 'json') {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(chalk.green(`Resume "${fileName}" parsed to HTML.`));
          if (typeof data === 'string') {
            console.log(data);
          } else {
            console.log(JSON.stringify(data, null, 2));
          }
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to parse resume to HTML.'));
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

  // --- Subcommand: resume parse-to-text ---
  resume
    .command('parse-to-text')
    .description('Parse a resume file to plain text format.')
    .option('-f, --file <filePath>', 'Path to the resume file (required)')
    .option('-n, --name <fileName>', 'Display name for the resume (used as file name in request)')
    .option('-o, --output <format>', 'Output format (table or json)', 'json')
    .action(async (options) => {
      const filePath = options.file;
      if (!filePath || !existsSync(filePath)) {
        console.error(chalk.red('Error: --file <filePath> is required and must exist.'));
        process.exit(1);
      }

      const fileBuffer = readFileSync(filePath);
      const fileName = options.name || filePath.split('/').pop() || 'resume';
      const spinner = ora(`Parsing resume "${fileName}" to text...`).start();

      try {
        const url = '/resume/parseToText';

        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: fileName });

        const response = await api.post(url, formData, {
          headers: formData.getHeaders(),
        });
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

  return resume;
}
