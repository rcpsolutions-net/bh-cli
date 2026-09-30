# bullhornh-cli — Features Plan (Bullhorn REST API)

Generated: 2026-09-25

## Current Coverage

| API Area | CLI Command(s) | Status |
|---|---|---|
| OAuth 2.0 Login | `bullhorn auth login/logout/status` | ✅ Done |
| Token Refresh (auto) | interceptor in `api.js` | ✅ Done |
| GET single/multiple entities | `bullhorn get <entityType> <entityId>` | ✅ Done |
| Search (Lucene) | `bullhorn search <entityType> -q <query>` | ✅ Done |
| Query (JPQL) | `bullhorn query <entityType> -w <where>` | ✅ Done |
| Create (POST) | `bullhorn create <entityType> <fields...>` | ✅ Done |
| Update (POST) | `bullhorn update <entityType> <entityId> <fields...>` | ✅ Done |
| Delete (DELETE) | `bullhorn delete <entityType> <entityId>` | ✅ Done |
| Entity Metadata | `bullhorn meta <entityType>` | ✅ Done |
| Entity Flowchart | `bullhorn entities` | ✅ Done (static, no API) |
| Business Services | `bullhorn service direct-deposit` | ✅ Done (DirectDepositAccount only) |
| CorporateUser | `bullhorn service corporate-user` | ✅ Done (create, update) |
| CorporateUserDelegation | `bullhorn service corporate-user-delegation` | ✅ Done (set, remove) |
| PlacementChangeRequest | `bullhorn service placement-change-request` | ✅ Done (create, update, approve) |
| BillableCharge | `bullhorn service billable-charge` | ✅ Done (create, update) |
| CustomerRequiredFieldMeta | `bullhorn service customer-required-field-meta` | ✅ Done (create) |
| PlacementCustomerRequiredField | `bullhorn service placement-customer-required-field` | ✅ Done (create) |
| JobCustomerRequiredField | `bullhorn service job-customer-required-field` | ✅ Done (create) |
| PlacementCRFConfig | `bullhorn service placement-crf-config` | ✅ Done (create) |
| JobCRFConfig | `bullhorn service job-crf-config` | ✅ Done (create) |
| Event Subscriptions | `bullhorn service events` | ✅ Done (subscribe, list, consume, unsubscribe) |
| Generic Service Call | `bullhorn service call <name>` | ✅ Done (generic, POST, PUT, GET, DELETE) |
| Effective-Dated Entities | `bullhorn version` | ✅ Done (list, create, update, delete) |
| Data Hub | `bullhorn data-hub` | ✅ Done (upsert, get, source-system, entity-type, schema-version) |
| Effective-On Support | `bullhorn (get search) query --effectiveOn` | ✅ Done (added to 3 commands) |
| Bulk Update | `bullhorn bulk-update <entityType> --ids <ids> <fields...>` | ✅ Done (supports --ids, --output) |
| Resume Parsing | `bullhorn resume parse-to-candidate, hrxml, html, text` | ✅ Done (4 new subcommands, form-data) |
| Pay & Bill / Timesheet | `bullhorn pay-bill <subcommand>` | ✅ Done (12 subcommands for 12 entities) |
| Layout Parameter | `bullhorn get,search,query --layout <name>` | ✅ Done (added to 3 commands) |
| Show Editable/Read-Only | `bullhorn get,search,query --show-editable --show-read-only` | ✅ Done (added to 3 commands) |
| Private Label Filtering | `bullhorn get,search,query --privateLabelId <id>` | ✅ Done (added to 3 commands) |
| Meta Parameter | `bullhorn get-search-query --meta <level>` | ✅ Done (added to 3 commands, default: off) |
| JSONP Support | `bullhorn get-search-query --jsonp <name>` | ✅ Done (added to 3 commands, maps to callback) |
| Pagination (start/count) | all search/query/get | ✅ Done |
| Field selection (fields=) | all search/query/get | ✅ Done |
| Sorting (orderBy/sort) | search, query | ✅ Done |
| JSON output | all commands (`-o json`) | ✅ Done |
| Table output | all commands (default) | ✅ Done |
| Confirmation prompts | delete (`--force`) | ✅ Done |
| .env pre-fill | auth login | ✅ Done |

