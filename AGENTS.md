# Dropvia: обязательные правила Codex

## Контекст и порядок работы

Dropvia (`https://dropvia.fun`) — сервис загрузки, передачи и скачивания файлов. Стек: React + TypeScript, React Router **Framework Mode с SSR**, официальный Vite plugin, Tailwind CSS, Node.js runtime. Next.js не используется.

Перед задачей:

1. Прочитай применимые `AGENTS.md`, определи область изменения.
2. Прочитай связанные требования `DESIGN.md`; перед новым экраном или лендингом прочитай его целиком. Не изменяй этот источник без запроса владельца.
3. Проверь фактические версии, архитектуру и существующие соглашения.
4. Выбери skills по матрице; открой **локальный** `.agents/skills/<имя>/SKILL.md` и нужные references. Загружай только относящееся к задаче. Не заявляй об использовании непрочитанного skill.
5. Для нетривиальной работы запиши краткий план с файлами, результатом и проверками. Когда пользователь уже поручил самостоятельное выполнение, продолжай без повторного согласования плана.
6. Внеси минимальное законченное изменение, проверь требования, код и реальный результат.
7. Выполни относящиеся проверки; в отчёте укажи фактические команды, результаты и ограничения. Не выдавай намерение или чужой отчёт за доказательство.

`DESIGN.md` — **стилевой референс AuthKit, а не продуктовая спецификация Dropvia**. Актуальные продуктовые факты — `PRODUCT.md`, требования последней задачи, `docs/PRICING.md` и `docs/API.md`. Реализован сайт с закрытой регистрацией, формой заявки и серверными контрактами-заглушками по запросу владельца. На публичных экранах не добавляй ярлыки «концепт»/«демо»; не превращай это в ложные обещания о реальном хранении, письмах, инфраструктуре или гарантиях. Не переносить функции или брендинг AuthKit. Владелец утвердил цены Plus/Standard/Advanced и состав опций из скриншота с исключениями: `docs/PRICING.md`. SSO и сквозное шифрование в Advanced — утверждённые требования тарифа, их backend ещё не реализован. Для отображения тарифов используй единый каталог `src/entities/plan/model.ts`; не возвращай старые Personal/Custom и не добавляй оплату или trial. До разрешённого запуска сохраняется `noindex`.

## Приоритеты

В рамках настраиваемых проектных инструкций: текущая явная задача → продуктовые требования `DESIGN.md` → архитектурные ограничения → официальные docs установленной версии → этот файл → skills → общие рекомендации. Системные инструкции и ограничения среды всегда действуют. При конфликте зафиксируй решение в документации и сохрани корректность, безопасность и продуктовый смысл.

## Матрица skills

Точные имена ниже соответствуют локальным manifest. Реестр, источники, commits и ограничения — `docs/SKILLS.md`. Проверка файлов: `npm run skills:verify`.

| Область                                      | Прочитать и применить                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| React-компоненты                             | `vercel-react-best-practices`, `vercel-composition-patterns`                                            |
| Routes, loaders, actions, SSR, metadata      | `react-router`, `vercel-react-best-practices`; обязательно `react-router/references/framework-mode.md`  |
| Новый лендинг/секция                         | `dropvia-frontend-design`, `ui-ux-pro-max`, `design-taste-frontend`, `copywriting`, `site-architecture` |
| Качество взаимодействий, Apple-style, motion | `apple-design`, `dropvia-frontend-design`                                                               |
| Полировка / UI-аудит                         | `impeccable` (audit/critique/polish reference по задаче), `web-design-guidelines`                       |
| Маркетинговый текст                          | `copywriting`, затем `copy-editing`                                                                     |
| Структура сайта и SEO                        | `site-architecture`, `content-strategy`, `dropvia-seo-audit`                                            |
| Structured data                              | `schema`, только подтверждённые сущности                                                                |
| Конверсионный сценарий                       | `cro`, когда есть реальное действие и аудитория                                                         |
| Архитектура и рефакторинг                    | `codebase-design`, `code-review`                                                                        |
| Сложная новая функциональность               | `writing-plans`, `dropvia-test-driven-development`                                                      |
| Ошибки                                       | `systematic-debugging`, `verification-before-completion`                                                |
| Финальный отчёт о проверках                  | `verification-before-completion`                                                                        |

### Обязательная адаптация внешних рекомендаций

