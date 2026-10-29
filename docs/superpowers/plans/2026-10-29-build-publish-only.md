# Build and publish only

Baseline c8c160e. Explicit owner request: remove extra release checks and leave container build and release. Preserve the existing stable-tag AND main-history trigger contract.

1. Remove the reusable Quality call, SSR runtime smoke and Ubuntu CLI lifecycle smoke from docker-release.yml. Build follows only tag/main validation. Export archive/checksum, transfer artifacts and publish the GitHub Release; retain source-tag consistency and checksum integrity. Remove redundant archive reload/test steps.
2. Remove the obsolete runtime-readiness regression coupled to the removed smoke command and restore test:release to main/tag gates. Keep CLI tests and standalone smoke source; leave Quality reusable-only with no automatic release caller.
3. Update AGENTS/current architecture/deploy/CLI/release docs to this policy; keep README deployment-only. Historical investigations remain in their dated plans.
4. Run actionlint/ShellCheck, release gates, lint and formatting; review the graph validate -> build -> publish. No real Docker build, tag, publication, push or deployment during this change.

Completed all steps. The release workflow has exactly validate/build/publish jobs; no Quality caller, container execution, runtime smoke or CLI smoke remains. The sole load is Buildx's image output needed by docker save. Main/tag checks, source-tag identity and asset checksum remain. The removed runtime-readiness test targeted a smoke command that no longer exists; local CLI tests and standalone smoke source remain available. README and production CLI behavior are unchanged.

Verification: actionlint v1.7.12 with ShellCheck v0.11.0 accepted both workflows; npm run test:release passed9/9, npm run test passed57/57, npm run lint/format:check/skills:verify and git diff --check passed. Reviewed the workflow needs graph and searched for removed smoke/caller references. No app build/typecheck/E2E, real Docker or remote CI rerun was needed/performed for this configuration-only change. No commit, push, tag, release or deployment performed. A new tag after committing the workflow to main is required to use the new pipeline.
