# Landing refinement — 28 October 2026

## Delivered scope

- Three bilingual sections: personal file collection (split text/category panel), sharing (wide inset document/link composition), everyday use cases (open editorial rows with a plans link). Existing generated Safari/iPhone hero,15% overlap and upward fade remain intact.
- `CodeWindow` replaces every multiline snippet on landing/API, including JSON responses. macOS-style title bar, syntax spans, keyboard-scrollable source and copy controls share one implementation. The highlighter renders escaped React text, has no remote scripts/dependencies and copies the original string. Success/failure is announced; changing source clears stale feedback.
- `AccordionItem` serves landing and prices FAQs. Native SSR/no-JS disclosure; with JS,280ms height/opacity transitions and plus-to-minus motion, keyboard activation, reversal from current geometry and immediate reduced-motion state. The preference is read when interacting because the installed Motion hook snapshots it at mount. `useAnimate` cleans scope animations on unmount.
- Access form: name/email/needs required, organization optional, meaningful labels/placeholders, bounded fields, localized pending/error/success and plain Request access / Оставить заявку submit. Removed the subscription sentence from the form. JSON and native form handling, API examples and privacy disclosures include the new fields. The endpoint remains the authorized201 acknowledgement stub, without persistence or outgoing mail.

## Verification and review

`npm run check` passed with22skills/integrity, format, lint, strict typecheck,28unit tests, production SSR build and81Playwright cases (desktop/tablet/mobile). These cover SSR translations, no-JS form/disclosure, request payload and retry, clipboard success/error, escaped source, both themes/axe/reflow, FAQ opening/closing/reversal and dynamic reduced motion. Actual theme/viewport screenshots were inspected. `git diff --check` passed. Separate read-only Standards and Spec reviews found no substantial issues; these were static reviews, not extra test runs.

Red phase: server tests demonstrated that blank/oversized/wrong-type new fields were previously accepted, and the old4096byte limit rejected a valid Cyrillic native form; CodeWindow tests initially failed due to the missing component. After implementation the tests passed. Browser investigation corrected two measurement assumptions: Windows clipboard uses CRLF; Motion height interpolation is not necessarily exposed as a native WAAPI animation. Tests now compare normalized line endings and actual intermediate/final geometry. Fractional content measurements avoid a rounded-height finish; changing reduced motion after mount is tested explicitly.

No new npm dependency. `DESIGN.md` remains unchanged. No deployment, remote CI or fresh Lighthouse/field-CWV measurement. UI/UX Pro Max search could not execute because no usable Python runtime is installed; relevant local UX dataset guidance (forms, timing, reduced motion) was read directly. No installer or remote script was run.

Research and section purpose/copy/CTA/source mapping: `docs/LANDING_STRUCTURE.md`. The design tokens, code windows, fields and FAQ conventions are documented in `docs/DESIGN_SYSTEM.md`. Request contract: `docs/API.md`.
