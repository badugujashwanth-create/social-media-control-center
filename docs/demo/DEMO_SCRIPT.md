# Social Media Control Center demo script

**Target length:** 4–5 minutes

**Format:** Real Chromium workflow with generated narration and WebVTT captions

**Data:** Deterministic synthetic workspace; all provider calls disabled

## Walkthrough

1. Open the login surface and state the safe-demo boundary.
2. Sign in and review the three-account dashboard.
3. Inspect simulated provider accounts, capability labels, and disabled OAuth actions.
4. Open the composer and explain content, link, media, and target validation.
5. Compose the Northstar release update and select all three accounts.
6. Queue publishing and show the per-target `publishing` state.
7. Wait for deterministic `success` results and synthetic external IDs.
8. Inspect historical second-attempt evidence.
9. Review daily posts and follower snapshot deltas with their stated limitations.
10. Return to the dashboard and summarize verified evidence and external gates.

Never expose environment files, provider credentials, personal accounts, unrelated applications, notifications, or private URLs. Never edit the recording to imply a live provider succeeded.

## Record

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\record-demo.ps1
```

Use `-SmokeOnly` first. The full command builds the production static export, starts isolated local services, verifies the API flow, records Chromium, adds narration, extracts inspection frames, validates audio/video, and writes a SHA-256 checksum.
