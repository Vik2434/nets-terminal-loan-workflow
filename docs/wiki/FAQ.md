# FAQ

## Is this repository ready to run as-is?

No. It is sanitized for public sharing. Replace placeholder IDs, URLs, domains, and users first.

## Where do I change recipients?

In the `Config` sheet, not in the page templates.

## Where do I change access roles?

In the `User_Roles` sheet.

## Can I use clasp with this repository?

Yes. Start from `.clasp.json.example`.

## Is this repository already structured like a typical clasp `src/` project?

No. It uses the raw Apps Script file layout in the repository root. That is the safe choice for this codebase because HtmlService includes and template routing depend on the current filenames.

## Why are the Apps Script files still flat in the root folder?

To preserve HtmlService template names and avoid breaking existing Apps Script compatibility.

## What creates the sheets?

`setupNetsLoanForm()` in `Setup.gs`.

## Does this project require Script Properties?

No. The current implementation uses `Config.gs`, the spreadsheet `Config` sheet, and the `User_Roles` sheet instead of `PropertiesService`.

