## RCP Solutions LLC Bullhorn CLI tool
### Lawrence Ham 

## 1. Research Findings & Core API Concepts

A review of the [Bullhorn REST API Documentation](https://bullhorn.github.io/rest-api-docs/) reveals several key concepts that will dictate our application's architecture.

### a. Authentication: OAuth 2.0
*   **Method:** Bullhorn uses OAuth 2.0. For a CLI, the **Password Grant Flow** is the most practical approach. While the documentation cautions against it for third-party apps, it is suitable for a trusted, first-party tool where the user is directly providing their credentials to their own machine.
*   **Process:**
    1.  User provides Username, Password, Client ID, and Client Secret.
    2.  The CLI makes a `POST` request to `https://auth.bullhornstaffing.com/oauth/token` with these credentials.
    3.  The API returns an `access_token` (called `BhRestToken`), a `refresh_token`, and, crucially, a `restUrl`.
*   **Key Challenge:** The `restUrl` is dynamic (e.g., `https://rest{swimlane}.bullhornstaffing.com/rest-services/{corpToken}/`). It is **not** a static URL. All subsequent API calls must use this `restUrl` as their base.
*   **Token Management:** The `BhRestToken` expires. The CLI must securely store the `BhRestToken`, `restUrl`, and `refresh_token` and use the `refresh_token` to get a new session when the old one expires.

### b. API Interaction
*   **Entities:** The API is structured around entities like `Candidate`, `JobOrder`, `ClientContact`, `Placement`, etc. These will map directly to our CLI commands.
*   **Standard Operations:**
    *   **GET `/entity/{EntityType}/{id}`:** Fetch a single record.
    *   **POST `/entity/{EntityType}`:** Create a new record.
    *   **POST `/entity/{EntityType}/{id}`:** Update an existing record. (Note: Bullhorn uses POST for updates, not PUT/PATCH).
    *   **DELETE `/entity/{EntityType}/{id}`:** Delete a record.
*   **Data Extraction (Search & Query):**
    *   **GET `/search/{EntityType}` or `/query/{EntityType}`:** These are the most powerful endpoints for extraction. The `search` endpoint is generally preferred as it supports more complex queries.
    *   **Parameters:** Critical query parameters include `fields` (to specify which fields to return), `where` (for filtering using Lucene-like syntax), `count`, and `start` (for pagination).

## 2. Technology Stack

We will use modern, well-supported Node.js libraries to build a robust and maintainable CLI.

*   **Core:** Node.js v22
*   **Command Framework:** [**Commander.js**](https://github.com/tj/commander.js) - A complete and popular solution for building complex command-line interfaces.
*   **HTTP Client:** [**Axios**](https://axios-http.com/) - Promise-based HTTP client for making requests to the Bullhorn API. Its interceptors are perfect for handling authentication and token refreshing automatically.
*   **Configuration Management:** [**Conf**](https://github.com/sindresorhus/conf) - For securely storing user credentials and session tokens in the appropriate user-level config directory for each OS (e.g., `~/.config/` on Linux). This is far superior to `.env` files for a distributable CLI.
*   **User Interaction:** [**Inquirer**](https://github.com/SBoudrias/Inquirer.js) - For creating interactive prompts, essential for the `login` command.
*   **CLI UX/UI:**
    *   [**Chalk**](https://github.com/chalk/chalk) - For adding color and style to terminal output, improving readability.
    *   [**Ora**](https://github.com/sindresorhus/ora) - To display elegant spinners during long-running operations like API calls.
*   **Data Formatting:** [**console.table**](https://developer.mozilla.org/en-US/docs/Web/API/console/table) (built-in) or a more advanced library like `cli-table3` for displaying search results in a clean, tabular format.

## 3. Project Structure

A modular structure will keep the codebase organized and scalable.

```
bullhorn-cli/
├── bin/
│   └── bh.js             # The executable entry point.
├── src/
│   ├── commands/         # Each command gets its own file.
│   │   ├── login.js
│   │   ├── get.js
│   │   ├── search.js
│   │   └── create.js
│   ├── lib/              # Core logic and helpers.
│   │   ├── api.js        # The Axios-based API client wrapper.
│   │   ├── auth.js       # Handles the entire auth and token refresh flow.
│   │   └── config.js     # Manages the `conf` store.
│   └── index.js          # Main Commander.js setup, ties commands together.
├── package.json
└── README.md
```

## 4. Proposed Command Structure & User Experience (UX)

The CLI will be invoked as `bh`. The structure should be intuitive and REST-like.

**`bh <command> <subcommand> [args] [options]`**

*   **Authentication:**
    *   `bh login`: Prompts the user interactively for their credentials and stores the session.
    *   `bh logout`: Clears the stored credentials and session.
    *   `bh status`: Checks if the user is logged in and displays session info.

*   **Read Operations (Data Extraction):**
    *   `bh get <entityType> <entityId>`: Fetches a single entity.
        *   _Example:_ `bh get Candidate 12345 --fields="id,name,email"`
        *   _Example:_ `bh get JobOrder 54321 -o json` (output as raw JSON)
    *   `bh search <entityType>`: Searches for entities based on a query.
        *   _Example:_ `bh search Candidate --where="isDeleted:0 AND name:John*"`
        *   _Example:_ `bh search JobOrder --fields="id,title,isOpen" --count=20 --sort="title"`

*   **Write Operations:**
    *   `bh create <entityType> --<field>="<value>"`: Creates a new entity.
        *   _Example:_ `bh create Candidate --firstName="Jane" --lastName="Doe" --email="jane.doe@example.com"`
    *   `bh update <entityType> <entityId> --<field>="<value>"`: Updates an entity.
        *   _Example:_ `bh update Candidate 12345 --email="new.email@example.com"`
    *   `bh delete <entityType> <entityId>`: Deletes an entity.
        *   _Example:_ `bh delete Note 98765 --force`

## 5. Phased Development Plan

We will build the CLI in logical, iterative phases.

### Phase 1: The Foundation - Authentication & Configuration

**Goal:** Establish a persistent, authenticated session with the Bullhorn API. This is the bedrock of the entire application.

1.  **Setup Project:** Initialize the Node.js project, install base dependencies (`commander`, `axios`, `conf`, `inquirer`, `chalk`).
2.  **Config Store:** Implement `src/lib/config.js` using `conf` to create a schema for storing `BhRestToken`, `restUrl`, `refreshToken`, etc.
3.  **Login Command:** Build the `bh login` command in `src/commands/login.js`. It will use `inquirer` to prompt for username, password, client ID, and secret.
4.  **Auth Logic:** Implement `src/lib/auth.js` to handle the OAuth token request. On success, it will save the tokens and `restUrl` to the config store.
5.  **API Client:** Create the initial `src/lib/api.js`. This module will configure a global Axios instance. It should:
    *   Read the `restUrl` and `BhRestToken` from the config store.
    *   Automatically set the `baseURL` to `restUrl`.
    *   Add an `Authorization` header with the `BhRestToken` to every request.

### Phase 2: Core Read Operations - "Extract"

**Goal:** Deliver the primary user value: extracting data from Bullhorn.

1.  **`get` Command:** Implement `bh get <entity> <id>`. This command will use the configured Axios client to make a simple GET request. It should handle displaying the result, potentially as formatted JSON.
2.  **`search` Command:** Implement `bh search <entity>`. This is the most important command.
    *   Parse options for `fields`, `where`, `count`, `start`, and `sort`.
    *   Construct the query parameters and make the request.
    *   Implement output formatting. By default, use `console.table` for a clean view. Add an `--output json` (or `-o json`) flag to dump the raw JSON response.
3.  **Add UX Polish:** Integrate `ora` spinners to show activity while the API calls are in flight. Use `chalk` for colored success/error messages.

### Phase 3: Write Operations - "Perform Other Actions"

**Goal:** Enable users to create, update, and delete data.

1.  **`create` Command:** Implement `bh create <entity>`. This command will need to dynamically build a request body from the provided flags (e.g., `--firstName="John"`).
2.  **`update` Command:** Implement `bh update <entity> <id>`. Similar to `create`, it will build a request body from flags.
3.  **`delete` Command:** Implement `bh delete <entity> <id>`. This is a straightforward DELETE request. Add a `--force` flag or an interactive confirmation prompt to prevent accidental deletions.

### Phase 4: Advanced Features & Refinements

**Goal:** Make the tool more robust and powerful.

1.  **Automatic Token Refresh:** Enhance the Axios client in `src/lib/api.js`. Use Axios interceptors to catch 401 Unauthorized errors. When a 401 occurs, the interceptor should:
    *   Pause the original request.
    *   Use the stored `refresh_token` to get a new `BhRestToken`.
    *   Update the config store with the new token.
    *   Retry the original, failed request with the new token.
2.  **Complex Input:** For `create` and `update`, add a `--from-file <path.json>` option to allow passing complex JSON objects as the request body.
3.  **Global Error Handling:** Implement a centralized error handler that catches API errors and displays them to the user in a friendly format.
4.  **Help & Documentation:** Ensure every command and option has thorough help text using Commander's `.description()` and `.option()` methods.

### Phase 5: Packaging & Distribution

**Goal:** Make the CLI easily installable for end-users.

1.  **Executable Script:** In `bin/bh.js`, add the shebang `#!/usr/bin/env node`.
2.  **`package.json`:**
    *   Add a `bin` field: `"bin": { "bh": "./bin/bh.js" }`.
    *   Add `"type": "module"` to use ES Module syntax.
3.  **Local Installation:** Users can `npm link` the project during development to test the `bh` command globally.
4.  **Publishing:** The package can be published to a private or public NPM registry, allowing users to install it via `npm install -g bullhorn-cli`.

This comprehensive strategy provides a clear roadmap from initial research to a fully-featured, distributable CLI tool for the Bullhorn REST API.
