// src/commands/file/index.js — Barrel: creates file command + adds all subcommands.

import { Command } from 'commander';
import buildGetCommand from './get.js';
import buildUploadCommand from './upload.js';
import buildAttachCommand from './attach.js';
import buildDetachCommand from './detach.js';

/** Creates the parent file command with all 4 subcommands. */
export default function createFileCommand() {
  const file = new Command('file')
    .alias('files')
    .description('Manage file attachments and downloads for entities.');

  buildGetCommand(file);
  buildUploadCommand(file);
  buildAttachCommand(file);
  buildDetachCommand(file);

  return file;
}
