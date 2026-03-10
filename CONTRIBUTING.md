# Contributing

Thanks for contributing to this repository.

## Ground Rules

- Do not commit live spreadsheet IDs, deployed Apps Script URLs, real recipient lists, or internal domains.
- Keep the root Apps Script source layout intact unless there is a strong compatibility reason to change it.
- Prefer small, reviewable changes over broad rewrites.
- Update documentation when changing workflow behavior, setup requirements, or configuration keys.

## Recommended Workflow

1. Create a feature branch from the default branch.
2. Update placeholder configuration locally before testing.
3. Validate the relevant Apps Script files with local syntax checks.
4. Run `setupNetsLoanForm()` in a safe spreadsheet if your change affects schema or config seeding.
5. Smoke test the relevant page or API flow before opening a pull request.

## Local Development

This project is designed for Google Apps Script.

- Use the Apps Script editor directly, or
- Use `clasp` with `.clasp.json.example` as the starting point.

## Pull Request Expectations

- Describe the problem being solved.
- List the user/admin flows tested.
- Mention any Config sheet or User_Roles changes.
- Call out any backward-compatibility risks.

## Documentation Expectations

If you change any of the following, update the docs in `docs/`:

- Setup steps
- Config keys
- Sheet schema
- Email behavior
- Access control behavior
- Deployment requirements

