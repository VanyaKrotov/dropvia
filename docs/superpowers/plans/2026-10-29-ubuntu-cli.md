# Ubuntu container CLI implementation plan

**Goal:** a Bash dropvia command with install/uninstall/update/update-cli/up/down, plus a one-line bootstrap that installs the command and invokes install.

**Architecture:** scripts/dropvia.sh owns container operations; scripts/install-cli.sh installs it atomically into /usr/local/bin/dropvia. Public GitHub API latest release and existing linux/amd64 archive/checksum are the only image source. Python3 stdlib parses untrusted JSON, IPs and numeric versions; Bash never sources downloaded configuration. Docker is a prerequisite, not installed through a remote script. Container labels preserve version and bind settings. Use an exclusive flock and bounded downloads/readiness checks.

**Spec:** current user request. Ubuntu with Bash, curl, Python3, Docker Engine, coreutils and util-linux; current release architecture is linux/amd64. Do not connect to or deploy on a real remote host during development.

## Tasks

- [x] Add behavioral tests with fake Docker/curl responses and isolated fixture files, then implement the CLI. Cover invalid IP/port, missing release, corrupt checksum, new install, existing-container refusal/confirmation, strict image cleanup, update/no-update, rollback, up/down idempotence, uninstall confirmations and self-update failure.
- [x] Add bootstrap, atomic script replacement, help/version, default /usr/local/bin/dropvia and explicit --install bootstrap option. Download fully and validate identity/syntax before execution; no curl pipe to a shell.
- [x] Reinstallation verifies the new download before touching the old container, backs up its image and removes only that image with --no-prune, without force/prune/volume deletion. Updates retain the old container/image until replacement is ready and restore it on failure. Preserve bind IP/port and stopped state.
- [x] Wire Linux CLI tests into Quality; keep app tests and release tests. Add shell syntax/static checks and preserve the existing LF attributes. Document both one-line commands, dependencies, defaults, confirmations, limits and rollback behavior.
- [x] Run project verification and CLI fixtures; distinguish mocked Docker behavior from actual Ubuntu/Engine execution. Review standards/spec independently and fix findings.

## Review focus

- No untrusted GitHub JSON/checksum/config is evaluated as shell code; release tag, asset names, URLs and image labels are validated.
- Failed downloads/checksum/load/start must not discard the working container. Install/reinstall asks before destructive work; uninstall asks separately for container, image and CLI.
- Only a verified Dropvia image/container can be removed; never force image deletion, prune images/parents or delete volumes.
- Interruptions trigger rollback/temporary-file cleanup while holding the lock. No automatic downgrade on a GitHub latest tag with a smaller version.
- update-cli requires no Docker daemon, preserves the working CLI on bad download, and changes only its own regular managed executable.

## Result

All six commands and two bootstrap one-liners implemented.24 CLI fixtures pass, along with52 unit/9 release/147 browser tests, build and static checks. Profile/extra-network review findings fixed; no remaining Standards/Spec findings. Real Ubuntu Docker smoke is wired into the tag/main release workflow but has not run locally or remotely. SIGINT/TERM execution is not locally covered; backup retention and ordinary failure rollback are covered. Exact evidence and operator instructions: docs/UBUNTU_CLI.md.
