# Architecture

## Overview

This application is a Google Apps Script web app backed by Google Sheets. The runtime uses HtmlService templates for the UI and server-side `.gs` files for data access, workflow logic, access control, and email notifications.

## Main Components

| Area | Files | Responsibility |
| --- | --- | --- |
| Routing and boot | `Code.gs`, `AccessDenied.html`, `ErrorPage.html` | `doGet`, page selection, boot payload, page-level access checks |
| Configuration | `Config.gs`, `Setup.gs` | bootstrap constants, config lookup, sheet setup, config seeding |
| Shared helpers | `Util.gs`, `Data.gs`, `Styles.html`, `Scripts.html` | formatting, normalization, memoized sheet reads, role parsing, shared UI behavior |
| Request flow | `Index.html`, `request.gs` | request form, validation, request submission, request summary |
| Tracking flow | `Track.html`, `TrackView.html`, `tracking.gs` | tracking search, request detail lookup, history rendering, reminder/cancel actions |
| Tech flow | `TechDashboard.html`, `admin.gs`, `availability.gs` | assignment queue, terminal availability, assignment, collection, return, terminal status |
| Approval flow | `ApprovalDashboard.html`, `approval.gs` | approval-required queue and decision handling |
| Finance flow | `FinancePortal.html`, `finance.gs` | read-only finance view and filtering |
| Notifications | `email.gs`, `reminder.gs` | transactional email generation and reminder sending |
| Workflow utilities | `workflow.gs`, `WebApp.gs`, `Flow.gs` | status transition helper and backward-compatible wrappers |

## Spreadsheet Model

The project expects these sheets:

| Sheet | Purpose |
| --- | --- |
| `Requests` | Main request records and workflow state |
| `Terminals` | Authoritative terminal inventory and status |
| `Workflow_Log` | Request lifecycle audit trail |
| `Config` | Runtime configuration, URLs, recipients, feature flags |
| `Email_Log` | Basic email audit log |
| `User_Roles` | Role-based access control |

## Runtime Flow

```mermaid
flowchart TD
  Browser["User opens web app URL"] --> doGet["Code.gs doGet()"]
  doGet --> boot["buildBoot_()"]
  boot --> access["hasPageAccess_()"]
  access -->|allowed| Page["HtmlService template"]
  access -->|denied| Denied["AccessDenied.html"]

  Page --> Client["Page JavaScript"]
  Client --> Api["google.script.run API call"]
  Api --> Service["request.gs / tracking.gs / admin.gs / approval.gs / finance.gs"]
  Service --> Data["Data.gs sheet helpers"]
  Data --> Sheets["Google Sheets"]
  Service --> Email["email.gs / MailApp"]
```

## Request Lifecycle

```mermaid
flowchart LR
  Submitted["Submitted"] --> PendingIT["Pending Tech Assignment"]
  Submitted --> PendingApproval["Pending Approval"]
  PendingApproval --> PendingIT
  PendingIT --> Assigned["Assigned"]
  Assigned --> Ready["Ready for Collection"]
  Ready --> OnLoan["On Loan"]
  OnLoan --> Completed["Completed"]
```

Notes:

- The exact status values preserve some backward-compatible aliases.
- Finance visibility is driven by request state plus assignment context.

## Access-Control Flow

```mermaid
flowchart TD
  User["Session.getActiveUser().getEmail()"] --> Domain["isAllowedDomainEmail_()"]
  Domain --> Roles["getUserAccessProfile_()"]
  Roles --> RequestPage["request / track pages"]
  Roles --> TechPage["tech page -> IsTech or IsAdmin"]
  Roles --> ApprovalPage["approval page -> IsApprover or IsAdmin"]
  Roles --> FinancePage["finance page -> IsFinance or IsAdmin"]
```

## Email Flow

```mermaid
flowchart TD
  Submit["apiSubmitRequest"] --> SubmitEmail["notifySubmission_()"]
  Submit --> ApprovalEmail["notifyApprovalRequired_()"]
  Assign["apiAssignTerminal"] --> AssignEmail["notifyAssignment_()"]
  Assign --> FinanceEmail["notifyFinanceAssignment_()"]
  Approve["apiApproveRequest / apiRejectRequest"] --> DecisionEmail["notifyApprovalDecision_()"]
  Return["apiMarkReturned"] --> ReturnEmail["notifyReturned_()"]
  Reminder["sendOverdueLoanReminders / apiSendReminder"] --> ReminderEmail["notifyReminder_()"]
```

## Important Compatibility Notes

- `Config.gs` preserves legacy config keys such as `TECH_EMAILS` and `FINANCE_EMAILS`.
- `Setup.gs` preserves mixed request-column aliases for backward compatibility.
- The root wrapper templates with spaces in their filenames still exist intentionally as compatibility shims.

## External Services Used

- `SpreadsheetApp`
- `HtmlService`
- `MailApp`
- `LockService`
- `Session`
- `ScriptApp`
- `Utilities`

