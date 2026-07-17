# Social Media Control Center case study

## 1. Project summary

Social Media Control Center is a monorepo for composing, scheduling, publishing, and analyzing social content through explicit provider connectors. It combines a Next.js web application, FastAPI service, PostgreSQL, Redis/RQ workers, and local object-storage support.

## 2. Problem being solved

Content teams often coordinate drafts, schedules, provider accounts, publishing jobs, and analytics in disconnected tools. Provider-specific OAuth and API behavior make a unified workflow difficult to test and maintain.

## 3. Target users

- Small content or marketing teams
- Operators scheduling posts across supported connectors
- Developers adding or testing provider adapters

## 4. Why existing approaches are insufficient

Direct provider calls from a UI entangle credentials, publishing rules, retries, and presentation. A durable system needs an API boundary, queued work, connector contracts, and explicit token handling.

## 5. Product approach

The web client manages content and account workflows. FastAPI validates requests and coordinates persistence. Background workers handle scheduled or retryable jobs. Each network provider implements a connector boundary so OAuth and publishing behavior do not leak across the application.

## 6. System architecture

The Next.js client calls the FastAPI API. PostgreSQL stores application state; Redis/RQ coordinates background jobs; MinIO-compatible storage supports local media workflows. OAuth callbacks and provider connectors are configured through environment values. See [ARCHITECTURE.md](ARCHITECTURE.md).

## 7. Main engineering decisions

- Isolate provider behavior behind a connector contract.
- Keep OAuth tokens and secrets in backend configuration rather than browser code.
- Use queued workers for scheduled and retryable operations.
- Provide Compose-oriented local dependencies without treating local credentials as production secrets.
- Demonstrate the product safely without real publishing accounts.

## 8. Difficult technical challenges

- Normalizing different provider authorization and publishing contracts
- Validating callback URLs and state without exposing tokens
- Coordinating scheduled jobs, retries, and application status
- Keeping the frontend useful when live provider approval is unavailable

## 9. How those challenges were solved

The API owns redirect validation, state, connector selection, and error mapping. Background execution is separated from request handling. The demo and tests use safe boundaries rather than fabricated successful provider publishing.

## 10. Security and privacy considerations

OAuth credentials and tokens must remain backend secrets. Redirect URIs must match configured public endpoints, and logs must not contain tokens. Real deployments need encrypted token storage, provider scope review, rate limiting, deletion/retention controls, and incident handling. The current video does not use a real account.

## 11. Testing strategy

Eleven API tests pass, the web lint command passes, and the Next.js production build completes. Current tests cover the verified API/configuration behavior; live provider contracts require approved sandbox accounts or mocked contract fixtures.

## 12. Performance considerations

Queued work prevents long provider calls from blocking interactive requests. Scaling would require measuring queue latency, provider rate limits, database contention, media size, and retry behavior. No production throughput claim is made.

## 13. Current limitations

- Real OAuth/provider approval and publishing were not verified.
- The video shows the real entry surface, not a fabricated provider success.
- Production token encryption, rate limits, monitoring, and retention policy need deployment-specific work.
- Connector contract and worker integration tests should be expanded.

## 14. Results demonstrated

The repository demonstrates a coherent full-stack monorepo, provider connector architecture, background-job boundary, 11 passing API tests, clean web lint, a successful production build, CI, and a captioned application video.

## 15. What the developer learned

External integrations should be designed as failure-prone boundaries. Authentication, retries, scopes, and provider-specific responses need explicit contracts rather than optimistic UI assumptions.

## 16. Next engineering steps

1. Add mocked contract tests for every connector and OAuth callback.
2. Add encrypted token storage and rotation/revocation workflows.
3. Add queue observability, idempotency keys, and retry/dead-letter policies.
4. Add rate limiting and media validation before any public deployment.
5. Run an approved sandbox end-to-end test for each provider.
