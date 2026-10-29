# Архитектура Dropvia

## CLI profile comparison

CLI profile comparison note: Ulimits is compared by unique Name with exact record values, because Docker inspect merges daemon defaults from an unordered map. Other HostConfig fields remain strict. A mismatch reports field names only and stops before destructive replacement; the probe is never started. This is a narrow semantic equivalence, not permission to drop arbitrary resource/security/network settings.

## Cookie notice

`features/cookie-notice` owns the first-party dismissal cookie and the one-button notice. Root loader parses the cookie before SSR; common Providers render the translated notice on all existing public screens, including sign-in and file nodes. Simplified root error pages remain outside Providers. Cookie-dependent HTML is no-store; the homepage merges parent cache headers with action headers instead of dropping them.

POST `/cookie-notice` accepts an explicit acknowledgement and a safe internal return path. It validates origin, media type and a bounded body, then stores a fixed versioned value for one year with Path=/, HttpOnly, SameSite=Lax and Secure on HTTPS. Native document submissions redirect back with303. Enhanced submissions use the existing TanStack mutation to keep network/proxy errors local and retry explicit; success revalidates the root, including completion after navigating away from the submitting instance. The endpoint is not part of public file API docs or sitemap. No tracking or advertising consent is introduced.

Обновлено 28 октября 2026. Решение владельца: Feature-Sliced Design в `src/`, React Router 8.5.1 Framework Mode, SSR, Node runtime, React19.3.1, TypeScript6 strict, Tailwind4.3.3. Исходный подготовительный экран заменён; `DESIGN.md` сохранён.

## Слои и ответственность

```text
src/
  app/                 # root, routes.ts, route adapters, providers, global theme
  pages/               # landing, prices, legal, api, status
  widgets/             # site-shell, file-scene
  features/
    request-access/    # invitation form and server validation
    sign-in/           # credentials form and bounded server submission
  entities/
    file/             # shared FileResource contract for API reference
    service-health/   # snapshot types, boundary parser, server generator
  shared/
    i18n/              # en/ru resources and isolated instances
    seo/               # localized metadata
    server/            # bounded HTTP body and error responses
    ui/                # consistent SVG geometry
```

Import order: app → pages → widgets → features → entities → shared. A layer can skip lower layers. Slices do not import their peers. ESLint prevents upward imports; no barrels or empty scaffolding. Cross-layer imports use explicit files. Server-only functions are `.server.ts`; Router strips loader/action code from browser modules. API request bodies and secrets never become loaderData.

## Алиасы импортов

Единственный источник соответствий — compilerOptions.paths в tsconfig.json:

