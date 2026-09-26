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

Fetch a single entity record by ID, optionally with to-many associations.

```bash
bullhorn get <entityType> <entityId> [toManyFieldName] [options]

Options:
  -f, --fields <list>       Comma-separated fields to return (default: all)
  -c, --count <n>           Records per page (for to-many fetches, default: 25)
      --start <n>           Pagination offset (default: 0)
  -s, --sort <field>        Sort field, prefix with - for descending
  -o, --output <format>     Output format: table or json (default: table)
      --effectiveOn <date>  Date to fetch effective-dated version (YYYY-MM-DD)
      --layout <name>       Layout name (e.g., "CandidateSummary")
      --show-editable       Include editable field information
      --show-read-only      Include read-only field information
      --privateLabelId <id>  Filter by private label ID
      --meta <level>        Include metadata (off, basic, full; default: off)
      --jsonp <name>        JSONP callback function name
```

```bash
bullhorn get Candidate 12345
bullhorn get JobOrder 54321 --fields="id,title,isOpen" -o json
bullhorn get Candidate 12345 primarySkills -c 10 --sort="-dateAdded"
bullhorn get Location 123 --effectiveOn 2025-01-01
```

### Search

Search for records using a [Lucene query](https://lucene.apache.org/core/2_9_4/queryparsersyntax.html).

```bash
bullhorn search <entityType> [options]

Options:
  -q, --query <lucene>    Lucene query string (required)
  -f, --fields <list>     Comma-separated fields to return (default: id,name)
  -c, --count <n>         Records per page (default: 15)
      --start <n>         Pagination offset (default: 0)
  -s, --sort <field>      Sort field, prefix with - for descending
  -o, --output <format>   Output format: table or json (default: table)
      --effectiveOn <date> Date to fetch effective-dated version (YYYY-MM-DD)
      --layout <name>     Layout name (e.g., "CandidateSummary")
      --show-editable     Include editable field information
      --show-read-only    Include read-only field information
      --privateLabelId <id> Filter by private label ID
      --meta <level>      Include metadata (off, basic, full; default: off)
      --jsonp <name>      JSONP callback function name
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
  -w, --where <clause>    SQL WHERE clause (required)
  -f, --fields <list>     Comma-separated fields to return (default: id)
  -c, --count <n>         Records per page (default: 15)
      --start <n>         Pagination offset (default: 0)
      --orderBy <field>   Sort field (e.g. "name DESC")
  -o, --output <format>   Output format: table or json (default: table)
      --effectiveOn <date> Date to fetch effective-dated version (YYYY-MM-DD)
      --layout <name>     Layout name (e.g., "CandidateSummary")
      --show-editable     Include editable field information
      --show-read-only    Include read-only field information
      --privateLabelId <id> Filter by private label ID
      --meta <level>      Include metadata (off, basic, full; default: off)
      --jsonp <name>      JSONP callback function name
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

### Soft Delete

Soft delete an entity record (sets `isDeleted=true`). Some entities only support soft delete.

```bash
bullhorn soft-delete <entityType> <entityId> [options]

Options:
  -f, --force   Skip confirmation prompt
  -o, --output  Output format: table or json (default: table)
```

```bash
bullhorn soft-delete Candidate 12345 --force
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

### Entitlements

Check permissions/entitlements for an entity type.

```bash
bullhorn entitlements <entityType> [options]

Options:
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn entitlements Candidate
```

### Association

Bulk lookup associations between entities (returns `[[parentId, childId], ...]`).

```bash
bullhorn association <entityType> <toManyFieldName> [options]

Options:
  --ids <ids>              Comma-separated parent IDs to lookup
  -c, --count <n>          Number of records to return (default: 25)
      --start <n>          Pagination offset (default: 0)
      --show-total-matched  Include total matched count
  -f, --fields <list>      Comma-separated fields to return
  -o, --output <format>    Output format: table or json (default: table)
```

```bash
bullhorn association Candidate primarySkills --ids "123,456,789"
```

### Associate

Associate to-many child entities with a parent entity.

```bash
bullhorn associate <entityType> <entityId> <toManyFieldName> <ids...> [options]

Options:
  -f, --fields <list>  Comma-separated fields to return
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn associate Candidate 123 primarySkills 964,684,253
```

### Disassociate

Disassociate (remove) to-many child entities from a parent entity.

```bash
bullhorn disassociate <entityType> <entityId> <toManyFieldName> <ids...> [options]

Options:
  -f, --fields <list>  Comma-separated fields to return
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn disassociate Candidate 123 primarySkills 253
```

### Department

Query entities scoped to specific departments (candidates, client contacts, placements, notes).

```bash
bullhorn department <entityType> [options]

Subcommands: candidates, client-contacts, placements, notes

Options:
  -f, --fields <list>    Comma-separated fields to return
  -c, --count <n>        Records per page (default: 25)
      --start <n>        Pagination offset (default: 0)
  -s, --sort <field>     Sort field, prefix with - for descending
  -w, --where <clause>   SQL WHERE clause
  -q, --query <lucene>   Lucene query string
      --departmentIds <ids>  Comma-separated department IDs
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn department candidates --departmentIds "1,2,3" -c 50
```

### My Entities

Query entities owned by the current user (candidates, client contacts, placements, notes).

```bash
bullhorn my <entityType> [options]

Subcommands: candidates, client-contacts, placements, notes

Options:
  -f, --fields <list>       Comma-separated fields to return
  -c, --count <n>           Records per page (default: 25)
      --start <n>           Pagination offset (default: 0)
  -s, --sort <field>        Sort field, prefix with - for descending
  -w, --where <clause>      SQL WHERE clause
  -q, --query <lucene>      Lucene query string
      --departmentIds <ids>  Comma-separated department IDs
  -o, --output <format>     Output format: table or json (default: table)
```

```bash
bullhorn my candidates -c 50 --sort="-dateAdded"
```

### All Corp Notes

Query all Notes across a ClientCorporation (includes `_score`).

```bash
bullhorn all-corp-notes [options]

Options:
  --clientCorpId <id>    Client corporation ID (required)
  -f, --fields <list>    Comma-separated fields to return
  --layout <name>        Layout name
  -c, --count <n>        Records per page (default: 25)
      --start <n>        Pagination offset (default: 0)
  -s, --sort <field>     Sort field, prefix with - for descending
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn all-corp-notes --clientCorpId 4 --fields=id,action --start=0 --count=5
```

### Login Info

Resolve data center information for a Bullhorn username (diagnostics, no auth required).

```bash
bullhorn login-info <username> [options]

Options:
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
bullhorn login-info john.doe@company.com
```

### File

Manage file attachments and downloads for entities.

```bash
bullhorn file <subcommand> [options]

Subcommands:
  get <entityType> <entityId> [fileId]  Download file or list attachments
  upload <entityType> <entityId>        Upload a file
  attach <entityType> <entityId> <fileId>  Attach existing file
  detach <entityType> <entityId> <fileId>  Remove attachment

Options:
  -f, --file <filePath>   File path (for upload)
  -n, --name <fileName>   Display name for the file
  -t, --type <type>       File type (e.g., "Resume", "Cover")
  -f, --fields <list>     Comma-separated fields to return
  -c, --count <n>         Records per page (for list)
      --force             Skip confirmation prompt
  -o, --output <format>   Output format: table or json (default: table)
```

```bash
# List attachments
bullhorn file get Candidate 123

# Upload a file
bullhorn file upload Candidate 123 --file /path/to/resume.pdf --name "Resume.pdf" --type Resume

# Attach a file
bullhorn file attach Candidate 123 456

# Detach a file
bullhorn file detach Candidate 123 456 --force
```

### Resume

Manage candidate/resume uploads, downloads, and parsing.

```bash
bullhorn resume <subcommand> [options]

Subcommands:
  upload <entityType> <entityId>        Upload a resume file
  download <entityType> <entityId>      Download a resume
  parse-to-candidate [options]          Parse resume to Candidate data
  parse-to-hrxml [options]              Parse resume to HRXML format
  parse-to-html [options]               Parse resume to HTML format
  parse-to-text [options]               Parse resume to plain text
```

#### Upload/Download

```bash
# Upload a resume
bullhorn resume upload Candidate 123 --file /path/to/resume.doc --name "Resume.doc"

# Download a resume
bullhorn resume download Candidate 123 --output base64 --destination ./resume.doc
```

#### Parse to Candidate

Extracts Candidate, Education, WorkHistory, and Skills data from a resume file.

```bash
bullhorn resume parse-to-candidate --file /path/to/resume.doc --name "Resume.doc" [options]

Options:
  -f, --file <filePath>         Path to the resume file (required)
  -n, --name <fileName>         Display name for the resume
  -d, --data <json>             JSON string of resume data (alternative to --file)
  --populate-description <type> Include description (text or html)
  -o, --output <format>         Output format: table or json (default: json)
```

```bash
bullhorn resume parse-to-candidate --file candidate.doc --name "candidate.doc"
```

#### Parse to HRML/HTML/Text

```bash
bullhorn resume parse-to-hrxml --file resume.doc
bullhorn resume parse-to-html --file resume.doc
bullhorn resume parse-to-text --file resume.doc
```

### Service

Interact with Bullhorn REST API business services.

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

#### Corporate User (`corporate-user`)

Manage corporate users via `/services/CorporateUser`.

```bash
bullhorn service corporate-user create <fields...>
bullhorn service corporate-user update <id> <fields...>
```

#### Corporate User Delegation (`corporate-user-delegation`)

Manage user delegations via `/services/CorporateUser/{id}/delegation/{delegateId}`.

```bash
bullhorn service corporate-user-delegation set <corpUserId> <delegateId> <fields...>
bullhorn service corporate-user-delegation remove <corpUserId> <delegateId> --force
```

#### Placement Change Request (`placement-change-request`)

Manage placement change requests via `/services/PlacementChangeRequest`.

```bash
bullhorn service placement-change-request create <fields...>
bullhorn service placement-change-request update <id> <fields...>
bullhorn service placement-change-request approve <id>
```

#### Billable Charge (`billable-charge`)

Manage billable charges via `/services/BillableCharge`.

```bash
bullhorn service billable-charge create <fields...>
bullhorn service billable-charge update <id> <fields...>
```

#### Customer Required Field Meta (`customer-required-field-meta`)

Manage custom required field definitions via `/services/CustomerRequiredFieldMeta`.

```bash
bullhorn service customer-required-field-meta create <fields...>
```

#### Placement/Job Customer Required Field (`placement-customer-required-field`, `job-customer-required-field`)

Manage placement/job-specific required fields.

```bash
bullhorn service placement-customer-required-field create [placementId] <fields...>
bullhorn service job-customer-required-field create [jobOrderId] <fields...>
```

#### Placement/Job CRF Configuration (`placement-crf-config`, `job-crf-config`)

Manage placement/job CRF configurations.

```bash
bullhorn service placement-crf-config create [placementId] <fields...>
bullhorn service job-crf-config create [jobOrderId] <fields...>
```

#### Event Subscriptions (`events`)

Manage event subscriptions for real-time entity change notifications.

```bash
# Subscribe to events
bullhorn service events subscribe --entities Candidate,Placement --event-types INSERTED,UPDATED --name "my-subscription"

# List subscriptions
bullhorn service events list

# Consume events (max 100, expires after 7 days)
bullhorn service events consume <subscriptionId> --max-events 50

# Unsubscribe
bullhorn service events unsubscribe <subscriptionId> --force
```

#### Generic Service Call (`call` / `run` / `exec`)

Call any Bullhorn business service endpoint (`/services/{serviceName}`).

```bash
bullhorn service call DirectDepositAccount -X POST -f payload.json
```

```bash
bullhorn service call DirectDepositAccount -X POST -d '{"candidate":{"id":4152400},"directDepositAccounts":[...]}'
```

### Version

Manage effective-dated entity versions (Location, Branch, CustomObjects).

```bash
bullhorn version <subcommand> [options]

Subcommands:
  list <entityType> <entityId>    List all versions
  create <entityType> <fields...> Create new version
  update <entityType> <id>        Update specific version
  delete <entityType> <id>        Delete version (soft-deletes root)

Options:
  -f, --file <filePath>   JSON file path
  -d, --data <jsonData>   Inline JSON string
  --versionId <id>        Version ID (for update/delete)
  --fields <list>         Comma-separated fields to return
  --force                 Skip confirmation prompt
  -o, --output <format>   Output format: table or json (default: table)
```

```bash
# List all versions of a Location
bullhorn version list Location 12345

# Create a new version
bullhorn version create Location name="New Name" address="123 Main St"

# Update a specific version
bullhorn version update Location 12345 --versionId 67890 name="Updated Name"

# Delete a version (soft-deletes root)
bullhorn version delete Location 12345 --versionId 67890 --force
```

### Data Hub

Manage Bullhorn Data Hub operations (upsert, source systems, entity types, schema versions).

```bash
bullhorn data-hub <subcommand> [options]

Subcommands:
  upsert                    Upsert up to 100 records
  get <entityName> [id]     Retrieve hub info
  source-system create|get  Manage source systems
  entity-type create|get    Manage entity types
  schema-version create|get Manage schema versions

Options:
  -f, --file <filePath>       JSON file path
  -d, --data <jsonData>       Inline JSON string
  --source-system <id>        Source system ID
  --entity-type <id>          Entity type ID
  --schema-version <id>       Schema version ID
  --name <name>               Name
  --display <name>            Display name
  --private                   Private flag
  --schema <schema>           Schema definition
  --description <text>        Description
  -o, --output <format>       Output format: table or json (default: table)
```

```bash
# Upsert data records
bullhorn data-hub upsert --source-system "MySystem" --entity-type "MyEntityType" --schema-version "v1" name="Record1" value="123"

# Get hub info
bullhorn data-hub get EdsData 12345

# Manage source systems
bullhorn data-hub source-system create --name "MySystem" --display "My System"
```

### Bulk Update

Mass update multiple entity records at once via `/massUpdate/{entityType}/{ids...}`.

```bash
bullhorn bulk-update <entityType> --ids <ids> <fields...> [options]

Options:
  --ids <ids>           Comma-separated entity IDs (required, e.g., "123,456,789")
  -o, --output <format> Output format: table or json (default: table)
```

```bash
bullhorn bulk-update Candidate --ids "123,456,789" status="Active" notes="Batch update"
```

### Pay & Bill / Timesheet

Manage Pay & Bill / Timesheet entities (AccountingPeriod, BillMaster, InvoiceStatement, Timesheet, etc.).

```bash
bullhorn pay-bill <subcommand> get [id] [options]

Subcommands:
  accounting-period              AccountingPeriod (payroll cycles, 2024.6)
  accounting-period-setting      AccountingPeriodSetting (payroll settings, 2026.5)
  bill-master                    BillMaster (billing masters, 2024.11)
  bill-master-transaction        BillMasterTransaction (billing transactions, 2024.6)
  direct-deposit-account-type-lookup  DirectDepositAccountTypeLookup (pay types, 2025.5)
  invoice-statement              InvoiceStatement (invoicing, 2026.5)
  invoice-term                   InvoiceTerm (invoice terms, 2025.5)
  payable-charge                 PayableCharge (payable charges, 2024.6)
  pay-bill-cycle                 PayBillCycle (pay cycles, 2026.6)
  sales-tax-rate                 SalesTaxRate (sales tax, 2024.6)
  timesheet                      Timesheet (timesheet entries, 2026.6)
  timesheet-entry                TimesheetEntry (timesheet line items, 2024.8)

Options:
  -f, --fields <list>    Comma-separated fields to return
  -c, --count <n>        Records per page (default: 25)
      --start <n>        Pagination offset (default: 0)
      --orderBy <field>  Sort field (e.g. "name DESC")
  -w, --where <clause>   SQL WHERE clause
  -o, --output <format>  Output format: table or json (default: table)
```

```bash
# Get a specific timesheet
bullhorn pay-bill timesheet get 12345

# List all timesheets
bullhorn pay-bill timesheet --fields="id,candidateId,totalHours,amount" -c 50

# List all invoice statements
bullhorn pay-bill invoice-statement --where "status = 'Posted'" --orderBy "dateAdded DESC"
```

## Common Options

The following options are available on `get`, `search`, and `query` commands:

| Option | Description |
|---|---|
| `-f, --fields <list>` | Comma-separated fields to return |
| `-c, --count <n>` | Records per page (pagination size) |
| `--start <n>` | Pagination offset |
| `-s, --sort <field>` / `--orderBy <field>` | Sort field (prefix with `-` or `DESC` for descending) |
| `-o, --output <format>` | Output format: `table` (default) or `json` |
| `--effectiveOn <date>` | Fetch effective-dated version (YYYY-MM-DD) |
| `--layout <name>` | Layout name (e.g., "CandidateSummary") |
| `--show-editable` | Include editable field information |
| `--show-read-only` | Include read-only field information |
| `--privateLabelId <id>` | Filter by private label ID |
| `--meta <level>` | Include metadata (`off`, `basic`, `full`) |
| `--jsonp <name>` | JSONP callback function name |

## Configuration

After login, the session is persisted locally via [`conf`](https://github.com/sindresorhus/conf). Sessions are automatically refreshed on expiry — no need to re-login frequently.

| Platform | Path                                          |
|----------|-----------------------------------------------|
| Linux    | `~/.config/bh-cli/config.json`                |
| macOS    | `~/Library/Preferences/bh-cli/config.json`    |
| Windows  | `%APPDATA%\bh-cli\config.json`                |

The stored config contains your `BhRestToken`, `restUrl`, and `refreshToken`. Treat this file as sensitive.

## API Coverage

| Area | Status | Commands |
|---|---|---|
| Authentication (OAuth 2.0) | ✅ | `auth login/logout/status` |
| Token Refresh (auto) | ✅ | interceptor in `api.js` |
| Entity CRUD | ✅ | `get`, `create`, `update`, `delete` |
| Search (Lucene) | ✅ | `search` |
| Query (JPQL) | ✅ | `query` |
| Entity Metadata | ✅ | `meta` |
| Entity Flowchart | ✅ | `entities` |
| To-many Fetch | ✅ | `get` (toManyFieldName arg) |
| Association/Entitlements | ✅ | `associate`, `disassociate`, `association`, `entitlements` |
| Soft Delete | ✅ | `soft-delete` |
| Department/My Entities | ✅ | `department`, `my` |
| All Corp Notes | ✅ | `all-corp-notes` |
| Login Info | ✅ | `login-info` |
| File Operations | ✅ | `file` (get/upload/attach/detach) |
| Resume Operations | ✅ | `resume` (upload/download/parse) |
| Business Services | ✅ | `service` (13 subcommands) |
| Effective-Dated Entities | ✅ | `version` (list/create/update/delete) |
| Data Hub | ✅ | `data-hub` (upsert/get/source-system/entity-type/schema-version) |
| Bulk Update | ✅ | `bulk-update` |
| Pay & Bill / Timesheet | ✅ | `pay-bill` (12 subcommands) |
| Query Enhancements | ✅ | `--layout`, `--meta`, `--jsonp`, `--effectiveOn`, `--show-editable`, `--show-read-only`, `--privateLabelId` |

## License

MIT
