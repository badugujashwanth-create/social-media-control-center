# Social Media Control Center narration

This is Social Media Control Center, shown in a safe local walkthrough. The banner is the first product boundary: every account, publishing result, identifier, and chart in this recording is synthetic. The demo API is deterministic, resets at sign-in, blocks OAuth starts, and never imports or calls a social provider. This lets us inspect the real application workflow without presenting a fabricated live integration.

After sign-in, the unified dashboard summarizes three simulated accounts, two recent posts, and token-health status. The primary action leads directly to composition, while account management and delivery history stay one click away. Credentials remain behind the API boundary; the browser stores only the short-lived application session token used by this isolated demo.

The Accounts view makes the external-service boundary visible again. LinkedIn, X, and Facebook examples declare their supported capabilities and synthetic source. OAuth controls are intentionally disabled here. A real deployment would require provider approval, exact callback configuration, minimal scopes, token encryption, revocation handling, and account-specific validation before any live publishing claim could be made.

The composer is the central workflow. It shows a content limit, an optional link, media capability guidance, and the exact selected targets. Connector capability checks run in both the interface and API so unsupported payloads cannot rely on a disabled button alone. In this walkthrough, all three synthetic accounts support text and links but not image publishing.

The release update is now ready. Post to All creates one application post plus a separate target record for each account. That per-target model is deliberate: a slow or failed provider should not hide successful delivery elsewhere. The browser moves to history immediately, where every target first shows publishing rather than an optimistic success state.

The deterministic worker simulation completes each target and returns visibly synthetic external identifiers. The application polls only while work is non-terminal, then stops when every provider reaches success, failure, rate-limited, or reauthentication-required status. No provider endpoint was contacted to produce these results.

Historical evidence also shows a Facebook target that succeeded on its second attempt. In the real worker, transient provider and rate-limit failures can be requeued within a bounded attempt policy, while authentication and invalid-payload errors move to explicit terminal states. Tests cover success, rate limiting, and cross-user resource boundaries.

Analytics is intentionally conservative. Daily post counts come from application records. Follower charts represent snapshot deltas only, and the interface states that they are not a claim about individual unfollowers. Availability is connector-specific because official APIs do not expose the same follower data on every network.

The repository now verifies nineteen API tests, a production frontend build, lint, the full Chromium workflow, mobile reflow, keyboard focus, reduced motion, dependency audits, and a tracked-file secret scan. These checks support a secure local MVP and portfolio demonstration, not production scale, provider approval, or universal connector coverage.

The completed flow returns to the dashboard with the same three-account workspace. The defensible product story is straightforward: compose once, keep provider credentials and failures behind explicit boundaries, and inspect every delivery result. Live OAuth, provider sandbox verification, hosting credentials, retention policy, and operational monitoring remain honest human and deployment gates.