---

### 1.1 `bullhorn entity <entityType> <entityId> --get` (single)
Already exists as `bullhorn get`. **No change needed.**

### 1.2 Multi-entity GET
`bullhorn get Candidate 123,456,789`
- API: `GET /entity/{entityType}/{id1,id2,id3}?fields=...`
- Returns `{ data: [...] }` with mixed success (404 for missing, found for existing)
- **Already partially supported** by `bullhorn get` accepting comma-separated IDs

### 1.3 To-many association fetch
```bash
bullhorn get Candidate 123 primarySkills
```
- API: `GET /entity/{entityType}/{id}/{toManyFieldName}s?fields=...&count=...&start=...&orderBy=...`
- Returns to-many associated entities of specified type
- Add as sub-argument: `bullhorn get <entityType> <entityId> [toManyFieldName] [options]`
- ✅ **DONE** — updated `src/commands/get.js` to accept optional `[toManyFieldName]` argument, added `-c/--count`, `--start`, `-s/--sort` options

### 1.4 Create to-many associations (PUT)
```bash
bullhorn associate Candidate 123 primarySkills 964,684,253
```
- API: `PUT /entity/{entityType}/{entity-id}/{to-many-association-name}/{entity-id},*`
- Creates and associates new to-many records
- **New command: `bullhorn associate`**
- ✅ **DONE** — `src/commands/associate.js` added, supports `-f/--fields` and `-o/--output`

### 1.5 Disassociate to-many (DELETE)
```bash
bullhorn disassociate Candidate 123 primarySkills 253
```
- API: `DELETE /entity/{entityType}/{entity-id}/{to-many-association-name}/{entity-id},*`
- **New command: `bullhorn disassociate`**
- ✅ **DONE** — `src/commands/disassociate.js` added, supports `-f/--fields` and `-o/--output`

### 1.6 Soft delete via POST (set isDeleted=true)
```bash
bullhorn soft-delete Candidate 123
```
- API: `POST /entity/{entityType}/{entityId}` with body `{ isDeleted: true }`
- Some entities only support soft delete (not hard delete)
- **New command: `bullhorn soft-delete`** (also aliased as `bullhorn softdelete`)
- ✅ **DONE** — `src/commands/soft-delete.js` added, supports `-f/--force` confirmation, `-o/--output`

### 1.7 Entity entitlements check
```bash
bullhorn entitlements Candidate
```
- API: `GET /entitlements/{entityType}`
- Returns array: `["CREATE", "READ", "READ_DEPARTMENT", "UPDATE", "DELETE"]`
- **New command: `bullhorn entitlements <entityType>`**
- ✅ **DONE** — `src/commands/entitlements.js` added, displays table with summary (CREATE/READ/UPDATE/DELETE checkmarks), supports `-o/--output`

### 1.8 Association lookup (bulk)
```bash
bullhorn association Candidate primarySkills --ids 123,456,789
```
- API: `POST /association/{entity}/{association field}` with body `{ ids: [...], count, start, showTotalMatched }`
- Returns `[[entityId, associatedEntityId], ...]`
- **New command: `bullhorn association`**
- ✅ **DONE** — `src/commands/association.js` added, supports `--ids`, `-c/--count`, `--start`, `--show-total-matched`, `-f/--fields`, `-o/--output`

---

### 2.1 Department entities
```bash
bullhorn department-candidates [options]
bullhorn department-client-contacts [options]
bullhorn department-placements [options]
bullhorn department-notes [options]
```
- API: `GET /department{Entity}s/?fields=...&departmentIds=...&count=...&start=...&sort=...&query=...&where=...`
- Returns entities from all user's departments (or specified departmentIds)
- **New command group: `bullhorn department`** with subcommands for each entity type
- ✅ **DONE** — `src/commands/department.js` added, subcommands: candidates, client-contacts, placements, notes; supports --fields, --count, --start, --sort, --where, --query, --departmentIds, --output

