# Development guide

## Purpose

Full-stack control center for composing, scheduling, publishing, and analyzing social content through pluggable connectors.

## Prerequisites

Next.js/TypeScript, FastAPI/Python, SQLAlchemy, Redis/RQ, PostgreSQL, MinIO.

## Install

```powershell
Frontend: npm ci in apps/web; API: pip install -r apps/api/requirements.txt
```

## Run

```powershell
Run the FastAPI service, worker dependencies, and Next.js web app as documented in the README
```

## Verify

- Tests: `API pytest; web ESLint`
- Build: `npm run build in apps/web`

See [TEST_REPORT.md](TEST_REPORT.md) for the latest audited results. Copy example environment files instead of committing real values. Generated dependencies, caches, logs, databases, and build output must remain untracked.

