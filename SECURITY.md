# Security Policy

## Supported Use

This repository is intended as a reusable Google Apps Script workflow template.
Before deploying, replace all placeholder IDs, URLs, domains, and email addresses with your own environment values.

## Reporting a Vulnerability

If you discover a security issue:

1. Do not open a public issue with exploit details.
2. Contact the repository maintainer privately through your preferred security contact channel.
3. Include reproduction steps, impact, and any recommended mitigation.

## Secrets and Sensitive Data

The public repository must never contain:

- Live spreadsheet IDs
- Deployed Apps Script URLs
- Script IDs
- Webhook URLs
- API keys or tokens
- Real recipient lists
- Internal-only domains

Before publishing changes, run a final scan for:

- `SpreadsheetApp.openById(...)`
- `https://script.google.com`
- real email addresses
- internal domains
- placeholder values that still need replacing locally

