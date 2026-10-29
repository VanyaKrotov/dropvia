# Cookie notice

Spec: persistent notice with a short cookie explanation, one OK button, animated entrance/exit. Keep EN/RU, system themes, SSR and reduced motion.

1. Add tests for acknowledgement storage and POST handling: no cookie before the user's action, valid scoped HttpOnly cookie, secure HTTPS, bounded/same-origin validation, safe no-JS redirect, malformed saved preferences ignored.
2. Implement a focused features/cookie-notice module and compact route adapter. Root loader reads acknowledgement; shared app Providers compose the notice on landing, sign-in and technical nodes. Use existing i18next/Motion providers and TanStack mutation, no additional global state or libraries. Mutation success revalidates root even after the submitting instance unmounts; network/proxy failures remain local. Preserve native form fallback.
3. Use existing surface/button/focus tokens. Bottom notice is nonmodal, keyboard usable and responsive. CSS entry remains visible without JS; Motion handles exit with reduced-motion support. A successful POST hides it; errors permit retry.
4. Update privacy copy for the single first-party acknowledgement cookie, with purpose/lifetime, and document limits. Do not describe the button as permission for analytics/advertising or add trackers.
5. Run unit, types/lint/build/format/skills and browser tests including no-JS acknowledgement, persistence across reload/routes/locales, failed POST, SSR markup, light/dark and mobile/tablet/desktop screenshots. View actual captures; review standards and requirements. No deployment or commit.

Legal context checked: ICO cookies guidance distinguishes information about strictly necessary storage from opt-in for non-essential tracking. This implementation only remembers the requested dismissal; no compliance certification or tracking consent is implied. Source: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/.

## Completed and verified, 29 October 2026

Baseline90447a9. All five steps implemented. The notice uses the existing palette and surface/pill tokens, one button and an inline privacy link. Acknowledgement lasts one year on that origin; deleting/expiring/blocking the cookie can show the notice again. Root404/500 intentionally keep their simplified error UI outside Providers. No analytics, advertising or new dependencies were added.

- `npm run typecheck`, `npm run build`, `npm run lint`, `npm run format:check`, `npm run skills:verify`, `git diff --check`: passed. Skills baseline remains22 manifests/351 files.
- `npm run test`: 57/57 (five new server contract tests); `npm run test:release`: 9/9; `npm run test:cli` with local Git Bash/Python: 34/34, no skips. CLI fixtures do not execute real Docker/APT operations.
- `npm run test:e2e -- --workers=4`: 171/171, including24 cookie checks across desktop/tablet/mobile plus existing SSR/no-JS/metadata/forms/a11y coverage. Network aborts, invalid proxy HTML, retry, native POST, SPA locale/standalone navigation, delayed POST after navigation, HTTP cache headers and320px reflow are covered.
- Viewed real light/dark screenshots at desktop/tablet/mobile sizes from test-results. Shortened copy/link and mobile spacing keep the banner compact; entry remains visible with JS disabled and reduced-motion disables spatial entry. Exit uses existing MotionConfig. Automated axe checks found no notice violations; this is not a WCAG certification.
- Red/green: cookie server tests failed against missing behavior, then passed. Review regressions separately reproduced missing homepage cache headers, a network action error replacing the page, and a delayed acknowledgement remaining visible after navigation. Fixed parent/action header merge, local mutation error handling and mutation-options root revalidation after success. Independent Standards/Spec reviews closed the findings; reviewers did not run these tests themselves.
- No deployment, push, commit, remote CI or field performance measurement. Separate test:ssr was not run because the full browser run includes the SSR suite. Browser coverage here is Chromium; real Safari/Firefox were not tested.
