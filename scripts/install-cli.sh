#!/usr/bin/env bash
# Dropvia CLI bootstrap (schema 1)
set -Eeuo pipefail
umask 077

readonly URL='https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/dropvia.sh'
BIN_DIR=${DROPVIA_BIN_DIR:-/usr/local/bin}
STATE_DIR=${DROPVIA_STATE_DIR:-/var/lib/dropvia}
downloaded=''
staged=''

die() {
  printf 'Dropvia installer: %s\n' "$*" >&2
  exit 1
}
cleanup() {
  local file
  for file in "$downloaded" "$staged"; do
    if [[ -n "$file" && "$(dirname -- "$file")" == "$BIN_DIR" && "$(basename -- "$file")" == .dropvia.* && ! -L "$file" ]]; then rm -f -- "$file"; fi
  done
}

case "${1:-}" in '' | --install) ;; --help)
  printf 'sudo bash install-cli.sh [--install]\n'
  exit 0
  ;;
*) die 'Допустим только флаг --install.' ;; esac
[[ $# -le 1 ]] || die 'Слишком много аргументов.'
[[ "$(uname -s)" == Linux && "$(id -u)" == 0 ]] || die 'Запустите установщик через sudo на Ubuntu/Linux.'
for command in curl bash install flock readlink mktemp; do command -v "$command" >/dev/null 2>&1 || die "Не найдена команда $command."; done
[[ "$BIN_DIR" == /* && "$BIN_DIR" != / && ! -L "$BIN_DIR" && "$BIN_DIR" != *$'\n'* ]] || die 'Неверный bin directory.'
[[ "$STATE_DIR" == /* && ! -L "$STATE_DIR" && "$STATE_DIR" != *$'\n'* ]] || die 'Неверный state directory.'
BIN_DIR=$(readlink -m -- "$BIN_DIR")
STATE_DIR=$(readlink -m -- "$STATE_DIR")
[[ "$(basename -- "$STATE_DIR")" == dropvia ]] || die 'State directory должен называться dropvia.'
mkdir -p -- "$BIN_DIR" "$STATE_DIR"
[[ -O "$BIN_DIR" && -O "$STATE_DIR" && ! -L "$STATE_DIR/lock" ]] || die 'Директории должны принадлежать root; symlink lock запрещён.'
chmod 700 -- "$STATE_DIR"
exec 9>"$STATE_DIR/lock"
flock --exclusive --nonblock 9 || die 'Другая операция dropvia уже выполняется.'
target="$BIN_DIR/dropvia"
[[ ! -L "$target" && ! -d "$target" ]] || die 'Нельзя заменить symlink или директорию dropvia.'
if [[ -e "$target" ]]; then
  grep -Fxq '# Dropvia CLI managed executable (schema 1)' "$target" || die 'Существующий файл не является Dropvia CLI.'
  printf 'Заменить существующий CLI %s? [y/N]: ' "$target" >&2
  IFS= read -r answer || exit 0
  case "$answer" in y | Y | yes | YES | да | Да) ;; *)
    printf 'Установка CLI отменена.\n'
    exit 0
    ;;
  esac
fi
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
downloaded=$(mktemp "$BIN_DIR/.dropvia.download.XXXXXXXX")
curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error \
  --retry 2 --connect-timeout 10 --max-time 60 --max-filesize 262144 \
  --output "$downloaded" "$URL" || die 'Не удалось скачать CLI; исходный файл не изменён.'
[[ $(wc -c <"$downloaded") -le 262144 && "$(head -n 1 "$downloaded")" == '#!/usr/bin/env bash' ]] || die 'Неверный размер или shebang CLI.'
grep -Fxq '# Dropvia CLI managed executable (schema 1)' "$downloaded" || die 'Неверный идентификатор скачанного файла.'
bash -n "$downloaded" || die 'CLI не прошёл проверку синтаксиса.'
staged=$(mktemp "$BIN_DIR/.dropvia.install.XXXXXXXX")
install -m 0755 -o 0 -g 0 "$downloaded" "$staged"
mv -fT -- "$staged" "$target"
printf 'CLI установлен: %s\n' "$target"
cleanup
trap - EXIT INT TERM
exec 9>&-
if [[ "${1:-}" == --install ]]; then exec "$target" install; fi
