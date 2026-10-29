# Dropvia CLI для Ubuntu

CLI — `scripts/dropvia.sh`; bootstrap — `scripts/install-cli.sh`. Команда устанавливается обычным root-owned файлом0755 в `/usr/local/bin/dropvia`. Публикация этих файлов в публичной ветке main — обязательное условие команд ниже; локальные изменения в рабочей копии ещё не доступны через raw.githubusercontent.com.

## Требования

Ubuntu22.04/24.04/26.04/26.10 amd64, Bash4.4+, curl с CA certificates, Python3 stdlib, GNU coreutils, util-linux/flock и работающий Docker Engine. Docker устанавливается и запускается отдельно по официальной инструкции: https://docs.docker.com/engine/install/ubuntu/. Скрипт не выполняет сторонний install-docker script и не меняет firewall/DNS/TLS. Операции выполняются от root (`sudo dropvia ...`). Runtime контейнера остаётся пользователем node.

В репозитории должен существовать опубликованный стабильный latest GitHub Release с двумя assets: `dropvia-vX.X.X-linux-amd64.tar.gz` и `.tar.gz.sha256`, созданными release workflow. Draft/prerelease, неполный набор assets, другой источник образа и ARM не поддержаны. GitHub API используется без токена для публичных ресурсов;404/rate-limit/сбой сети завершают операцию до изменения установленного контейнера.

Для сервера без готовых компонентов используйте [deploy.sh](DEPLOY.md): он проверит Ubuntu и установит недостающие зависимости и Docker перед запуском bootstrap. Требования выше относятся к самостоятельному запуску CLI/CLI-bootstrap.

## Установить только CLI

Одна команда полностью скачивает bootstrap, проверяет Bash syntax, затем запускает его через sudo (либо напрямую от root). Bootstrap отдельно скачивает CLI по HTTPS, проверяет shebang/идентификатор/размер/syntax, устанавливает root-owned stage file и атомарно заменяет target. Ответы install читаются с обычного stdin, поэтому сетевой поток не передаётся в Bash через pipe.

```bash
( set -eu; dropvia_tmp="$(mktemp)"; trap 'rm -f -- "$dropvia_tmp"' EXIT; curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/install-cli.sh -o "$dropvia_tmp"; bash -n "$dropvia_tmp"; if [ "$(id -u)" = 0 ]; then bash "$dropvia_tmp"; else sudo bash "$dropvia_tmp"; fi )
```

Если CLI уже установлен, bootstrap спросит разрешение заменить его. По умолчанию отказ; чужой файл, directory или symlink с именем dropvia не заменяются.

## Установить CLI и сразу запустить сервис

Та же команда с --install. Она не является командой для Windows/PowerShell: выполнять на сервере Ubuntu в Bash.

```bash
( set -eu; dropvia_tmp="$(mktemp)"; trap 'rm -f -- "$dropvia_tmp"' EXIT; curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/install-cli.sh -o "$dropvia_tmp"; bash -n "$dropvia_tmp"; if [ "$(id -u)" = 0 ]; then bash "$dropvia_tmp" --install; else sudo bash "$dropvia_tmp" --install; fi )
```

## Команды

| Команда                    | Поведение                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| sudo dropvia install       | Стабильный latest release, запрос bind IP/port, установка и запуск. Для существующего Dropvia — подтверждение переустановки. |
| sudo dropvia uninstall     | Независимые подтверждения удаления контейнера, его образа и самой CLI. Отказ на одном этапе не означает согласия на другие.  |
| sudo dropvia update        | Сравнение числовых версий. Только более новая версия; прежние IP/port и running/stopped сохраняются.                         |
| sudo dropvia update-cli    | Последняя CLI из main по HTTPS; atomic replacement после проверок, Docker не требуется.                                      |
| sudo dropvia up            | Запуск остановленного контейнера и readiness; уже работающий не перезапускается.                                             |
| sudo dropvia down          | Graceful stop с timeout20s; уже остановленный не меняется.                                                                   |
| dropvia --help / --version | Справка и версия CLI без root/Docker.                                                                                        |

## Адрес и порт

install спрашивает IP интерфейса (default0.0.0.0) и внешний TCP-порт (default3000; диапазон1–65535). IPv4 и IPv6 поддержаны, IPv6 автоматически оформляется в Docker publish `[address]:port:3000`. Это bind IP, а не доменное имя/URL. Указанный адрес должен принадлежать серверу. После запуска используйте `http://<server-ip>:<port>`;0.0.0.0/:: означают все интерфейсы, а не адрес для браузера. Для reverse proxy обычно выбирайте127.0.0.1. Доступ извне зависит от сети и firewall сервера; утилита не настраивает их.

Настройки сохраняются в container labels io.dropvia.*. Работает один контейнер с именем dropvia, restart unless-stopped, non-root image, --init, read-only rootfs, cap-drop ALL, no-new-privileges и ограниченные json-file logs (10m×3). Данные/volumes не создаются. Монтирования в существующем контейнере блокируют автоматическую замену, чтобы не потерять нестандартную конфигурацию.

## Замена, очистка и откат

CLI0.1.1 сравнивает `HostConfig.Ulimits` в порядке Name: Docker28 может добавлять daemon defaults в разном порядке при каждом inspect. Значения Soft/Hard и остальные поля сохраняют точное сравнение; дубликаты имён или некорректные записи отклоняются. Пустой/отсутствующий список означает отсутствие дополнительных limits. Другие HostConfig fields не исключаются из проверки. При реальном несовпадении CLI теперь перечисляет имена полей без печати значений и останавливается до stop/remove. Profile-check контейнер по-прежнему никогда не запускается.

