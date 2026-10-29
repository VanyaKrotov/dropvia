# Dashboard visuals and copy refinement

Scope: latest owner request; preserve the existing design, pages, sticky header and API behavior.

- Generate desktop and responsive mobile WEB screenshots in both themes and EN/RU, with the built-in imagegen tool; inspect the results and persist optimized assets in the repository.
- Replace the HTML file-scene with responsive pictures. Desktop shows desktop plus a smaller mobile view; mobile shows the mobile webpage. Localized alt text, fixed aspect ratios, srcset/theme selection, main visual eager/high priority.
- Animate each image once when loaded, including cached images. Keep server/no-JS images visible. Respect reduced motion and cancel animation/listeners on unmount.
- Remove repeated closed-registration/invitation labels from hero, form and pricing cards. Keep one concise explanation by the request form and factual access rules in legal/API pages. Remove the landing's repeated upload/share/download sequence, already covered by benefits.
- Browser checks: image loading/selection/animation, EN/RU and theme changes, cache/no-JS, sticky navigation, layouts/axe. Run project checks and inspect desktop/tablet/mobile screenshots.

## Follow-up: Safari and iPhone

- Preserve generated assets; add decorative macOS Safari and iPhone Safari frames in `src/widgets/file-scene/browser-frames.tsx` and theme-aware styles in `src/app/styles/site.css`.
- Align the two devices at the bottom with a two-column grid; preserve phone proportions and show the iPhone alone on narrow screens.
- Adjust `FileScene` to animate the complete frame with opacity0→1 and y12→0 over900ms, without scale; retain load/cache handling, reduced motion and SSR visibility.
- Verify common baseline, phone aspect ratio, theme/language selection, load/cache animation and no-JS output; inspect actual desktop/tablet/mobile screenshots and run `npm run check`.
