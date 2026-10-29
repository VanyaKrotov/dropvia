# Cookie notice: browser persistence

Owner request: remember OK in localStorage and send no acknowledgement requests.

1. Replace cookie-based E2E expectations with persistence across reloads, locales and standalone screens, no acknowledgement requests, storage failures and cross-tab changes. Run the persistence case against the current implementation to confirm it fails.
2. Keep the existing notice styling and motion; use a versioned, fixed localStorage acknowledgement, an SSR-safe external-store snapshot and browser storage events. Remove the server endpoint, cookie parser, root loader dependency and obsolete server tests.
3. Update product/privacy/architecture documentation to describe browser storage with no automatic expiry. No tracking or new cookies; JavaScript is required for localStorage and the notice is rendered only after hydration.
4. Run unit tests, typecheck, lint, formatting, skills verification, production build and browser checks (including SSR and the notice on desktop/tablet/mobile). Review the changed behavior and server/client boundary.

Completed. Red: the original persistence case failed with localStorage returning null. Green:52 unit tests and36 focused Playwright cases (notice and SSR across all three device projects) passed; includes zero POST requests, cross-tab updates, clearing storage, blocked reads/writes, no-JS content, both themes, reduced motion and axe checks. Typecheck, lint, production build, format:check, skills:verify and diff whitespace checks passed. Reviewed server/client boundaries and the desktop/tablet/mobile dark screenshots plus the mobile light screenshot. Vite's sandbox CommonJS loading error required rerunning build/typecheck/browser checks outside the sandbox; those completed successfully. Full unrelated E2E/CLI/release suites and remote CI were not run. No publication, commit or deployment.