Перед любой заменой скачивается готовый release и проверяется SHA-256. Для установленного контейнера создаётся временный НЕ запускаемый profile-check контейнер из того же старого образа с ожидаемыми CLI flags. Сравниваются полный HostConfig, runtime Config, hostname/labels и network IPAM/aliases; probe удаляется. Нестандартные env/network/resource/restart/command/logging/security settings блокируют замену до остановки старого контейнера, поскольку их точное восстановление CLI не поддерживает. Checksum manifest разбирается как данные и допускает только ожидаемое имя архива; он не выполняется и не передаётся напрямую в sha256sum -c с произвольными путями. После Docker load проверяются image source/version/platform/ID. JSON и настройки никогда не source/eval.

**Переустановка:** подтверждение → IP/port → download/checksum → проверка эксклюзивного использования старого image ID → временный docker save старого образа → graceful stop/remove старого контейнера → удаление только его image ID с --no-prune, без --force → load/create/start/readiness новой версии. Ошибка вызывает восстановление предыдущего образа/настроек из backup. Чужие контейнеры, дополнительные aliases образа и shared image блокируют предварительную очистку до stop. Простой на время замены возможен.

**Update:** новый образ загружается при работающем старом контейнере. Старый переименовывается во временный rollback container и останавливается; новый получает прежний bind. Старый удаляется только после успешного readiness нового. При ошибке новый убирается, прежний получает исходное имя и состояние. Если прежний был остановлен, новый остаётся остановленным и readiness выполняется при up. Новая версия меньше или равна установленной — no-op, автоматического downgrade нет.

**Uninstall:** отдельное подтверждение graceful stop/remove контейнера, отдельное — image ID (без force/prune), отдельное — удаление собственного regular CLI file. Томы, другие images и контейнеры не удаляются. Shared/aliased image остаётся с сообщением. Сохраняется служебная root-only директория `/var/lib/dropvia` с lock; её inode не удаляется во время удержания flock.

**Legacy:** контейнер без io.dropvia.managed допускается для up/down/uninstall только при подтверждённом official image source/version, единственном binding3000/tcp и отсутствии mounts. Для явной reinstall его профиль также должен совпасть с поддерживаемым; произвольные ручные конфигурации требуют ручной миграции. update требует сначала install с подтверждением стандартной конфигурации. Контейнер с именем dropvia, но чужим образом, не изменяется.

EXIT/INT/TERM запускают cleanup/rollback. При неудачном rollback backup и inspect JSON сохраняются в указанной root-only директории для ручного восстановления; исходная ошибка возвращает nonzero. SIGKILL/потеря питания не являются транзакцией: проверьте `docker container ls -a` и rollback container/files перед повтором. Неудачно загруженный образ может остаться в Docker cache; глобальная очистка не выполняется.

Для специальных путей root может явно задать DROPVIA_BIN_DIR bootstrap и DROPVIA_STATE_DIR (basename должен быть dropvia). По умолчанию они не нужны. State directory lock запрещает конкурентные команды CLI/bootstrap.

## Проверки

`npm run test:cli` — реальные Bash/Python исполнения с изолированными fake Docker/curl и fixture directories. Покрываются install/reinstall/checksum, shared/foreign images, update/no-update/stopped state/rollback, invalid bind, up/down, independent uninstall confirmations, CLI update и bootstrap. Это проверка control flow, а не подтверждение работы Docker Engine. На Windows тесты требуют Git Bash и CLI_TEST_PYTHON с путём к Python; без него отмечаются skipped, Ubuntu Quality запускает их обязательно с системным python3.

Quality Linux выполняет bash -n, ShellCheck и эти tests. Docker release workflow дополнительно запускает реальный CLI lifecycle smoke от root на одноразовом Ubuntu runner с уже собранным release archive: API/download подменены локальными файлами, Docker — настоящий. Новые Docker builds вне разрешённых tag/main условий не добавлены.

Локальная проверка29October2026 (Windows, Git Bash + Python3; baseline0bc0a84):

- `npm run skills:verify`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` — exit0.
- `npm run test` —52/52; `npm run test:release` —9/9; `npm run test:cli` с CLI_TEST_PYTHON —24/24, без skipped; `npm run test:e2e -- --workers=4` —147/147.
- Три shell-файла: Bash -n, shfmt v3.12.0 -d и ShellCheck v0.11.0 — exit0. ShellCheck скачан только в ignored artifacts/tools из официального release ZIP; SHA-256 сверён с опубликованным upstream8a4e35ab0b331c85d73567b12f2a444df187f483e5079ceffa6bda1faa2e740e. shfmt — официальный Go module, upstream tag проверен.
- actionlint v1.7.12 — оба изменённых workflow приняты; `git diff --check` — чисто. Существующие LF gitattributes сохранены.
- Standards review обнаружил потерю нестандартной конфигурации при recreate rollback. Исправлено profile probe comparison для HostConfig/Config и полного набора сетей; добавлены fixtures custom resources/extra network. Повторное review —0 открытых замечаний. Spec review —0 открытых замечаний; однострочные bootstrap команды проверены чтением, а bootstrap --install исполнялся в fixture.

Первый red прогон воспроизвёл отсутствие CLI; далее green сценарии проверили наблюдаемое поведение команд. Fake Docker/curl фиксируют только разрешённые операции и не обращаются к реальному Engine/GitHub. Readiness и failed rollback/atomic mv покрыты fixtures. SIGINT/SIGTERM обработчики проверены кодом, но их исполнение локально не моделировалось. Реальный Ubuntu/Docker smoke и удалённый CI **не запускались**; локальный Engine по-прежнему недоступен. Наличие CI smoke не означает его успешного выполнения. Удалённый сервер, push, создание тега/релиза и production deployment в этой задаче не выполнялись.
