# Ubuntu deploy bootstrap plan

**Goal:** downloadable deploy.sh prepares Ubuntu prerequisites, installs/starts Docker when needed, installs the existing CLI and invokes its interactive install.

**Spec:** latest user request; prior CLI behavior and confirmations remain. No actual remote deployment during implementation.

- [x] Add self-contained scripts/deploy.sh: root/sudo, Ubuntu/systemd/amd64 validation, missing APT dependencies, local Docker detection, official signed APT repository, service enable/start, bounded readiness and checked installer handoff.
- [x] Preserve existing Docker installations/configuration. Never uninstall conflicting container runtimes automatically, never run convenience install scripts, never modify firewall/TLS or prune data. APT --no-remove and lock timeout; scoped temp cleanup.
- [x] Extend isolated CLI fixtures with apt/dpkg/systemctl/gpg responses. Cover fresh host, ready Docker, stopped Docker, conflicts, unsupported OS/arch, failed packages/key/start and installer handoff. Test actual repository-file rendering in fixture directories.
- [x] Document download/run and one-line deploy command; update shell checks and Quality. Keep real Docker builds confined to tag/main workflow.
- [x] Run CLI/project/static checks and read-only review. Clearly distinguish mocked system package/service checks from real Ubuntu execution.

Primary reference: https://docs.docker.com/engine/install/ubuntu/, checked29October2026. Use signed Deb822 sources and Docker key fingerprint validation, not third-party shell installers.

## Verification, 29 October 2026

- Baseline 0bc0a84; previous uncommitted Ubuntu CLI work preserved. This extension adds deploy and shares the existing isolated test fixture.
- `npm run test:cli` with explicit local Python3: 34/34, zero skipped (24 CLI + 10 deploy). Red regression run reproduced both review findings before fixes: unwanted service enable on ready hosts and acceptance of additional primary signing keys. Full green run passed after fixes; valid subkeys remain supported.
- `npm run skills:verify`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build`: exit0. Typecheck first failed inside the restricted local Vite loader (`require is not defined` in lodash); the same unchanged command passed outside that sandbox. No app/toolchain source changes made for it.
- `npm run test`: 52/52; `npm run test:release`: 9/9; `npm run test:e2e -- --workers=4`: 147/147, including SSR/no-JS and metadata coverage.
- Four shell scripts: bash -n, ShellCheck v0.11.0, shfmt v3.12.0 -d all exit0. deploy --help runs without system mutations. Both changed workflows pass actionlint v1.7.12; shell files have LF line endings.
- Independent read-only Spec and Standards reviews completed. Two Standards findings fixed and re-reviewed closed; no outstanding findings reported.
- No real Ubuntu APT/systemd/sudo handoff, remote CI, Docker Engine smoke or deployment executed locally. Official Docker key download from this local network returned HTTP403; fixture GPG output tests parser behavior, not the current remote key. Source key is checked at deployment time. SIGINT/TERM cleanup reviewed but not signal-injected. No push, tag, release or commit created for this task.
