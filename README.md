# Dropvia

Сервис файлового хранения с закрытой регистрацией: лендинг, приглашения, тарифы, API reference, статусы и правовые страницы. React19 + TypeScript strict, React Router8 Framework Mode с настоящим SSR, Tailwind4, Node runtime. Архитектура FSD в `src/`.

## Запуск

Node22.22+ (поддерживаемая версия в `.nvmrc`) и npm. Зависимости закреплены в lockfile, lifecycle scripts отключены в `.npmrc`.

```bash
npm ci --include=dev
npm run dev
```

Открыть http://127.0.0.1:5173. Production:

```bash
npm run build
npm start
```

SSR server использует PORT/HOST среды; при отсутствии PORT стандартный порт3000.

## Docker и GitHub Releases

`Dockerfile` собирает production SSR в нескольких стадиях. Runtime содержит только build и production node_modules, работает от пользователя node и слушает0.0.0.0:3000. Node22.22.3 совпадает с текущей .nvmrc; Actions передаёт её точное значение как NODE_VERSION. `.dockerignore` разрешает только исходники, public и необходимые build configs; локальные зависимости, credentials/.env, skills, docs и test artifacts не передаются в контекст.

```bash
docker build -t dropvia:local .
docker run --rm --name dropvia -p 3000:3000 dropvia:local
```

`.github/workflows/docker-release.yml` запускается при push тега формата vX.X.X, например v0.1.0. Обычный push в main и PR не собирают образ. До сборки проверяются точный stable SemVer (без prerelease/build suffix и ведущих нулей), совпадение тега с SHA события и принадлежность коммита истории origin/main. Тег на более раннем main-коммите разрешён; собирается именно этот SHA. Тег на неслитой feature-ветке блокируется. GitHub tag push не содержит branch context, поэтому branches+tags не используются как ложное условие AND.

После попадания этих настроек в main релиз запускается так (версия приведена как пример):

```bash
git switch main
git pull --ff-only
git tag -a v0.1.0 -m "Dropvia v0.1.0"
git push origin v0.1.0
```

Сначала проходит reusable Quality на Ubuntu/Windows. Затем Buildx собирает linux/amd64, экспортирует Docker archive, проверяет загрузку и запуск non-root SSR/статических ресурсов в read-only контейнере. В релиз прикладываются `dropvia-v0.1.0-linux-amd64.tar.gz` и одноимённый `.sha256`. GitHub Release создаётся, если его ещё нет; существующий получает assets. `GITHUB_TOKEN` с contents:write доступен только отдельному publish job; PAT и container registry не требуются. Actions artifact хранится7 дней как передача между jobs, release assets остаются в релизе.

Перед публикацией повторно проверяется SHA удалённого тега и checksum. Существующие assets не перезаписываются: повтор с тем же именем завершится ошибкой вместо --clobber. При неудачной частичной загрузке требуется осознанно исправить состав assets или выпустить новую версию. Если включена release immutability, assets нужно добавлять до публикации релиза; workflow создаёт новый релиз вместе с assets через gh release create. Не передвигайте релизные теги.

Загрузка архива с платформы linux/amd64 и запуск:

```bash
sha256sum --check dropvia-v0.1.0-linux-amd64.tar.gz.sha256
docker load --input dropvia-v0.1.0-linux-amd64.tar.gz
docker run --rm --name dropvia -p 3000:3000 dropvia:v0.1.0
```

Настройка workflow не является deployment. Для локальной сборки нужен работающий Docker Engine; фактические результаты проверки конфигурации — `docs/DOCKER_RELEASE.md`.

## Автоматическая установка на Ubuntu