| Алиас       | Директория     |
| ----------- | -------------- |
| @app/*      | src/app/*      |
| @pages/*    | src/pages/*    |
| @widgets/*  | src/widgets/*  |
| @features/* | src/features/* |
| @entities/* | src/entities/* |
| @shared/*   | src/shared/*   |

Vite8 и Vitest5 используют resolve.tsconfigPaths=true; дополнительные plugins и deprecated baseUrl не нужны. Импорт указывает конкретный файл, например `@features/sign-in/model/credentials`; алиасы не требуют index/barrel файлов и не отменяют направление FSD. ESLint проверяет как относительные пути, так и alias prefixes. Type-only imports также используют aliases. Generated `./+types/*` остаётся относительным для Router rootDirs; route registration strings, CSS @import и Node new URL являются другими механизмами и не переписываются.

## SSR и маршрутизация

`react-router.config.ts`: `appDirectory: 'src/app'`, `ssr: true`. Official React Router Vite integration. Root renders HTML/links/metadata/errors. Optional `:lang?` site layout accepts only Russian `ru` or the default English; unsupported language segments404. Each page has a compact route adapter and generated Route types. Resource routes precede the site hierarchy and return JSON without site markup.

Pages: `/`, `/prices`, `/terms`, `/privacy`, `/status`, `/api/`, `/sign-in`; mirrors `/ru`, `/ru/prices`, etc. Canonical/hreflang/OG/Twitter are generated for each pair. Status uses a loader to create the first snapshot. Static pages need no dummy loaders. Site loader validates language. Main content exists in server HTML without hydration. ErrorBoundary determines locale from the URL even when no loader ran.

`shared/seo/metadata.ts` owns page metadata: `pageSeo` appends ` | Dropvia` to the unbranded localized page meaning and builds description/OG/Twitter tags; `pageMetadata` additionally adds canonical/hreflang/og:url for the seven main page types. File nodes use validated loader codes in their title/description; error boundaries use localized error metadata. They receive no canonical/hreflang/og:url. Route meta returns no tags for errors, leaving the root boundary as the single metadata owner. All variants remain noindex/nofollow. SSR tests inspect these tags without JavaScript and fetch the common PNG to verify MIME, signature and declared dimensions.

The single social cover is `public/images/og/dropvia.png` for every page and language; `shared/seo/social-images.json` records its path and actual dimensions. URLs in metadata are absolute on `https://dropvia.fun`. Generation prompts, source logo, dimensions and hashes are recorded in `docs/social-image-manifest.json`. These static files do not add route discovery or preload requests. Adding a page requires localized title/description; the common cover and localized alt are applied automatically. Open Graph image properties follow https://ogp.me/; Twitter uses summary_large_image.

`/sitemap.xml` — resource route с HTTP200, application/xml UTF-8 и cache max-age3600. Берёт пути из общего `pagePaths` в shared/seo/metadata.ts, исключает status и добавляет EN/RU через тот же localizedPath, что canonical. Всего12 URL: home/prices/terms/privacy/api/signIn. Технические узлы и JSON API handlers не входят в этот реестр. robots.txt указывает https://dropvia.fun/sitemap.xml. Это явное уточнение владельца29October2026 вместо прежнего204; noindex страниц сохраняется до отдельного разрешения. Не задаём выдуманные lastmod/changefreq/priority. Unit tests разбирают XML, проверяют namespace и точный список адресов; HTTP tests проверяют200 без редиректа и совпадение canonical каждой страницы. Протокол: https://www.sitemaps.org/protocol.html.

## Переводы и темы

`react-i18next`17.1.9 + `i18next`26.5.11. Every provider creates its own synchronous initialized instance with local resources; immutable dictionaries can be shared, mutable language cannot. Language comes from URL, never browser storage or device detection. Language links preserve route/query/hash. English stays default regardless of Accept-Language. Locale key recreates providers on a language switch. No effect-fetch for translations or initial data.

CSS `prefers-color-scheme` chooses semantic light/dark tokens on first paint and when device appearance changes. Identical HTML in both themes; no bootstrap script, cookie or hydration suppression. `framer-motion`14.7.1 MotionConfig respects reduced-motion. `date-fns`4.4.0 formats policy dates and parses status timestamps; actual status times use explicit UTC.

## Работа с данными

TanStack Query5.105.0 owns client server-state. QueryClient is per provider/request, not shared across server renders. Status initialData is the loader snapshot; initialDataUpdatedAt is the loader receivedAt (checkedAt remains the generation time), staleTime/refetchInterval30s. Hidden/background polling disabled, offline requests paused by Query defaults, unmount abort signal and10s timeout. Failed refresh retains last data with a visible stale alert. Runtime parser rejects malformed/duplicate services.

Form: TanStack mutation POSTs JSON to `/api/v1/access-requests`; pending disables repeat submission,15s timeout, no automatic retries. Native no-JS form POSTs to `/?index` or `/ru?index`; index Router action calls the identical server handler and renders201 acknowledgement. Both paths validate input/origin/consent and bound streamed bodies. Native refresh can resubmit; real persistence must add idempotency.

See `docs/API.md` for seven operations and launch gates. Current contract returns acknowledgements without persistence/mail, file operations remain restricted. Status is generated data, not real monitoring. No database, authentication or object storage is implied.

API reference owns illustrative request/response fixtures in `pages/api/examples.ts`; the shared file representation lives in `entities/file/model.ts`. `EndpointReference` keeps response selection local to one method. Examples include authorized success/error contracts and protocol headers, without changing resource handlers. Native response selects and language tabs only change displayed code; they never execute the documented requests. Logical file paths and nullable public URLs are described in `docs/API.md`.

## Проверки и расширение

Sign-in is a standalone localized SSR route outside the marketing layout, with a compact brand/language header and shared SiteFooter. Its loader validates locale; its typed action invokes features/sign-in/api/submit.server.ts. A native Router Form sends email/password to this same route with username/current-password autocomplete. Client enhancement adds pending feedback and translated alerts; no-JS POST returns the same page and status. Requests are bounded to16KiB and checked for method, origin, media type and field shape. The owner requires at least8 UTF-16 units for the password; the shared validator enforces this and the existing1024-unit maximum on the client and server. The form uses noValidate and our own field error messages, rather than browser constraint popups. Invalid submissions focus the first invalid field and do not issue a client POST; editing updates existing errors. Server422 fieldErrors render under the same inputs even without JavaScript. No credential values are returned. Per the owner's stub contract, valid requests return400 with error=clientNotFound and a localized message. No identity backend or session issuance exists. The application does not log, persist or reflect credentials; HTML/data responses use no-store and noindex. The request-access link returns to the localized landing anchor. Real backend integration must add verification, session lifecycle and operational abuse controls before enabling successful login.

Unit tests cover validation, synthetic distribution, parser, language isolation and error sanitization. Playwright covers SSR/no-JS, form success/failure, API contracts, polling lifecycle, both languages/themes, layouts and axe. CI matrix Windows/Ubuntu retained. `npm run check` is the local complete gate.

Docker release: multi-stage Dockerfile assembles the SSR build and production dependencies into a non-root Node runtime; .dockerignore uses an explicit build-context allowlist. The owner's current release policy is validate → build → publish: strict vX.X.X/main ancestry, exact tagged SHA, linux/amd64 archive and SHA-256, then a separate contents:write GitHub Release publisher. Quality and runtime/CLI smoke are not called by this pipeline. The reusable-only Quality workflow remains dormant; local npm checks are available. `npm run test:release` tests the Git gate on temporary repositories. No registry or deployment is configured. Contract: `docs/DOCKER_RELEASE.md`.

Ubuntu host management is a separate Bash surface in scripts/dropvia.sh, installed by scripts/install-cli.sh. The CLI consumes public latest-release archive/checksum and uses Python3 stdlib for JSON/IP/version validation. Container labels store its bind/version; an exclusive flock serializes operations. install/reinstall and update verify the supported runtime profile before replacing anything; a temporary non-running probe compares full Docker HostConfig/Config and network membership against the expected profile. update retains the old container for rollback; destructive reinstall first saves the old image. No application FSD modules or global app state are added. CLI fixture tests and the standalone Docker lifecycle smoke remain available separately; release publication no longer invokes them. User-facing commands, bootstrap and limitations: docs/UBUNTU_CLI.md.

scripts/deploy.sh prepares an Ubuntu amd64/systemd host before that bootstrap: missing APT prerequisites, signed official Docker repository when needed, local Engine readiness, then the checked CLI installer with --install. It does not build images, migrate conflicting runtimes, alter app modules or bypass destructive confirmations. Package/service changes are covered by isolated command fixtures; no real OS install is implied by those tests. Entry command and operational limits: docs/DEPLOY.md.

Prerender can be enabled later for verified-static public routes using the installed framework API; never prerender private file URLs. Keep business behavior in feature/entity slices, not root layout. Add new dependencies only for an actual need. Do not add generic repositories, services, wrappers or global state before they carry behavior.

## Unlisted file server pages and public status memory

`/:lang?/_data/:uuid` is a standalone SSR route outside SiteHeader, with shared SiteFooter composed under the page inside its Providers. Default English and /ru are supported; uuid is the configured node code D01/D02, not a UUID format. The finite fileServers registry maps codes to existing download-01/download-02 service IDs. Unknown nodes or languages return404; future nodes must be explicitly registered with a corresponding service ID. The shared LanguageSwitch preserves the node/query/hash and supports native SSR navigation. Language links between the node language versions are explicitly permitted; there are no incoming global navigation links, no sitemap entry, no canonical/hreflang discovery links, and both robots metadata and X-Robots-Tag noindex/nofollow. No authentication wall is added; unlisted is not authorization.

getStatusSnapshot in the .server.ts entity owns a process-local snapshot containing only public generated telemetry. It lazily regenerates after60s and returns defensive copies. API/status/node loaders all read it, so refreshing a page does not redraw values. No timer, persistence or per-visitor map is needed. Restart resets memory and separate processes have separate snapshots; shared monitoring/persistence is a future integration. No real uptime or network measurements are implied.

Entity query options share30s visible-only polling, bounded requests, parsing and cancellation. Loaders send receivedAt separately from checkedAt so an aged cached snapshot does not trigger an unnecessary hydration refetch. Failed polling retains the last snapshot and shows a stale error. The node page uses the existing operational/degraded semantics, preserving the distinction between a degraded service and a proven full outage.
