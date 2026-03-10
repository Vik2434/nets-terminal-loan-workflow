# Setup Guide

This guide walks a new maintainer through setting up the workflow from scratch.

## Prerequisites

- Google Workspace access with permission to create Sheets and Apps Script projects
- A Google Spreadsheet to hold workflow data
- Optional: [`clasp`](https://github.com/google/clasp) for local source control and deployment

## Setup Options

### Option A: Apps Script Editor

1. Create a new Google Spreadsheet.
2. Open `Extensions > Apps Script`.
3. Add the repository files to the Apps Script project.
4. Replace the placeholder spreadsheet ID in `Config.gs`.
5. Save the project.

Use this option if you want a container-bound Apps Script project. In that model, the code can fall back to `SpreadsheetApp.getActiveSpreadsheet()` during setup.

### Option B: Local Development with clasp

1. Clone this repository locally.
2. Copy `.clasp.json.example` to `.clasp.json`.
3. Replace `YOUR_SCRIPT_ID` with the Apps Script project ID.
4. Replace the placeholder spreadsheet ID in `Config.gs`.
5. Push with `clasp push`.

Use this option if you want a standalone Apps Script project managed from source control. In that model, `NLF.SS_ID` must point to the spreadsheet the app should use.

## First-Time Configuration

Before running the app in a real environment:

1. Open [Config.gs](../Config.gs).
2. Replace:
   - `YOUR_SPREADSHEET_ID`
   - any placeholder publication defaults you want to change before setup
3. Save the project.

If you plan to keep the script container-bound, you can still leave the placeholder temporarily and rely on the active spreadsheet fallback during initial setup.

## Run Initial Setup

From the Apps Script editor:

1. Select `setupNetsLoanForm`.
2. Run it once.
3. Authorize the script if prompted.

This creates or repairs the following sheets:

- `Requests`
- `Terminals`
- `Workflow_Log`
- `Config`
- `Email_Log`
- `User_Roles`

## Replace Sample Values

After setup, open the spreadsheet and update:

### Config Sheet

- `DOMAIN`
- `WEB_APP_URL`
- `APP_URL`
- page URLs
- tech, finance, approver, and admin recipients
- optional requester CC and reminder settings

### User_Roles Sheet

Replace the example rows with your real users and roles.

## Verify the Spreadsheet

Run `checkNetsHeaders()` if you want to confirm the sheet headers match the expected schema.

## Smoke Test Checklist

Use a safe test environment first.

1. Open `?page=request` and submit a test request.
2. Open `?page=track` and verify tracking by Request ID.
3. Open `?page=tech` with a tech user and assign a terminal.
4. Open `?page=finance` with a finance user.
5. Open `?page=approval` with an approver if approval-required flow is needed.
6. Mark a request returned and confirm terminal reset behavior.

## Optional Trigger Setup

If you want overdue reminders:

1. Create a time-driven trigger for `sendOverdueLoanReminders`.
2. Choose an interval appropriate for your support model.
3. Verify `REMINDER_COOLDOWN_HOURS` in the `Config` sheet.

There are no required script properties for this repository. The project uses the `Config` sheet instead of `PropertiesService`.
