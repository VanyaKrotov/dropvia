# AuthKit structure and motion adaptation

**Spec:** latest owner request: structure and animations like https://workos.com/authkit?ref=authkit. Preserve Dropvia product facts, `DESIGN.md`, both locales/themes, generated Safari/iPhone previews and access form/API behavior.

**Research:** inspected the live reference in the browser, not just the older style document. Current hierarchy: centered hero and layered visual → customer strip → three feature columns → integration → vertical-tab demonstration →2×2 platform grid → three use cases → contrasting reliability band → proof/pricing → final CTA. Observed staggered visual entrances, layered panels and animated tab transitions. Borrow composition and interaction; replace customers/certifications/uptime with file categories and truthful status/navigation. Never copy the auth product's functionality, assets or promises.

**Direction:** centered section introductions, continuous hairline rails, divided columns and spacious section rhythm in existing midnight/ice and system light palette. The existing Safari/iPhone hero retains15% overlap and fade/rise. A vertical-tab file story is the focal interaction: storage/sharing/retrieval illustrations change with a short layered transition. Supporting visuals reveal once on entering the viewport; no autoplay, parallax or infinite loops. Reduced motion is reactive; SSR/no-JS content is visible.

## Files / steps

- [x] Add `tests/e2e/authkit-layout.spec.ts` for SSR section order, keyboard tabs with no file API calls, and viewport/reduced-motion reveal behavior. Verify absence of the new structure first.
- [x] Recompose `pages/landing/landing-page.tsx` and `product-stories.tsx`: feature columns → API integration → interactive experience → platform grid → use cases → status/plan navigation → FAQ → request. Add page-owned `file-experience.tsx` and `use-landing-motion.ts`; no new dependency.
- [x] Add scoped `app/styles/landing.css` and remove superseded story styles, avoiding effects on other pages. Preserve hero/header geometry and existing forms, code windows and FAQ.
- [x] Add finished EN/RU copy, update `docs/LANDING_STRUCTURE.md` and `docs/DESIGN_SYSTEM.md`; keep `DESIGN.md` unchanged.
- [x] Run `npm run check`, inspect actual mobile/tablet/desktop in both themes, keyboard/no-JS/reduced-motion and console errors; perform separate Standards/Spec review. Record real results; no deployment.

## Review focus

Do not transplant fake testimonials, MAUs, uptime or enterprise auth. Tab illustration is a presentation, not working file storage. Roving tab focus/labels and interruption must work. Content must remain visible without JS or IntersectionObserver. Avoid stale opacity after locale/navigation/preference changes. Do not regress existing screenshot selection, no-JS submission or Clipboard controls.