- Единственный источник routing — актуальный `react-router` из `remix-run/react-router`. Архивный `react-router-framework-mode` заменён официальным преемником, второй skill не устанавливать.
- Vercel: применяй общие React, bundle, async и composition правила. Не переносить `next/*`, RSC, `use server`, Next caching, `after()`, `next/dynamic`, server actions или client directives в этот Framework SSR проект. `React.cache` не является кэшем обычных loaders. Code splitting даёт Router; добавляй `lazy` только по измеримой необходимости. Не подавляй hydration warnings вместо исправления причины.
- `DESIGN.md` выше вкусовых запретов skills: dark palette, pill controls, 16px panels и разрешённый Skywash остаются. Taste не вправе требовать четыре изображения, восемь анимаций, случайное новое направление или выдуманные примеры. Никаких декоративных эффектов ради прохождения его детектора. Apple — принципы качества, не копирование бренда; motion и blur не обязательны.
- Владелец отдельно поручил заменить hero HTML-макет сгенерированными изображениями desktop/mobile web кабинета. Ресурсы: `public/images/dashboard/`, EN/RU и обе темы; provenance и prompts — `docs/dashboard-image-manifest.json`. Это маркетинговая иллюстрация интерфейса, не реализация личного кабинета. Не возвращать повторяющиеся invitation badges: пояснение о закрытой регистрации остаётся у формы, а юридические/API ограничения сохраняются по смыслу.
- Impeccable используется **в ручном режиме**: launcher не запускать, бинарный engine не скачивать, hooks не устанавливать. Его собственный fallback: прочитать проектный контекст напрямую, затем нужный playbook и `reference/craft-floor.md` перед UI-правкой. Не перезаписывать `DESIGN.md` через init/document/doctor. Это осознанное ограничение установки.
- UI/UX Pro Max: локальный Python 3, только stdlib; команды используют путь этого skill, а не `${CLAUDE_PLUGIN_ROOT}`. Search output — рекомендация. Не сохранять сгенерированную альтернативную «истину» поверх `DESIGN.md`.
- Superpowers подключён выборочно. Не активировать `using-superpowers`, сторонние hooks, автоматические worktree/commit/push или весь workflow. TDD нужен для содержательного изменения поведения; конфиги, vendoring и простые обратимые визуальные правки проверяй подходящими проверками без формальных тестов. Не удаляй существующий код ради TDD-ритуала.
- `code-review`: Standards и Spec — раздельные проходы, для значимого изменения допустимы предусмотренные skill независимые review-агенты. Зафиксируй baseline и spec; для unborn repo используй полный снимок новых файлов и исходную задачу. Не требуй issue tracker, если требования уже в задаче. Review read-only; никаких внешних сообщений или публикации.
- Совпадения глобальных имён устранены префиксами `dropvia-frontend-design`, `dropvia-seo-audit`, `dropvia-test-driven-development`. Загружай эти локальные версии явно. Не менять глобальные skills пользователя.

## Архитектура

По задаче владельца29October2026 CTA общей шапки — Sign in / «Войти», ведёт на `/sign-in` или `/ru/sign-in`. Закрытая регистрация сохраняется: под email/password формой ссылка на локализованный `#request-access`. Отдельный SSR-экран имеет компактную шапку с языком и общий подвал. POST отправляется на тот же сервер; явный контракт заглушки —400 с локализованной ошибкой «Клиент с такими данными не найден». Успешного входа, cookies или tokens пока нет; не логировать, не сохранять и не отражать credentials в ответах. Заявки в hero/тарифах/подвале сохраняют своё действие.

Архитектура FSD в `src/`: `app` (Framework SSR, route adapters, providers, styles) → `pages` → `widgets` → `features` → `entities` → `shared`. Импорты направлены вниз; не импортируй app/страницы из нижних слоёв и соседние slices без обоснованного контракта. ESLint ограничивает обратные импорты между слоями. `src/app/routes.ts` регистрирует компактные route modules; `root.tsx` отвечает за HTML и errors. `pages` компонуют экраны, `features/request-access` — сценарий заявки, `entities/service-health` — статус, `shared` — i18n/UI/HTTP/metadata. Не создавай пустые директории, barrel exports, круговые зависимости, service-слои и универсальные компоненты с десятками флагов.

