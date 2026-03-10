# Deployment

## Recommended Settings

- Deploy as a web app
- Execute as `User accessing the web app`
- Limit access to your Workspace domain
- Keep the current flat Apps Script file naming intact

## After Deploying

Update the `Config` sheet:

- `WEB_APP_URL`
- `APP_URL`
- page URLs

This project does not use Apps Script script properties. Runtime values live in the spreadsheet `Config` sheet instead.

## Optional Trigger

Create a time-driven trigger for `sendOverdueLoanReminders()` if you want overdue notifications.

Full deployment checklist: [../DEPLOYMENT.md](../DEPLOYMENT.md)

Apps Script runtime details: [Apps Script](Apps-Script.md)