### 2.2 My entities (user-owned)
```bash
bullhorn my-candidates [options]
bullhorn my-client-contacts [options]
bullhorn my-placements [options]
bullhorn my-notes [options]
```
- API: `GET /my{Entity}s/?fields=...&departmentIds=...&count=...&start=...&sort=...&query=...&where=...`
- Returns entities owned by current user
- **New command group: `bullhorn my`** with subcommands for each entity type
- ✅ **DONE** — `src/commands/my.js` added, subcommands: candidates, client-contacts, placements, notes; supports --fields, --count, --start, --sort, --where, --query, --departmentIds, --output

---

### 3.1 All Corp Notes
```bash
 bullhorn all-corp-notes --clientCorpId 4 --fields=id,action --start=0 --count=5
```
- API: `GET /allCorpNotes/?fields=...&layout=...&clientCorpId=...&start=...&count=...`
- Returns all Notes across a ClientCorporation with `_score`
- **New command: `bullhorn all-corp-notes`**
- ✅ **DONE** — `src/commands/all-corp-notes.js` added, supports --clientCorpId (required), --fields, --layout, --count, --start, --sort, --output

### 3.2 File operations
```bash
# Get a file (base64)
bullhorn file Candidate 3835 --output json
# Upload a file
bullhorn file Candidate --upload /path/to/file.txt
# List file attachments
bullhorn file-attachments Candidate 123
```
- API: `GET /file/{entityType}/{entityId}/{fileId}` (base64)
- API: `PUT /file/{entityType}` (upload)
- API: `GET /entity/{entityType}/{entityId}/fileAttachments?fields=...` (list)
- API: `PUT /entity/{entityType}/{entityId}/fileAttachments/{fileId}` (attach)
- API: `DELETE /entity/{entityType}/{entityId}/fileAttachments/{fileId}` (detach)
- **New command group: `bullhorn file`** with subcommands: `get`, `upload`, `attach`, `detach`
- ✅ **DONE** — `src/commands/file.js` added, subcommands: get (download or list), upload, attach, detach; supports --file, --name, --type, --fields, --output, --force

### 3.3 Resume operations
- API: `POST /resume/{entityType}/{entityId}` (upload resume)
- API: `GET /resume/{entityType}/{entityId}` (download resume)
- **New command group: `bullhorn resume`** with subcommands: `upload`, `download`
- ✅ **DONE** — `src/commands/resume.js` added, subcommands: upload, download; supports --file, --name, --output, --destination

### 3.4 Login info (data center resolution)
- API: `GET rest.bullhornstaffing.com/rest-services/loginInfo?username={username}`
- Already used internally in `auth.js` — **expose as `bullhorn login-info <username>`** for diagnostics
- ✅ **DONE** — `src/commands/login-info.js` added, uses public endpoint (no auth required), supports --output (json/table)

---

### 4.1 Create version
- API: `POST /entity/{entityType}` (new version on existing root)
- Body: version fields (no root fields like clientCorporation)
- ✅ **DONE** — `bullhorn version create <entityType> [fieldArgs...]` (supports --file, --data, key=value args)

### 4.2 Update specific version
- API: `POST /entity/Location/1234` with `versionId` in body
- ✅ **DONE** — `bullhorn version update <entityType> <entityId> --versionId <vid> [fieldArgs...]` (supports --file, --data, --versionId)

### 4.3 Delete version
- API: `DELETE /entity/Location/1234` with versionId in body
- ✅ **DONE** — `bullhorn version delete <entityType> <entityId> --versionId <vid>` (supports --force, --output)

### 4.4 Get version (today's) with effectiveOn
- API: `GET /entity/Location/1234?fields=...&effectiveOn=2024-12-31`
- ✅ **DONE** — Added `--effectiveOn <date>` flag to `bullhorn get`, `bullhorn search`, `bullhorn query`

### 4.5 Get all versions
- API: `GET /entity/Location/1234/versions?fields=...`
- ✅ **DONE** — `bullhorn version list <entityType> <entityId>` (supports --fields, --output)

