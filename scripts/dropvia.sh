#!/usr/bin/env bash
# Dropvia CLI managed executable (schema 1)
set -Eeuo pipefail
umask 077

readonly REPOSITORY='VanyaKrotov/dropvia'
readonly SOURCE="https://github.com/$REPOSITORY"
readonly CLI_URL="https://raw.githubusercontent.com/$REPOSITORY/main/scripts/dropvia.sh"
readonly NAME='dropvia'
readonly CLI_VERSION='0.1.0'
readonly SCRIPT_SOURCE=${BASH_SOURCE[0]}
STATE_DIR=${DROPVIA_STATE_DIR:-/var/lib/dropvia}
WORKDIR=''
TRANSACTION=0
NEW_ATTEMPT=0
NEW_IMAGE=''
NEW_ID=''
PROBE_ID=''
STAGED_CLI=''
OLD_ID=''
OLD_IMAGE=''
OLD_VERSION=''
OLD_ADDRESS=''
OLD_PORT=''
OLD_RUNNING='false'
RELEASE_TAG=''

say() { printf '%s\n' "$*"; }
warn() { printf 'Dropvia: %s\n' "$*" >&2; }
die() {
  warn "$*"
  exit 1
}

confirm() {
  local answer
  printf '%s [y/N]: ' "$1" >&2
  IFS= read -r answer || return 1
  case "$answer" in y | Y | yes | YES | да | Да) return 0 ;; *) return 1 ;; esac
}

need() { command -v "$1" >/dev/null 2>&1 || die "Не найдена команда $1. См. требования в README."; }

download() {
  curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error \
    --retry 2 --retry-delay 1 --connect-timeout 10 --max-time 900 \
    --output "$2" "$1" || die "Не удалось скачать $1. Текущая установка сохранена."
}

create_container() {
  local image=$1 version=$2 address=$3 port=$4 binding container_name=${5:-$NAME}
  binding="$address:$port:3000"
  [[ "$address" != *:* ]] || binding="[$address]:$port:3000"
  docker container create --name "$container_name" --restart unless-stopped --init \
    --read-only --cap-drop ALL --security-opt no-new-privileges \
    --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
    --publish "$binding" \
    --label io.dropvia.managed=true --label "io.dropvia.version=$version" \
    --label "io.dropvia.address=$address" --label "io.dropvia.port=$port" "$image"
}

wait_ready() {
  local attempt
  for ((attempt = 0; attempt < 30; attempt++)); do
    if docker container exec "$1" node -e \
      'fetch("http://127.0.0.1:3000/", {signal: AbortSignal.timeout(2000)}).then(async r => { if (!r.ok || !(await r.text()).includes("| Dropvia</title>")) process.exit(1); }).catch(() => process.exit(1));' \
      >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

rollback() {
  local candidate='' restored='' old_name=''
  warn 'Восстанавливаю предыдущую установку.'
  if [[ "$NEW_ATTEMPT" == 1 ]] && docker container inspect "$NAME" >"$WORKDIR/failed.json" 2>/dev/null; then
    candidate=$(
      python3 - "$WORKDIR/failed.json" "$NEW_IMAGE" "$RELEASE_TAG" <<'PY'
import json,sys
c=json.load(open(sys.argv[1],encoding='utf-8'))[0]
l=c.get('Config',{}).get('Labels') or {}
if c['Image']==sys.argv[2] and l.get('io.dropvia.managed')=='true' and l.get('io.dropvia.version')==sys.argv[3]:
    print(c['Id'])
PY
    )
    if [[ -n "$candidate" ]]; then
      docker container rm --force "$candidate" >/dev/null || {
        warn 'Не удалось убрать новый контейнер; требуется ручная проверка.'
        return 1
      }
    fi
  fi
  [[ -n "$OLD_ID" ]] || return 0
  if docker container inspect "$OLD_ID" >"$WORKDIR/old.json" 2>/dev/null; then
    old_name=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))[0]["Name"])' "$WORKDIR/old.json")
    [[ "$old_name" == "/$NAME" ]] || docker container rename "$OLD_ID" "$NAME" || return 1
    restored=$OLD_ID
  else
    if ! docker image inspect "$OLD_IMAGE" >/dev/null 2>&1; then
      [[ -f "$WORKDIR/previous-image.tar" ]] || {
        warn 'Резервный образ отсутствует.'
        return 1
      }
      docker image load --input "$WORKDIR/previous-image.tar" >/dev/null || return 1
    fi
    restored=$(create_container "$OLD_IMAGE" "$OLD_VERSION" "$OLD_ADDRESS" "$OLD_PORT") || return 1
  fi
  if [[ "$OLD_RUNNING" == true ]]; then
    docker container start "$restored" >/dev/null || return 1
    wait_ready "$restored" || return 1
  fi
  warn 'Предыдущая версия и её настройки восстановлены.'
}

