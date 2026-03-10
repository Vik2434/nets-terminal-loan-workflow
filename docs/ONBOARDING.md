# Maintainer Onboarding

## What This Project Is

This repository is a Google Apps Script workflow for shared NETS terminal requests, assignment, tracking, approval handling, finance visibility, and completion.

## Configure These First

1. `Config.gs`
   - replace `YOUR_SPREADSHEET_ID`
2. Spreadsheet `Config` sheet
   - replace domain, page URLs, and all recipient values
3. Spreadsheet `User_Roles` sheet
   - replace the example rows with real users

## Most Important Files

- [../Code.gs](../Code.gs): routing and page boot
- [../Config.gs](../Config.gs): runtime constants and config helpers
- [../Data.gs](../Data.gs): sheet access, normalization, and role parsing
- [../Setup.gs](../Setup.gs): schema setup and default seeding
- [../request.gs](../request.gs): request submission
- [../admin.gs](../admin.gs): IT dashboard actions
- [../tracking.gs](../tracking.gs): tracking and reminders
- [../email.gs](../email.gs): notification templates and recipient routing

## Safe First Test

1. Run `setupNetsLoanForm()`.
2. Replace placeholder values in `Config` and `User_Roles`.
3. Submit a request from the request page.
4. Assign a terminal from the tech dashboard.
5. Confirm tracking and finance visibility.
6. Mark the request returned.

## What Not to Edit Casually

- `NLF.FIELD` aliases in `Config.gs`
- `normalizeRequest_()` in `Data.gs`
- `seedConfig_()` and `seedRoles_()` in `Setup.gs`
- page template names used by `pageToTemplate_()` in `Code.gs`
- role parsing and access helpers in `Data.gs`

## When a Change Needs Extra Care

Take extra care when changing:

- sheet headers
- request status values
- role logic
- email recipient logic
- direct page URLs

Those areas affect multiple pages and workflows at once.

## Manual Release Checklist

- No placeholder IDs or URLs remain in the live environment
- No real secrets remain in the public repository
- All protected pages were tested with the right roles
- Email links open the correct deployed pages
- Terminal status and workflow log writes were verified

