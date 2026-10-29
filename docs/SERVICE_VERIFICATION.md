# Проверка реализации сервиса — 28 октября 2026

Этот отчёт относится к новому сайту и FSD-миграции после baseline `fdc7fb7`. Старый `docs/VERIFICATION.md` сохраняет историю первоначальной основы. Все результаты ниже получены фактическими запусками в этой задаче; remote CI не запускался.

## Установка и инструменты

Перед установкой проверены npm registry metadata (version, peerDependencies, license) и официальные docs. Выполнено:

```text
npm install --save-exact framer-motion@14.7.1 date-fns@4.4.0 react-i18next@17.1.9 i18next@26.5.11 @tanstack/react-query@5.105.0 --ignore-scripts --no-fund
```

Добавлено11packages, аудит369packages,0vulnerabilities. Не выполнялись удалённые shell installers, hooks или глобальные установки.22локальных skills/351файл не изменены, `skills:verify` проходит.

## Финальные автоматические проверки

`npm run check` завершился с exit0 после исправлений review:

| Проверка      | Результат                                                   |
| ------------- | ----------------------------------------------------------- |
| skills:verify | 22skills,351files, manifests/licenses/pins/SHA-256 verified |
| format:check  | Prettier passed                                             |
| lint          | ESLint passed, включая обратные FSD imports                 |
| typecheck     | Router typegen + TypeScript strict passed                   |
| test          | 4files,17unit tests passed                                  |
| build         | Production client и SSR bundles built                       |
| test:e2e      | 57cases passed:19scenarios × desktop/tablet/mobile;26.7s    |

Отдельно выполнен `npm run test:ssr -- --output=artifacts/ssr-final --reporter=line`: 5 проверок пройдены, exit 0. Вывод сохранён отдельно, чтобы не удалять скриншоты полного набора.

Unit scope: email/consent/origin/media/body-boundary validation, no personal-data echo, native form encoding,89% whole-snapshot distribution, malformed/duplicate status rejection, language-instance isolation and URL resolution, localized/sanitized route errors.

Browser scope: main content and metadata in HTTP HTML, Russian language/canonical, missing pages404, no-JS reading/disclosure AND native POST201/success, JSON/resource contracts including OPTIONS405+Allow, form success and failed-submit retry retaining email, code language tabs, path/query/hash-preserving language switch, status manual refresh/failure retaining last snapshot, no immediate hydration refetch,30s polling and unmount cancellation, skip/focus,320px reflow/reduced-motion, all six page types in both languages and themes on three viewports.72page/theme/viewport axe scans found no violations for WCAG2A/AA/2.1AA/2.2AA tags. This does not certify complete WCAG compliance.

## Reproduced failures and corrections

- Initial contract tests RED: upload endpoint404 instead of403, original landing lacked new content. Implemented routes/pages, then GREEN.
- Typecheck exposed obsolete Russian route after migration and widened service state typing; removed superseded preparatory code and annotated validated state result. No ts-ignore or relaxed strict settings.
- First expanded browser suite:51passed,3failed. Native form posted to parent route405. Fixed index target `?index` and SSR-visible confirmation; focused no-JS regression passed, then full suite passed.
- Standards review found two additional P2: OPTIONS invoked GET-only loaders; direct fragment links produced hydration mismatch and lost hash. Added regressions and observed both RED against production build; explicit method guards and activation-time hash fixed both. Final suite57passed. Independent reviewer rechecked fresh build/JSDOM and confirmed both resolved.

## Lighthouse and visual review

Executed Lighthouse13.6.0 against the current local production root URL, mobile and desktop presets, headless Chromium156. Results saved as JSON/HTML in ignored `artifacts/quality/service-{mobile,desktop}.report.*`; compact committed evidence: `docs/service-lighthouse-summary.json`.

| Preset  | Performance | Accessibility | Best Practices | SEO | LCP   | CLS | TBT |
| ------- | ----------- | ------------- | -------------- | --- | ----- | --- | --- |
| Mobile  | 100         | 100           | 100            | 66  | 761ms | 0   | 0ms |
| Desktop | 100         | 100           | 100            | 66  | 207ms | 0   | 0ms |

SEO is intentionally reduced by noindex before launch approval. These are localhost laboratory measurements of the landing page, not field Core Web Vitals or file-transfer performance. INP was not measured; TBT is not INP. Full report config records simulated network/CPU conditions.

Actual screenshots generated for all page/language/theme combinations; main agent inspected representative full-page desktop/tablet/mobile captures and additional readable viewport captures for Russian mobile hero/form and desktop API/hero. Stable ignored preview files: `artifacts/service-preview/`. Browser suite captures: `test-results/`, report: `playwright-report/`. Native theme changes use CSS, no hydration suppression. No browser page errors in the tested routes. Expected404 server diagnostic logs and NO_COLOR/FORCE_COLOR tool warnings do not indicate leaked HTML or browser errors.

Manual Impeccable technical audit/craft floor and current web-design-guidelines informed review. Its binary engine/hooks/automatic detector were not executed. See `docs/SERVICE_REVIEW.md` for independent Standards/Spec findings and fixes.

## Preserved source and limitations

DESIGN.md SHA-256 unchanged: `380300d93fa0080c01386696b3ff8547a73eafe8d588285c25ed32e923069189`.

No deployment, push, commit, payment, external email, database, production monitoring or real file storage. Current acknowledgement201 discards data as requested; files remain403/404; statuses are synthetic. Pricing amounts/quotas and legal operator/jurisdiction/providers/retention are not approved. Legal pages are authored for this site's current behavior and need owner/legal review before real launch. See `docs/API.md` for the concrete production integration gates.

Physical-device testing, WebKit/Firefox, field INP/CWV, real-user usability tests, comprehensive legal/security certification and remote GitHub Actions were not performed. Chromium emulation and axe are explicitly limited evidence. All temporary audit servers were stopped.