cleanup() {
  local status=$?
  local retain=0
  trap - EXIT INT TERM
  set +e
  if [[ -n "$PROBE_ID" ]]; then
    docker container rm "$PROBE_ID" >/dev/null 2>&1 || warn "Не удалось удалить временный profile-check контейнер $PROBE_ID."
  fi
  if [[ "$TRANSACTION" == 1 ]]; then
    if ! rollback; then
      retain=1
      warn "Автоматический откат не завершён. Резервные файлы оставлены в $WORKDIR. Проверьте docker container ls -a перед следующей командой."
    fi
  fi
  if [[ -n "$STAGED_CLI" && "$(dirname -- "$STAGED_CLI")" == "$(dirname -- "${CLI_PATH:-/nonexistent}")" && "$(basename -- "$STAGED_CLI")" == .dropvia.* && ! -L "$STAGED_CLI" ]]; then
    rm -f -- "$STAGED_CLI"
  fi
  if [[ "$retain" == 0 && -n "$WORKDIR" && -d "$WORKDIR" && ! -L "$WORKDIR" && "$(dirname -- "$WORKDIR")" == "$STATE_DIR" && "$(basename -- "$WORKDIR")" == tmp.* ]]; then
    rm -rf -- "$WORKDIR"
  fi
  exit "$status"
}

