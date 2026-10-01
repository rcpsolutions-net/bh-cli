# bullhorn-cli (bh-cli) — Capabilities & API Endpoints

Base URL resolved per data center via `loginInfo` (e.g. `https://rest.bullhornstaffing.com/rest-services/`) · OAuth 2.0 bearer token (`auth login`, auto-refresh) · 27 top-level commands.

## auth / system

| Command | Endpoint |
|---|---|
| `auth login` | GET `rest.bullhornstaffing.com/rest-services/loginInfo` → POST `{oauthUrl}/token` → POST `{restUrl}/login` (stored locally) |
| `auth logout` / `auth status` | local config only |
| `test` | local only |

## get

| Command | Endpoint |
|---|---|
| `get <entity> <id>` | GET `/entity/{type}/{id}` |
| `get <entity> <id> <toMany>` | GET `/entity/{type}/{id}/{toMany}s` |

## search / query

| Command | Endpoint |
|---|---|
| `search <entity> -q <lucene>` | GET `/search/{type}` |
| `query <entity> -w "<sql>"` | GET `/query/{type}` |

## create / update / delete

| Command | Endpoint |
|---|---|
| `create <entity> k=v...` | POST `/entity/{type}` |
| `update <entity> <id> k=v...` | POST `/entity/{type}/{id}` (Bullhorn uses POST for updates) |
| `delete <entity> <id>` | DELETE `/entity/{type}/{id}` |
| `soft-delete <entity> <id>` | POST `/entity/{type}/{id}` (`isDeleted: true`) |

## associations & permissions

| Command | Endpoint |
|---|---|
| `associate <entity> <id> <field> <ids...>` | PUT `/entity/{type}/{id}/{field}/{ids}` |
| `disassociate <entity> <id> <field> <ids...>` | DELETE `/entity/{type}/{id}/{field}/{ids}` |
| `association <entity> <field> --ids <ids>` | POST `/association/{type}/{field}` |
| `entitlements <entity>` | GET `/entitlements/{type}` |

## scoped queries

| Command | Endpoint |
|---|---|
| `department <candidates\|client-contacts\|placements\|notes>` | GET `/department{Entity}s/` |
| `my <candidates\|client-contacts\|placements\|notes>` | GET `/my{Entity}s/` |
| `all-corp-notes --clientCorpId <id>` | GET `/allCorpNotes/` |
| `login-info <username>` | GET `rest.bullhornstaffing.com/rest-services/loginInfo?username=` (no auth) |

## metadata

| Command | Endpoint |
|---|---|
| `meta <entity>` | GET `/meta/{type}` |
| `entities` | local relationship flowchart (no API call) |

## file

| Command | Endpoint |
|---|---|
| `file get <entity> <id>` | GET `/entity/{type}/{id}/fileAttachments` |
| `file get <entity> <id> <fileId>` | GET `/file/{type}/{id}/{fileId}` (download) |
| `file upload <entity> <id>` | PUT `/file/{type}` |
| `file attach <entity> <id> <fileId>` | PUT `/entity/{type}/{id}/fileAttachments/{fileId}` |
| `file detach <entity> <id> <fileId>` | DELETE `/entity/{type}/{id}/fileAttachments/{fileId}` |

## resume

| Command | Endpoint |
|---|---|
| `resume upload <entity> <id>` | POST `/resume/{type}/{id}` |
| `resume download <entity> <id>` | GET `/resume/{type}/{id}` |
| `resume parse-to-candidate` | POST `/resume/parseToCandidate` |
| `resume parse-to-hrxml` | POST `/resume/parseToHrXml` |
| `resume parse-to-html` | POST `/resume/parseToHtml` |
| `resume parse-to-text` | POST `/resume/parseToText` |

## service (business services)

| Command | Endpoint |
|---|---|
| `service direct-deposit get <candidateId>` | GET `/query/DirectDepositAccount` |
| `service direct-deposit update [candidateId]` | PUT or POST `/services/DirectDepositAccount` |
| `service call <name>` | GET/PUT/DELETE/POST `/services/{name}` |
| `service corporate-user create` | POST `/services/CorporateUser` |
| `service corporate-user update <id>` | PUT `/services/CorporateUser/{id}` |
| `service corporate-user-delegation set <userId> <delegateId>` | POST `/services/CorporateUser/{id}/delegation/{delegateId}` |
| `service corporate-user-delegation remove <userId> <delegateId>` | DELETE `/services/CorporateUser/{id}/delegation/{delegateId}` |
| `service placement-change-request create` | POST `/services/PlacementChangeRequest` |
| `service placement-change-request update <id>` | PUT `/services/PlacementChangeRequest/{id}` |
| `service placement-change-request approve <id>` | POST `/services/PlacementChangeRequest/{id}/approve` |
| `service billable-charge create` | POST `/services/BillableCharge` |
| `service billable-charge update <id>` | PUT `/services/BillableCharge/{id}` |
| `service customer-required-field-meta create` | POST `/services/CustomerRequiredFieldMeta` |
| `service placement-customer-required-field create` | POST `/services/PlacementCustomerRequiredField` |
| `service job-customer-required-field create` | POST `/services/JobCustomerRequiredField` |
| `service placement-crf-config create` | POST `/services/PlacementCustomerRequiredFieldConfiguration` |
| `service job-crf-config create` | POST `/services/JobCustomerRequiredFieldConfiguration` |
| `service events subscribe <id>` | PUT `/event/subscription/{id}` |
| `service events list` | GET `/event/subscription` |
| `service events consume <id>` | GET `/event/subscription/{id}` |
| `service events unsubscribe <id>` | DELETE `/event/subscription/{id}` |

## version (effective-dated entities)

| Command | Endpoint |
|---|---|
| `version list <entity> <id>` | GET `/entity/{type}/{id}/versions` |
| `version create <entity> k=v...` | POST `/entity/{type}` |
| `version update <entity> <id> --versionId <vid>` | POST `/entity/{type}/{id}` |
| `version delete <entity> <id> --versionId <vid>` | DELETE `/entity/{type}/{id}` (versionId in body) |

## data-hub

| Command | Endpoint |
|---|---|
| `data-hub upsert` | POST `/data-hub/data` (≤100 records) |
| `data-hub get <entityName> [id]` | GET `/data-hub/{entityName}[/{id}]` |
| `data-hub source-system create` | POST `/data-hub/sourceSystem` |
| `data-hub source-system get <id>` | GET `/data-hub/sourceSystem/{id}` |
| `data-hub entity-type create` | POST `/data-hub/entityType` |
| `data-hub entity-type get <id>` | GET `/data-hub/entityType/{id}` |
| `data-hub schema-version create` | POST `/data-hub/entityTypeSchemaVersion` |
| `data-hub schema-version get <id>` | GET `/data-hub/entityTypeSchemaVersion/{id}` |

## bulk-update

| Command | Endpoint |
|---|---|
| `bulk-update <entity> --ids <ids> k=v...` | POST `/massUpdate/{type}/{ids}` |

## pay-bill (12 entity groups)

| Command | Endpoint |
|---|---|
| `pay-bill <entity> get [id]` | GET `/entity/{Entity}/{id}` or GET `/query/{Entity}` |

Entities: `accounting-period`, `accounting-period-setting`, `bill-master`, `bill-master-transaction`, `direct-deposit-account-type-lookup`, `invoice-statement`, `invoice-term`, `payable-charge`, `pay-bill-cycle`, `sales-tax-rate`, `timesheet`, `timesheet-entry`

## help

| Command | Endpoint |
|---|---|
| `help` / `help --entities` / `help <Entity>` | local reference (203 entity types) |
