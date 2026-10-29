# Release-only build workflow

Baseline: b7ee44e. Spec: build only for main commits with a release tag.

1. Make quality.yml reusable-only. The Docker release workflow remains the sole caller, after validate confirms stable vX.X.X, exact checkout/tag/event commit and origin/main ancestry. Preserve the existing policy allowing earlier main commits.
2. Make the release entry condition explicitly require a non-deletion tag push. Do not add branch filters beside tag filters: those select alternative events rather than imposing main AND tag.
3. Update AGENTS.md and docs/DOCKER_RELEASE.md to describe the single release entry point. Keep README focused on deployment.
4. Run release gate tests, workflow actionlint, lint and formatting checks; review the dependency graph validate -> quality -> build -> publish. No tag push, release, actual deployment or remote workflow run.

Completed: quality.yml now has only workflow_call; Docker release remains the only caller and explicitly accepts only a non-deletion tag push. Git validation and main ancestry behavior were preserved. Reviewed both workflow files and their needs graph against the request; README remains deployment-only.

Verification: 9/9 release tests passed; both workflows passed actionlint v1.7.12; npm run format:check, npm run lint and git diff --check passed. The first release-test run was blocked by local sandbox permissions while creating temporary .git/config files; an unchanged retry outside the sandbox passed. App build/E2E were not rerun for this workflow-only change. No remote CI, Docker build, tag push or publication was performed.

Reference: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushbranchestagsbranches-ignoretags-ignore (checked29October2026).
