# Social Media Control Center interview guide

## Tell me about this project.

It is a Next.js/FastAPI monorepo for composing, scheduling, and analyzing social content through connector and background-worker boundaries.

## Why did you build it?

Provider APIs fragment OAuth, publishing, retries, media rules, and analytics. The project creates one operational model without putting provider secrets in the browser.

## What was your contribution?

Discuss the integrated web/API/worker structure, connector contract, OAuth configuration validation, tests, documentation, and safe demo. Do not claim that real provider publishing was completed without approved account evidence.

## What was the hardest technical problem?

Normalizing provider behavior while preserving provider-specific scopes, callback validation, errors, and rate limits.

## How does the architecture work?

Next.js calls FastAPI; PostgreSQL stores state; Redis/RQ handles scheduled jobs; MinIO-compatible storage supports local media; provider adapters own OAuth/publishing details.

## What would you improve?

Add connector contract fixtures, encrypted token storage, idempotency, dead-letter handling, queue observability, rate limiting, and approved sandbox end-to-end tests.

## How did you test it?

Eleven API tests, web lint, and the production web build pass. No live provider success is fabricated in the video.

## What are its security limitations?

OAuth tokens require encrypted storage and strict scopes. Redirect URIs, logs, media validation, deletion/retention, rate limits, and account revocation need deployment review.

## How would you scale it?

Scale API and workers separately, partition queues by provider/work type, enforce idempotency, respect provider quotas, store media externally, and add queue/database observability.

## What did you learn?

External integrations should be modeled as unreliable contracts, with retries, scopes, errors, and security boundaries visible in the architecture.
