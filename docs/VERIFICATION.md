# Проверка настройки Dropvia

Дата: 28 октября 2026. Исходный repo: main без commits, единственный пользовательский файл `DESIGN.md`. Он сохранён без изменений. Публикация, deployment, commits, push и GitHub settings не выполнялись.

## Выполненные проверки

| Проверка                                          | Фактический результат                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub API/tree/README/SKILL/license/history      | Проверены все указанные источники; данные сохранены в registry JSON                                                                          |
| Skills CLI 1.7.4 help/add/list                    | Локальная copy-установка, 22 навыка для Codex                                                                                                |
| Codex app-server skills/list forceReload          | 22 enabled repo skills, 0 project parse errors; `codex-skills-discovery.json`                                                                |
| `node scripts/snapshot-skills.mjs --write`        | Зафиксированы reviewed source refs и SHA-256 ресурсов                                                                                        |
| `npm run skills:verify`                           | 22 skills, 351 файлов; наличие manifests/license evidence, уникальность и hashes                                                             |
| UI/UX Pro Max Python search                       | Design-system запрос выполнен, альтернативная палитра отклонена как не соответствующая DESIGN; targeted focus query нашёл применимые правила |
| `npm install --include=dev --ignore-scripts`      | Зависимости установлены; npm audit сообщил 0 vulnerabilities                                                                                 |
| `npm run test`                                    | 2 unit/component tests passed; до реализации оба ожидаемо падали                                                                             |
| `npm run typecheck`                               | Passed, generated route types и strict TS                                                                                                    |
| `npm run lint`                                    | Passed, ESLint 10, 0 warnings                                                                                                                |
| `npm run build`                                   | Client и server production builds созданы                                                                                                    |
| `npm run test:e2e`                                | 30 passed, Chromium desktop/tablet/mobile                                                                                                    |
| Locale RED/GREEN                                  | До реализации 2 проверки падали на `lang=ru` по умолчанию и 404 `/ru`; после реализации обе проходят                                         |
| `npm run format`                                  | Собственные исходники и документы отформатированы; upstream skills и DESIGN исключены                                                        |
| `npm ci --include=dev --ignore-scripts --no-fund` | Чистая установка из lock: 357 packages, audit 0 vulnerabilities                                                                              |
| `npm run check`                                   | Полностью завершился с exit 0: skills, format:check, lint, typecheck, 2 unit tests, production build, 30 Playwright cases                    |
| Review regression RED/GREEN                       | 3 проверки сначала упали на error title, языке /ru/missing и пустом sitemap; после исправлений проходят                                      |
| Lighthouse 13.6.0 mobile + desktop                | Фактически выполнен дважды, в том числе финальная production сборка; результаты ниже                                                         |

Playwright проверил SSR HTTP 200 с контентом, canonical/title/description/OG/Twitter/noindex; no-JS чтение, native disclosure и переключение на русский; настоящий 404 с корректным title/языком без canonical главной; robots и 204 для отложенного sitemap; en/ru SSR, language switch и reciprocal hreflang; отсутствие page/hydration console errors; keyboard skip link/focus; 320px reflow; reduced motion; axe WCAG A/AA rules. Это 10 сценариев на трёх Chromium projects. Автоматическая a11y проверка не подтверждает все критерии WCAG.

## Диагностика во время настройки

- TypeScript 7 выходит за текущие peer constraints typescript-eslint; выбран 6.0.3. ESLint 9 сначала рассматривался из-за jsx-a11y, но оказался EOL; выбран поддерживаемый ESLint 10, несовместимый plugin исключён. Проверки a11y выполняются axe и браузером.
- Router default SSR entry автоматически пытался добавить isbot. Зависимость закреплена явно (5.2.2); dev dependencies восстановлены. Больше нельзя полагаться на автоматические изменения package.json при typegen.
- В Windows sandbox Vite config runner первоначально интерпретировал CommonJS lodash как ESM (`require is not defined`). Повторная проверка вне файловой виртуализации и с полным dependency set собрала приложение без patch node_modules или изменения SSR architecture. Финальные SSR/build/browser команды запускаются в обычном локальном окружении с tool escalation. Для CI это ограничение данной sandbox-среды не предполагается, но Linux CI ещё не исполнялся.
- В browser logs есть ожидаемый server log для проверяемого 404 и предупреждения NO_COLOR/FORCE_COLOR. Пользовательский HTML не раскрывает trace. Это не провал тестов.
- UI/UX source package version и npm version не совпали; использован проверенный commit renderer. Impeccable binary detector и hooks не запускались.

