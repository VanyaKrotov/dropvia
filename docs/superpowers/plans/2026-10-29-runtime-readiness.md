# Docker runtime readiness regression

Evidence: GitHub Actions run40903911231, tagv0.0.1, job123558761619. Build and archive load succeeded. First runtime HTTP request returned curl56 at15:51:01.695Z, approximately180ms after docker run returned. No application startup/error log was emitted before cleanup. The existing --retry-connrefused does not retry receive/reset failures. Startup timing is the leading explanation; the logs do not prove that the process would later become healthy.

1. Add a regression executing the real readiness curl command from the workflow against a local TCP server: initial reset with a partial body, then a valid response. Confirm current flags fail and the output is not accepted as ready.
2. Add bounded --retry-all-errors, connect/retry timeouts and curl --output instead of shell redirection, so retried partial output is truncated. Preserve actual SSR checks, main/tag gating, non-root and read-only runtime.
3. Add state inspection on failure before cleanup; retain logs. Update release docs and npm release-test command to include the transport regression.
4. Run real transport tests (no fake curl), release tag tests, workflow/static checks. Local Docker Engine is unavailable; do not claim a real container rerun or remotely rerun/publish/create a tag. Preserve existing uncommitted cookie work.

References: https://curl.se/docs/manpage.html#--retry-all-errors and https://github.com/VanyaKrotov/dropvia/actions/runs/40903911231/job/123558761619.

Completed all four steps. Scope is the runtime smoke curl/cleanup, one real-transport regression, release test command and this documentation. No application or Dockerfile change; earlier uncommitted cookie work preserved.

Verification29October2026:

- Red regression: the first reset produced curl56, exactly one request and a partial startup body. Green regression after retry/output fix: exactly two requests and the clean complete HTML file. `npm run test:release`: 10/10, including nine main/tag gates, no skips.
- `npm run typecheck`, `npm run test` (57/57), `npm run lint`, `npm run format:check`, `npm run skills:verify` (22/351), `git diff --check`: passed. node --check accepted the new test file.
- actionlint v1.7.12 with ShellCheck v0.11.0 accepted both workflows. Independent Standards/Spec reviews reported no actionable findings; they did not independently run tests.
- GitHub connector read the actual failing job logs. Docker build/save/load and Linux/Windows Quality succeeded remotely on old tagv0.0.1; this does not verify the new fix in Actions.
- Local Docker Engine pipe remains unavailable. No new Docker build/run, app build/E2E, remote CI rerun, push, commit, tag or release performed for this workflow-only fix. New tag on the fixed main commit is required; re-running the old tag reuses old workflow content. Retry budget60s can be followed by up to5s for the last in-flight attempt.
