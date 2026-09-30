# bullhorn-cli — Developer Guide

**Project**: `bullhorn-cli` (npm: `bh-cli`) — CLI for the Bullhorn REST API.
**Runtime**: Node.js >= 22, ESM (`"type": "module"`).
**CLI framework**: Commander.js. **Entry point**: `src/index.js`.
**Binaries**: `bin/bh.js` → `node src/index.js`, `bin/bullhorn.js`.

## Structure

```
src/
├── index.js          # Commander root — registers all 25 commands
├── lib/              # Shared internals (no command logic)
│   ├── api.js        # Axios instance + 401 interceptor (auto token refresh)
│   ├── auth.js       # Login / logout / token-refresh handlers
│   ├── config.js     # Conf store singleton (local JSON)
│   └── helpers.js    # buildGetParams, renderJsonOutput, renderTableOutput, formatApiError
└── commands/         # 25 command modules — flat files OR subcommand groups
    ├── get.js        # single-file commands (~18 files)
    ├── auth.js
    ├── search.js
    ├── create.js
    ├── update.js
    ├── delete.js
    ├── entities.js
    ├── meta.js
    ├── query.js
    ├── bulk-update.js
    ├── soft-delete.js
    ├── my.js
    ├── department.js
    ├── all-corp-notes.js
    ├── associate.js
    ├── disassociate.js
    ├── association.js
    ├── entitlements.js
    ├── login-info.js
    ├── help.js         # CLI logic + imports help-entities.js (static data)
    └── help-entities.js # static entity list + command-to-entity mappings
    └── service/        # subcommand group (13 subcommands)
    ├── data-hub/       # subcommand group (5 subcommands)
    ├── resume/         # subcommand group (6 subcommands)
    ├── version/        # subcommand group (4 subcommands)
    ├── file/           # subcommand group (4 subcommands)
    └── pay-bill/       # subcommand group (12 entities)
```

## Patterns

### Single-file commands
Most commands live in `src/commands/<name>.js`. Each exports one default function that returns a `Command` instance:

```js
export default function createGetCommand() {
  const cmd = new Command('get').description(...)
    .argument('<entityType>')
    // ...options, action...
  return cmd;
}
```

Imported in `src/index.js` as `createXCommand` → `program.addCommand(createXCommand())`.

### Subcommand groups (directory + barrel)
Commands with many subcommands use a directory layout:

```
src/commands/<group>/
├── index.js       # barrel — imports all subcommand builders, creates parent Command, adds them via addCommand()
├── sub-a.js       # export default function buildSubACommand() { ... }
├── sub-b.js
├── _shared.js     # shared helpers/types (prefixed with _)
└── _<group>-original.js  # legacy single-file (kept for reference)
```

**Barrel rules**: `index.js` must import from concrete files (`./sub-a.js`), never through another barrel. Internal sibling imports also bypass barrels.

## Why DRY + Barrel

- **DRY** — Subcommands share the same API call shape, output helpers (`renderTableOutput`, `renderJsonOutput`), and error handling (`formatApiError`). Without shared helpers, every subcommand copies ~20 lines → bug fixes must happen in N places. With `_shared.js`, fix once.
- **Barrel** — Without a barrel, `src/index.js` would need ~80 scattered imports. The barrel keeps it at ~30, makes the command tree discoverable per group, and lets you add/remove subcommands by touching one directory.

Together: barrel reduces **surface area**, DRY reduces **duplication**.

### Lib modules
- `api.js` — singleton Axios instance with 401 interceptor (triggers token refresh).
- `auth.js` — login, logout, `handleTokenRefresh`.
- `config.js` — singleton reading from local JSON config store.
- `helpers.js` — shared utilities: `buildGetParams`, `renderJsonOutput`, `renderTableOutput`, `formatApiError`.

### Naming convention
- Command builders: `createXCommand()` (single-file) or `buildXCommand()` (subcommand).
- Internal/shared files: `_shared.js` or `_<group>-original.js`.

## Workflow

1. **Add a command** — single-file: create `src/commands/<name>.js`, export default builder, add import + `program.addCommand()` in `src/index.js`.
2. **Add a subcommand group** — create directory under `src/commands/`, add barrel `index.js` + subcommand files, update `src/index.js`.
3. **Verify**: `node src/index.js --help` lists all commands; test with `bh <command> --help`.
4. **No lint/test configured** — manual `--help` smoke test is the verification standard.

## Dependencies

| Package | Use |
|---|---|
| `axios` | HTTP client (api.js) |
| `commander` | CLI framework |
| `chalk` | Terminal colors |
| `cli-table3` | Table rendering |
| `conf` | Local JSON config store |
| `dotenv` | Env var loading |
| `inquirer` | Interactive prompts |
| `ora` | Spinner / progress indicator |

## Files to ignore / keep

- `package-lock.json` — track deps.
- `COMPLETED.md` — historical refactor log (read-only archive).
- `_original.js` files — legacy reference; safe to remove once refactoring is finalized.
- `REFACTOR_PLAN.md` — obsolete; deleted (plan executed).
