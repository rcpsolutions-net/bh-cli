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

### Service

Interact with Bullhorn REST API business services (such as `DirectDepositAccount`).

#### Direct Deposit (`direct-deposit` / `DirectDepositAccount` / `dd`)

Manage candidate direct deposit accounts via `/services/DirectDepositAccount`.

##### Update accounts via JSON file:

```bash
bullhorn service direct-deposit update 4152400 --file accounts.json
```

Where `accounts.json` contains either the full payload:

```json
{
  "candidate": {
    "id": 4152400
  },
  "directDepositAccounts": [
    {
      "amount": 1000,
      "remainder": false,
      "currencyUnit": {
        "id": 166,
        "minorUnits": 0
      },
      "bankName": "Chase Bank",
      "accountNumber": "111",
      "transitNumber": "021000021",
      "directDepositAccountTypeLookup": {
        "id": 1,
        "label": "Checking"
      },
      "paymentOrder": 1
    },
    {
      "amount": 500,
      "remainder": false,
      "currencyUnit": {
        "id": 166,
        "minorUnits": 0
      },
      "bankName": "Bank of America",
      "accountNumber": "112",
      "transitNumber": "011401533",
      "directDepositAccountTypeLookup": {
        "id": 2,
        "label": "Savings"
      },
      "paymentOrder": 2
    },
    {
      "remainder": true,
      "currencyUnit": {
        "id": 166,
        "minorUnits": 0
      },
      "bankName": "Wells Fargo",
      "accountNumber": "113",
      "transitNumber": "091000019",
      "directDepositAccountTypeLookup": {
        "id": 3,
        "label": "Pay Card"
      },
      "paymentOrder": 3
    }
  ]
}
```

Or an array of `directDepositAccounts` when providing `<candidateId>` on the command line.

##### Update via inline JSON:

```bash
bullhorn service direct-deposit update 4152400 --data '{"candidate":{"id":4152400},"directDepositAccounts":[...]}'
```

##### Update a single account using CLI flags:

```bash
bullhorn service direct-deposit update 4152400 \
  --bank "Chase Bank" \
  --transit "021000021" \
  --account "111" \
  --type Checking \
  --remainder
```

Options:
- `-c, --candidate <id>`: Candidate ID (or pass as first argument)
- `-f, --file <filePath>`: JSON file path (full payload or accounts array)
- `-d, --data <jsonData>`: Inline JSON string
- `--clear`: Clear all accounts for the candidate (sends empty account array)
- `-b, --bank <name>`: Bank name
- `-a, --account <num>`: Account number
- `-t, --transit <num>` / `-r, --routing <num>`: Routing / transit number
- `--type <type>`: `Checking`, `Savings`, or `Pay Card` (default: `Checking`)
- `--amount <n>`: Fixed deposit dollar amount
- `--remainder`: Flag account for remainder of pay
- `--order <n>`: Payment order (default: 1)
- `--currency-unit <id>`: Currency unit ID (default: 166 for USD)
- `-X, --method <method>`: HTTP method: `POST` or `PUT` (default: `POST`)
- `-o, --output <format>`: Output format: `table` or `json` (default: `table`)

##### Inspect existing direct deposit accounts:

```bash
bullhorn service direct-deposit get 4152400
bullhorn service direct-deposit get 4152400 -o json
```

#### Generic Service Call (`call` / `run` / `exec`)

Call any Bullhorn business service endpoint (`/services/{serviceName}`):

```bash
bullhorn service call DirectDepositAccount -X POST -f payload.json
```

```bash
bullhorn service call DirectDepositAccount -X POST -d '{"candidate":{"id":4152400},"directDepositAccounts":[...]}'
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
