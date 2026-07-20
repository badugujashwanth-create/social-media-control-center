# Development and setup

## Prerequisites

- Python 3.13
- Node.js 22 and npm
- Docker Compose for PostgreSQL, Redis, and MinIO
- Playwright bundled Chromium for browser verification
- FFmpeg only when producing a release video

## Install

```powershell
python -m pip install -r apps/api/requirements.txt
npm ci --prefix apps/web
```

## Full local stack

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Generate a Fernet key:

   ```powershell
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

3. Set a unique `SECRET_KEY` of at least 32 characters.
4. Keep `ENVIRONMENT=development`; set `DEV_MODE=true` only when manual synthetic token entry is intentionally needed.
5. Start dependencies from `infra` with `docker compose up -d`.
6. From `apps/api`, run `alembic upgrade head`, then `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.
7. Start `rq worker -u redis://localhost:6379/0 publish snapshot`.
8. Set `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000` and run `npm run dev -- --port 3000` from `apps/web`.

## Provider-isolated demo

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\record-demo.ps1 -SmokeOnly -SkipBrowserInstall
```

The command builds production assets and owns/cleans up its local processes. It never reads a provider credential.

## Verify

```powershell
cd apps/api
python -m pytest -q
python -m pip_audit -r requirements.txt

cd ..\web
npm audit --audit-level=moderate
npm run lint
npm run build
npm run test:e2e
```

The E2E command requires the safe demo API and static server. The recorder handles those services automatically.

## Production rules

- `ENVIRONMENT=production`
- unique `SECRET_KEY` with at least 32 characters
- generated Fernet `TOKEN_ENCRYPTION_KEY`
- `DEV_MODE=false`
- exact deployed frontend/API origins and callback URLs
- managed PostgreSQL, Redis, and object storage
- external secret manager, rotation/revocation process, logs/metrics, retention/deletion policy, and provider approval

Do not copy local MinIO defaults or placeholder provider values into production.
