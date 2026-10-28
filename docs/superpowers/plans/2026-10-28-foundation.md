# Dropvia development foundation — implementation plan

**Goal:** воспроизводимая локальная среда Codex и React Router Framework SSR.
**Architecture:** компактные route modules; продуктовый UI рядом с feature; общие токены в CSS; никаких загрузок файлов до определения серверного контракта.
**Spec:** исходная задача настройки среды и корневой `DESIGN.md` (только стилевой референс).
**Execution:** автономно в текущей сессии, как явно потребовал пользователь. Дополнительное подтверждение плана, commits и переключение workflow не требуются. Это проектная адаптация `writing-plans`.

## Constraints and review focus

- Не менять исходный `DESIGN.md`, не придумывать функции, лимиты и гарантии.
- Реальный SSR, содержимое и metadata в HTTP HTML до JavaScript.
- Skills локальные, с лицензиями, commits и проверкой целостности; никаких hooks.
- Browser globals не должны попасть в server render; ошибки не раскрывают внутренности.
- Проверить no-JS, 404, metadata, keyboard, узкие экраны, reduced motion, axe.
- Команды и CI должны работать из чистого checkout через `npm ci`.

## Tasks

- [x] Аудит: единственный исходный файл — `DESIGN.md`, main без commits, приложения нет.
- [x] Исследовать указанные GitHub-источники, skills.sh и официальную документацию; сохранить commits и историю.
- [x] Установить отобранные 22 skills с references; убрать конфликты имён.
- [x] Добавить `AGENTS.md`, реестр, архитектуру, дизайн-систему и честную структуру стартовой страницы.
- [x] `package.json`, конфиги TypeScript/Tailwind/Vite/ESLint/Prettier/Vitest/Playwright; установить совместимые версии.
- [x] Прочитать docs установленного React Router 8.5.1; создать root и index route.
- [x] Написать SSR/metadata/no-JS/404 контракты; RED/GREEN подтверждён для ошибок, SSR smoke выполнен после сборки (не заявляется test-first).
- [x] Реализовать стартовый экран, metadata и resource routes robots/sitemap.
- [x] Unit/component checks для полезного контракта; production build и browser verification.
- [x] Уточнение владельца: English default и русский, обычные пользователи простого хранилища. Добавить `/ru`, language links, URL locale, reciprocal hreflang; RED/GREEN browser tests.
- [x] GitHub Actions, проверка навыков; отдельные Standards/Spec review; исправления и итоговый отчёт.

Результаты фактических запусков фиксируются в `docs/VERIFICATION.md`. План описывает решения, а не подтверждает прохождение тестов.