После публикации скриптов в main выполните команду на сервере от root (при необходимости сначала `sudo -i`). Она запустит deploy: он установит недостающие компоненты и Docker, затем CLI и контейнер; IP и порт запрашиваются в процессе:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/deploy.sh)
```

Нужны Ubuntu amd64 с systemd, curl и готовый latest Release с образом. Работающий Docker сохраняется, конфликтующие пакеты автоматически не удаляются. Подробности и запуск из сохранённого файла — [docs/DEPLOY.md](docs/DEPLOY.md).

## CLI на Ubuntu

После публикации скриптов в main установите CLI и сразу запустите контейнер одной командой на Ubuntu amd64 (Docker Engine должен быть установлен и запущен):

```bash
( set -eu; dropvia_tmp="$(mktemp)"; trap 'rm -f -- "$dropvia_tmp"' EXIT; curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/install-cli.sh -o "$dropvia_tmp"; bash -n "$dropvia_tmp"; if [ "$(id -u)" = 0 ]; then bash "$dropvia_tmp" --install; else sudo bash "$dropvia_tmp" --install; fi )
```

Далее: `sudo dropvia install`, `uninstall`, `update`, `update-cli`, `up`, `down`. При установке запрашиваются bind IP/port; переустановка и удаление требуют подтверждения. Образы проверяются по SHA-256, обновление сохраняет bind и имеет rollback. Полная инструкция, команда установки только CLI и ограничения: [docs/UBUNTU_CLI.md](docs/UBUNTU_CLI.md).

## Импорты

Для src/ настроены aliases в tsconfig.json: `@app/`, `@pages/`, `@widgets/`, `@features/`, `@entities/`, `@shared/`. Vite и Vitest используют эту же карту без дополнительных зависимостей.

```ts
import { SignInForm } from '@features/sign-in/ui/sign-in-form';
import { localizedPath } from '@shared/i18n/config';
```

Generated route types импортируются через `./+types/...`, как требует React Router. Направления импортов FSD контролирует ESLint.

## Страницы

| English  | Русский     | Назначение                                         |
| -------- | ----------- | -------------------------------------------------- |
| /        | /ru         | Лендинг и форма приглашения #request-access        |
| /prices  | /ru/prices  | Предложения по приглашению, сравнение, FAQ         |
| /terms   | /ru/terms   | Условия использования                              |
| /privacy | /ru/privacy | Уведомление о конфиденциальности                   |
| /status  | /ru/status  | Статусы четырёх компонентов, polling30s            |
| /api/    | /ru/api/    | Семь API-операций, cURL/JavaScript/Python          |
| /sign-in | /ru/sign-in | Email/password, SSR-форма входа и ссылка на заявку |

Язык определяется URL на сервере; английский по умолчанию. `react-i18next`/`i18next` создаются изолированно на дерево SSR. Ссылки переключают язык с сохранением страницы/query/hash. Темы следуют системному `prefers-color-scheme`, без flash/hydration scripts. Framer Motion уважает reduced-motion. Даты — date-fns, статус UTC.

Технические SSR-страницы узлов доступны напрямую: `/_data/D01`, `/_data/D02` и русские `/ru/_data/D01`, `/ru/_data/D02`. Они публичны, но отсутствуют в навигации и sitemap; установлены noindex/nofollow. Неизвестный узел возвращает404. Новые узлы добавляются явно в реестр service-health.

## API и данные

Кнопка общей шапки ведёт на страницу входа. Форма отправляет POST на тот же сервер, работает с JS и без него, валидирует email/password и показывает pending/error. По контракту владельца заглушка возвращает400 «Клиент с такими данными не найден». Приложение не сохраняет, не логирует и не отражает пароль в ответах; cookies/tokens не создаются. Реальная проверка аккаунтов и сессии ещё не подключены. Свободная регистрация закрыта, ссылка под формой ведёт к заявке на главной.

`/api/v1/upload/:uuid?` POST403; `/download/:uuid?` GET404; `/files/:uuid` GET404/DELETE403; `/shares/:uuid` POST403; `/status` GET200; `/access-requests` POST201.

**Текущая серверная реализация намеренно соответствует запросу на заглушки.** Заявка проверяется и подтверждается, но не записывается в БД и не отправляет письмо. Статусы и задержки генерируются и хранятся в памяти процесса60s; страницы узлов, /status и API читают общий снимок. Перезапуск сбрасывает память, отдельные процессы не разделяют её;89% снимков полностью исправны, иначе деградирует один компонент. Это не реальный uptime. Файлы не принимаются. Подключение хранилища, auth, реальной очереди приглашений, email и мониторинга — отдельная следующая работа. Подробности/валидация/production gates в `docs/API.md`.

TanStack Query получает начальные статусы из loader, продолжает polling и сохраняет последний снимок при ошибке. Форма использует mutation без retry, а без JS — нативную отправку в index Router action с тем же обработчиком.201 отображает подтверждение в форме. Body limit16384bytes, origin/consent/email validation, единые JSON errors, no-store.

## Структура

`src/app`→`pages`→`widgets`→`features`→`entities`→`shared`. ESLint запрещает обратные импорты слоёв. Generated route types и build output не коммитятся. Нет Next.js, SPA-only router или копии API в клиенте. Подробнее `docs/ARCHITECTURE.md`.

## Проверки

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run test:release
npm run test:cli
npm run build
npx playwright install chromium
npm run test:ssr
npm run test:e2e
npm run skills:verify
npm run check
```

Playwright запускает production SSR server на127.0.0.1:4173 и останавливает его. Проверяет desktop/tablet/mobile, обе темы и языки, axe, SSR без JS, формы, polling и API. Скриншоты в test-results, HTML-отчёт в playwright-report; эти артефакты исключены из Git. `check` объединяет полный набор. GitHub Actions запускает проверки на Ubuntu/Windows; локальные проверки не означают выполненный remote CI.

## Дизайн, контент и Agent Skills

`DESIGN.md` — неизменённый визуальный источник. `PRODUCT.md` — подтверждённые факты. `AGENTS.md` — обязательный порядок работы и матрица активации22 локальных skills. Читайте конкретный `.agents/skills/<name>/SKILL.md` и нужные references перед задачей, а не объявляйте использование по названию.

`docs/SKILLS.md` содержит источники, commits, лицензии, установку и ограничения. `npm run skills:verify` проверяет manifests и351 vendored files. Не запускать сторонние hooks, Impeccable binary launcher или глобальные установки. Обновление требует проверки upstream и осознанного обновления integrity baseline, не слепого skills update. Skills не гарантируют соблюдение рекомендаций без чтения и review.

Документация: `docs/DESIGN_SYSTEM.md`, `docs/LANDING_STRUCTURE.md`, `docs/API.md`, `docs/ARCHITECTURE.md`. Последние результаты — `docs/SERVICE_VERIFICATION.md`; старый `docs/VERIFICATION.md` относится только к первоначальной основе.

## До реального запуска

Нужны фактические условия хранения/тарифы и сведения об операторе/юрисдикции/провайдерах/retention для юридического review. Тексты правовых страниц ограничены поведением публичного сайта, не подтверждают соответствие всем законам. Пока сохранён noindex. `/sitemap.xml` уже отдаёт XML с12 canonical EN/RU страницами, включая вход, без статуса и технических узлов; ссылка опубликована в robots.txt. Индексация разрешается отдельно. Деплой, реальные платежи и внешние интеграции не выполнялись.