## Визуальная и performance проверка

Первый набор screenshots desktop/tablet/mobile просмотрен. Обнаружено появление скрытого skip link в full-page capture после прокрутки; его hiding переведён на стандартный clipped pattern, screenshot возвращает scroll к началу. Размер desktop зафиксирован 1440×1000, tablet 768×1024, mobile 390×844 (device scale влияет на физический размер PNG).

Итоговые английские и русские screenshots просмотрены на всех трёх размерах. Типографическая иерархия сохраняется, русский текст не обрезается, header с языковыми ссылками не переполняется, native disclosure остаётся понятным и доступным. Переключатель выделяет текущий язык текстом/подчёркиванием, без цветового кодирования. Визуальные ссылки и native controls соответствуют состояниям. Никаких вымышленных операций, progress, цифр или отзывов. В рамках подготовительного экрана существенных визуальных дефектов после исправления skip link не осталось; полного продуктового flow для оценки ещё нет.

Preview PNG сохранены локально в `artifacts/preview/{desktop,tablet,mobile}-{en,ru}.png`; keyboard/disclosure state — `test-results/**/page.png`. Оба каталога игнорируются Git. Проверка по Impeccable audit/craft-floor references выполнена вручную, дополнена Web Interface Guidelines, axe и браузером; binary detector не запускался. Пinned стиль DESIGN имеет приоритет над конфликтующими вкусовыми defaults. Это не выдаётся за полный автоматический Impeccable command run.

| Финальный lab run | Performance | Accessibility | Best Practices | SEO |    LCP | CLS | TBT |
| ----------------- | ----------: | ------------: | -------------: | --: | -----: | --: | --: |
| Mobile            |         100 |           100 |            100 |  66 | 0.763s |   0 | 0ms |
| Desktop           |         100 |           100 |            100 |  66 | 0.209s |   0 | 0ms |

Lighthouse 13.6.0, Chrome for Testing 156, Windows, localhost production server. Mobile: simulated RTT 150ms, throughput 1638.4Kbps, CPU slowdown 4×; desktop preset: RTT 40ms, throughput 10240Kbps, CPU 1×. Это лабораторный снимок простой подготовительной страницы без файлового backend, не field CWV и не прогноз реальной upload performance. INP не измерен; TBT не заменяет INP. Единственный провал SEO audits — `is-crawlable`, вызванный намеренным noindex. Полные JSON/HTML reports — `artifacts/quality/lighthouse-{mobile,desktop}.report.{json,html}`, компактные настройки и результаты сохранены в `docs/lighthouse-summary.json`.

## Независимый review

Отдельные Standards и Spec review прошли по полному снимку исходников/настроек, поскольку git baseline ещё не имел commits. Найдены 3 уникальных P2: error title, язык русской 404, пустой XML sitemap. Все исправлены и покрыты HTTP regressions; оба reviewer отдельно повторно воспроизвели исправленные handlers и подтвердили устранение исходных замечаний. Подробности — `docs/REVIEW.md`. Свойства безопасности и весь сторонний код полностью не аудировались.

Локальные серверы, запущенные для тестов и Lighthouse, остановлены. `DESIGN.md` повторно проверен: SHA-256 `380300d93fa0080c01386696b3ff8547a73eafe8d588285c25ed32e923069189`.

## Ограничения

- Product storage/upload backend, quotas, TTL, auth, privacy/security claims и дата запуска не утверждены. Текущий экран честно сообщает отсутствие операций.
- Подготовительные страницы имеют noindex; endpoint sitemap пока 204, валидный XML откладывается до первого indexable URL. Это намеренно ограничивает indexability/SEO score до запуска.
- Field CWV, настоящий Safari/WebKit, Firefox, физические мобильные устройства и screen-reader session не измерялись.
- GitHub Actions настроен для Ubuntu/Windows, но remote CI ещё не запускался. Branch protection и required checks на сервере не включались.
- Скиллы дают повторяемый процесс и проверяемые файлы; они не являются технической гарантией безошибочного поведения агента.
