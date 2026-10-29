# Docker Release Implementation Plan

**Goal:** build the production SSR Docker image only for pushed vX.X.X tags whose commit belongs to main, then attach the compressed Docker archive and SHA-256 to that repository release.

**Architecture:** separate read-only tag validation, reusable Quality workflow and image build jobs from the release job with contents:write. Build the exact validated SHA. GitHub tag events have no branch context, so check ancestry against origin/main explicitly; branch pushes alone do not build images. Scope is workflow configuration, not a deployment or a tag/release publication during this task.

**Tech Stack:** existing React Router8.5.1 SSR, Node22.22.3, Docker multi-stage build, Buildx, GitHub Actions and preinstalled GitHub CLI. linux/amd64 Docker archive, no container registry.

**Spec:** current user request; AGENTS.md for verification and repository constraints.

## Tasks

- [x] Add Dockerfile with isolated development/build and production dependencies, non-root runtime and direct Node entrypoint. Match .nvmrc; exclude secrets, host node_modules, build output, skills and tests from context.
- [x] Add release workflow with strict stable SemVer validation, lightweight/annotated tag support, main ancestry and moved-tag checks. Pass only validated outputs to subsequent jobs. Reuse Quality via workflow_call; avoid duplicate quality runs for tag pushes.
- [x] Export dropvia-vX.X.X-linux-amd64.tar.gz and checksum, load the archive, run an SSR/non-root smoke check, and pass assets to a separately permissioned publish job. Create a release when absent or add assets to an existing one without overwriting existing assets.
- [x] Document tag creation order, main-history interpretation, assets, docker load/run and rerun behavior. No remote push, tag or release during local verification.
- [x] Validate Docker/workflow syntax and release gating with temporary Git repositories (valid/invalid versions, annotated/lightweight tags, off-main commit, old main commit and moved tag). Run project checks and attempt real Docker build/load/run when the local engine is available. Report unavailable checks explicitly.

## Review focus

- Branch and tag filters are not an AND condition: only tag push triggers this workflow; ancestry is a mandatory gate before build.
- Checkout/publish must not follow a moved tag or build current main instead of the tagged commit.
- No write token in npm/Docker steps; no registry credentials or third-party install scripts.
- Release archives must be Docker-loadable, use only production dependencies, and actually serve SSR/static resources as non-root.
- Existing release assets are immutable by policy: do not use --clobber; fail safely on a duplicate filename.

Primary references: GitHub push event docs, Docker multi-stage/build export docs, official nodejs/docker-node and GitHub CLI release create/upload manuals, checked29October2026. Action versions will be pinned to verified full commits.

## Verification result

Configuration and release gate completed.52 unit tests,9 release tests and147 E2E passed; actionlint and Bash syntax checks passed. One review finding about ambiguous remote ref lookup fixed using tags%2F namespace; both review axes have no remaining findings. Docker build/load/runtime remain unverified locally because the installed Desktop engine did not become available. No remote release, tag or deployment performed. Full evidence: docs/DOCKER_RELEASE.md.
