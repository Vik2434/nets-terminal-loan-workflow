# Deployment Guide

## Recommended Deployment Model

Deploy as a Google Apps Script web app:

- Execute as: `User accessing the web app`
- Access: your Workspace domain

This aligns with the current access-control model, which uses:

- `Session.getActiveUser().getEmail()`
- `User_Roles`
- configured domain checks

## Deployment Steps

1. Complete the setup in [SETUP.md](SETUP.md).
2. Ensure `Config.gs` and the `Config` sheet no longer contain placeholder values.
3. In the Apps Script editor, select `Deploy > New deployment`.
4. Choose `Web app`.
5. Set the execution and access settings.
6. Copy the deployed URL.

## Update Config After Deployment

After the first deployment, update these keys in the `Config` sheet:

- `WEB_APP_URL`
- `APP_URL`
- `REQUEST_URL`
- `TRACK_URL`
- `TECH_URL`
- `APPROVAL_URL`
- `FINANCE_URL`

If you skip this step, direct links in email notifications may still be incomplete or fall back to generated URLs.

## Post-Deployment Checklist

### Access and Routing

- Request page loads for a domain user
- Tracking search page loads for a domain user
- Tech dashboard loads for a tech user
- Approval dashboard loads for an approver
- Finance portal loads for a finance user

### Data

- Request submission writes rows correctly
- Terminal assignment updates both request and terminal records
- Return flow resets the terminal to `Available`
- Workflow log entries are written

### Email

- Request submitted email
- IT / tech notification email
- Assignment email
- Finance notification email
- Completion email

## Optional Trigger

The project includes `sendOverdueLoanReminders()` in [../reminder.gs](../reminder.gs).

If you want reminder automation:

1. Add a time-driven trigger.
2. Choose a schedule that fits your operations.
3. Confirm `WAITLIST_REMINDER_EMAIL` and `REMINDER_COOLDOWN_HOURS`.

## Deployment Safety Tips

- Keep a separate non-production spreadsheet for testing changes.
- Avoid changing the sheet schema manually; prefer `setupNetsLoanForm()`.
- Re-deploy after updating server-side code that affects routing, templates, access control, or email links.

