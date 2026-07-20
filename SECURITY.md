# Security policy

## Supported status

Social Media Control Center is maintained as a portfolio project. Real OAuth and publishing require provider-owned credentials, review, and sandbox validation; Instagram remains a stub.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature when it is enabled. Otherwise, contact the repository owner through an existing verified GitHub contact channel. Do not include secrets, access tokens, private URLs, or personal data in a public issue.

## Configuration rules

- Keep real credentials in local environment files or an external secret manager.
- Commit only placeholder values in `.env.example` files.
- Rotate any credential that was previously committed; deleting it from the current branch does not remove Git history.
- Use synthetic or public sample data for tests, screenshots, and recordings.
- Set `ENVIRONMENT=production`, use a unique signing key of at least 32 characters, and keep `DEV_MODE=false` in production. Startup rejects unsafe combinations.
- Treat the local safe demo as synthetic evidence only. It blocks OAuth and does not import provider connectors.

## Verified controls and remaining gates

The release tests password hashing, token encryption, OAuth configuration, cross-user authorization, job-state transitions, safe-demo isolation, and production configuration guards. Dependency and tracked-file secret scans are clean for the release candidate.

Production still requires provider scope review, secret rotation/revocation, upload scanning/limits, retention and deletion rules, monitoring, incident response, and staged live-provider validation.

No response-time or production support commitment is implied.
