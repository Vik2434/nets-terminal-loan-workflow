# Installation

## Prerequisites

- Google Workspace access
- A Google Spreadsheet
- Optional `clasp` for local development

## Installation Steps

1. Create a spreadsheet for the workflow.
2. Create or connect an Apps Script project.
3. Add the repository source files.
4. Replace the placeholder spreadsheet ID in `Config.gs`.
5. Run `setupNetsLoanForm()`.
6. Update the generated `Config` and `User_Roles` sheets.

## Optional clasp Setup

1. Copy `.clasp.json.example` to `.clasp.json`.
2. Replace `YOUR_SCRIPT_ID`.
3. Push with `clasp push`.

For more detail, see [../SETUP.md](../SETUP.md).

