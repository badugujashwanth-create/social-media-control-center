# Social Media Control Center case study

## Product problem

Publishing one update across multiple networks looks simple until OAuth scopes, content capabilities, rate limits, token expiry, retries, and provider-specific errors become part of the workflow. A UI that reports one global success hides the most important operational truth: each provider can finish differently.

## Approach

SMCC separates the web experience, application API, queued work, and provider connectors. One post creates a target per selected account. The API validates ownership and connector capabilities before persistence. Workers update each target independently and preserve attempts, errors, and external identifiers.

The core public workflow is deliberately narrow and complete: authenticate, inspect connected-account capabilities, compose text/link content, publish to explicit targets, monitor status progression, and review conservative analytics.

## Engineering decisions

- Backend-only provider credentials with Fernet-encrypted token storage
- Connector contract to isolate provider differences
- PostgreSQL records for durable post and per-target state
- Redis/RQ jobs with bounded retry intervals
- Terminal states for failure, rate limit, and reauthentication instead of endless spinners
- User-scoped queries and explicit cross-user authorization tests
- Production startup guards for signing secrets and developer mode
- A separate provider-isolated demo process instead of fake live-provider success

## Product design changes

The visual system stayed intact: the same sky palette, cards, typography, controls, and navigation structure remain. The completion pass added a clear product statement, visible form labels, a primary compose path, safe-demo disclosure, capability language, status badges, keyboard focus, reduced motion, and a mobile menu. The 390 px dashboard went from 490 px root width to 390 px without horizontal overflow.

## Verification

- 19 API tests
- clean frontend lint and production build
- zero known npm or Python dependency vulnerabilities
- authorization, unsafe-production-config, OAuth, worker, upload, analytics, and demo-isolation coverage
- full Chromium workflow with no non-local HTTP requests
- 245.368-second narrated/captioned walkthrough with 10 inspected frames

## Honest outcome

The repository demonstrates a secure local MVP and a credible provider boundary. It does not prove approved provider apps, live publishing, production scale, retention policy, or hosted observability. Instagram remains a stub and image publishing remains disabled for the three visible connectors.

## Next engineering steps

1. Validate each connector against an approved sandbox and store redacted contract fixtures.
2. Add idempotency keys, dead-letter inspection, and queue metrics.
3. Add cursor pagination and asset lifecycle controls.
4. Verify token rotation/revocation and deletion/retention behavior in a staged deployment.
5. Run cross-browser and assistive-technology audits.
