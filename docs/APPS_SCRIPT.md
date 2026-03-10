# Apps Script Deployment Notes

## Detected Project Style

This project is a raw Apps Script source tree with optional `clasp` support.

Evidence in the repository:

- root-level `.gs` and `.html` files are the active runtime files
- HtmlService uses filename-based includes such as `include('Styles')` and `include('Scripts')`
- routing maps directly to template filenames in `Code.gs`
- `.clasp.json.example` exists, but there is no transformed `src/` build layout

This means the safest maintenance model is:

- keep the active source files in the repository root
- use `clasp` only as a transport/deployment tool, not as a reason to reorganize the file tree

## Naming and Manifest Behavior

Required file naming matters in this project because:

- `include(filename)` in `Code.gs` expects matching Apps Script HTML filenames
- `pageToTemplate_()` returns template names such as `Index`, `Track`, `TrackView`, `TechDashboard`, `ApprovalDashboard`, `FinancePortal`, and `ConfirmationPage`
- wrapper files such as `Request.html` and `Terminal Loan Request.html` are backward-compatible aliases

Keep these files named exactly as they are unless you are prepared to update:

- `Code.gs`
- any `include(...)` usage
- backward-compatible wrapper templates

The repository includes [appsscript.json](../appsscript.json) with:

- `runtimeVersion: V8`
- `exceptionLogging: STACKDRIVER`
- web app settings for domain access and user-executed requests

## Spreadsheet Connection Model

The spreadsheet binding is handled in [Config.gs](../Config.gs) and [Setup.gs](../Setup.gs).

Runtime order:

1. If `NLF.SS_ID` is set to a real value, the app uses `SpreadsheetApp.openById(...)`.
2. If `NLF.SS_ID` is still a placeholder, it falls back to `SpreadsheetApp.getActiveSpreadsheet()`.

This supports two deployment patterns:

### Standalone Script

- script is not bound to a spreadsheet
- `NLF.SS_ID` must be replaced with a real spreadsheet ID

### Container-Bound Script

- script is attached directly to the spreadsheet
- `NLF.SS_ID` may remain a placeholder during initial setup
- `SpreadsheetApp.getActiveSpreadsheet()` becomes the fallback source

## Config vs Script Properties

This project does **not** currently use `PropertiesService`.

There are no required script properties for the current codebase.

Environment-specific values are stored in:

- [Config.gs](../Config.gs) for bootstrap placeholders
- the spreadsheet `Config` sheet for runtime values
- the spreadsheet `User_Roles` sheet for access control

This is intentional and should be documented clearly for future maintainers.

## Setup Flow

Initial setup entry point:

- `setupNetsLoanForm()` in [Setup.gs](../Setup.gs)

What it does:

- ensures required sheets exist
- seeds headers
- seeds canonical terminal inventory
- seeds `Config`
- seeds `User_Roles`

Recommended first-run sequence:

1. replace `YOUR_SPREADSHEET_ID` if using a standalone script
2. run `setupNetsLoanForm()`
3. update `Config` sheet values
4. replace example `User_Roles`
5. deploy the web app

## Web App Deployment

Entry point:

- `doGet(e)` in [Code.gs](../Code.gs)

Recommended deployment settings:

- Execute as: `User accessing the web app`
- Access: your Workspace domain

Why:

- the app relies on `Session.getActiveUser().getEmail()`
- access checks use the configured domain and the `User_Roles` sheet

After deployment:

1. copy the deployed URL
2. update `WEB_APP_URL`
3. update `APP_URL`
4. update the page-specific URL keys

## Triggers Used

### Simple Trigger

- `onOpen()` in [Code.gs](../Code.gs)
  - adds the custom spreadsheet menu

### Web App Trigger

- `doGet(e)` in [Code.gs](../Code.gs)
  - serves request, tracking, tech, approval, finance, and confirmation pages

### Optional Time-Driven Trigger

- `sendOverdueLoanReminders()` in [reminder.gs](../reminder.gs)
  - not automatic unless you create the trigger manually

No installable trigger is required for core request submission or dashboard actions. Those run from user-initiated web app requests.

## Optional clasp Workflow

If you want to manage the project with `clasp`:

1. copy `.clasp.json.example` to `.clasp.json`
2. replace `YOUR_SCRIPT_ID`
3. run `clasp push`
4. use `clasp deploy` or the Apps Script UI for deployment management

Because this repository uses the raw root layout, do not set `rootDir` to a nested folder unless you also restructure the project deliberately.

## Safe Configuration Section

Before any real deployment, replace all placeholders:

- `YOUR_SPREADSHEET_ID`
- `YOUR_SCRIPT_ID`
- `YOUR_WEBAPP_DEPLOYMENT_ID`
- `your-domain.example`
- all example email recipients

Runtime-safe placeholders are documented in:

- [../Config.gs](../Config.gs)
- [../examples/config-sheet.example.csv](../examples/config-sheet.example.csv)
- [../examples/user-roles.example.csv](../examples/user-roles.example.csv)

