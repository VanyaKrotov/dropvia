# AuthKit layout and motion adaptation

Reference: [WorkOS AuthKit](https://workos.com/authkit?ref=authkit), inspected in a real browser on28October2026. The live page differs from the older AuthKit style reference in `DESIGN.md`. Current structure and interactions were used; Dropvia tokens, device themes, brand and product constraints remain authoritative.

The adaptation includes centered introductions, a category strip in place of customer logos, divided feature columns, integration, vertical scenario tabs with layered illustrations, a2×2 platform grid, three use cases, a contrasting service-navigation band, plans, FAQ and final request form. Full section/content/CTA mapping is in `docs/LANDING_STRUCTURE.md`.

## Motion implementation

- Existing hero: image-load fade-in900ms with12px rise; Safari/iPhone bottom alignment and15% overlap retained.
- Main interaction: keep/share/retrieve tabs switch presentation scenes with260ms opacity/y transitions. Keyboard arrows, Home/End and roving focus work. No file operations are performed.
- Supporting visuals: one-shot650ms viewport reveals, bounded sibling stagger; no autoplay loops, scroll locking, external animation scripts or added dependency.
- `useLandingMotion` owns observation and controls, restores visibility on cleanup and reacts to reduced-motion changes using `useSyncExternalStore` with a stable SSR snapshot. SSR/no-JS content remains visible by default. The new hook does not require an observer to keep its content visible.
- Existing animated native FAQ, macOS code windows/Clipboard controls and extended request form are preserved.

## Verification

`npm run check` passed:22skills/integrity, formatting, lint, strict typecheck,28unit tests, production SSR build and90Playwright cases across desktop/tablet/mobile. Added checks verify SSR section order, keyboard scenario selection without file requests, scroll/reduced motion and actual loading of the below-fold dashboard image. Existing no-JS form/disclosure, locales, Clipboard, axe, header and API contracts remain covered.

The first structure test failed because the previous page had no integration section ID. The first full run found a1px overflow at320px caused by a rotated background card. Its width is now bounded by the scene; targeted checks passed on all three projects, then the complete suite passed. Code examples continue to scroll within their own region.

Actual light/dark desktop/tablet/mobile screenshots were inspected, including isolated experience and platform views after lazy image loading. The Russian page and scenario switching were additionally viewed through the in-app browser. Separate static Standards and Spec reviews reported no substantial findings; these reviews are not extra browser test runs.

`DESIGN.md` SHA-256 remains `380300d93fa0080c01386696b3ff8547a73eafe8d588285c25ed32e923069189`. No new npm dependency, remote installer, deployment or remote CI. Lighthouse and field Core Web Vitals were not remeasured. File endpoints and request persistence/email remain as previously authorized stubs; no WorkOS customer, compliance, uptime or auth-feature claims were imported.
