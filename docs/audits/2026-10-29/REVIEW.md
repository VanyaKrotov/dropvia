# Аудит качества кода Dropvia — 29 октября 2026

## Область и метод

Проверена текущая рабочая копия: runtime в src/, unit/E2E, собственные scripts, конфигурация TypeScript/ESLint/Vite/React Router/Playwright и GitHub Actions. Исходный снимок94 файлов,9743 строки и SHA-256 каждого файла — baseline.json. Git HEAD fdc7fb792b9044a5990c3b76936de9284bae0396 содержит прежний подготовительный экран, поэтому один git diff не охватывает весь новый untracked src/. Vendored skills, node_modules и generated build не переписывались.

Основания: текущая задача, AGENTS.md, PRODUCT.md, DESIGN.md, docs/ARCHITECTURE.md, docs/API.md и docs/PRICING.md. Применены локальные code-review, codebase-design, React/Router рекомендации, TDD и verification-before-completion. Независимые read-only проходы Standards и Spec дополнены основным аудитом серверных границ и проверок. Ни один внешний review не заменяет фактический запуск команд.

В просмотренном scope критических дефектов P0/P1 не выявлено. Подтверждённые проблемы ниже исправлены; это оценка проверенного состояния, не доказательство отсутствия любых возможных дефектов.

## Standards

| ID  | Приоритет               | Проблема и исправление                                                                                                                                                                                                   | Проверка                                                                                                                             |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | P2                      | shared/server/http.ts: apiError принимал HeadersInit, но object spread терял Headers и tuple arrays. Заголовки теперь объединяются через Headers; исходные no-store/nosniff сохраняются.                                 | Регрессия для трёх разрешённых представлений; два случая падали до исправления, затем прошли.                                        |
| S2  | P2                      | features/request-access/api/submit.server.ts: сравнение media type было чувствительно к регистру/пробелу перед параметрами. Добавлена нормализация trim/toLowerCase, как у sign-in.                                      | Application/JSON с charset раньше получал415, после исправления201.                                                                  |
| S3  | P2                      | app/routes/home.tsx: native HTML-ответ заявки терял action Cache-Control, а405 не содержал Allow. Route headers передаёт actionHeaders; Allow учитывает GET/HEAD/POST страницы. JSON Content-Type не переносится в HTML. | Прямые POST/PUT для EN/RU:201/no-store/text-html и405/Allow/no-store. До исправления HTTP-тест воспроизвёл отсутствие Cache-Control. |
| S4  | P2                      | entities/service-health/model.ts: Date.parse принимал не-ISO и нормализовал некорректные даты, после чего UI мог показывать «—». Проверяются ISO-форма, явный часовой пояс и календарная корректность parseISO.          | Отклоняются «1», текстовая дата, дата без зоны и30 февраля; принимаются ISO с Z и числовым смещением.                                |
| S5  | P3, сопровождение       | pages/legal/legal-page.tsx: два списка [0..5] могли молча скрыть следующий раздел политики. Навигация и содержание теперь используют один типизированный массив из соответствующего языкового словаря.                   | Typecheck и существующие SSR/browser проверки обеих политик и языков. Нового renderer или type casting нет.                          |
| S6  | P3                      | scripts/check-codex-skills.mjs: повторный запуск всегда записывал дату2026-10-28. checkedOn теперь берётся из текущей UTC-даты. Исторический discovery JSON не переписан без реального запуска.                          | node --check; сам discovery launcher в этом аудите не запускался.                                                                    |
| S7  | P2, надёжность проверок | tests/e2e/service.spec.ts: один тест обходил24 экрана с axe и screenshots и ранее превышал30s при8 workers. Разделён на light/dark по12 экранов с теми же assertions и без увеличения timeout.                           | Финальный полный прогон описан ниже.                                                                                                 |

Независимый Standards-review после исправлений новых существенных замечаний не выявил. Три его исходных замечания — S4/S5/S6; S1/S2/S3/S7 подтверждены основным проходом.

## Spec

| ID  | Приоритет | Проблема и исправление                                                                                                                                                                                                                                                                                                                                         |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | P3        | shared/i18n/en.ts и ru.ts, api.healthBody: checkedAt ошибочно назывался временем ответа, а no-store — запретом любого кэша. Теперь описаны время генерации снимка, повторное использование сервером до60s и отдельная роль HTTP no-store. Реализация и89% synthetic snapshots не менялись.                                                                     |
| B2  | P2        | app/styles/site.css: «Конфиденциальность» обрезалась на мобильном, а document scrollWidth не ловил дефект из-за overflow clipping. H1 правовых страниц получил адаптивный clamp и защитный перенос; тест измеряет реальные line boxes при320px/390px. Red: правая граница406px при контейнере до300px; targeted green после исправления. DESIGN.md не изменён. |

