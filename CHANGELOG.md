# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses calendar-based release notes rather than strict semantic versioning.

## [Unreleased]

### Planned
- Optional automated test harness for Apps Script service functions.
- Additional setup validation for placeholder configuration values.

## [2026-03-11] Public Repository Preparation

### Added
- Public-safe repository metadata, governance files, and issue templates.
- Full setup, configuration, deployment, usage, architecture, troubleshooting, and onboarding documentation.
- Wiki-ready markdown pages under `docs/wiki/`.
- Example configuration files for clasp, the Config sheet, and the User_Roles sheet.
- Minimal `appsscript.json` manifest for version-controlled Apps Script deployments.

### Changed
- Sanitized spreadsheet IDs, deployment URLs, domains, seeded recipients, seeded role rows, and runtime branding.
- Reworked default configuration values to use public-safe placeholders and reserved example domains.
- Added placeholder-aware runtime guards for spreadsheet IDs, page URLs, and email recipients.

### Removed
- Local-only screenshots, spreadsheet export files, macOS metadata files, and unused legacy prototype folders.

