# Dropvia service review — 28 October 2026

Baseline `fdc7fb7`; reviewed tracked diff plus all new `src/**` and service browser tests. Independent read-only Standards and Spec reviewers were reused per the local `code-review` skill. Current user request is the spec; decisions are in PRODUCT.md and the service implementation plan. This report supplements the earlier foundation review rather than replacing its historical evidence.

## Standards

Two P2 findings were reproduced and fixed:

1. **Fragment in language-link SSR href.** HTTP requests contain no fragment, but the first client Router location does. Rendering location.hash in href caused a hydration attribute mismatch; React left the server href unchanged and language switching lost the fragment. Fix: stable SSR href uses translated path+search; click/auxclick adds the fragment at activation. Direct `/api/?source=reference#health` browser regression failed before the fix and passed after it. Native no-JS language navigation preserves page/query; preserving a client-only fragment requires JavaScript.
2. **OPTIONS reached GET loaders.** Router invokes loaders for OPTIONS too. Status returned200 and file loaders returned404 instead of documented405+Allow. Fix: explicit GET/HEAD guards in all three relevant loaders. HTTP OPTIONS regression failed200 vs405 before the fix; after rebuilding, it passed for status/download/files.

The Standards reviewer rechecked the fresh server build directly and reproduced SSR/hydration in JSDOM: both findings resolved, correct Allow/JSON, no href mismatch, hash preserved on click. No remaining substantial findings in the reviewed areas. No files were modified by the reviewer.

## Spec

The independent Spec reviewer found no substantial omissions, scope creep or incorrect implementation against this stage's contracts. Six page types with Russian mirrors, FSD, requested libraries, device theme, invitation UI, seven API operations, status polling and native fallback match the brief. Numerical tariffs and infrastructure promises were deliberately not invented. Real persistence/mail/storage is outside the explicitly requested stubs, not claimed implemented.

## Visual and functional review

Main agent reviewed actual desktop/tablet/mobile captures in both themes, including Russian copy, form, pricing, statuses, legal and API. Added readable viewport captures after full-page captures proved too tall to inspect details. Checked focus/skip-link/native FAQ, code tabs, control states, text measure, reflow and both-theme contrast with browser evidence and axe. No decorative loops or fake successful file transfer.

Impeccable was used in the project's permitted manual mode (existing context, craft floor, technical audit reference); binary detector/launcher/hooks and its automated dual critique were not run. User/reference decisions override its generic eyebrow/font/gradient bans. This is not a formal WCAG or legal certification.