### 4.6 Effective-dated entity support in existing commands
- ✅ **DONE** — Added `--effectiveOn <date>` flag to `bullhorn get`, `bullhorn search`, `bullhorn query`
- Effective-dated entities return `changedVersionId` alongside `changedEntityId` (handled by service commands)

**Effective-dated entities include:** Location, LocationGroup, Branch, BranchGroup, CustomObject1-35, and any custom object configured as effective-dated.

---

### 5.1 CorporateUser service
- API: `POST/PUT /services/CorporateUser`
- Added in 2024.11
- ✅ **DONE** — `bullhorn service corporate-user create|update` (supports --file, --data, --output)

### 5.2 CorporateUserDelegation service
- API: `PUT/DELETE /services/CorporateUser/{corporateUserId}/delegation/{delegateId}`
- Added in 2024.12 (PUT) and 2026.5 (DELETE)
- ✅ **DONE** — `bullhorn service corporate-user-delegation set|remove <corpUserId> <delegateId>` (supports --file, --data, --output)

### 5.3 PlacementChangeRequest service
- API: `POST/PUT /services/PlacementChangeRequest` + `approve` sub-endpoint (2024.11)
- ✅ **DONE** — `bullhorn service placement-change-request create|update|approve <id>` (supports --file, --data, --output)

### 5.4 BillableCharge service
- API: `POST/PUT /services/BillableCharge`
- Added in 2024.11
- ✅ **DONE** — `bullhorn service billable-charge create|update <id>` (supports --file, --data, --output)

### 5.5 CustomerRequiredFieldMeta service
- API: `POST /services/CustomerRequiredFieldMeta`
- Added in 2025.3
- ✅ **DONE** — `bullhorn service customer-required-field-meta create` (supports --file, --data, --output)

### 5.6 PlacementCustomerRequiredField service
- API: `POST /services/PlacementCustomerRequiredField`
- Added in 2025.3
- ✅ **DONE** — `bullhorn service placement-customer-required-field create [placementId]` (supports --file, --data, --output)

### 5.7 JobCustomerRequiredField service
- API: `POST /services/JobCustomerRequiredField`
- Added in 2025.3
- ✅ **DONE** — `bullhorn service job-customer-required-field create [jobOrderId]` (supports --file, --data, --output)

### 5.8 PlacementCustomerRequiredFieldConfiguration service
- API: `POST /services/PlacementCustomerRequiredFieldConfiguration`
- Added in 2025.3
- ✅ **DONE** — `bullhorn service placement-crf-config create [placementId]` (supports --file, --data, --output)

### 5.9 JobCustomerRequiredFieldConfiguration service
- API: `POST /services/JobCustomerRequiredFieldConfiguration`
- Added in 2025.3
- ✅ **DONE** — `bullhorn service job-crf-config create [jobOrderId]` (supports --file, --data, --output)

### 5.10 Event Subscriptions (new — Priority 5.10)
- API: `PUT /event/subscription/{subscriptionId}` (create), `GET /event/subscription` (list), `GET /event/subscription/{id}?maxEvents=N` (consume), `DELETE /event/subscription/{id}` (delete)
- Events expire and purge after 7 days; max 15 subscriptions per database; max 100 events per consume call
- ✅ **DONE** — `bullhorn service events subscribe|list|consume|unsubscribe` (supports --entities, --event-types, --max-events, --output, --force)

---

### 6.1 Data Hub — Upsert data
- API: `POST /data-hub/data` (up to 100 records)
- ✅ **DONE** — `bullhorn data-hub upsert` (supports --file, --data, --source-system, --entity-type, --schema-version, key=value records)

### 6.2 Data Hub — Get info
- API: `GET /data-hub/{entityName}/{entityId}`
- ✅ **DONE** — `bullhorn data-hub get <entityName> [entityId]` (supports --output)

### 6.3 Data Hub — Source systems
- API: `POST/PUT /data-hub/sourceSystem` and `GET /data-hub/sourceSystem/{sourceSystemId}`
- ✅ **DONE** — `bullhorn data-hub source-system create|get <sourceSystemId>` (supports --file, --data, --name, --display)

