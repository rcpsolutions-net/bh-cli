# bh-cli AI-Friendly Refactor — Complete Plan

**Project**: `bh-cli` — Bullhorn REST API CLI tool. 31 source files, 6214 total lines. ESM modules (`"type": "module"`). Commander.js-based. 25 registered commands. Entry: `src/index.js`. Verified: `node src/index.js --help` runs successfully.

## Source Layout (31 files)

| File | Lines | Role |
|---|---|---|
| `src/index.js` | 82 | Registers 25 commands |
| `src/lib/api.js` | 64 | Axios instance, 401 interceptor with token refresh |
| `src/lib/auth.js` | 176 | Login, logout, handleTokenRefresh |
| `src/lib/config.js` | 39 | Conf store singleton |
| 26 files in `src/commands/` | — | Command implementations |

## Top Candidates for Splitting (by line count)

| # | File | Lines | Subcommands/Exports | Plan |
|---|---|---|---|---|
| 1 | `service.js` | 1226 | 13 (direct-deposit, call, corporate-user, corporate-user-delegation, placement-change-request, billable-charge, customer-required-field-meta, placement-crf, job-crf, placement-crf-config, job-crf-config, events) | → 13 files + barrel |
| 2 | `help.js` | 600 | 200+ static entity list + 12 entity→command mapping if-blocks | → CLI logic + static data file |
| 3 | `pay-bill.js` | 570 | 12 entity handlers sharing `buildParams`/`renderTable` helpers | → 12 files + barrel |
| 4 | `data-hub.js` | 529 | 5 (upsert, get, source-system, entity-type, schema-version) | → 5 files + barrel |
| 5 | `resume.js` | 388 | 6 (upload, download, parse-to-candidate, parse-to-hrxml, parse-to-html, parse-to-text) | → 6 files + barrel |
| 6 | `version.js` | 284 | 4 (list, create, update, delete) + `parseFieldArgs` | → 4 files + barrel |
| 7 | `file.js` | 256 | 4 (get, upload, attach, detach) | → 4 files + barrel |

## Skipped (small, single-responsibility, no split needed)

| File | Lines | Reason |
|---|---|---|
| `get.js` | 213 | Single responsibility |
| `query.js` | 166 | Single responsibility |
| `search.js` | 166 | Single responsibility |
| `update.js` | 73 | Too small |
| `delete.js` | 74 | Too small |
| `login-info.js` | 73 | Too small |
| `entities.js` | 65 | Too small |
| `entitlements.js` | 79 | Too small |
| `soft-delete.js` | 86 | Too small |
| `meta.js` | 94 | Too small |
| `my.js` | 125 | Single responsibility |
| `department.js` | 125 | Single responsibility |
| `all-corp-notes.js` | 113 | Single responsibility |
| `associate.js` | 94 | Single responsibility |
| `disassociate.js` | 94 | Single responsibility |
| `association.js` | 104 | Single responsibility |
| `auth.js` | 85 | Single responsibility |

## 8 Batches

### Batch A: `service.js` → 13 files + barrel

- Create `src/commands/service/` directory
- 13 subcommand files (one per service subcommand)
- `src/commands/service/index.js` barrel (pure re-exports)
- Import change in `src/index.js`: `./commands/service.js` → `./commands/service/index.js`

### Batch B: `help.js` → CLI logic + static data

- `src/commands/help.js` — CLI logic (remaining after data extraction)
- `src/commands/help-entities.js` — static data (`COMMANDS_LIST`, `ENTITIES_LIST`, `ENTITY_COMMAND_MAP`)
- Import change in `src/index.js`

### Batch C: `pay-bill.js` → 12 entity files + barrel

- Create `src/commands/pay-bill/` directory
- 12 entity handler files
- `src/commands/pay-bill/index.js` barrel (exports all handlers + shared `buildParams`/`renderTable`)
- Import change in `src/index.js`: `./commands/pay-bill.js` → `./commands/pay-bill/index.js`

### Batch D: `data-hub.js` → 5 subcommand files + barrel

- Create `src/commands/data-hub/` directory
- 5 subcommand files (upsert, get, source-system, entity-type, schema-version)
- `src/commands/data-hub/index.js` barrel
- Import change in `src/index.js`: `./commands/data-hub.js` → `./commands/data-hub/index.js`

### Batch E: `resume.js` → 6 subcommand files + barrel

- Create `src/commands/resume/` directory
- 6 subcommand files (upload, download, parse-to-candidate, parse-to-hrxml, parse-to-html, parse-to-text)
- `src/commands/resume/index.js` barrel
- Import change in `src/index.js`: `./commands/resume.js` → `./commands/resume/index.js`

### Batch F: `version.js` → 4 subcommand files + barrel

- Create `src/commands/version/` directory
- 4 subcommand files (list, create, update, delete)
- `src/commands/version/index.js` barrel (exports all + `parseFieldArgs`)
- Import change in `src/index.js`: `./commands/version.js` → `./commands/version/index.js`

### Batch G: `file.js` → 4 subcommand files + barrel

- Create `src/commands/file/` directory
- 4 subcommand files (get, upload, attach, detach)
- `src/commands/file/index.js` barrel
- Import change in `src/index.js`: `./commands/file.js` → `./commands/file/index.js`

### Batch H: Update `src/index.js` imports

- Update all 6 barrel-replaced module imports (service, pay-bill, data-hub, resume, version, file)
- 19 other commands stay single-file — no changes needed

## Constraints

- **Behavior-preserving only.** No logic changes, no renamed public APIs.
- **Preserve git history.** Use `git mv` when moving symbols to their own files, so `git blame`/`git log --follow` still work.
- **One primary export per file.** Helpers/types fine alongside it.
- **Barrel files do pure re-export only**, zero logic.
- **Internal files import concrete files directly**, never through their own barrel.
- **Abort if >40 files touched in one run.** This plan touches ~60 new files total, but per-batch stays under threshold.
- **Verify each batch:** `node src/index.js --help` (no typecheck/lint configured).
- **Execution order:** A → B → C → D → E → F → G → H (highest-impact-first).