Используются запрошенные владельцем `framer-motion`, `date-fns`, `react-i18next`/`i18next`, `@tanstack/react-query`. Route loader/action остаются серверными границами; Query не заменяет SSR. `QueryClient` и экземпляр переводов создаются на экземпляр дерева, не как изменяемый singleton сервера. Status получает initialData из loader, staleTime30s, polling30s только для открытого экрана, отмена при unmount, ошибка с сохранением последнего снимка. Мутации не повторять автоматически. Закрытые file endpoints возвращают403/404; не открывать доступ без следующего требования. Заглушка заявки201 не является долговременным хранилищем или отправкой почты.

SOLID применять по необходимости; DRY без преждевременных абстракций; KISS/YAGNI. Высокая связность внутри, минимальная между модулями; небольшие сфокусированные функции, явные стабильные типизированные интерфейсы, композиция, предсказуемые ошибки. Новая зависимость требует конкретной пользы и проверки совместимости/лицензии. Предпочитай нативные API.

## React и TypeScript

Внутренние импорты используют aliases из tsconfig.json: `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`. Имена совпадают со слоями; не добавляй дубли вроде `@feature` или barrel exports ради алиаса. Vite и Vitest читают paths через встроенный `resolve.tsconfigPaths`; не дублируй карту в resolve.alias. Ограничения FSD сохраняются и для aliases. Исключения: generated `./+types/*` React Router, CSS @import и относительные файловые URL в Node scripts остаются штатными.

- Только функциональные компоненты, семантический HTML, понятные props и композиция. Бизнес-логику отделяй от представления, когда она появилась. Не создавай глобальный state, hooks и wrappers без потребности.
- Вычисляемое состояние вычисляй при render; `useEffect` — синхронизация с внешней системой. Не добавляй `useMemo`/`useCallback` без причины, избегай лишних подписок и ререндеров.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. `any` только с документированным исключением; не скрывай ошибки через `@ts-ignore`. Используй `unknown` на недоверенных границах, runtime validation, discriminated unions для сложных состояний, type-only imports и минимум casts.
- Внешние payload types отделяй от внутренних моделей. Не отправляй secrets в loaderData; `.server.ts` для серверных функций и секретов.

## React Router SSR

- Перед генерацией проверь `package.json`/lock и docs `node_modules/react-router/docs/`; если их нет — version-matched официальные docs.
- `ssr: true`, plugin `@react-router/dev/vite`, route modules, generated `./+types/*`. Не заменять Framework Mode на `BrowserRouter`/SPA.
- Серверные данные — `loader`; изменения формы — `action` и `Form`/fetcher. Используй `useLoaderData<typeof loader>()` или типизированные `Route.ComponentProps`. Не добавляй loader для константы ради формальности.
- Ошибки, pending/empty/validation states обязательны для соответствующего сценария. После action используй штатную revalidation. Никакого повторного effect-fetch после hydration без причины.
- Не читать `window`, `document`, `localStorage` при import/render/loader на сервере. Стабильная первая разметка, без random/time/locale mismatch. Основное содержимое и metadata должны присутствовать в HTTP HTML без JS.
- SSR остаётся основой. Prerender добавляй по маршрутам после подтверждения статичности данных, используя API установленной версии; приватные страницы и file links не prerender.

## Дизайн, контент, SEO

До компонентов нового лендинга: извлеки факты `DESIGN.md` → аудитория и value proposition с подтверждением → структура и сценарий → законченные тексты → tokens → UI. Обнови `docs/LANDING_STRUCTURE.md` и `docs/DESIGN_SYSTEM.md`. Неподтверждённые поля помечай в документах; не выводи заглушки в готовый интерфейс.

Не выдумывай отзывы, пользователей, цены, лимиты, скорость, шифрование, гарантии, срок хранения или функции. Не используй lorem ipsum, клише, keyword stuffing, AI-маркетинг. CTA описывает доступное действие. Основной язык — английский (`/`), русский — `/ru`. Все пользовательские тексты и сообщения переводить; язык определяется URL на сервере, без localStorage/автоматического редиректа. Переключение языка — реальные ссылки. Поддерживай правильные html lang, canonical и reciprocal hreflang (en, ru, x-default); обе версии пока noindex.

Tailwind 4 theme variables и CSS custom properties в `src/app/styles/site.css` задают цвета, типографику, шаг4px, интервалы, радиусы, elevation, контейнеры, breakpoints, motion и focus. Обе темы следуют `prefers-color-scheme` и меняются без JS; новая явная задача расширяет dark-only совет референса. Тёмная палитра и Skywash сохранены, светлая задаётся семантическими эквивалентами. MotionConfig reducedMotion=user; контент остаётся видимым без JS. Не копируй неверный `#2f343` из референса: верное значение `#2f343e`. Не распространяй `@apply`, произвольные значения и class utilities без пользы. Без декоративного looping motion. Явное исключение владельца: медленный pulse точек сервисов на странице статуса, только без reduced motion; текстовые статусы всегда видимы. Проприетарные шрифты не скачивать без лицензии.