### 6.4 Data Hub — Entity types
- API: `POST/PUT /data-hub/entityType` and `GET /data-hub/entityType/{entityTypeId}`
- ✅ **DONE** — `bullhorn data-hub entity-type create|get <entityTypeId>` (supports --file, --data, --source-system, --name, --display, --private)

### 6.5 Data Hub — Schema versions
- API: `POST/PUT /data-hub/entityTypeSchemaVersion` and `GET /data-hub/entityTypeSchemaVersion/{schemaVersionId}`
- ✅ **DONE** — `bullhorn data-hub schema-version create|get <schemaVersionId>` (supports --file, --data, --entity-type, --source-system, --name, --schema, --description)

---

### 7.1 Bulk operations
```bash
# Bulk update multiple entities
bullhorn bulk-update Candidate --ids 123,456,789 --fields status="Active"
```
- Bullhorn supports massUpdate for Candidate (and possibly others)
- **New command: `bullhorn bulk-update`**
- ✅ **DONE** — `src/commands/bulk-update.js` added, supports `--ids` (required), `-f/--fields`, `-o/--output`

### 7.2 To-one association by ID in create/update
```bash
bullhorn create Candidate owner.id=123 primarySkills.id=456,789
```
- Already works with current key=value parsing for to-one associations
- **No change needed** (already supported)

### 7.3 To-one association by name in create/update
```bash
bullhorn create Candidate owner={id:123}
```
- Bullhorn allows JSON objects for associations
- **Enhancement to create/update parsing**

### 7.4 Layout parameter
```bash
bullhorn get Candidate 123 --layout "CandidateSummary"
```
- API: `GET /entity/Candidate/123?layout=CandidateSummary&fields=...`
- **Add `--layout <name>` option to `bullhorn get`, `bullhorn search`, `bullhorn query`**
- ✅ **DONE** — Added to all 3 commands

### 7.5 showEditable / showReadOnly parameters
```bash
bullhorn get Candidate 123 --show-editable
bullhorn get Candidate 123 --show-read-only
```
- API: `showEditable=true` / `showReadOnly=true`
- **Add flags to `bullhorn get`, `bullhorn search`, `bullhorn query`**
- ✅ **DONE** — Added to all 3 commands

### 7.6 Private label filtering
```bash
bullhorn get Candidate 123 --privateLabelId 5
```
- API: `privateLabelId=5`
- **Add `--privateLabelId <id>` option to `bullhorn get`, `bullhorn search`, `bullhorn query`**
- ✅ **DONE** — Added to all 3 commands

### 7.7 Meta parameter on all queries
```bash
bullhorn get Candidate 123 --meta full
bullhorn search Candidate -q "isDeleted:0" --meta basic
```
- API: `meta=off|basic|full`
- **Add `--meta <level>` option to `bullhorn get`, `bullhorn search`, `bullhorn query`**
- ✅ **DONE** — Added to all 3 commands (default: off)

### 7.8 JSONP support
- API: `callback=myFunction` parameter
- **Add `--jsonp <name>` option to all GET commands**
- ✅ **DONE** — Added to `bullhorn get`, `bullhorn search`, `bullhorn query` (maps to `callback` param)

---

## Missing — Priority 8 (Enhanced Entity List)

The entity reference covers ~150+ entities. Here are the major ones not yet explorable:

### Core Staffing Entities
| Entity | CRUD? | Notes |
|---|---|---|
| Candidate | ✅ | Full CRUD |
| ClientContact | ✅ | Full CRUD |
| JobOrder | ✅ | Full CRUD |
| JobSubmission | ✅ | Full CRUD |
| Placement | ✅ | Full CRUD |
| Lead | ✅ | Full CRUD |
| Opportunity | ✅ | Full CRUD |
| Note | ✅ | Full CRUD |
| Appointment | ✅ | Full CRUD |
| Task | ✅ | Full CRUD |
| Sendout | ✅ | Full CRUD |
| WebResponse | ✅ | Full CRUD |
| Interview | ✅ | Full CRUD |

