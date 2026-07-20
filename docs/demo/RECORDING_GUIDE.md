# Recording guide

The recorder owns its local demo processes and stops them after completion. Run it only when ports `3100` and `8011` are free, or pass `-UseExistingServices` for already healthy compatible services.

## Credit-saving sequence

1. Run API tests, web lint/build, dependency audits, and the tracked-file secret scan.
2. Run `scripts\record-demo.ps1 -SmokeOnly -SkipBrowserInstall`.
3. Fix any workflow failure and rerun the smallest affected test.
4. Run the full recorder once.
5. Inspect every extracted frame before accepting the asset.

## Acceptance

- At least 180 seconds
- 1280×720 video
- VP9 video and Opus audio
- Captions and thumbnail present
- Ten inspected frames show the intended browser state
- No secrets, unrelated windows, personal data, or provider-success implication
- Verification JSON and SHA-256 checksum match the final WebM
