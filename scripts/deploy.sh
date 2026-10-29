#!/usr/bin/env bash
# Dropvia Ubuntu deployment (schema 1)
set -Eeuo pipefail
umask 077

readonly INSTALLER_URL='https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/install-cli.sh'
readonly DOCKER_FINGERPRINT='9DC858229FC7DD38854AE2D88D81803C0EBFCD88'
OS_RELEASE_FILE=/etc/os-release
APT_SOURCES_DIR=/etc/apt/sources.list.d
APT_MAIN_SOURCE_FILE=/etc/apt/sources.list
KEYRINGS_DIR=/etc/apt/keyrings
STATE_DIR=${DROPVIA_STATE_DIR:-/var/lib/dropvia}
WORKDIR=''
KEY_STAGE=''
SOURCE_STAGE=''
APT_UPDATED=0
OS_CODENAME=''

say() { printf 'Dropvia deploy: %s\n' "$*"; }
die() {
  printf 'Dropvia deploy: %s\n' "$*" >&2
  exit 1
}
need() { command -v "$1" >/dev/null 2>&1 || die "Не найдена обязательная системная команда $1."; }

detect_ubuntu() {
  local ID='' VERSION_ID='' VERSION_CODENAME='' UBUNTU_CODENAME=''
  [[ -f "$OS_RELEASE_FILE" ]] || die 'Не найден /etc/os-release.'
  # This is the local root-managed OS identity, never downloaded input.
  # shellcheck source=/dev/null
  . "$OS_RELEASE_FILE"
  [[ "$ID" == ubuntu ]] || die 'Поддерживается только Ubuntu.'
  case "$VERSION_ID" in 22.04 | 24.04 | 26.04 | 26.10) ;; *) die "Ubuntu $VERSION_ID не поддерживается этим установщиком." ;; esac
  OS_CODENAME=${UBUNTU_CODENAME:-$VERSION_CODENAME}
  [[ "$OS_CODENAME" =~ ^[a-z]+$ ]] || die 'Некорректный Ubuntu codename.'
  [[ "$(dpkg --print-architecture)" == amd64 ]] || die 'Релизы Dropvia доступны только для Ubuntu amd64.'
}

package_installed() {
  [[ "$(dpkg-query -W -f='${Status}' "$1" 2>/dev/null)" == 'install ok installed' ]]
}

apt_update() {
  say 'Обновляю индекс APT.'
  apt-get -o DPkg::Lock::Timeout=120 update || die 'APT update завершился ошибкой. Установка остановлена.'
  APT_UPDATED=1
}

