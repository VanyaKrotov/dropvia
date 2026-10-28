# Архитектура Dropvia

## Состояние и решение

На старте существовал только `DESIGN.md`, без package.json и commits. Исходный файл сохранён. Принята feature-oriented организация React Router Framework Mode с настоящим SSR на Node.js.

| Слой                        | Ответственность                                                                 | Ограничение                                |
| --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `app/root.tsx`              | HTML document, URL locale, Links/Meta/Scripts, Outlet, безопасный ErrorBoundary | Не содержит продуктовую логику             |
| `app/routes.ts`             | Явный реестр маршрутов                                                          | Нет параллельного client router            |
| `app/routes/`               | Route modules, metadata, resource responses                                     | Компактные, типы `./+types/*` генерируются |
| `app/features/coming-soon/` | Честный подготовительный экран                                                  | Не принимает файлы и персональные данные   |
| `app/styles/app.css`        | Tailwind theme и базовые состояния                                              | Согласован с `DESIGN.md`                   |
| `tests/e2e/`                | Production SSR, no-JS, metadata, 404, keyboard, axe, responsive                 | Не заменяет визуальный просмотр            |
| `.agents/skills/`           | Проверенные локальные навыки                                                    | Не попадают в runtime bundle               |
| `docs/`                     | Решения, контент и воспроизводимые свидетельства                                | Факты отделены от планов                   |

Общие `components/ui`, `components/layout`, hooks и server modules появятся при реальном использовании, а не заранее.

## Выполнение запроса

`HTTP request → @react-router/serve → server build → route module → React HTML → hydration`.

Vite использует официальный `reactRouter()` plugin. `react-router.config.ts` явно включает `ssr: true`. `react-router build` создаёт `build/client` и `build/server/index.js`; `npm start` запускает официальный Node server. Framework default entry points обеспечивают server render и hydration; копировать их без причины не нужно.

`/` (English default) и `/ru` отдают локализованный текст и metadata до JavaScript. Язык HTML вычисляется из SSR router location (`useLocation` + общий `localeFromPath`), без browser APIs и лишнего loader запроса. Это работает даже на `/ru/missing`, когда Router не запускает loaders. Два компактных route modules переиспользуют один feature и metadata builder. Обычные языковые ссылки работают без JS, reciprocal hreflang включает en/ru/x-default. `/robots.txt` отдаёт text/plain; `/sitemap.xml` пока 204 без тела, поскольку индексируемых URL нет. Неизвестный путь возвращает 404, а не SPA fallback 200. В error HTML есть локализованный title и нет stack traces, raw error messages и canonical главной.

## Данные и будущие файлы

Серверных файловых данных и мутаций пока нет, поэтому product loaders/actions не добавлены для формальности. Язык — часть router location, не загружаемые данные. Официальный default server entry использует явно закреплённый `isbot` 5.2.2 для завершённого bot rendering. Когда появится утверждённый upload contract:

- `loader` читает только необходимые безопасные данные; типы — `Route.LoaderArgs`, потребление — `useLoaderData<typeof loader>()` или `Route.ComponentProps`.
- `action` принимает серверные формы, валидирует `unknown`, возвращает field errors с HTTP 400 или redirect. `Form`/fetcher показывает pending и позволяет повторить ошибку.
- Node/storage/secrets изолируются в `.server.ts`. Клиент получает публичные модели, никогда ключи или внутренние paths.
- До загрузки определить размер, multipart/streaming, quotas, storage, TTL, авторизацию ссылок, abuse handling и политику удаления. Текущая основа этого не реализует и никаких гарантий не делает.
- Не хранить request/user state на уровне общего server module. Не применять Next.js caching и RSC APIs.

Feature импортирует общие primitives и lib; primitives не импортируют feature/routes. Не создавать слои-посредники, пока сложность действительно не появилась. Нет глобального store и дополнительных runtime UI-библиотек.

## Версии

React/DOM 19.3.1, React Router dev/node/serve/runtime 8.5.1, Vite 8.3.5, Tailwind/Vite adapter 4.3.3, TypeScript 6.0.3. TypeScript 7 доступен, но typescript-eslint пока декларирует TS `<6.1`. ESLint 10.13.0 поддерживается typescript-eslint и React Hooks plugin. `eslint-plugin-jsx-a11y` пока декларирует максимум ESLint 9; он исключён, поскольку ESLint 9 уже EOL. Accessibility проверяется axe, keyboard и браузером. Нет force/legacy-peer-deps. Node development baseline — 22.22.3; Router требует минимум 22.22.0. Точные transitive версии — package-lock.json.

## Prerender и SEO

SSR включён всегда. По мере появления подтверждённых статических страниц можно добавить `prerender: ['/approved-static-route']` рядом с `ssr: true`; API сначала сверить с docs установленной версии. Главная пока динамически SSR, чтобы smoke test проверял серверный путь. Приватные file links не prerender и не индексировать. Обе языковые версии подготовительные и имеют noindex. Endpoint sitemap зарезервирован и возвращает 204; пустой XML urlset не соответствует XSD, требующей минимум один URL. При запуске продукта обновить контент, robots metadata, валидный XML sitemap и robots Sitemap directive вместе с тестами.

## Контроль

ESLint: базовый TS, promises, React Hooks; Prettier — единственный formatter. Vitest + Testing Library проверяют безопасные пользовательские ошибки. Playwright запускает production server и проверяет SSR/no-JS и UI на трёх размерах; axe проверяет WCAG 2 A/AA, WCAG 2.1/2.2 AA rules, доступные движку. CI использует npm ci, pinned actions, минимальный read-only token.

Lifecycle scripts npm выключены через `.npmrc`. Текущий toolchain работает с опубликованными platform packages; если новая зависимость потребует install script, сначала изучить его и разрешить только конкретный обоснованный запуск. Не переключать ignore-scripts глобально.

## Официальные источники

- [React Router: installation](https://reactrouter.com/8.5.1/start/framework/installation), [rendering](https://reactrouter.com/8.5.1/start/framework/rendering), [route modules](https://reactrouter.com/8.5.1/start/framework/route-module).
- [React: effects](https://react.dev/learn/you-might-not-need-an-effect).
- [Tailwind: Vite](https://tailwindcss.com/docs/installation/using-vite), [theme variables](https://tailwindcss.com/docs/theme).
- Приоритет в разработке: документы пакета `node_modules/react-router/docs/` установленной версии.
