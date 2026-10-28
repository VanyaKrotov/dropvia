# Dropvia

Инженерная основа сервиса загрузки, передачи и скачивания файлов для [dropvia.fun](https://dropvia.fun). React 19, TypeScript, React Router 8 Framework Mode с SSR, Tailwind 4 и Node.js. Публикация и deployment не выполнялись.

Сейчас доступен честный подготовительный экран: English по умолчанию на `/`, русский на `/ru`, SSR-переключение языка, canonical и hreflang. Аудитория — обычные пользователи простого файлового хранилища. Передача файлов, серверное хранение, аккаунты и меры защиты ещё не определены и не реализованы. `DESIGN.md` сохранён как главный визуальный источник: это reference AuthKit, продуктовые пробелы явно перечислены в [LANDING_STRUCTURE](docs/LANDING_STRUCTURE.md).

## Начало работы

Node.js **22.22.3** (`.nvmrc`) и npm 11.16.0 — проверенная среда. Runtime Router требует Node ≥22.22.0, некоторые dev-зависимости — ≥22.22.2. Для другого LTS сначала проверить engines полного dependency tree.

```sh
npm ci --include=dev
npx playwright install chromium
npm run dev
```

Dev server: `http://127.0.0.1:5173`. Lifecycle scripts зависимостей отключены в `.npmrc`; текущий toolchain использует опубликованные platform packages. Не включайте все scripts для новой зависимости: изучите конкретную потребность.

## Команды

| Команда                                   | Назначение                                                     |
| ----------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                             | Официальный React Router Vite dev server                       |
| `npm run lint`                            | ESLint 10, TypeScript и React Hooks, warnings запрещены        |
| `npm run typecheck`                       | Generated route types + strict TypeScript                      |
| `npm run format` / `npm run format:check` | Prettier; vendored skills и исходный DESIGN исключены          |
| `npm run test` / `npm run test:watch`     | Vitest + Testing Library                                       |
| `npm run build`                           | Production client и SSR server builds                          |
| `npm start`                               | Node server из `build/server/index.js`, по умолчанию порт 3000 |
| `npm run test:ssr`                        | HTTP HTML/metadata, no-JS, 404 и resource routes               |
| `npm run test:e2e`                        | Production server + Chromium mobile/tablet/desktop + axe       |
| `npm run skills:verify`                   | Manifests, источники, лицензии и SHA-256 ресурсов              |
| `npm run check`                           | Полная последовательность обязательных проверок                |

Playwright сам поднимает production server на `127.0.0.1:4173` и останавливает его; сначала нужен build. Скриншоты каждого размера — `test-results/**/page.png`, отчёт — `playwright-report/index.html`. Эти генерируемые файлы не хранятся в Git. В CI они загружаются как artifacts.

Для ручного production preview:

```sh
npm run build
npm start
```

Порт и hostname задаются стандартными `PORT` и `HOST` environment variables `react-router-serve`; secrets в клиентскую сборку не добавлять. Официальный default SSR entry использует явно закреплённый `isbot`, чтобы поисковые роботы получали завершённую разметку. Свой server/entry без необходимости не нужен.

## Codex и Agent Skills

Сначала [AGENTS.md](AGENTS.md), затем требования [DESIGN.md](DESIGN.md) и относящиеся local skills. Все 22 выбранных skill находятся в `.agents/skills/` и доступны после checkout без installer. Точные названия, commits, причины выбора и ограничения — [SKILLS.md](docs/SKILLS.md). Откройте новую реплику/сессию Codex, если каталог не обновился; при необходимости перезапустите Codex.

Codex обнаруживает manifests, но это не гарантирует их механического применения: `AGENTS.md` требует фактического чтения подходящего SKILL.md, references и проверки результата. CI проверяет целостность и качество кода; он не способен доказать, что агент следовал каждой текстовой инструкции.

Проверенные source snapshots установлены Skills CLI 1.7.4 с `-a codex --copy -y`, без `-g`. UI/UX Pro Max собран официальным Codex template renderer из закреплённого source commit; его проверенный source version не совпал с npm-публикацией, поэтому случайный другой npm release не исполнялся. Impeccable работает по references вручную, без скачивания engine и без hooks.

Не запускайте `skills update`/`experimental_install` вслепую: три manifest имеют локальные уникальные имена, UI/UX template генерируется, и direct reinstall может вернуть дубликаты или потерять adaptations. Обновление: выбрать новый commit → изучить diff/license/scripts/references → установить в отдельный temp → перенести только выбранный навык → повторить задокументированные aliases → обновить `docs/skills-sources.json` → `node scripts/snapshot-skills.mjs --write` → `npm run skills:verify` → review. Сам `snapshot-skills` ничего не скачивает и не запускает vendored code.

UI/UX search требует Python 3 (stdlib only):

```sh
python .agents/skills/ui-ux-pro-max/scripts/search.py "visible keyboard focus" --domain ux
```

Python — необязательный инструмент дизайнера, не runtime приложения и не зависимость CI. Taste optional scripts требуют Node 22 и Chromium; их рекомендации уступают утверждённой дизайн-системе.

## Документы и качество

- [ARCHITECTURE](docs/ARCHITECTURE.md): SSR request path, границы, версии, будущие file contracts.
- [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md): реальные tokens, responsive/type/focus/motion решения.
- [LANDING_STRUCTURE](docs/LANDING_STRUCTURE.md): факты, missing brief, весь текущий текст и SEO-план.
- [SKILLS](docs/SKILLS.md): выбор, install provenance, лицензии, discovery и конфликты.
- [VERIFICATION](docs/VERIFICATION.md): фактические команды, review и визуальные свидетельства.

GitHub Actions `Quality` настроен для Ubuntu и Windows. Branch protection/required status checks на GitHub не менялись: workflow станет выполняться после push. Обе подготовительные страницы имеют noindex. `/sitemap.xml` пока 204 без тела и не рекламируется в robots; валидный XML и Sitemap directive добавляются с первыми индексируемыми страницами при запуске продукта. Field CWV и полное соответствие WCAG требуют отдельных реальных измерений.
