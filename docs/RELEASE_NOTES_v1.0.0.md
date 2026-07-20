# v1.0.0 — Verified local MVP

Released: 2026-07-20

## Highlights

- Complete provider-isolated recruiter workflow from login through per-target results and analytics
- Deterministic synthetic accounts and publishing progression with OAuth explicitly blocked
- Responsive mobile navigation and corrected 390 px reflow
- Clear safe-demo, provider-capability, follower-delta, and production-boundary language
- Production signing-key/developer-mode guards and password input bounds
- Cross-user authorization coverage for account and post resources
- Upgraded Next.js/Python security dependencies with zero known npm or pip-audit findings
- CI adds dependency audits and the safe-demo browser smoke

## Verification

- 19 API tests passed
- frontend lint and production static build passed
- bundled Chromium workflow and responsive audit passed
- tracked release archive secret scan found no leaks
- walkthrough: 245.368 seconds, 1280×720, VP9 + Opus, captions, thumbnail, SHA-256 `ec54b7e7f19fff9ba0f7bd843b801b6e36a41a951a8fd653ad034f4d2298e9e1`

## External gates

Live OAuth and provider publishing were not verified. Provider consoles, credentials, sandbox approvals, hosting, domains, monitoring, token rotation/revocation, and retention policy remain owner actions.