initialize() {
  [[ "$(uname -s)" == Linux ]] || die 'Эта утилита предназначена для Ubuntu/Linux.'
  [[ "$(id -u)" == 0 ]] || die 'Запустите команду через sudo, например: sudo dropvia install.'
  local command
  for command in python3 curl flock readlink mktemp sha256sum; do need "$command"; done
  [[ "$STATE_DIR" == /* && "$STATE_DIR" != *$'\n'* && ! -L "$STATE_DIR" ]] || die 'Некорректная директория состояния.'
  STATE_DIR=$(readlink -m -- "$STATE_DIR")
  [[ "$(basename -- "$STATE_DIR")" == dropvia ]] || die 'Директория состояния должна называться dropvia.'
  mkdir -p -- "$STATE_DIR"
  [[ -O "$STATE_DIR" && ! -L "$STATE_DIR/lock" ]] || die 'Директория состояния должна принадлежать текущему root-пользователю; symlink lock запрещён.'
  chmod 700 -- "$STATE_DIR"
  exec 9>"$STATE_DIR/lock"
  flock --exclusive --nonblock 9 || die 'Другая команда dropvia уже выполняется.'
  WORKDIR=$(mktemp -d "$STATE_DIR/tmp.XXXXXXXX")
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
}

require_docker() {
  need docker
  docker info >/dev/null 2>&1 || die 'Docker Engine недоступен. Установите/запустите Docker по официальной инструкции Ubuntu.'
}

read_container() {
  local fields
  docker container inspect "$NAME" >"$WORKDIR/container.json" 2>/dev/null || return 1
  C_IMAGE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))[0]["Image"])' "$WORKDIR/container.json")
  [[ "$C_IMAGE" =~ ^sha256:[a-f0-9]{64}$ ]] || die 'Некорректный ID образа существующего контейнера.'
  docker image inspect "$C_IMAGE" >"$WORKDIR/image.json" || die 'Не найден образ существующего контейнера.'
  fields=$(
    python3 - "$WORKDIR/container.json" "$WORKDIR/image.json" "$SOURCE" <<'PY'
import ipaddress,json,re,sys
c=json.load(open(sys.argv[1],encoding='utf-8'))[0]
i=json.load(open(sys.argv[2],encoding='utf-8'))[0]
l=c.get('Config',{}).get('Labels') or {}
il=i.get('Config',{}).get('Labels') or {}
version=il.get('org.opencontainers.image.version','')
if il.get('org.opencontainers.image.source')!=sys.argv[3] or not re.fullmatch(r'v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)',version):
    sys.exit('Контейнер dropvia использует непроверенный образ; чужой контейнер не будет изменён.')
if c.get('Mounts'):
    sys.exit('Контейнер содержит mounts: автоматическая замена конфигурации запрещена.')
if l.get('io.dropvia.managed')=='true':
    if l.get('io.dropvia.version')!=version: sys.exit('Версия контейнера не совпадает с образом.')
    address=l.get('io.dropvia.address',''); port=l.get('io.dropvia.port','')
else:
    bindings=(c.get('HostConfig',{}).get('PortBindings') or {}).get('3000/tcp') or []
    if len(bindings)!=1: sys.exit('Для существующего контейнера требуется одна публикация порта 3000/tcp.')
    address=bindings[0].get('HostIp') or '0.0.0.0'; port=bindings[0].get('HostPort','')
try:
    address=str(ipaddress.ip_address(address))
    if not re.fullmatch(r'[0-9]+',str(port)) or not 1<=int(port)<=65535: raise ValueError()
except ValueError: sys.exit('Некорректные настройки bind IP/port существующего контейнера.')
if not re.fullmatch(r'[a-f0-9]{64}',c['Id']): sys.exit('Некорректный ID контейнера.')
print('\n'.join([c['Id'],c['Image'],version,address,str(int(port)),str(c['State']['Running']).lower(),str(l.get('io.dropvia.managed')=='true').lower()]))
PY
  ) || die 'Существующий контейнер нельзя безопасно обработать автоматически.'
  local values
  mapfile -t values <<<"$fields"
  C_ID=${values[0]} C_IMAGE=${values[1]} C_VERSION=${values[2]} C_ADDRESS=${values[3]} C_PORT=${values[4]} C_RUNNING=${values[5]} C_MANAGED=${values[6]}
}

latest_release() {
  case "$(uname -m)" in x86_64 | amd64) ;; *) die 'Доступен только релиз linux/amd64; установка на этой архитектуре не поддерживается.' ;; esac
  download "https://api.github.com/repos/$REPOSITORY/releases/latest" "$WORKDIR/release.json"
  RELEASE_TAG=$(
    python3 - "$WORKDIR/release.json" "$SOURCE" <<'PY'
import json,re,sys
r=json.load(open(sys.argv[1],encoding='utf-8'))
t=r.get('tag_name','')
if r.get('draft') is not False or r.get('prerelease') is not False or not re.fullmatch(r'v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)',t):
    sys.exit('Последний релиз не является стабильным vX.X.X.')
n=f'dropvia-{t}-linux-amd64.tar.gz'
for name in [n,n+'.sha256']:
    assets=[a for a in r.get('assets',[]) if a.get('name')==name]
    if len(assets)!=1 or assets[0].get('browser_download_url')!=f'{sys.argv[2]}/releases/download/{t}/{name}':
        sys.exit('Релиз ещё не содержит полный проверяемый комплект image/checksum.')
print(t)
PY
  ) || die 'Не удалось получить готовый релиз. Текущая установка не изменена.'
}

download_image() {
  local name="dropvia-$RELEASE_TAG-linux-amd64.tar.gz" expected actual
  ARCHIVE="$WORKDIR/$name"
  download "$SOURCE/releases/download/$RELEASE_TAG/$name" "$ARCHIVE"
  download "$SOURCE/releases/download/$RELEASE_TAG/$name.sha256" "$WORKDIR/checksum"
  expected=$(
    python3 - "$WORKDIR/checksum" "$name" <<'PY'
import re,sys
s=open(sys.argv[1],encoding='ascii').read()
m=re.fullmatch(r'([a-fA-F0-9]{64})[ \t]+\*?'+re.escape(sys.argv[2])+r'\n?',s)
if not m: sys.exit('Некорректный checksum manifest.')
print(m[1].lower())
PY
  ) || die 'Checksum manifest отклонён.'
  actual=$(sha256sum <"$ARCHIVE")
  [[ "${actual%% *}" == "$expected" ]] || die 'SHA-256 архива не совпадает. Контейнер не изменён.'
}

load_image() {
  docker image load --input "$ARCHIVE" >/dev/null || die 'Docker не смог загрузить архив.'
  docker image inspect "dropvia:$RELEASE_TAG" >"$WORKDIR/new-image.json" || die 'Архив не содержит ожидаемого образа.'
  NEW_IMAGE=$(
    python3 - "$WORKDIR/new-image.json" "$SOURCE" "$RELEASE_TAG" <<'PY'
import json,re,sys
i=json.load(open(sys.argv[1],encoding='utf-8'))[0]
l=i.get('Config',{}).get('Labels') or {}
if i.get('Os')!='linux' or i.get('Architecture')!='amd64' or l.get('org.opencontainers.image.source')!=sys.argv[2] or l.get('org.opencontainers.image.version')!=sys.argv[3] or not re.fullmatch(r'sha256:[a-f0-9]{64}',i.get('Id','')):
    sys.exit('Образ имеет неверную платформу, источник или версию.')
print(i['Id'])
PY
  ) || die 'Загруженный образ не прошёл проверку.'
}

prompt_binding() {
  local address port normalized
  while true; do
    printf 'IP для прослушивания (0.0.0.0 — все IPv4 интерфейсы) [%s]: ' "${C_ADDRESS:-0.0.0.0}" >&2
    IFS= read -r address || die 'Нужен интерактивный ввод IP и порта.'
    printf 'Порт сервера [%s]: ' "${C_PORT:-3000}" >&2
    IFS= read -r port || die 'Нужен интерактивный ввод IP и порта.'
    address=${address:-${C_ADDRESS:-0.0.0.0}} port=${port:-${C_PORT:-3000}}
    if normalized=$(
      python3 - "$address" "$port" <<'PY'
import ipaddress,re,sys
try:
    address=str(ipaddress.ip_address(sys.argv[1]))
    if not re.fullmatch(r'[0-9]+',sys.argv[2]) or not 1<=int(sys.argv[2])<=65535: raise ValueError()
except ValueError: sys.exit('Введите IPv4/IPv6 и порт от 1 до 65535 (без имени домена).')
print(address); print(int(sys.argv[2]))
PY
    ); then
      local values
      mapfile -t values <<<"$normalized"
      BIND_ADDRESS=${values[0]} BIND_PORT=${values[1]}
      return
    fi
  done
}

snapshot_old() {
  OLD_ID=$C_ID OLD_IMAGE=$C_IMAGE OLD_VERSION=$C_VERSION OLD_ADDRESS=$C_ADDRESS OLD_PORT=$C_PORT OLD_RUNNING=$C_RUNNING
}

assert_supported_profile() {
  local accepted=0
  PROBE_ID=$(create_container "$OLD_IMAGE" "$OLD_VERSION" "$OLD_ADDRESS" "$OLD_PORT" "$NAME-profile-$$") || die 'Не удалось проверить профиль восстановления.'
  [[ "$PROBE_ID" =~ ^[a-f0-9]{64}$ ]] || die 'Некорректный ID проверочного контейнера.'
  docker container inspect "$PROBE_ID" >"$WORKDIR/profile.json" || die 'Не удалось прочитать профиль восстановления.'
  if python3 - "$WORKDIR/container.json" "$WORKDIR/profile.json" <<'PY'; then accepted=1; fi
import json,sys
old=json.load(open(sys.argv[1],encoding='utf-8'))[0]
standard=json.load(open(sys.argv[2],encoding='utf-8'))[0]
if old.get('HostConfig')!=standard.get('HostConfig'):
    sys.exit('Нестандартный HostConfig (network/resources/restart/logging/security): точный откат не поддерживается.')
a,b=old.get('Config',{}),standard.get('Config',{})
ignored={'Hostname','Image','Labels'}
for key in a.keys()|b.keys():
    if key not in ignored and (a.get(key) or None)!=(b.get(key) or None):
        sys.exit(f'Нестандартный Config.{key}: точный откат не поддерживается.')
if a.get('Hostname') not in (None,'',old['Id'][:12]):
    sys.exit('Нестандартный hostname: точный откат не поддерживается.')
allowed=(b.get('Labels') or {})
if any(key not in allowed or allowed[key]!=value for key,value in (a.get('Labels') or {}).items()):
    sys.exit('Контейнер имеет дополнительные/изменённые labels: точный откат не поддерживается.')
networks=old.get('NetworkSettings',{}).get('Networks') or {}
expected=set(standard.get('NetworkSettings',{}).get('Networks') or {}) or {'bridge'}
if set(networks)!=expected and not (not networks and old.get('State',{}).get('Status')=='created'):
    sys.exit('Нестандартный набор подключённых сетей: точный откат не поддерживается.')
for network in networks.values():
    if network.get('IPAMConfig') or network.get('Aliases') or network.get('DriverOpts') or network.get('GwPriority'):
        sys.exit('Нестандартные network IP/aliases: точный откат не поддерживается.')
PY
  docker container rm "$PROBE_ID" >/dev/null || die 'Не удалось убрать profile-check контейнер.'
  PROBE_ID=''
  [[ "$accepted" == 1 ]] || die 'Замена отменена до остановки: используйте ручную миграцию нестандартного контейнера.'
}

assert_exclusive_image() {
  local users
  users=$(docker container ls --all --quiet --no-trunc --filter "ancestor=$OLD_IMAGE") || die 'Не удалось проверить использование образа.'
  [[ "$users" == "$OLD_ID" ]] || die 'Образ используется другим контейнером. Переустановка с очисткой отменена.'
  python3 - "$WORKDIR/image.json" <<'PY'
import json,sys
tags=json.load(open(sys.argv[1],encoding='utf-8'))[0].get('RepoTags') or []
if len(tags)>1: sys.exit('Образ имеет дополнительные теги. Удаление по ID без force невозможно.')
PY
}

deploy() {
  local mode=$1 address=$2 port=$3 running=$4
  if [[ -n "$OLD_ID" ]]; then assert_supported_profile; fi
  if [[ "$mode" == reinstall ]]; then
    assert_exclusive_image || die 'Безопасная очистка старого образа невозможна.'
    docker image save --output "$WORKDIR/previous-image.tar" "$OLD_IMAGE" || die 'Не удалось сохранить резервный образ.'
  else
    load_image
  fi
  TRANSACTION=1
  if [[ -n "$OLD_ID" ]]; then
    if [[ "$mode" == reinstall ]]; then
      [[ "$OLD_RUNNING" != true ]] || docker container stop --time 20 "$OLD_ID" >/dev/null
      docker container rm "$OLD_ID" >/dev/null
      docker image rm --no-prune "$OLD_IMAGE" >/dev/null || die 'Не удалось удалить только старый образ.'
      load_image
    else
      docker container rename "$OLD_ID" "$NAME-rollback-$$"
      [[ "$OLD_RUNNING" != true ]] || docker container stop --time 20 "$OLD_ID" >/dev/null
    fi
  fi
  NEW_ATTEMPT=1
  NEW_ID=$(create_container "$NEW_IMAGE" "$RELEASE_TAG" "$address" "$port") || die 'Не удалось создать контейнер.'
  if [[ "$running" == true ]]; then
    docker container start "$NEW_ID" >/dev/null || die 'Не удалось запустить новую версию.'
    wait_ready "$NEW_ID" || die 'Новая версия не ответила на SSR readiness-проверку.'
  fi
  if [[ -n "$OLD_ID" && "$mode" != reinstall ]]; then docker container rm "$OLD_ID" >/dev/null; fi
  TRANSACTION=0
  if [[ -n "$OLD_IMAGE" && "$OLD_IMAGE" != "$NEW_IMAGE" && "$mode" != reinstall ]]; then
    docker image rm --no-prune "$OLD_IMAGE" >/dev/null 2>&1 || warn 'Предыдущий образ оставлен: он имеет другие ссылки или используется контейнером.'
  fi
  say "Установлен Dropvia $RELEASE_TAG. Bind: $address:$port → 3000/tcp."
  [[ "$running" != true ]] || say 'Контейнер запущен. Для 0.0.0.0/:: используйте IP сервера и выбранный порт.'
}

install_app() {
  local mode=install
  if read_container; then
    confirm "Найден Dropvia $C_VERSION. Переустановить контейнер с предварительным удалением только его старого образа?" || {
      say 'Переустановка отменена.'
      return
    }
    snapshot_old
    mode=reinstall
  fi
  prompt_binding
  latest_release
  download_image
  deploy "$mode" "$BIND_ADDRESS" "$BIND_PORT" true
}

update_app() {
  read_container || die 'Dropvia ещё не установлен. Выполните sudo dropvia install.'
  [[ "$C_MANAGED" == true ]] || die 'Этот контейнер создан без CLI. Сначала выполните install с подтверждением стандартной конфигурации.'
  snapshot_old
  latest_release
  if ! python3 - "$RELEASE_TAG" "$C_VERSION" <<'PY'; then
import sys
def version(s): return tuple(map(int,s[1:].split('.')))
sys.exit(0 if version(sys.argv[1])>version(sys.argv[2]) else 1)
PY
    say "Обновление не требуется: установлен $C_VERSION, latest $RELEASE_TAG."
    return
  fi
  download_image
  deploy update "$OLD_ADDRESS" "$OLD_PORT" "$OLD_RUNNING"
}

managed_executable() {
  [[ ! -L "$SCRIPT_SOURCE" ]] || die 'Операция с symlink CLI запрещена.'
  CLI_PATH=$(readlink -f -- "$SCRIPT_SOURCE")
  [[ "$(basename -- "$CLI_PATH")" == dropvia && -f "$CLI_PATH" && -O "$CLI_PATH" ]] || die 'Сначала установите CLI как обычный файл dropvia в bin.'
  grep -Fxq '# Dropvia CLI managed executable (schema 1)' "$CLI_PATH" || die 'Неверный идентификатор CLI.'
}

update_cli() {
  managed_executable
  need install
  download "$CLI_URL" "$WORKDIR/dropvia"
  [[ $(wc -c <"$WORKDIR/dropvia") -le 262144 ]] || die 'Новый CLI превышает допустимый размер.'
  [[ "$(head -n 1 "$WORKDIR/dropvia")" == '#!/usr/bin/env bash' ]] || die 'Неверный shebang нового CLI.'
  grep -Fxq '# Dropvia CLI managed executable (schema 1)' "$WORKDIR/dropvia" || die 'Скачан файл другого назначения.'
  bash -n "$WORKDIR/dropvia" || die 'Новый CLI имеет синтаксическую ошибку.'
  if cmp -s "$WORKDIR/dropvia" "$CLI_PATH"; then
    say 'CLI уже обновлён.'
    return
  fi
  STAGED_CLI=$(mktemp "$(dirname -- "$CLI_PATH")/.dropvia.XXXXXXXX")
  if install -m 0755 -o 0 -g 0 "$WORKDIR/dropvia" "$STAGED_CLI" && mv -fT -- "$STAGED_CLI" "$CLI_PATH"; then
    STAGED_CLI=''
    say 'CLI обновлён из публичной ветки main. Контейнер не изменён.'
  else
    die 'Обновление CLI не завершено; исходный файл сохранён.'
  fi
}

uninstall_app() {
  local image=''
  managed_executable
  if read_container; then
    image=$C_IMAGE
    if confirm "Остановить и удалить контейнер $NAME ($C_VERSION), сохранив Docker volumes?"; then
      [[ "$C_RUNNING" != true ]] || docker container stop --time 20 "$C_ID" >/dev/null
      docker container rm "$C_ID" >/dev/null
      if confirm "Удалить только образ $image (без force/prune)?"; then
        docker image rm --no-prune "$image" >/dev/null || warn 'Образ сохранён: он используется другим контейнером или имеет дополнительные теги.'
      fi
    fi
  else say 'Контейнер Dropvia отсутствует.'; fi
  if confirm "Удалить CLI $CLI_PATH?"; then
    rm -- "$CLI_PATH"
    say 'CLI удалён.'
  fi
}

usage() {
  cat <<'HELP'
Dropvia CLI — управление контейнером Ubuntu/linux-amd64
  sudo dropvia install     Latest release; IP/порт; подтверждение переустановки
  sudo dropvia uninstall   Подтверждения удаления контейнера, образа и CLI
  sudo dropvia update      Новая версия с сохранением bind и откатом при ошибке
  sudo dropvia update-cli  Обновить только CLI из публичной ветки main
  sudo dropvia up          Запустить остановленный контейнер
  sudo dropvia down        Остановить работающий контейнер
  dropvia --version       Версия CLI
HELP
}

main() {
  [[ $# -le 1 ]] || die 'Ожидается одна команда. Используйте dropvia --help.'
  case "${1:---help}" in --help | help | -h)
    usage
    return
    ;;
  --version)
    say "Dropvia CLI $CLI_VERSION"
    return
    ;;
  install | uninstall | update | update-cli | up | down) ;; *) die 'Неизвестная команда. Используйте dropvia --help.' ;; esac
  initialize
  if [[ "$1" == update-cli ]]; then
    update_cli
    return
  fi
  require_docker
  case "$1" in
    install) install_app ;;
    update) update_app ;;
    uninstall) uninstall_app ;;
    up)
      read_container || die 'Dropvia не установлен.'
      if [[ "$C_RUNNING" == true ]]; then say 'Контейнер уже запущен.'; else
        docker container start "$C_ID" >/dev/null
        if ! wait_ready "$C_ID"; then
          docker container stop --time 20 "$C_ID" >/dev/null
          die 'Контейнер не прошёл readiness-проверку.'
        fi
        say 'Контейнер запущен.'
      fi
      ;;
    down)
      read_container || die 'Dropvia не установлен.'
      if [[ "$C_RUNNING" == true ]]; then
        docker container stop --time 20 "$C_ID" >/dev/null
        say 'Контейнер остановлен.'
      else say 'Контейнер уже остановлен.'; fi
      ;;
  esac
}

main "$@"
