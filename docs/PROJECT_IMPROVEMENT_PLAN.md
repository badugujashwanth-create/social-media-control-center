# Project Improvement Plan

## Current state

The product has a real API/web split, connector abstraction, scheduling and job state, and 11 meaningful API tests. Live publishing cannot be represented as universally verified.

## Findings

- **Works:** content workflow, connector boundary, queue/state transitions, errors, web build/lint, and safe demo evidence.
- **Does not / missing:** comprehensive role permissions, rich asset lifecycle, real-provider rate-limit testing, and end-to-end browser automation.
- **UX / architecture:** coherent workflow; provider capabilities and simulated actions need persistent labels.
- **Testing / security:** API tests are useful. OAuth scopes, token storage, authorization, and replay behavior need provider-specific review before real accounts are enabled.
- **Performance / docs / demo:** unbounded history could eventually need pagination. Docs/video are strong; provider credentials are the live-demo blocker.

## Recommendations

### Critical

- Preserve the explicit separation between synthetic demo actions and real publishing.
- Keep CI on API tests plus frontend lint/build; fail clearly when credentials are absent.

### High value

- Add a browser smoke test for create, approve/schedule, status progression, and failure recovery.
- Add authorization tests if multi-user roles become public.

### Optional

- Add bounded analytics and asset search after core scheduling evidence is stable.

## Delivery constraints

- **Priority:** demo honesty and core workflow; **complexity:** medium; **dependencies:** Node and optional authorized provider sandboxes.
- **Acceptance:** core CI passes, demo never contacts providers, live integrations are accurately labeled, and no token is committed.
- **Excluded:** claiming every social network, automated real posting from portfolio CI, and vanity analytics.
