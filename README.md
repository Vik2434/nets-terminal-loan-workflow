# NETS Terminal Loan Workflow

A Google Apps Script web application for managing a shared NETS terminal request-and-return workflow with Google Sheets, HtmlService pages, role-based access, and transactional email notifications.

This repository has been sanitized for public sharing. All environment-specific IDs, URLs, domains, and recipients have been replaced with safe placeholders or reserved example values.

## Purpose

This project supports a lightweight internal workflow for shared payment terminals:

1. A requester submits a terminal loan request.
2. IT / operations staff assign an available terminal.
3. Finance receives read-only visibility after assignment.
4. Requesters track the request by Request ID.
5. IT marks the terminal as returned and closes the request.

## Core Features

- Request form with validation, acknowledgements, and half-day timing support
- Request tracking by Request ID
- IT dashboard for assignment, status updates, and return handling
- Approval dashboard for waitlist / approval-required cases
- Finance dashboard for read-only budget visibility
- Confirmation / detail page for request summaries
- Role-based access using the `User_Roles` sheet
- Config-driven email notifications with HTML transactional templates
- Setup and repair routine for spreadsheet schema

## Tech Stack

- Google Apps Script (V8 runtime)
- Google Sheets as the primary data store
- HtmlService for page rendering
- MailApp for notifications
- LockService for write-path coordination
- Optional `clasp` workflow for source control and deployment

## Repository Structure

The flat root file layout is intentional. Apps Script template includes and runtime file names depend on the current naming convention.

```text
.
├── Code.gs                      # doGet routing, page boot payload
├── Config.gs                    # project constants, config access, spreadsheet bootstrap
├── Util.gs                      # shared formatting, URL, email, and validation helpers
├── Data.gs                      # sheet access, normalization, lookup, and role parsing
├── Setup.gs                     # initial sheet/config/role/terminal setup and repair
├── request.gs                   # request submission and confirmation-detail backend
├── tracking.gs                  # tracking search and request history backend
├── admin.gs                     # tech dashboard and assignment/return backend
├── approval.gs                  # approval dashboard backend
├── finance.gs                   # finance dashboard backend
├── availability.gs              # date-range and terminal availability checks
├── workflow.gs                  # workflow transition helpers
├── email.gs                     # HTML email generation and notification routing
├── reminder.gs                  # overdue reminder trigger entry point
├── WebApp.gs                    # backward-compatible wrapper functions
├── Index.html                   # request page
├── Track.html                   # tracking search page
├── TrackView.html               # tracking result page
├── TechDashboard.html           # IT dashboard
├── ApprovalDashboard.html       # approval dashboard
├── FinancePortal.html           # finance dashboard
├── ConfirmationPage.html        # request detail / confirmation page
├── Styles.html                  # shared UI styles
├── Scripts.html                 # shared client helpers
├── examples/                    # sample config and User_Roles CSVs
├── docs/                        # setup, architecture, deployment, usage docs
├── .github/                     # issue templates and PR template
├── .clasp.json.example          # sample clasp configuration
└── appsscript.json              # Apps Script manifest
```

## Quick Start

1. Create a new Google Spreadsheet for the workflow data.
2. Create a Google Apps Script project and add these files, or clone the repo and use `clasp`.
3. Replace the placeholder spreadsheet ID in `Config.gs`.
4. Run `setupNetsLoanForm()` once.
5. Update the generated `Config` and `User_Roles` sheets with your real values.
6. Deploy the project as a web app.
7. Update the page URLs in the `Config` sheet after deployment.

Detailed instructions:

- [docs/SETUP.md](docs/SETUP.md)
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Configuration Guide

There are two configuration layers:

- `Config.gs`
  - contains repository-safe bootstrap defaults such as `YOUR_SPREADSHEET_ID`
  - should be updated before the first real deployment
- `Config` sheet
  - becomes the runtime source of truth for URLs, recipients, reminder behavior, and related settings

Examples:

- [examples/config-sheet.example.csv](examples/config-sheet.example.csv)
- [examples/user-roles.example.csv](examples/user-roles.example.csv)
- [.clasp.json.example](.clasp.json.example)

## Deployment Guide

Recommended deployment settings:

- Execute as: `User accessing the web app`
- Access: your Workspace domain only

After deploying:

1. Copy the deployment URL into `WEB_APP_URL` and `APP_URL`.
2. Update `REQUEST_URL`, `TRACK_URL`, `TECH_URL`, `APPROVAL_URL`, and `FINANCE_URL`.
3. Test each page with a real role-mapped user.
4. Add an optional time-driven trigger for `sendOverdueLoanReminders`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full checklist.

## Usage Guide

- Requesters use the request form and tracking pages.
- Tech users work from the IT dashboard.
- Approvers handle waitlist / approval-required requests.
- Finance users review the finance portal only after assignment.
- Admins manage setup, config, roles, and deployment URLs.

See [docs/USAGE.md](docs/USAGE.md).

## Screenshots

This public repository does not include real production screenshots.

Suggested additions if you want to publish visuals later:

- Request form
- Tracking result page
- IT dashboard
- Finance portal
- Approval dashboard

## Security Note

- This repository must not contain live spreadsheet IDs, deployed Apps Script URLs, or real recipient lists.
- Placeholder email values are intentionally treated as non-deliverable until replaced.
- Review [SECURITY.md](SECURITY.md) before making the repository public.

## Known Limitations

- Google Sheets is the primary datastore, so large datasets can still increase Apps Script execution time.
- There is no automated test suite in the repository yet.
- Some legacy compatibility wrapper files remain intentionally to avoid breaking older template references.
- Request status aliases are still preserved for backward compatibility with older sheet columns.

## Future Improvement Ideas

- Add automated Apps Script smoke tests
- Add CI checks for placeholder leakage before release
- Split the project into a `clasp`-friendly source tree with build tooling if a larger refactor is acceptable
- Add admin reporting and operational metrics

## Maintenance Notes

- Update recipients and page URLs in the `Config` sheet, not in the page templates.
- Keep `NLF.FIELD` aliases in `Config.gs` aligned with any sheet schema changes.
- Treat `Setup.gs` as the source of truth for sheet headers and sample seed values.
- Avoid deleting legacy wrapper files unless you have verified no existing links depend on them.

## Additional Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [docs/ONBOARDING.md](docs/ONBOARDING.md)
- [docs/wiki/Home.md](docs/wiki/Home.md)

## Credits

Prepared as a reusable public template for Google Apps Script workflow maintenance and long-term version control.

