# Troubleshooting

## Access Denied on Finance / Approval / Tech Pages

Check:

- the user is signed in with the configured domain
- the `User_Roles` row has the correct email
- `Active` is set to `Y`
- the relevant `IsTech`, `IsApprover`, or `IsFinance` flag is enabled

## Spreadsheet Not Configured

If you see errors about setup or spreadsheet access:

- replace `YOUR_SPREADSHEET_ID` in [../Config.gs](../Config.gs), or
- bind the Apps Script project to a spreadsheet before running setup

## Email Links Point to the Wrong Place

Verify the `Config` sheet:

- `WEB_APP_URL`
- `APP_URL`
- `REQUEST_URL`
- `TRACK_URL`
- `TECH_URL`
- `APPROVAL_URL`
- `FINANCE_URL`

## Emails Are Not Sending

Check:

- MailApp authorization has been granted
- recipient values in `Config` are real emails, not placeholders
- `APPROVER_MODE` is set correctly
- the request is reaching the expected notification trigger

## Setup Ran but Sheets Still Look Wrong

Run:

- `setupNetsLoanForm()`
- `checkNetsHeaders()`

Also verify that the spreadsheet referenced by `Config.gs` is the one you intended to use.

## Tracking Result Is Blank or Says Request Not Found

Check:

- the Request ID format (`REQ-YYYYMMDD-XXXXX`)
- the request exists in `Requests`
- the URL includes `requestId`
- the `Workflow_Log` sheet is present

## IT Queue Looks Empty

Check:

- the request status was written correctly
- the request is within the statuses consumed by `apiGetTechDashboardData`
- the current user has `IsTech` or `IsAdmin`

## Finance Portal Has No Rows

Check:

- the current user has `IsFinance` or `IsAdmin`
- the relevant requests match the statuses used by `apiGetFinancePortalData`
- assigned terminal / budget data exists in `Requests`

## Placeholder Values Still Show Up

Search for:

- `YOUR_`
- `your-domain.example`

Then replace those values in:

- `Config.gs`
- the `Config` sheet
- `User_Roles`
- `.clasp.json` if using clasp