Независимый Spec-review не нашёл других существенных расхождений. Намеренные ограничения не ошибочно записаны в баги: sign-in400/clientNotFound, gated file endpoints403/404, acknowledgement201 без persistence/mail и синтетический статус — утверждённые контракты этой стадии.

## Архитектурная оценка

- AST-разбор TypeScript с реальным module resolution:57 production TS/TSX-модулей,105 внутренних import edges,0 циклов,0 обратных FSD-импортов и0 запрещённых cross-slice связей. Полный граф — dependencies.json; generated route types и внешние пакеты не считаются узлами этого графа.
- Направление app → pages → widgets → features → entities → shared соблюдено. Компактные route adapters оправданы Framework Mode; фабрика маршрутов ради сокращения повторов ухудшила бы generated typing и явность.
- Серверные handlers/cache отделены в .server.ts. SSR данные не перезапрашиваются эффектом после hydration. QueryClient/i18n изолированы на дерево; процессный cache содержит только фиксированный публичный snapshot.
- Композиция CodeWindow, AccordionItem, browser frames и pricing catalog уменьшает реальное дублирование. Новых классов, service/repository layers, global state, hooks или библиотек ради паттернов не требуется.
- Custom sign-in validation едина для клиента и сервера; ошибки полей типизированы и не содержат credentials. Native no-JS путь сохранён. Подписки, observers, clipboard timers и motion cleanup просмотрены; abort выполняющегося status fetch дополнительно проверен браузером.
- Большие CSS-файлы и строковые API examples сами по себе не являются дефектом. Tokens централизованы, JSX-компоненты сфокусированы, examples отделены от отображения. Массовое перемещение CSS/переименование без изменения ответственности не проводилось.

## Доказательства и проверки

- npm ls --depth=0: установленные прямые версии соответствуют package.json, missing/invalid dependencies не обнаружены.
- Три targeted unit suites:26 проверок прошли после ожидаемых red failures для S1/S2/S4.
- Targeted HTTP regression для S3 прошла после исходного red missing Cache-Control.
- Новый browser сценарий подтвердил ERR_ABORTED уже выполняющегося refresh при уходе со страницы. Первые две версии его interception cleanup давали Route already handled / teardown timeout; fixture исправлен, production cancellation менять не понадобилось.
  -21 API snippets:7 JavaScript прошли Node --check,7 Python — compile без исполнения,7 cURL — POSIX shlex tokenization. Это проверка синтаксиса; реальные authorized upload/download по примерам не выполнялись. Результаты — example-syntax.json.
- EN331 и RU333 строковых сообщений: после учёта языковых plural suffixes отсутствующих ключей нет. Разница в количестве обусловлена формами множественного числа.
- Первый полный npm run check после серверных исправлений: exit0,46 unit и135 browser scenarios. После визуально обнаруженного B2 выполнены targeted red/green и повторная сборка; финальный npm run check после CSS-исправления завершился exit0:46 unit tests и138 Playwright scenarios, production build, typecheck, lint, formatter и skills verification прошли при стандартных8 workers. Retries локально отключены. Просмотрены реальные desktop/tablet/mobile screenshots правовых страниц и API; исправленный заголовок полностью виден на390px, line-box regression также проверяет320px.

## Границы вывода и следующие интеграции

Реальные accounts/sessions, file storage, billing, SSO/encryption, долговременная очередь заявок, email и мониторинг по-прежнему не реализованы по утверждённому scope. Code audit не меняет этот статус и не означает готовность backend к запуску.

Не выполнялись deployment, публикация, изменение branch protection, remote CI, новый Lighthouse/field CWV замер, внешняя база уязвимостей или юридическая проверка. Проверки браузера выполнялись в Chromium с desktop/tablet/mobile emulation, Safari/Firefox не запускались. Тест скрытой реальной вкладки и полное исполнение всех Python/cURL примеров остаются пробелами покрытия; они не выданы за пройденные. Syntax checks, axe и отсутствие найденных проблем не являются сертификатом безопасности, WCAG или универсального соответствия всем паттернам.

Итог по осям: Standards —7 подтверждённых пунктов, Spec —2; все перечисленные исправлены. Самая серьёзная категория на каждой оси: P2 Standards, P2 Spec.
