# Landing depth and interaction refinement

**Goal:** explain Dropvia's storage/sharing purpose with varied sections, improve all code examples and FAQ motion, and collect useful access-request context.

**Architecture:** preserve FSD/Router SSR and generated Safari/iPhone hero. Shared `CodeWindow` and `AccordionItem` serve landing, prices and API. The request feature owns its typed payload and server validation. No new dependency or deployment.

**Spec:** latest owner request; unchanged `DESIGN.md`, `PRODUCT.md`, root `AGENTS.md`. Apply writing-plans locally and proceed under the owner's standing authorization; no additional workflow installer/hooks or mandatory handoff.

## Direction and content before components

Audience: ordinary people keeping documents, photos and project files; primary action: request access. Preserve the existing voice and palette (copy mode B). New sections expand confirmed storage/transfer/download purposes, not unapproved security, sync or quotas.

1. Collection: split editorial text and a quiet file-category composition, explaining what belongs in a personal space.
2. Sharing: a wide inset panel with a document/link illustration and concise explanation of sender/recipient needs.
3. Everyday use cases: asymmetric editorial rows for personal files, study and projects; no invented customers or metrics. Keep benefits compact and link to plans/API where useful.

Colors/type: existing midnight/ice/violet semantic themes and system font. Generous120px section rhythm,16px panels,6px fields, subtle inset edges. Avoid adding the same card layout or entrance animation to every section. New motion answers interactions only.

Research: official Dropbox features and sharing help, WeTransfer send-transfer guide. Borrow topic hierarchy only; see updated `docs/LANDING_STRUCTURE.md` for sources and exact EN/RU copy keys.

## Tasks and verification

- [x] Extend `features/request-access`: name100, optional organization160, needs1000 characters, email254, consent; validate unknown JSON and native URL-encoded payloads, bounded16KiB body. First add rejection tests for blank/oversized/wrong-type text; verify red, then implement. Update API examples, no-JS form, privacy and docs together.
- [x] Add `shared/ui/code-window.tsx` and a safe lexical highlighter: SSR text escaping, macOS title bar, syntax spans, copy feedback/error, no destructive HTML injection. Use it for all multiline examples including responses. Test clipboard success/failure, value changes and malicious-looking source.
- [x] Add `shared/ui/accordion-item.tsx`: native details/summary fallback, reversible height/opacity expansion and animated plus/minus; keyboard and rapid reversals, reduced motion, cleanup and no-JS all work. Replace both FAQs, not unrelated native disclosures.
- [x] Add `pages/landing/product-stories.tsx`, EN/RU copy and responsive theme-aware styles. Keep the existing hero and overlap unchanged. Update `docs/LANDING_STRUCTURE.md` and `docs/DESIGN_SYSTEM.md` with section purpose, copy, CTA and presentation.
- [x] Run unit tests, typecheck/lint/build, browser scenarios for new fields/payload/retry/no-JS, copy, FAQ reversal and reduced motion. Run `npm run check`; inspect actual desktop/tablet/mobile light/dark screenshots. Review standards/spec separately. Record actual evidence and limitations; no remote CI or Lighthouse claim.

## Review focus

Untrusted field types/oversized UTF-8 bodies; personal users without a company; clipboard rejection; accordion interrupted during closing; SSR and JS-disabled disclosure/forms. Each belongs in its task's tests. Keep code example text byte-for-byte copyable after highlighting.
