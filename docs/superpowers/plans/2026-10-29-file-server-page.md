# File server technical page implementation plan

## Follow-up: language selection and shared footer

Owner explicitly requests the common footer and language selection on node pages. Extract the existing anchor-based switch into shared/ui/language-switch.tsx and reuse it in SiteHeader and the technical header. Compose SiteFooter under the page in its route provider; keep the compact technical header. Preserve node/query/fragment, SSR/no-JS navigation, both themes and responsive layout. Permit only the node page's language link as an exception to the no-incoming-links rule; no global node links or indexability changes.

- [x] Red browser checks for missing footer/language controls, then implement the shared switch, route footer composition and compact header tools.
- [x] Update durable instructions/design notes to match the new owner requirement.
- [x] Run full checks and inspect node screenshots on desktop/tablet/mobile. No backend/cache, dependency or deployment changes.

**Goal:** public, unlisted technical pages at `/_data/:uuid` for configured D01/D02 nodes, with EN default and `/ru/_data/:uuid` translations. No authentication wall, inbound navigation links, sitemap entries or deployment.

**Spec:** owner's29October2026 request, PRODUCT.md and unchanged DESIGN.md. A Read surface in the existing visual system. Public node details show code, role, data formats, API version and key authentication; do not copy unimplemented HLS/DASH, replicas, signed access or TLS/HTTP2 guarantees from the visual example.

**Architecture:** compact `app/routes/file-server.tsx` outside the marketing shell; `pages/file-server/file-server-page.tsx` owns the screen; existing entity owns a finite node registry, public status cache and shared query options. Reuse Providers, BrandMark, tokens and API status. Technical routes only link outward to the locale-aware main service, docs, status and support.

- [x] Add failing tests for stable snapshots within60s, refresh at expiry, defensive copies, configured node resolution and public/unlisted technical routes.
- [x] Keep createStatusSnapshot pure. Add a process-local public snapshot cache in status.server.ts, lazy60s refresh, shared by API/status/technical loaders. No per-user data, filesystem state, timers or unbounded node caches. Restart clears it; multiple processes have independent snapshots.
- [x] Extract entity query options, preserve30s visible-only polling, cancellation, error retention and no hydration refetch. Pass receivedAt from loaders separately from the generation timestamp.
- [x] Implement SSR route, EN/RU copy, accessible status/details/outward links, responsive light/dark layout and noindex via metadata and X-Robots-Tag. Reject unknown node/language identifiers404. Register only D01/D02; add future nodes explicitly.
- [x] Update product/architecture/API/design notes and the agent exception for public server status memory. Run npm run check, inspect desktop/tablet/mobile screenshots, review Standards and Spec, fix material findings.

**Verification:** unit fake-clock expiry/isolation tests; browser SSR/no-JS, current node vs status API agreement, reload stability, polling error retention, forbidden inbound links,404 cases, axe and overflow in both themes. No external API calls or publication.

## Verification and review

- Red:2 cache tests failed before getStatusSnapshot existed; browser SSR test failed404 before route implementation. Green: cache tests and all9 new browser scenarios passed after implementation.
- Full npm run check passed:22 skills /351 integrity-checked files; formatter, ESLint, Router typegen / TypeScript;36 unit tests; production client/server build;111 browser scenarios including SSR/no-JS, both languages/themes, all three viewport projects, axe, overflow, stable reloads, degraded state and failed-poll retention. No deployment or remote CI was performed.
- Inspected6 full-page node screenshots across desktop/tablet/mobile and light/dark. Node/code, details, links and responsive wrapping match the existing system. Snapshots are generated public data, not measured uptime.
- Spec review: no actionable findings. Standards review: no production breaches; one browser-test reliability issue at the60s rollover. Corrected comparisons to permit a real minute expiry while retaining exact TTL/defensive-copy assertions under a unit fake clock. Additional invalid-language404 coverage added.
- Official routing/route-module documentation matched installed React Router8.5.1. New route uses typed loader data and Providers; no new dependency or Next API introduced.

Follow-up verification: missing-footer and missing-language browser checks failed before implementation. Final npm run check passed36 unit tests and114 browser scenarios, including no-JS language navigation, D02/query/fragment preservation, localized footer links, existing main-site language behavior, SSR, axe and responsive layouts. Inspected node screenshots at three sizes in both themes. Shared LanguageSwitch retains the previous header anchor behavior; no backend or status-cache changes were made.
