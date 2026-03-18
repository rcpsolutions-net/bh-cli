# bh-cli

A command-line interface for interacting with the [Bullhorn REST API](https://bullhorn.github.io/rest-api-docs/). Fetch, search, query, create, update, and delete Bullhorn entities directly from your terminal.

## Requirements

- Node.js >= 22.0.0
- Bullhorn account with API credentials (Client ID and Client Secret)

## Installation

```bash
git clone <repo-url>
cd bh-cli
npm install
npm link
```

After linking, the `bullhorn` command will be available globally.

## Setup

Authenticate to create a local session:

```bash
bullhorn auth login
```

You'll be prompted for your Bullhorn username, password, Client ID, and Client Secret. On success, the session token and REST URL are stored locally for all subsequent commands.

Optionally, set default credentials via environment variables to pre-fill the login prompts:

```env
BH_USER_NAME=your_username
BH_USER_PASSWORD=your_password
BH_API_CLIENT_ID=your_client_id
BH_API_CLIENT_SECRET=your_client_secret
```

## Commands

### Authentication

```bash
bullhorn auth login    # Authenticate and save session
bullhorn auth logout   # Clear stored credentials
bullhorn auth status   # Show current session status
```

### Get

Fetch a single entity record by ID.

```bash
bullhorn get <entityType> <entityId> [options]

Options:
  -f, --fields <list>    Comma-separated fields to return (default: all)
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn get Candidate 12345
bullhorn get JobOrder 54321 --fields="id,title,isOpen" -o json
```

### Search

Search for records using a [Lucene query](https://lucene.apache.org/core/2_9_4/queryparsersyntax.html).

```bash
bullhorn search <entityType> [options]

Options:
  -q, --query <lucene>   Lucene query string (required)
  -f, --fields <list>    Comma-separated fields to return (default: id,name)
  -c, --count <n>        Records per page (default: 15)
      --start <n>        Pagination offset (default: 0)
  -s, --sort <field>     Sort field, prefix with - for descending
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn search Candidate -q "isDeleted:0 AND name:John*" -c 20
bullhorn search JobOrder -q "isOpen:1" --fields="id,title,dateAdded" -s "-dateAdded"
```

### Query

Query records using a SQL-like WHERE clause.

```bash
bullhorn query <entityType> [options]

Options:
  -w, --where <clause>   SQL WHERE clause (required)
  -f, --fields <list>    Comma-separated fields to return (default: id)
  -c, --count <n>        Records per page (default: 15)
      --start <n>        Pagination offset (default: 0)
      --orderBy <field>  Sort field (e.g. "name DESC")
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn query Candidate -w "id > 100 AND isDeleted = false" --orderBy "lastName ASC"
```

### Create

Create a new entity record using `key=value` pairs.

```bash
bullhorn create <entityType> <fields...>
```

```bash
bullhorn create Candidate firstName="Jane" lastName="Doe" email="jane@example.com"
```

### Update

Update an existing entity record by ID.

```bash
bullhorn update <entityType> <entityId> <fields...>
```

```bash
bullhorn update Candidate 12345 email="new@example.com" status="Active"
```

### Delete

Delete an entity record by ID.

```bash
bullhorn delete <entityType> <entityId> [options]

Options:
  -f, --force  Skip confirmation prompt
```

```bash
bullhorn delete Note 98765 --force
```

### Meta

Get field definitions and type metadata for an entity.

```bash
bullhorn meta <entityType> [options]

Options:
  -f, --fields <list>    Fields to get metadata for (default: all)
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn meta Candidate
bullhorn meta JobOrder -o json
```

### Entities

Display a flowchart of major Bullhorn entities and their relationships.

```bash
bullhorn entities
```

## Configuration

After login, the session is persisted locally via [`conf`](https://github.com/sindresorhus/conf). Sessions are automatically refreshed on expiry — no need to re-login frequently.

| Platform | Path                                          |
|----------|-----------------------------------------------|
| Linux    | `~/.config/bh-cli/config.json`                |
| macOS    | `~/Library/Preferences/bh-cli/config.json`    |
| Windows  | `%APPDATA%\bh-cli\config.json`                |

The stored config contains your `BhRestToken`, `restUrl`, and `refreshToken`. Treat this file as sensitive.

## License

MIT