Публичные индексируемые страницы: один смысловой H1, правильные heading levels, уникальные title/description, canonical на `https://dropvia.fun`, OG/Twitter, читаемые URL, реальные internal links, sitemap и robots. Sitemap содержит только существующие canonical indexable 200 URLs. Пока весь сайт до разрешённого запуска — `noindex, nofollow`; `/sitemap.xml` возвращает204 без тела, robots не рекламирует sitemap. Не публикуй пустой urlset: XSD требует хотя бы один URL. При запуске добавить валидный XML, языковые canonical страницы и Sitemap directive вместе с обновлением тестов. Robots разрешает прочитать noindex; robots не является защитой файлов. Приватные transfer/download страницы по умолчанию `noindex` и исключены из sitemap. Structured data только по подтверждённым фактам; не публикуй фиктивные ratings/FAQ/security claims.

## Accessibility и производительность

WCAG 2.2 AA: клавиатура, видимый focus, skip link, labels и ошибки форм, достаточный контраст, альтернативы drag, удобные touch targets, zoom/reflow, reduced motion, доступные names, safe areas. Нативные controls прежде ARIA. Hover — не единственный сигнал. Изображения с размерами, responsive sources и lazy loading ниже первого экрана; главный visual не lazy.

Цели, не гарантии: Lighthouse Performance ≥90, Accessibility/Best Practices/SEO ≥95; LCP ≤2.5s, CLS ≤0.1, INP ≤200ms. Измеряй реалистичные mobile/desktop conditions. Не выдавай lab measurements за field CWV. Временно noindex обоснованно снижает SEO score.

## Проверки и завершение

Для code changes: относящиеся тесты, `npm run typecheck`, `npm run lint`, `npm run build`; перед итогом `npm run format:check`, `npm run skills:verify`, `npm run test`. Для SSR/metadata — `npm run test:ssr`; значимых UI изменений — `npm run test:e2e`, реальные mobile/tablet/desktop screenshots и их просмотр. `npm run check` объединяет полный набор. Проверяй hydration/console errors и no-JS HTML. Axe — часть проверки, не сертификат WCAG.

При bugfix сначала воспроизведение и причина, затем регрессионная проверка. При сложной новой функции — red/green/refactor по наблюдаемому контракту. Не тестируй реализации, константы и косметику ради количества тестов. Перед завершением — code review по требованиям и стандартам, визуальная проверка созданных экранов; исправь существенные замечания.

Не утверждай, что тест/skill/CI/browser check прошёл, если он фактически не запускался. Отдельно перечисляй неисполненные проверки. GitHub Actions запускает команды в чистой среде; локальный успех не означает выполненный remote CI. Не публиковать, не deploy, не менять GitHub branch protection, не удалять пользовательский код и не включать внешние hooks без отдельного запроса.

## Технические страницы узлов

`/_data/:uuid` и `/ru/_data/:uuid` — публичные, но отсутствующие в навигации технические SSR-страницы. uuid здесь — код из конечного fileServers registry (D01/D02); неизвестные узлы404. Не добавлять входящие ссылки из общей навигации, sitemap entries, canonical/hreflang discovery или login gate. Явно разрешено переключение EN/RU внутри технической страницы: общий LanguageSwitch сохраняет код узла, query и hash. Под страницей подключается общий SiteFooter внутри Providers; компактная техническая шапка сохраняется. Исходящие ссылки ведут на основной сервис соответствующего языка, API, статус и поддержку. Public node details следуют контракту Dropvia, а не неподтверждённым HLS/TLS/репликации со скриншота.

Явное исключение для серверной памяти: `entities/service-health/status.server.ts` хранит только общий публичный сгенерированный снимок на60s и выдаёт защитные копии. Это не request/user/locale state. Все status loaders и API используют getStatusSnapshot; pure createStatusSnapshot остаётся генератором для тестов. QueryClient и i18n по-прежнему изолированы на дерево. checkedAt — время генерации; receivedAt из loader — свежесть полученных SSR данных для Query. Перезапуск сбрасывает память; процессы не разделяют кэш. Не называть эти значения измеренным мониторингом.
