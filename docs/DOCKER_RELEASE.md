# Docker release

Релизный workflow `.github/workflows/docker-release.yml` выполняет только сборку контейнера и публикацию готового архива в GitHub Release. По явной задаче владельца Quality, SSR runtime smoke и Ubuntu CLI lifecycle smoke исключены из этой цепочки.

## Условия запуска

Workflow запускается при push тега `vX.X.X`. Перед сборкой проверяются стабильный формат версии, соответствие checkout коммиту тега и принадлежность коммита истории `origin/main`. Допускаются lightweight/annotated tags и более ранние коммиты main. Обычный push в main без тега, другие ветки, PR и удаление тега сборку не запускают.

Фильтры branches и tags в GitHub Actions не заменяют условие main И tag: принадлежность коммита проверяет `scripts/release/validate-tag.mjs`. Эта проверка сохраняется.

## Сборка

Цепочка jobs: `validate` → `build` → `publish`.

Buildx собирает `linux/amd64` из точного SHA тега. Dockerfile содержит production SSR build и production dependencies; runtime работает от пользователя node. Версия Node берётся из `.nvmrc`. Dockerfile, ограничения build context и runtime flags образа этим упрощением не изменялись.

После сборки `docker image save` и `gzip` создают:

- `dropvia-vX.X.X-linux-amd64.tar.gz`
- `dropvia-vX.X.X-linux-amd64.tar.gz.sha256`

Архив и checksum передаются publisher через Actions artifact с retention7 дней. Registry push, повторный docker load и запуск тестовых контейнеров не выполняются. Buildx load используется только для экспорта собранного образа через docker save.

## Публикация

Отдельный publish job имеет `contents: write`; остальные jobs — только read. Checkout не сохраняет credentials; actions закреплены полными commits.

Перед публикацией проверяется соответствие удалённого тега исходному SHA и целостность переданных assets по SHA-256. Новый GitHub Release создаётся с этими файлами; существующий получает assets без перезаписи совпадающих имён. Проверки main/tag и целостности файлов сохраняют исходный контракт выпуска и доставки CLI.

## Проверки отдельно от релиза

Локальные `npm run check`, `test`, `test:cli`, `test:release`, `lint`, `typecheck` и browser tests доступны разработчику. Quality workflow сохранён как reusable-only, но сейчас не вызывается релизом и не имеет самостоятельных triggers. Возвращать его или smoke в release без отдельного запроса владельца не следует.

`npm run test:release` проверяет только Git gate. Тест `runtime-readiness.test.mjs`, зависевший от удалённого SSR smoke step, удалён вместе с этим step. CLI fixture tests и scripts/cli-tests/docker-smoke.sh сохранены; защитные проверки самой CLI не менялись.

Это упрощение отключает проверки в релизном pipeline, а не исправляет CLI HostConfig mismatch. История диагностики остаётся в датированных планах в docs/superpowers/plans/.

После коммита workflow в main нужен новый релизный тег, например `v0.0.4`. Повторный запуск старого тега использует его старый workflow. В рамках изменения тег, релиз, push или deployment не выполняются.

## Развёртывание

Установка опубликованного релиза на сервер: [DEPLOY.md](DEPLOY.md). Пользовательская команда также находится в README.md.