### Lookup / Reference Entities (read-only, immutable)
| Entity | Notes |
|---|---|
| BusinessSector | Immutable lookup |
| Category | Immutable lookup |
| Country | Immutable lookup |
| Skill | Immutable lookup |
| Specialty | Immutable lookup |
| State | Immutable lookup |
| TimeUnit | Immutable lookup |
| CandidateSource | Immutable lookup |
| CandidateType | Immutable lookup |
| ClientRating | Immutable lookup |
| EmploymentType | Immutable lookup |
| CandidateStatus | Immutable lookup |

### Pay & Bill Entities (new in 2024-2026)
| Entity | Added | Notes |
|---|---|---|
| AccountingPeriod | 2024.6 | Payroll cycle |
| AccountingPeriodSetting | 2026.5 | Payroll settings |
| BillableCharge | 2024.11 | Billable charges |
| BillMaster | 2024.11 | Billing master |
| BillMasterTransaction | 2024.6 | Billing transactions |
| DirectDepositAccount | ✅ | Via `bullhorn service` |
| DirectDepositAccountTypeLookup | 2025.5 | Pay types |
| InvoiceStatement | 2026.5 | Invoicing |
| InvoiceTerm | 2025.5 | Invoice terms |
| PayableCharge | 2024.6 | Payable charges |
| PayBillCycle | 2026.6 | Pay cycles |
| SalesTaxRate | 2024.6 | Sales tax |
| Timesheet | 2026.6 | Timesheet entries |
| TimesheetEntry | 2024.8 | Timesheet line items |

### Custom Objects
| Entity | Notes |
|---|---|
| CustomObject1-35 | Per-deployment, dynamic |

### Data Hub Entities
| Entity | API Path |
|---|---|
| EdsSourceSystem | `/data-hub/sourceSystem` |
| EdsEntityType | `/data-hub/entityType` |
| EdsEntityTypeSchemaVersion | `/data-hub/entityTypeSchemaVersion` |
| EdsData | `/data-hub/data` |

### Activity / Sales Management
| Entity | Notes |
|---|---|
| ActivityGoal | Sales goal tracking |
| ActivityGoalConfiguration | Goal configuration |
| ActivityGoalTarget | Goal assignment |

### Certification Management
| Entity | Notes |
|---|---|
| CandidateCertification | Candidate certs |
| CandidateCertificationRequirement | Required certs |
| Certification | Certification lookup |
| CertificationGroup | Certification groups |
| CertificationFileAttachment | Cert file attachments |
| CertificationRequirement | Unified cert requirements |

### Candidate-specific Sub-entities
| Entity | Notes |
|---|---|
| CandidateAvailability | Date-specific availability |
| CandidateEducation | Education history |
| CandidateReference | References |
| CandidateReferenceQuestion | Reference questions |
| CandidateReferenceResponse | Reference answers |
| CandidateShiftPreference | Shift preferences |
| CandidateTaxInfo | Tax information |
| CandidateWorkHistory | Work history |

### Location / Branch (effective-dated)
| Entity | Notes |
|---|---|
| Location | Effective-dated |
| LocationGroup | Effective-dated |
| Branch | Effective-dated |
| BranchGroup | Effective-dated |

### Other Entities
| Entity | Notes |
|---|---|
| ClientCorporation | Immutable (cannot delete) |
| CorporateUser | Via `bullhorn service` |
| CorporateUserDelegation | Via `bullhorn service` |
| Department | User departments |
| FileAttachment | Via `bullhorn file` |
| NoteEntity | General notes |
| PlacementChangeRequest | Via `bullhorn service` |
| GeneralLedgerAccount | Accounting |
| PayrollClient | Payroll integration |

---

## Implementation Roadmap

