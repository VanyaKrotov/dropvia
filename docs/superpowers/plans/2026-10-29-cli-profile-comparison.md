# CLI profile comparison

Baseline f8060dc. User screenshot corresponds to run40913900286/job123594140594, tagv0.0.2. Image build, SSR runtime and CLI install/up/down succeeded. Reinstall stopped before any destructive operation because old/probe HostConfig structures differed. The original diagnostic does not identify the field; exact original difference cannot be recovered from that job's logs.

Investigation: runner uses Docker28.0.4. Its inspect.go merges daemon default ulimits independently for each inspection; oci_linux.go mergeUlimits iterates a Go map and appends without sorting. With multiple defaults the same limits can have a different order. This is a demonstrated comparator defect and plausible cause, not proof of the specific CI field. withRlimits copies HostConfig, so do not claim that container start mutates these limits.

1. Model daemon-supplied ulimit ordering in isolated Docker fixtures. Reproduce rejection for equal reversed limits; require accepted reinstall/update. Reject changed values, duplicate names and malformed records before stop/image removal.
2. Canonicalize only Ulimits by validated unique Name; compare complete records/Soft/Hard exactly. Preserve every other HostConfig field and the non-running probe. On rejection list differing HostConfig field names without dumping values/secrets.
3. Document the narrow equivalence and limits of the diagnosis; run fixtures, release tests, shell/workflow/static/project checks. Read-only review. No real Docker run, publication, tag creation or remote rerun without authorization.

Sources: https://github.com/moby/moby/blob/v28.0.4/daemon/inspect.go#L90-L101 and https://github.com/moby/moby/blob/v28.0.4/daemon/oci_linux.go#L1006-L1020.

## Completed / verification

CLI0.1.1 implements the narrow comparison and field-name diagnostics. Missing/null/empty Ulimits are equivalent; all non-empty records are retained with exact Soft/Hard and other entry values. No other HostConfig setting is ignored, no probe is started, and destructive steps still follow the guard.

Red: new fixtures rejected reordered equal limits for both install/update with the same generic HostConfig message. Green: four targeted scenarios passed, including changed Memory and changed/duplicate/malformed Ulimits rejection before stop/image deletion. Full `npm run test:cli` with explicit local Python/Git Bash: 37/37, zero skips.

`npm run test:release`: 10/10; `npm run typecheck`, `npm run test` (57/57), `npm run lint`, `npm run format:check`, `npm run skills:verify` (22/351), `git diff --check`: passed. bash -n, shfmt -d and ShellCheck v0.11.0 accepted the shell files; actionlint v1.7.12 with ShellCheck accepted both workflows. Independent read-only Standards/Spec re-reviews reported no findings; they did not execute tests themselves.

No real Docker Engine locally: its Windows pipe is unavailable. The regression is isolated command-fixture execution, not proof that the original CI differed specifically in Ulimits or that a new Docker smoke has passed. No app build/E2E rerun for this CLI-only change; the read actual v0.0.2 job already passed SSR runtime/Quality on that commit. No commit, push, tag/release creation, deployment or remote rerun was performed. A new tag on fixed main is needed for actual CI validation; retain strict guard if any other named difference remains.
