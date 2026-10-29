# Установка Dropvia на Ubuntu

`scripts/deploy.sh` — отдельная точка входа для нового сервера. Скрипт устанавливает недостающие системные компоненты и Docker Engine, устанавливает команду `dropvia` и запускает `dropvia install`. Node.js, npm и исходный код приложения на сервере не нужны: контейнер загружается из GitHub Release.

## Скачать и запустить

Выполняйте на сервере Ubuntu в Bash:

```bash
wget --https-only -O deploy.sh https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/deploy.sh && bash deploy.sh
```

Если на сервере уже есть curl, вместо wget:

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/deploy.sh -o deploy.sh && bash deploy.sh
```

Файл сначала сохраняется локально; его можно прочитать перед запуском. Запуск от обычного пользователя автоматически переходит к sudo, от root sudo не требуется. Нужен доступ root или право sudo и работающий systemd. Самую первую загрузку нужно выполнить доступным wget/curl либо перенести файл на сервер другим способом.

**Перед использованием URL необходимо опубликовать scripts/deploy.sh, install-cli.sh и dropvia.sh в main публичного репозитория VanyaKrotov/dropvia.** Также нужен стабильный latest Release с `dropvia-vX.X.X-linux-amd64.tar.gz` и его `.sha256`. Скрипт не создаёт релиз и не собирает образ на сервере.

## Что выполняется

1. Проверка Ubuntu, версии, архитектуры amd64 и доступности systemd. Поддержаны Ubuntu 22.04, 24.04, 26.04 и 26.10. ARM-образов в текущем release workflow нет.
2. Проверка пакетов ca-certificates, curl, python3, util-linux, coreutils, grep и bash. Через APT устанавливаются только отсутствующие пакеты, без upgrade всей системы. APT ждёт свою блокировку до 120 секунд и получает `--no-remove`, чтобы установка не удаляла другие пакеты.
3. Проверка локального Docker Engine. Для работающего Engine сохраняются пакеты, конфигурация и политика автозапуска служб. Остановленная существующая docker.service запускается; для такого либо нового Docker/containerd включается автозапуск.
4. При отсутствии Engine — установка docker-ce, docker-ce-cli и containerd.io из официального Docker APT-репозитория. Для нового source загружается GPG-ключ по HTTPS, проверяется единственный основной ключ с fingerprint `9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88`, создаётся Deb822 source с отдельным `Signed-By`. Подключи разрешены, дополнительные основные ключи отклоняются. GnuPG устанавливается при необходимости. Уже настроенный официальный source используется повторно; его настройки доверия остаются ответственностью администратора.
5. Ожидание готовности Docker до 30 секунд после запуска службы. Не используется удалённый Docker context: целевой daemon — `/var/run/docker.sock`, постоянные настройки клиента не переписываются.
6. Загрузка bootstrap CLI по HTTPS, проверка размера, shebang, идентификатора и Bash syntax. Bootstrap устанавливает `/usr/local/bin/dropvia`, затем запускает установку контейнера. SHA-256 и принадлежность образа проверяются самой CLI.

В конце установщик спрашивает IP интерфейса и внешний порт. Например, `127.0.0.1:3000` для reverse proxy или `0.0.0.0:3000` для прослушивания всех IPv4-интерфейсов. В браузере используйте фактический IP/домен сервера, а не 0.0.0.0. Существующая установка CLI/контейнера требует подтверждения замены; эти подтверждения не обходятся.

Команды дальнейшего управления: `sudo dropvia update`, `up`, `down`, `update-cli`, `uninstall`. Контракты замены и отката — [UBUNTU_CLI.md](UBUNTU_CLI.md).

## Повторный запуск и ошибки

Работающий Docker не переустанавливается. Если отсутствует docker.service и установлены конфликтующие docker.io, containerd, runc, podman-docker или старые Docker-пакеты, скрипт перечислит их и остановится: миграцию таких установок выполняет администратор. Чужие контейнеры, образы, volumes и APT sources не удаляются. Скрипт не настраивает firewall, DNS, reverse proxy или TLS.

Ошибка APT, неверный fingerprint, недоступность systemd/Docker или неправильный скачанный installer дают ненулевой код завершения; установка приложения после этого не продолжается. При ротации официального ключа требуется проверить новый ключ и обновить скрипт. Сторонние зеркала и convenience shell installers не используются. Нужен сетевой доступ к Ubuntu APT, download.docker.com, GitHub API, raw.githubusercontent.com и release CDN; ограничения сети или GitHub rate limit не обходятся.

Системные пакеты и успешно записанный Docker source остаются после последующей ошибки: это не транзакция установки ОС. Временные файлы удаляются по EXIT/INT/TERM внутри `/var/lib/dropvia/deploy.tmp.*`; блокировка deploy.lock предотвращает параллельные deploy. Блокировки CLI используются отдельно. SIGKILL и потеря питания требуют обычной проверки состояния APT/Docker перед повтором.

## Проверка реализации

`npm run test:cli` проверяет сценарии deploy и CLI с изолированными заменами APT, dpkg, systemctl, GPG, curl и Docker; тесты не меняют систему разработчика. Дополнительно используются bash -n, ShellCheck, shfmt и actionlint. Эти проверки не подтверждают реальную установку пакетов на Ubuntu. По последней задаче владельца release workflow выполняет только сборку и публикацию, без Quality/SSR/CLI smoke. Отдельный Docker lifecycle smoke source сохранён для явно разрешённой проверки на одноразовом host.

Официальные источники установки: [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) и [Linux post-installation](https://docs.docker.com/engine/install/linux-postinstall/). На локальной Windows-машине настоящий deploy на Ubuntu не выполнялся; официальный Docker CDN при проверке ключа вернул HTTP 403. Скрипт оставляет такую ошибку явной и не подменяет источник.

Проверено 29 октября 2026: 34 CLI/deploy fixtures без пропусков, 52 unit-теста, 9 release-тестов и 147 Playwright-тестов; skills verification, форматирование, lint, typecheck, production build и статические shell/workflow проверки прошли. Результаты и ограничения — [план и журнал проверки](superpowers/plans/2026-10-29-deploy-bootstrap.md).