### Phase 1 — Core API Gaps (Week 1-2)
- [x] `bullhorn auth login/logout/status` (done)
- [x] `bullhorn get <entityType> <entityId>` (done)
- [x] `bullhorn get <entityType> <entityId> [toManyFieldName]` — to-many association fetch
- [x] `bullhorn associate <entityType> <entityId> <assocField> <ids...>` — create to-many
- [x] `bullhorn disassociate <entityType> <entityId> <assocField> <ids...>` — remove to-many
- [x] `bullhorn soft-delete <entityType> <entityId>` — soft delete via POST
- [x] `bullhorn entitlements <entityType>` — check permissions
- [x] `bullhorn association <entityType> <assocField> --ids <ids>` — bulk association lookup

### Phase 2 — Department / My / Specialized (Week 3-4)
- [x] `bullhorn department <entityType> [options]` — department-scoped queries (subcommands: candidates, client-contacts, placements, notes; supports --fields, --count, --start, --sort, --where, --query, --departmentIds)
- [x] `bullhorn my <entityType> [options]` — user-owned queries (subcommands: candidates, client-contacts, placements, notes; same options)
- [x] `bullhorn all-corp-notes --clientCorpId <id> [options]` — all corporation notes (supports --fields, --layout, --count, --start, --sort)
- [x] `bullhorn login-info <username>` — data center resolution (diagnostics, no auth required)
- [x] `bullhorn file <subcommand>` — file operations (get, upload, attach, detach; supports --fields, --count, --output)
- [x] `bullhorn resume <subcommand>` — resume upload/download (supports --file, --name, --output, --destination)

### Phase 3 — Effective-Dated Entities (Week 5)
- [x] `bullhorn version list <entityType> <entityId>` — list all versions (GET /entity/{entityType}/{entityId}/versions)
- [x] `bullhorn version create <entityType> [fieldArgs...]` — create new version (POST /entity/{entityType}, supports --file, --data)
- [x] `bullhorn version update <entityType> <id> --versionId <vid> [fieldArgs...]` — update version (POST /entity/{entityType}/{id}, supports --file, --data, --versionId)
- [x] `bullhorn version delete <entityType> <id> --versionId <vid>` — delete version (DELETE /entity/{entityType}/{id}, supports --force)
- [x] Add `--effectiveOn <date>` flag to `bullhorn get`, `bullhorn search`, `bullhorn query` (applies to effective-dated entities like Location, Branch, CustomObjects)

### Phase 4 — Business Services (Week 6-7)
- [x] `bullhorn service corporate-user create|update` — CRUD corporate users (2024.11)
- [x] `bullhorn service corporate-user-delegation set|remove` — user delegations (2024.12 PUT, 2026.5 DELETE)
- [x] `bullhorn service placement-change-request create|update|approve` — placement change requests (2024.11)
- [x] `bullhorn service billable-charge create|update` — billable charges (2024.11)
- [x] `bullhorn service customer-required-field-meta create` — custom required field meta (2025.3)
- [x] `bullhorn service placement-customer-required-field create` — placement CRF (2025.3)
- [x] `bullhorn service job-customer-required-field create` — job CRF (2025.3)
- [x] `bullhorn service placement-crf-config create` — placement CRF configuration (2025.3)
- [x] `bullhorn service job-crf-config create` — job CRF configuration (2025.3)
- [x] `bullhorn service events subscribe|list|consume|unsubscribe` — event subscriptions (new)

### Phase 5 — Data Hub (Week 8)
- [x] `bullhorn data-hub upsert` — upsert records (POST /data-hub/data, supports --file, --data, --source-system, --entity-type, --schema-version, key=value records)
- [x] `bullhorn data-hub get <entityName> [entityId]` — retrieve hub info (GET /data-hub/{entityName}/{entityId})
- [x] `bullhorn data-hub source-system create|get <sourceSystemId>` — manage source systems (POST/PUT /data-hub/sourceSystem, GET /data-hub/sourceSystem/{id})
- [x] `bullhorn data-hub entity-type create|get <entityTypeId>` — manage entity types (POST/PUT /data-hub/entityType, GET /data-hub/entityType/{id})
- [x] `bullhorn data-hub schema-version create|get <schemaVersionId>` — manage schema versions (POST/PUT /data-hub/entityTypeSchemaVersion, GET /data-hub/entityTypeSchemaVersion/{id})

