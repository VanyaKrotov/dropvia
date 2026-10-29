# API reference implementation plan

**Goal:** implement the owner's six API-documentation changes in the existing EN/RU SSR application.

**Scope:** full authorized REST contract and typed file model in the reference; keep the explicitly requested live403/404 file gates and public status/access handlers. Examples are contract representations, not evidence of implemented storage, sharing or credential issuance. This task authorizes successful file-response examples and supersedes the earlier docs prohibition on them.

**Architecture:** `entities/file/model.ts` owns FileResource; `pages/api/examples.ts` owns protocol examples/responses; `pages/api/endpoint-reference.tsx` owns response selection; `api-page.tsx` composes model, navigation and methods. Existing CodeWindow, header-height CSS variable and theme tokens are reused. No dependencies, deployments or destructive changes.

- [x] Red: unit tests for successful file representations, bodyless204 and binary download; browser contract for header/footer API visibility, model, response selection and sticky navigation. Baseline: current scoped source snapshot; repo src is still untracked from earlier work.
- [x] Implement FileResource(id UUID string,name,path logical path,size integer bytes,mimeType,publicUrl nullable,downloadUrl,createdAt,modifiedAt), shared sample and field descriptions. Public URL is null until sharing is enabled; no internal filesystem paths or secrets.
- [x] Describe201/Location upload/share,200 metadata/status,200/206 binary download,304 conditional metadata,204 empty delete,201 access acknowledgement and endpoint-specific4xx/5xx with correct headers. Keep the current JSON error envelope. Clients must not parse204 as JSON or save error JSON as downloaded bytes.
- [x] Update page: API v1 badge; H1 scaled to76%; sticky desktop sidebar and mobile horizontal navigation below measured header; GET green, POST amber, DELETE red with accessible contrast. Remove API only from global header and retain footer/contextual documentation links.
- [x] Update EN/RU, docs/API.md, PRODUCT/AGENTS as needed, design notes and impacted existing tests. Use RFC9110 semantics; RFC9457 reviewed but no unrequested migration of actual error envelopes.
- [x] Run full npm run check, inspect both themes on desktop/tablet/mobile, check anchor occlusion and errors/console, and perform separate Spec/Standards read-only reviews. Do not send requests to public dropvia.fun from examples or publish.

## Verification — 29 October 2026

- Red before implementation: both new file-contract tests failed against the former403/404-only fixtures. Green:32 unit tests across6 files.
- `npm run check` passed:22 skills /351 integrity-checked files, formatting, ESLint, Router typegen / TypeScript,32 unit tests, production client/server build and102 Playwright scenarios. The browser suite includes SSR/no-JS, resource-handler restrictions, hydration/console, overflow and axe in EN/RU and both themes across desktop/tablet/mobile.
- Parsed all14 generated JavaScript/Python snippets without executing network requests. Intercepted the upload example in process: multipart filename stays brief.pdf and logical path stays /projects/brief.pdf. Fixed the initial Blob default-filename issue found in both review passes.
- Additional targeted API-reference run:3/3 projects passed and saved EN/RU sticky-navigation screenshots under artifacts/api-reference-review. Inspected Russian top-of-page screenshots in both themes at all three widths, and anchored metadata screenshots at all three widths; method markers, code windows, selected response and sticky offsets remain readable. Full-page /api/ and /ru/api/ screenshots are also in test-results.
- Final independent read-only Standards review: no remaining actionable findings. Final independent Spec review: no remaining actionable findings. Both checked the corrected filename and the six requested changes; parent performed command/browser verification.
- Live file operations still return the agreed403/404 gates. FileResource success responses are the documented authorized contract; no authentication/storage/sharing backend or deployment was introduced. Remote CI and live infrastructure were not run.