ensure_packages() {
  local package
  local -a missing=()
  for package in "$@"; do package_installed "$package" || missing+=("$package"); done
  if [[ ${#missing[@]} -eq 0 ]]; then return; fi
  [[ "$APT_UPDATED" == 1 ]] || apt_update
  say "Устанавливаю компоненты: ${missing[*]}"
  DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=120 \
    -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold \
    install --yes --no-install-recommends --no-remove "${missing[@]}" || die 'Не удалось установить необходимые пакеты; автоматическое удаление конфликтов запрещено.'
}

cleanup() {
  local file
  for file in "$KEY_STAGE" "$SOURCE_STAGE"; do
    if [[ -n "$file" && ! -L "$file" && "$(basename -- "$file")" == .dropvia-docker.* && ("$(dirname -- "$file")" == "$KEYRINGS_DIR" || "$(dirname -- "$file")" == "$APT_SOURCES_DIR") ]]; then rm -f -- "$file"; fi
  done
  if [[ -n "$WORKDIR" && -d "$WORKDIR" && ! -L "$WORKDIR" && "$(dirname -- "$WORKDIR")" == "$STATE_DIR" && "$(basename -- "$WORKDIR")" == deploy.tmp.* ]]; then rm -rf -- "$WORKDIR"; fi
}

initialize() {
  [[ "$STATE_DIR" == /* && ! -L "$STATE_DIR" && "$STATE_DIR" != *$'\n'* ]] || die 'Неверная директория состояния.'
  STATE_DIR=$(readlink -m -- "$STATE_DIR")
  [[ "$(basename -- "$STATE_DIR")" == dropvia ]] || die 'State directory должен называться dropvia.'
  mkdir -p -- "$STATE_DIR"
  [[ -O "$STATE_DIR" && ! -L "$STATE_DIR/deploy.lock" ]] || die 'State directory должен принадлежать root; symlink lock запрещён.'
  chmod 700 -- "$STATE_DIR"
  exec 8>"$STATE_DIR/deploy.lock"
  flock --exclusive --nonblock 8 || die 'Другой deploy уже выполняется.'
  WORKDIR=$(mktemp -d "$STATE_DIR/deploy.tmp.XXXXXXXX")
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
}

docker_ready() {
  command -v docker >/dev/null 2>&1 && [[ "$(docker info --format '{{.OSType}}' 2>/dev/null)" == linux ]]
}

has_docker_repository() {
  local file line
  for file in "$APT_MAIN_SOURCE_FILE" "$APT_SOURCES_DIR"/*.list "$APT_SOURCES_DIR"/*.sources; do
    [[ -f "$file" ]] || continue
    while IFS= read -r line || [[ -n "$line" ]]; do
      line=${line#"${line%%[![:space:]]*}"}
      [[ "$line" == deb\ * || "$line" == URIs:* ]] || continue
      if [[ "$line" == *https://download.docker.com/linux/ubuntu* ]]; then return 0; fi
    done <"$file"
  done
  return 1
}

configure_repository() {
  if has_docker_repository; then
    say 'Использую существующий Docker APT source.'
    return
  fi
  ensure_packages gnupg
  need gpg
  curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error \
    --retry 2 --connect-timeout 10 --max-time 60 --max-filesize 65536 \
    --output "$WORKDIR/docker.asc" https://download.docker.com/linux/ubuntu/gpg || die 'Официальный Docker key недоступен. Проверьте доступ к download.docker.com; сторонние зеркала автоматически не используются.'
  local fingerprint
  mkdir "$WORKDIR/gnupg"
  fingerprint=$(gpg --no-options --homedir "$WORKDIR/gnupg" --batch --show-keys --with-colons "$WORKDIR/docker.asc" | python3 -c '
import sys
primary = []
awaiting_primary = False
for line in sys.stdin:
    row = line.rstrip("\n").split(":")
    if row[0] == "pub":
        primary.append("")
        awaiting_primary = True
    elif row[0] == "sub":
        awaiting_primary = False
    elif row[0] == "fpr" and awaiting_primary and len(row) > 9:
        primary[-1] = row[9]
        awaiting_primary = False
print(primary[0] if len(primary) == 1 else "")
') || die 'Не удалось проверить Docker signing key.'
  [[ "$fingerprint" == "$DOCKER_FINGERPRINT" ]] || die 'Docker signing key fingerprint не совпадает с ожидаемым; APT source не добавлен.'
  local key="$KEYRINGS_DIR/dropvia-docker.asc" source="$APT_SOURCES_DIR/dropvia-docker.sources"
  [[ ! -L "$KEYRINGS_DIR" && ! -L "$APT_SOURCES_DIR" && ! -L "$key" && ! -L "$source" ]] || die 'Symlink в путях Docker APT configuration запрещён.'
  mkdir -p -- "$KEYRINGS_DIR" "$APT_SOURCES_DIR"
  chmod 755 -- "$KEYRINGS_DIR" "$APT_SOURCES_DIR"
  cat >"$WORKDIR/docker.sources" <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $OS_CODENAME
Components: stable
Architectures: amd64
Signed-By: $key
EOF
  if [[ -e "$key" ]] && ! cmp -s "$WORKDIR/docker.asc" "$key"; then die "Существующий $key не будет перезаписан."; fi
  if [[ -e "$source" ]] && ! cmp -s "$WORKDIR/docker.sources" "$source"; then die "Существующий $source не будет перезаписан."; fi
  KEY_STAGE=$(mktemp "$KEYRINGS_DIR/.dropvia-docker.XXXXXXXX")
  SOURCE_STAGE=$(mktemp "$APT_SOURCES_DIR/.dropvia-docker.XXXXXXXX")
  install -m 0644 "$WORKDIR/docker.asc" "$KEY_STAGE"
  install -m 0644 "$WORKDIR/docker.sources" "$SOURCE_STAGE"
  mv -fT -- "$KEY_STAGE" "$key"
  KEY_STAGE=''
  mv -fT -- "$SOURCE_STAGE" "$source"
  SOURCE_STAGE=''
  apt_update
}

ensure_docker() {
  local installed=0 package attempt
  local -a conflicts=()
  if docker_ready; then
    say 'Docker Engine уже доступен; пакеты и конфигурация сохраняются.'
    return
  elif ! systemctl cat docker.service >/dev/null 2>&1; then
    for package in docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc; do
      if package_installed "$package"; then conflicts+=("$package"); fi
    done
    [[ ${#conflicts[@]} -eq 0 ]] || die "Обнаружены конфликтующие пакеты: ${conflicts[*]}. Автоматическое удаление запрещено; требуется ручная миграция."
    configure_repository
    ensure_packages docker-ce docker-ce-cli containerd.io
    installed=1
  fi
  if systemctl cat docker.service >/dev/null 2>&1; then
    if systemctl cat containerd.service >/dev/null 2>&1; then
      systemctl enable --now containerd.service || die 'Не удалось запустить containerd.service.'
    fi
    systemctl enable --now docker.service || die 'Не удалось запустить docker.service. Проверьте journalctl -u docker.'
  elif [[ "$installed" == 1 ]]; then
    die 'После установки отсутствует docker.service.'
  else say 'Рабочий Docker не имеет systemd unit: его способ запуска не изменён.'; fi
  for ((attempt = 0; attempt < 30; attempt++)); do
    if docker_ready; then return; fi
    sleep 1
  done
  die 'Docker Engine не стал доступен. Проверьте systemctl status docker и journalctl -u docker.'
}

main() {
  if [[ "${1:-}" == --help ]]; then
    printf 'sudo bash deploy.sh — подготовить Ubuntu, Docker и запустить установку Dropvia.\n'
    return
  fi
  [[ $# -eq 0 ]] || die 'Параметры не поддерживаются. Используйте bash deploy.sh.'
  if [[ "$(id -u)" != 0 ]]; then
    need sudo
    exec sudo -- bash "${BASH_SOURCE[0]}" "$@"
  fi
  [[ "$(uname -s)" == Linux ]] || die 'Deploy предназначен для Ubuntu/Linux.'
  local command
  for command in apt-get dpkg dpkg-query systemctl; do need "$command"; done
  detect_ubuntu
  systemctl show --property=Version --value >/dev/null 2>&1 || die 'Требуется Ubuntu с работающим systemd (не chroot/контейнер без init).'
  ensure_packages ca-certificates curl python3 util-linux coreutils grep bash
  for command in curl python3 flock readlink mktemp sha256sum install; do need "$command"; done
  initialize
  export DOCKER_HOST=unix:///var/run/docker.sock
  unset DOCKER_CONTEXT
  ensure_docker
  say 'Компоненты готовы. Запускаю установщик CLI и контейнера; ответьте на вопросы IP/порта и подтверждения.'
  curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error \
    --retry 2 --connect-timeout 10 --max-time 60 --max-filesize 65536 \
    --output "$WORKDIR/install-cli.sh" "$INSTALLER_URL" || die 'Не удалось скачать установщик CLI.'
  [[ "$(head -n 1 "$WORKDIR/install-cli.sh")" == '#!/usr/bin/env bash' && $(wc -c <"$WORKDIR/install-cli.sh") -le 65536 ]] || die 'Неверный формат установщика CLI.'
  grep -Fxq '# Dropvia CLI bootstrap (schema 1)' "$WORKDIR/install-cli.sh" || die 'Неверный идентификатор установщика CLI.'
  bash -n "$WORKDIR/install-cli.sh" || die 'Установщик CLI не прошёл syntax check.'
  bash "$WORKDIR/install-cli.sh" --install
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