### Phase 6 — Enhancements (Week 9)
- [x] Add `--layout <name>` to `bullhorn get`, `bullhorn search`, `bullhorn query`
- [x] Add `--show-editable` / `--show-read-only` flags
- [x] Add `--privateLabelId <id>` flag
- [x] Add `--meta <level>` flag (off/basic/full)
- [x] Add `--jsonp <name>` flag
- [x] Add bulk update support (`bullhorn bulk-update`)

### Phase 7 — Resume Parsing (Week 10)
- [x] `bullhorn resume parse-to-candidate` — parse resume to Candidate/education/work history/skills data (POST /resume/parseToCandidate, supports --file, --name, --populate-description, --output)
- [x] `bullhorn resume parse-to-hrxml` — parse resume to HRXML format (POST /resume/parseToHrXml, supports --file, --name, --output)
- [x] `bullhorn resume parse-to-html` — parse resume to HTML format (POST /resume/parseToHtml, supports --file, --name, --output)
- [x] `bullhorn resume parse-to-text` — parse resume to plain text (POST /resume/parseToText, supports --file, --name, --output)

### Phase 8 — Pay & Bill / Timesheet Entities (Week 11)
- [x] `bullhorn pay-bill accounting-period get [id]` — manage AccountingPeriod entities (payroll cycles, 2024.6)
- [x] `bullhorn pay-bill accounting-period-setting get [id]` — manage AccountingPeriodSetting entities (payroll settings, 2026.5)
- [x] `bullhorn pay-bill bill-master get [id]` — manage BillMaster entities (billing masters, 2024.11)
- [x] `bullhorn pay-bill bill-master-transaction get [id]` — manage BillMasterTransaction entities (billing transactions, 2024.6)
- [x] `bullhorn pay-bill direct-deposit-account-type-lookup get [id]` — manage DirectDepositAccountTypeLookup entities (pay types, 2025.5)
- [x] `bullhorn pay-bill invoice-statement get [id]` — manage InvoiceStatement entities (invoicing, 2026.5)
- [x] `bullhorn pay-bill invoice-term get [id]` — manage InvoiceTerm entities (invoice terms, 2025.5)
- [x] `bullhorn pay-bill payable-charge get [id]` — manage PayableCharge entities (payable charges, 2024.6)
- [x] `bullhorn pay-bill pay-bill-cycle get [id]` — manage PayBillCycle entities (pay cycles, 2026.6)
- [x] `bullhorn pay-bill sales-tax-rate get [id]` — manage SalesTaxRate entities (sales tax, 2024.6)
- [x] `bullhorn pay-bill timesheet get [id]` — manage Timesheet entities (timesheet entries, 2026.6, supports amount field + BigDecimal units)
- [x] `bullhorn pay-bill timesheet-entry get [id]` — manage TimesheetEntry entities (timesheet line items, 2024.8)

---

## Architecture Notes

### Existing patterns to follow:
1. Each CLI command = one file in `src/commands/`
2. Each command exports a `create<Name>Command()` function returning a `Command` instance
3. API calls go through `src/lib/api.js` (axios instance with token interceptor)
4. Auth checks happen in `api.js` — auto-exits if not logged in (except auth/entities commands)
5. Output: table (default) or JSON (`-o json`)
6. Progress: `ora` spinners
7. Colors: `chalk`

### Key files to modify:
- `src/index.js` — register new commands
- `src/lib/api.js` — may need enhancements for new HTTP methods/patterns
- `src/commands/` — new command files

### Dependencies already installed:
- `commander` — CLI framework (already used everywhere)
- `axios` — HTTP client (already used everywhere)
- `chalk` — colors (already used everywhere)
- `cli-table3` — table output (already used everywhere)
- `conf` — config storage (already used for auth)
- `dotenv` — env file loading (already used)
- `inquirer` — interactive prompts (already used)
- `ora` — spinners (already used)

### No new dependencies required — all features use existing stack.
