// src/lib/helpers.js — Shared utilities for commands.
// Each function is self-contained and documented so an AI can safely
// drop it into a new command by copying one import + calling patterns.

import Table from 'cli-table3';
import chalk from 'chalk';

// ── Query params builder ────────────────────────────────────────────

/**
 * Assemble common Bullhorn GET-request query parameters from command options.
 *
 * Handles: fields, count, start, sort/orderBy, effectiveOn, layout,
 *          showEditable, showReadOnly, privateLabelId, meta, jsonp (callback).
 * Undefined options are skipped — no `undefined` or empty strings leak to the API.
 *
 * @param {object} options  — Commander parsed `.option()` values (camelCase)
 * @param {object} [extra]  — Additional params the caller wants upfront (e.g. query, where)
 * @returns {object}
 */
export function buildGetParams(options, extra = {}) {
  const params = { ...extra };

  if (options.fields    !== undefined) params.fields          = options.fields;
  if (options.count     && Number(options.count))               params.count   = Number(options.count);
  if (options.start     && Number(options.start))               params.start   = Number(options.start);
  if (options.sort)                                    params.sort      = options.sort;
  if (options.orderBy)                                 params.orderBy   = options.orderBy;
  if (options.effectiveOn)                               params.effectiveOn = options.effectiveOn;
  if (options.layout)                                    params.layout      = options.layout;
  if (options.showEditable)                              params.showEditable = true;
  if (options.showReadOnly)                              params.showReadOnly = true;
  if (options.privateLabelId !== undefined)               params.privateLabelId = options.privateLabelId;
  if (options.meta && options.meta !== 'off')              params.meta        = options.meta;
  if (options.jsonp)                                     params.callback    = options.jsonp;

  return params;
}

/**
 * Build GET params for the /allCorpNotes/ endpoint.
 * Adds required clientCorpId + optional layout.
 */
export function buildAllCorpNotesParams(options, extra = {}) {
  const params = { ...extra };

  if (options.fields    !== undefined) params.fields          = options.fields;
  if (options.count     && Number(options.count))               params.count   = Number(options.count);
  if (options.start     && Number(options.start))               params.start   = Number(options.start);
  if (options.sort)                                    params.sort      = options.sort;
  if (options.layout)                                    params.layout      = options.layout;

  return params;
}

// ── Output formatters ───────────────────────────────────────────────

/**
 * Write `data` as pretty-printed JSON to stdout.
 */
export function renderJsonOutput(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Render tabular data using cli-table3.
 *
 * @param {Array<Record<string, unknown>>} records  — array of row objects
 * @param {string[]} [headers]                      — column headers (optional; defaults to keys of first record)
 * @param {Function} [rowFn]                        — custom row mapper `(record, headers) => array` (optional)
 *                                                    If omitted the default row is `headers.map(h => record[h])`.
 * @param {object}   [tableOpts]                     — forwarded to Table constructor (e.g. `colWidths`)
 */
export function renderTableOutput(records, headers = null, rowFn = null, tableOpts = {}) {
  const dynamicHeaders = headers || Object.keys(records[0] || {});

  const table = new Table({ head: dynamicHeaders.map(h => chalk.cyan.bold(String(h))), ...tableOpts });

  if (rowFn) {
    for (const record of records) table.push(rowFn(record, dynamicHeaders));
  } else {
    for (const record of records) table.push(dynamicHeaders.map(h => {
      const val = record[h];
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
    }));
  }

  console.log(table.toString());
}

// ── Error helpers ────────────────────────────────────────────────────

/**
 * Extract a human-readable error object from an axios HTTP error.
 *
 * @param {Error}  error
 * @param {string} entityFor — entity type string (used in contextual hints)
 * @returns {{ status: number, message: string, hint: string }}
 */
export function formatApiError(error, entityFor = '') {
  if (error.response) {
    const status   = error.response.status;
    const message  = error.response.data?.errorMessage || 'No specific error message provided.';

    // Common contextual hints per status code
    let hint = '';
    switch (status) {
      case 400:
        hint = chalk.yellow('This may be due to invalid input or query syntax. Please check your arguments.');
        break;
      case 401:
        hint = chalk.yellow('Your session may have expired. Try re-authenticating with `bh auth login`.');
        break;
      case 403:
        hint = chalk.yellow('You do not have permission to access this resource.');
        break;
      case 404:
        hint = chalk.yellow(`The record you are looking for does not exist.`);
        if (entityFor) hint = chalk.yellow(`The entity "${entityFor}" may be invalid or the record does not exist.`);
        break;
    }

    return { status, message, hint };
  }

  return null; // not an HTTP error — caller should handle separately
}

// ── Error output rendering ───────────────────────────────────────────

/**
 * Render an API error (status + message) to stderr using chalk.
 * Returns `false` for non-HTTP errors — caller handles them separately.
 */
export function renderApiError(error, chalk) {
  if (error.response) {
    const status   = error.response.status;
    const message  = error.response.data?.errorMessage || error.response.data?.message || JSON.stringify(error.response.data);
    console.error(chalk.red(`Error ${status}: ${message}`));
    return true; // was an HTTP error — handled
  }
  console.error(chalk.red('An unexpected error occurred:', error.message));
  return false;
}

// ── Diagnostics ──────────────────────────────────────────────────────

/**
 * Print a one-line status line suitable for diagnostics.
 */
export function printStatusLine(label, value) {
  console.log(`  ${chalk.cyan.bold(label)}: ${value}`);
}

// ── Command boilerplate wrapper ────────────────────────────────────────

/**
 * Wrap a command action with standard spinner + error handling.
 * The `body` function receives `{ chalk, exitCode }` and is responsible for
 * all API calls and output rendering. It should NOT print errors to stderr —
 * `invoke` handles that automatically.
 *
 * Usage:
 *   .action(async (args, options) => {
 *     invoke(async ({ chalk }) => {
 *       const res = await api.get(url, { params });
 *       if (options.output === 'json') renderJsonOutput(res.data);
 *       else renderTableOutput(records, headers);
 *     }, { spinnerMsg, successMsg, failMsg });
 *   })
 */
export async function invoke(body, { spinnerMsg, successMsg = 'Done.', failMsg, exitCode = 1 }) {
  const ora   = (await import('ora')).default;
  const chalk = (await import('chalk')).default;

  const spinner = ora(spinnerMsg).start();

  try {
    await body({ chalk });
    spinner.succeed(chalk.green(successMsg));
  } catch (error) {
    spinner.fail(chalk.red(failMsg || 'Failed.'));

    if (renderApiError(error, chalk)) {
      // HTTP error — already printed status + message to stderr
    }
    // non-HTTP errors: renderApiError returned false, error already printed

    process.exit(exitCode);
  }
}
