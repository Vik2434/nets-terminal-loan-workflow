# Configuration Guide

## Configuration Layers

This project uses two configuration layers:

1. `Config.gs`
   - bootstrap defaults
   - spreadsheet ID
   - repository-safe placeholder values
2. `Config` sheet
   - runtime source of truth for URLs, recipients, domain, and feature flags

## Required Replacements Before Real Use

### In Config.gs

Replace:

- `NLF.SS_ID`
- any remaining placeholder publication defaults you do not want seeded into the spreadsheet

### In the Config Sheet

Replace:

- `DOMAIN`
- `WEB_APP_URL`
- `APP_URL`
- `REQUEST_URL`
- `TRACK_URL`
- `TECH_URL`
- `APPROVAL_URL`
- `FINANCE_URL`
- all recipient email values

## Important Config Keys

| Key | Required | Purpose |
| --- | --- | --- |
| `DOMAIN` | Yes | Allowed sign-in domain for request and protected pages |
| `WEB_APP_URL` | Yes | Base deployed web app URL |
| `APP_URL` | Recommended | Backward-compatible runtime base URL |
| `REQUEST_URL` | Recommended | Direct request-form link |
| `TRACK_URL` | Recommended | Direct tracking-page link |
| `TECH_URL` | Recommended | Direct IT dashboard link |
| `APPROVAL_URL` | Recommended | Direct approval dashboard link |
| `FINANCE_URL` | Recommended | Direct finance dashboard link |
| `IT_RECIPIENTS` | Yes | IT notification recipients |
| `TECH_EMAILS` | Optional | Legacy tech-recipient compatibility key |
| `DEFAULT_TECH_EMAIL` | Recommended | Fallback tech owner |
| `FINANCE_RECIPIENTS` | Yes | Finance notification recipients |
| `FINANCE_EMAILS` | Optional | Legacy finance-recipient compatibility key |
| `FINANCE_EMAIL` | Optional | Single-recipient compatibility value |
| `APPROVER_EMAIL_TEST` | Yes | Approval destination for TEST mode |
| `APPROVER_EMAIL_LIVE` | Yes | Approval destination for LIVE mode |
| `APPROVER_MODE` | Yes | `TEST` or `LIVE` |
| `ADMIN_EMAILS` | Yes | Admin users with full access |
| `REQUESTER_CC` | Optional | CC recipients for requester-facing emails |
| `WAITLIST_REMINDER_EMAIL` | Optional | Waitlist reminder fallback recipient |
| `REMINDER_COOLDOWN_HOURS` | Optional | Cooldown between reminders |
| `ALLOW_REQUESTER_CANCEL` | Optional | Enables requester cancellation from tracking |

## User_Roles Sheet

The runtime expects the following header structure:

| Column | Purpose |
| --- | --- |
| `Email` | User email used for matching |
| `Name` | Display name |
| `IsAdmin` | Full access |
| `IsTech` | Tech / IT dashboard access |
| `IsApprover` | Approval dashboard access |
| `IsFinance` | Finance portal access |
| `Active` | Enables or disables the user |
| `Notes` | Freeform administrative note |

## Access Rules

- Request page: any signed-in user from the configured domain
- Track pages: any signed-in user from the configured domain
- Tech page: `IsAdmin` or `IsTech`
- Approval page: `IsAdmin` or `IsApprover`
- Finance page: `IsAdmin` or `IsFinance`

## Placeholder Behavior

The repository uses reserved example values such as:

- `YOUR_SPREADSHEET_ID`
- `https://script.google.com/macros/s/YOUR_WEBAPP_DEPLOYMENT_ID/exec`
- `admin@your-domain.example`

These placeholders are intentionally non-operational:

- placeholder spreadsheet IDs will not open a live spreadsheet
- placeholder page URLs fall back to generated URLs where possible
- placeholder email addresses are intentionally normalized away and ignored by recipient resolution

This prevents accidental use of public template values in a live environment.

## Example Files

- [../examples/config-sheet.example.csv](../examples/config-sheet.example.csv)
- [../examples/user-roles.example.csv](../examples/user-roles.example.csv)

