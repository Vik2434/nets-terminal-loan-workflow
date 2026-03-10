# Usage Guide

## Requester Flow

1. Open the request page.
2. Complete requester details, request reason, dates, budget information, and acknowledgements.
3. Submit the request.
4. Use the tracking link or Request ID to monitor progress.

## Tracking Flow

1. Open the tracking page.
2. Enter the Request ID.
3. Review:
   - request summary
   - workflow progress
   - request details
   - assignment information
   - timeline history

## Tech / IT Flow

1. Open the IT dashboard with a tech-enabled user.
2. Review the pending queue.
3. Select a request.
4. Choose an available terminal.
5. Assign the terminal.
6. Mark collection and return events as needed.

## Approval Flow

Approval is used when a request requires the waitlist / approval route.

1. Open the approval dashboard with an approver-enabled user.
2. Review pending approval requests.
3. Approve to move the request into the tech queue, or reject the request.

## Finance Flow

Finance is read-only.

1. Open the finance portal with a finance-enabled user.
2. Filter by division, terminal, or search input.
3. Open request details for budget visibility.

## Admin Flow

Admins are responsible for:

- running `setupNetsLoanForm()` for initial setup or repair
- updating `Config`
- maintaining `User_Roles`
- confirming deployment URLs
- verifying email routing and reminder configuration

## Safe Testing Sequence

Use this order when validating a fresh environment:

1. Submit a request
2. Track the request
3. Assign a terminal
4. Confirm finance visibility
5. Open the confirmation/detail page
6. Mark the request returned / completed

