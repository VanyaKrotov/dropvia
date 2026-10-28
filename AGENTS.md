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

В репозитории сейчас `DESIGN.md` — **стилевой референс AuthKit, а не продуктовая спецификация Dropvia**. Из задачи и уточнения владельца подтверждены название, домен, назначение простого файлового хранилища, аудитория обычных пользователей, английский по умолчанию и русский. Пробелы перечислены в `docs/LANDING_STRUCTURE.md`. Не превращай упоминания SSO, MFA, брендинга или темы из AuthKit в функции Dropvia. До утверждения функциональности сохраняй честный подготовительный экран и `noindex`; не изображай рабочую загрузку файлов.

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
- Impeccable используется **в ручном режиме**: launcher не запускать, бинарный engine не скачивать, hooks не устанавливать. Его собственный fallback: прочитать проектный контекст напрямую, затем нужный playbook и `reference/craft-floor.md` перед UI-правкой. Не перезаписывать `DESIGN.md` через init/document/doctor. Это осознанное ограничение установки.
- UI/UX Pro Max: локальный Python 3, только stdlib; команды используют путь этого skill, а не `${CLAUDE_PLUGIN_ROOT}`. Search output — рекомендация. Не сохранять сгенерированную альтернативную «истину» поверх `DESIGN.md`.
- Superpowers подключён выборочно. Не активировать `using-superpowers`, сторонние hooks, автоматические worktree/commit/push или весь workflow. TDD нужен для содержательного изменения поведения; конфиги, vendoring и простые обратимые визуальные правки проверяй подходящими проверками без формальных тестов. Не удаляй существующий код ради TDD-ритуала.
- `code-review`: Standards и Spec — раздельные проходы, для значимого изменения допустимы предусмотренные skill независимые review-агенты. Зафиксируй baseline и spec; для unborn repo используй полный снимок новых файлов и исходную задачу. Не требуй issue tracker, если требования уже в задаче. Review read-only; никаких внешних сообщений или публикации.
- Совпадения глобальных имён устранены префиксами `dropvia-frontend-design`, `dropvia-seo-audit`, `dropvia-test-driven-development`. Загружай эти локальные версии явно. Не менять глобальные skills пользователя.

## Архитектура

Сохраняй работающую структуру. `app/routes.ts` регистрирует компактные route modules; `root.tsx` отвечает за HTML, metadata, outlet и errors. UI функциональности хранится в `app/features/<feature>/`. Общие UI-примитивы — `app/components/ui`, layout — `app/components/layout`, только при реальном повторном использовании. Не создавай пустые директории, barrel exports, круговые зависимости, service-слои и универсальные компоненты с десятками флагов.

SOLID применять по необходимости; DRY без преждевременных абстракций; KISS/YAGNI. Высокая связность внутри, минимальная между модулями; небольшие сфокусированные функции, явные стабильные типизированные интерфейсы, композиция, предсказуемые ошибки. Новая зависимость требует конкретной пользы и проверки совместимости/лицензии. Предпочитай нативные API.

## React и TypeScript

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

Tailwind 4 theme variables и CSS custom properties задают цвета, типографику, шаг 4px, интервалы, радиусы, elevation, контейнеры, breakpoints, motion и focus. Не копируй неверный `#2f343` из референса: верное значение в его таблице — `#2f343e`. Не распространяй `@apply`, произвольные значения и class utilities без пользы. Оформление без лишних карточек, бейджей, иконок, blur, glows и looping motion. Проприетарные шрифты не скачивать без лицензии.

Публичные индексируемые страницы: один смысловой H1, правильные heading levels, уникальные title/description, canonical на `https://dropvia.fun`, OG/Twitter, читаемые URL, реальные internal links, sitemap и robots. Sitemap содержит только существующие canonical indexable 200 URLs. Обе подготовительные страницы — `noindex, nofollow`; до появления индексируемых URL `/sitemap.xml` возвращает 204 без тела, robots не рекламирует sitemap. Не публикуй пустой urlset: XSD требует хотя бы один URL. При запуске добавить валидный XML, обе языковые canonical страницы и Sitemap directive вместе с обновлением тестов. Robots разрешает прочитать noindex; robots не является защитой файлов. Приватные transfer/download страницы в будущем по умолчанию `noindex` и исключены из sitemap. Structured data только по подтверждённым фактам; не публикуй фиктивные ratings/FAQ/security claims.

## Accessibility и производительность

WCAG 2.2 AA: клавиатура, видимый focus, skip link, labels и ошибки форм, достаточный контраст, альтернативы drag, удобные touch targets, zoom/reflow, reduced motion, доступные names, safe areas. Нативные controls прежде ARIA. Hover — не единственный сигнал. Изображения с размерами, responsive sources и lazy loading ниже первого экрана; главный visual не lazy.

Цели, не гарантии: Lighthouse Performance ≥90, Accessibility/Best Practices/SEO ≥95; LCP ≤2.5s, CLS ≤0.1, INP ≤200ms. Измеряй реалистичные mobile/desktop conditions. Не выдавай lab measurements за field CWV. Временно noindex обоснованно снижает SEO score.

## Проверки и завершение

Для code changes: относящиеся тесты, `npm run typecheck`, `npm run lint`, `npm run build`; перед итогом `npm run format:check`, `npm run skills:verify`, `npm run test`. Для SSR/metadata — `npm run test:ssr`; значимых UI изменений — `npm run test:e2e`, реальные mobile/tablet/desktop screenshots и их просмотр. `npm run check` объединяет полный набор. Проверяй hydration/console errors и no-JS HTML. Axe — часть проверки, не сертификат WCAG.

При bugfix сначала воспроизведение и причина, затем регрессионная проверка. При сложной новой функции — red/green/refactor по наблюдаемому контракту. Не тестируй реализации, константы и косметику ради количества тестов. Перед завершением — code review по требованиям и стандартам, визуальная проверка созданных экранов; исправь существенные замечания.

Не утверждай, что тест/skill/CI/browser check прошёл, если он фактически не запускался. Отдельно перечисляй неисполненные проверки. GitHub Actions запускает команды в чистой среде; локальный успех не означает выполненный remote CI. Не публиковать, не deploy, не менять GitHub branch protection, не удалять пользовательский код и не включать внешние hooks без отдельного запроса.
