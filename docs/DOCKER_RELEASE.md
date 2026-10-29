# Docker release

## Исправление ожидания runtime: релиз v0.0.1

В [run40903911231](https://github.com/VanyaKrotov/dropvia/actions/runs/40903911231/job/123558761619) image build, archive save/load и Quality на Linux/Windows прошли. Падение произошло на первом GET к только что запущенному контейнеру: curl56, connection reset, примерно через180ms после docker run. Логи ещё не содержали сообщения Node о запуске. Это соответствует запросу до готовности сервера; сам факт последующей успешной готовности тем запуском не подтверждён.

Прежний `--retry-connrefused` не повторял receive/reset failures. Теперь readiness GET использует `--retry-all-errors` с20 повторами, retry budget60s, connect timeout2s и request timeout5s. Ответ пишется через `--output`, чтобы curl сбрасывал частичное тело между попытками: stdout redirection при retry могла склеить неудачный и успешный ответы. Проверки title, RU HTML, static image и non-root остаются обязательными. При ошибке перед удалением контейнера выводятся его State и logs; исходный код ошибки сохраняется.

Регрессия в scripts/release/runtime-readiness.test.mjs запускает фактическую команду curl из workflow против локального TCP-сервера: первый ответ обрывается reset после частичного тела, второй корректен. Проверяются повторный запрос и точный итоговый HTML. Это настоящий транспорт/curl, но не настоящий Docker Engine.

После коммита исправления в main нужен новый релизный тег, например v0.0.2. Re-run старого v0.0.1 использует workflow старого коммита и не подхватит исправление из main. Теги/релизы автоматически ради проверки не создаются.

Для подготовки сервера и установки готового релиза предусмотрен отдельный [deploy.sh](DEPLOY.md). Он не меняет условия сборки или публикации образов.

Цель владельца: образ для main и релизных тегов vX.X.X, архив в GitHub Release. Реализация — `.github/workflows/docker-release.yml`, `Dockerfile`, `.dockerignore`, `scripts/release/validate-tag.mjs`. Baseline до задачи: cb91cad. Настройка не создаёт удалённый тег/релиз и не выполняет deployment сама по себе; публикация выполняется будущим tag push.

## Контракт запуска

Единая точка входа всей сборки — push тега vX.X.X, проверенного строгим stable SemVer. GitHub glob `v*.*.*` — предварительный фильтр; malformed/prerelease tags отклоняются validate job до Quality и Docker. Удаление тега пропускается. Обычные branch pushes (включая main без нового тега), PR и manual dispatch не запускают сборку. Для off-main тега выполняется только отклоняющая проверка validate; сборочные jobs не запускаются.

Checkout получает SHA события и полную историю. Gate проверяет tag commit, HEAD и event commit, затем git merge-base --is-ancestor с origin/main. Lightweight и annotated tags поддержаны. Более ранний коммит истории main разрешён; неслитая feature-ветка запрещена. Политика не требует равенства текущему tip main. Повторная проверка удалённого tag SHA перед публикацией блокирует перемещённый тег.

## Сборка и assets

Node22.22.3-bookworm-slim, значение версии для CI берётся из .nvmrc. npm ci использует lockfile и project .npmrc с ignore-scripts. Отдельные stages для build dependencies, SSR build и production dependencies. Runtime: node user, прямой Node CMD, PORT3000/HOST0.0.0.0, только package.json/build/node_modules. Контекст — allowlist исходников, public и build configs. Runtime libraries не заменяются host node_modules, dev dependencies не попадают в runtime.

Quality workflow доступен только через workflow_call; его единственный caller — release workflow после успешного validate. Самостоятельные push/PR/manual triggers удалены по уточнению владельца: TypeScript/SSR production build и Playwright, как и Docker image build, запускаются только в проверенной release-цепочке. Нельзя добавлять `branches: [main]` рядом с tags в push и считать это условием AND: ветка тега проверяется через Git ancestry. Release gate тестируется на Ubuntu/Windows вместе с остальными проверками. Локальные команды npm run check/build по-прежнему доступны вручную.

Buildx load, single linux/amd64; registry push и provenance attestations отключены, поскольку доставляется Docker archive. После docker save + gzip -n создаётся SHA-256, архив проверяется и загружается docker load. Smoke запускает read-only non-root контейнер, проверяет SSR EN/RU и общий PNG. В release передаются только archive/checksum через Actions artifact (7 дней), publisher скачивает их и проверяет checksum. Published assets не перезаписываются.

## Права и закреплённые actions

Все GitHub actions закреплены полными commits. Проверены upstream refs: checkout v6 d23441a48e516b6c34aea4fa41551a30e30af803 (существующая настройка); setup-buildx v4 f87e5991a6d7451dcb8d9637bfbc97413f497069; build-push v7 c3c9e263c25d99ce0380d002d59b67737d91b0dc; upload-artifact v4 ea165f8d65b6e75b540449e92b4886f43607fa02 (существующая настройка); download-artifact v4 d3f86a106a0bac45b974a628896c90dbdf5c8093. Docker actions проверены по официальным action.yml. Сторонние remote install scripts, hooks, PAT или registry credentials не добавляются.

Validate/Quality/build: contents:read, checkout без сохранённых credentials. Publish: contents:write, без checkout и исполнения npm/Docker/project scripts; GH_TOKEN передаётся только шагу gh release. GitHub CLI preinstalled на ubuntu runner. Новый релиз создаётся с --verify-tag и assets; существующий получает assets без --clobber. При совпадении имени операция безопасно останавливается, допускается только осознанное исправление assets или новая версия.

## Проверка

Gate tests используют временные Git repositories с собственными refs и локальной identity, не меняют пользовательские теги/ветки/remotes. Проверяются annotated/lightweight tags, старый main commit, off-main commit, moved tag, malformed versions/newline, отсутствие main и CLI outputs. Проверка удаления fixtures ограничена собственной временной директорией.

Проверено локально на Windows29October2026:

- `npm run skills:verify`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` — exit0.
- `npm run test` —52/52; `npm run test:release` —9/9; `npm run test:e2e -- --workers=4` —147/147, включая SSR.
- actionlint v1.7.12, собранный из официального Go module в игнорируемый artifacts/tools: оба workflow приняты без ошибок. ShellCheck не запускался; три Bash run-блока отдельно прошли Git Bash -n, JavaScript — node --check.
- Standards review —0 actionable findings. Spec review нашёл неоднозначность refs при совпадении branch/tag имени; исправлено через `commits/tags%2F${RELEASE_TAG}` и тест коллизии refs. Повторное review закрыло замечание.
- `git diff --check` — без whitespace errors.

Docker CLI29.6.2 установлен, но Linux Engine pipe недоступен; docker desktop start --detach не привёл к подключению. `docker build --check .` остановился до проверки Dockerfile на отсутствии Engine. Реальная сборка, docker save/load и запуск контейнера локально **не проверены**. Дополнительный read-only registry manifest lookup получил403, поэтому доступность base image из текущей сети также не подтверждена. Эти ограничения не обходились установкой WSL, изменением Docker/system settings или альтернативным непроверенным runtime. CI выполняет настоящую сборку/load/smoke перед publish; его успешный run ещё не подтверждён.

Удалённый GitHub Actions run, push, создание тега/релиза и deployment в рамках настройки не выполнялись.

## Первичные источники

- GitHub push events: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push
- Docker export/build: https://docs.docker.com/build/ci/github-actions/export-docker/
- Docker best practices: https://docs.docker.com/build/building/best-practices/
- Docker load compressed archives: https://docs.docker.com/reference/cli/docker/image/load/
- GitHub Release assets: https://cli.github.com/manual/gh_release_create и https://cli.github.com/manual/gh_release_upload

## Дополнение: Ubuntu CLI

В следующей задаче добавлены собственные scripts/dropvia.sh и scripts/install-cli.sh. Linux Quality проверяет их Bash syntax/ShellCheck и24 fixture scenarios; после обычного Docker smoke release job также запускает scripts/cli-tests/docker-smoke.sh с настоящим Engine и локальными download fixtures. Lifecycle: install, down/up idempotence, no-op update, destructive reinstall с проверкой profile/backup и uninstall. Это не добавляет Docker builds на branch/PR: smoke использует уже собранный image только в разрешённом tag/main workflow. Этот реальный CLI smoke ещё не выполнялся; локальные результаты и bootstrap команды — docs/UBUNTU_CLI.md.
