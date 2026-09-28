// src/commands/resume/index.js — Barrel: creates resume command + adds all subcommands.

import { Command } from 'commander';
import buildUploadCommand from './upload.js';
import buildDownloadCommand from './download.js';
import buildParseToCandidateCommand from './parse-to-candidate.js';
import buildParseToHrxmlCommand from './parse-to-hrxml.js';
import buildParseToHtmlCommand from './parse-to-html.js';
import buildParseToTextCommand from './parse-to-text.js';

/** Creates the parent resume command with all 6 subcommands. */
export default function createResumeCommand() {
  const resume = new Command('resume')
    .description('Manage candidate/resume uploads and downloads.');

  buildUploadCommand(resume);
  buildDownloadCommand(resume);
  buildParseToCandidateCommand(resume);
  buildParseToHrxmlCommand(resume);
  buildParseToHtmlCommand(resume);
  buildParseToTextCommand(resume);

  return resume;
}
