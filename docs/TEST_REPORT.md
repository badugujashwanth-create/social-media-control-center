# Test report

Audited on 2026-07-20 on Windows using the release candidate working tree. GitHub Actions reruns API, web, dependency, and safe-demo checks on the release branch and pull request.

| Command | Result | Evidence |
|---|---|---|
| `apps/api: python -m pytest -q` | Pass | 19 tests in 6.18 s |
| `apps/api: python -m pip_audit -r requirements.txt` | Pass | No known vulnerabilities |
| `apps/web: npm audit --audit-level=moderate` | Pass | 0 vulnerabilities |
| `apps/web: npm run lint` | Pass | No ESLint errors |
| `apps/web: npm run build` | Pass | Next.js 16.2.10 static production export; 10 application routes plus not-found |
| `social-walkthrough.spec.ts` smoke | Pass | Complete provider-isolated workflow in bundled Chromium; zero external HTTP requests |
| `social-audit.spec.ts` | Pass | Desktop and 390×844 mobile captures; no root overflow |
| `social-workflow.spec.ts` | Pass | Compose → publishing → three terminal results → analytics; mobile navigation/focus/reduced motion |
| Gitleaks current diff and tracked release archive | Pass | No leaks found |

## Test coverage by risk

- Authentication hashing and invalid-hash handling
- Signup/login/me API flow and input bounds
- Cross-user account, post-target, read, and disconnect authorization
- Production configuration rejects unsafe signing secrets and developer mode
- Fernet token encryption/decryption
- OAuth scopes, callbacks, state error handling, and production redirect validation
- Connector publish contract with mocked HTTP
- Worker success, retry, and rate-limit state transitions
- Upload boundary with a fake object store
- Dashboard, analytics, and follower snapshot endpoints
- Deterministic demo isolation, authentication, publishing progression, and blocked OAuth
- Responsive reflow, mobile navigation, keyboard focus, Escape close, and reduced motion

## Evidence limits

No test in this report contacts Facebook, LinkedIn, X, Instagram, MinIO, Redis, or PostgreSQL as a live hosted service. The SQLite/fake-queue/fake-storage tests prove application contracts, not vendor approval or production operations. Cross-browser and screen-reader testing remain future work.
