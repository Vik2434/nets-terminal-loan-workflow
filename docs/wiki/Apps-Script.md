# Apps Script

## Detected Repository Style

This project is a raw Apps Script source repository with optional `clasp` support.

- Active `.gs` and `.html` files live in the repository root
- HtmlService templates are loaded by filename
- Wrapper files with spaces in their names are retained for backward compatibility
- `.clasp.json.example` is provided for teams that want to deploy with `clasp`

## Why the Flat File Layout Is Preserved

The current naming matters because:

- `include('Styles')` and `include('Scripts')` depend on existing HTML filenames
- `pageToTemplate_()` in `Code.gs` maps page routes directly to template names
- changing filenames casually would break routing or HtmlService includes

## Spreadsheet Binding

The app connects to Sheets in this order:

1. `NLF.SS_ID` from `Config.gs`
2. `SpreadsheetApp.getActiveSpreadsheet()` as a container-bound fallback

That means the same codebase can be used as:

- a standalone Apps Script project pointing to a spreadsheet by ID
- a container-bound Apps Script project attached directly to the spreadsheet

## Script Properties

This codebase does not require `PropertiesService`.

Configuration lives in:

- `Config.gs`
- the spreadsheet `Config` sheet
- the spreadsheet `User_Roles` sheet

## Main Triggers

- `onOpen()` adds the spreadsheet menu
- `doGet(e)` serves the web app
- `sendOverdueLoanReminders()` is optional and must be created as a time-driven trigger if you want reminder automation

## Web App Deployment

Recommended settings:

- Execute as: `User accessing the web app`
- Access: your Workspace domain

After deploying:

1. copy the deployed URL
2. update `WEB_APP_URL`
3. update `APP_URL`
4. update all page URLs in the spreadsheet `Config` sheet

## Optional clasp Use

If you want to use `clasp`:

1. copy `.clasp.json.example` to `.clasp.json`
2. replace `YOUR_SCRIPT_ID`
3. run `clasp push`

Do not move the active runtime files into a nested source directory unless you are intentionally restructuring the whole project.

