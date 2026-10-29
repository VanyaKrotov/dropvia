#!/usr/bin/env bash
# Real Docker test, run only in the disposable Ubuntu release runner.
set -Eeuo pipefail
archive=$(readlink -f -- "$1")
readonly archive
readonly tag=$2
repository_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
readonly repository_root
[[ "$(id -u)" == 0 ]] || {
  printf 'Run the smoke test as root.\n' >&2
  exit 1
}
if docker container inspect dropvia >/dev/null 2>&1; then
  printf 'Refusing to touch an existing dropvia container in this runner.\n' >&2
  exit 1
fi
work=$(mktemp -d "${RUNNER_TEMP:-/tmp}/dropvia-cli-smoke.XXXXXXXX")
readonly work
cleanup() {
  local candidate
  if candidate=$(docker container inspect --format '{{.Id}}' dropvia 2>/dev/null); then
    if [[ "$(docker container inspect --format '{{index .Config.Labels "io.dropvia.managed"}}' "$candidate")" == true && "$(docker container inspect --format '{{index .Config.Labels "io.dropvia.version"}}' "$candidate")" == "$tag" ]]; then
      docker container rm --force "$candidate" >/dev/null
    fi
  fi
  if [[ "$(basename -- "$work")" == dropvia-cli-smoke.* && "$(dirname -- "$work")" == "${RUNNER_TEMP:-/tmp}" && ! -L "$work" ]]; then rm -rf -- "$work"; fi
}
trap cleanup EXIT
mkdir "$work/bin"
cp "$repository_root/scripts/dropvia.sh" "$work/dropvia"
chmod 755 "$work/dropvia"
export DROPVIA_STATE_DIR="$work/state/dropvia"
export DROPVIA_SMOKE_ARCHIVE="$archive" DROPVIA_SMOKE_TAG="$tag"
cat >"$work/bin/curl" <<'CURL'
#!/usr/bin/env bash
set -euo pipefail
output='' url=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output=$2; shift 2 ;;
    https://*) url=$1; shift ;;
    *) shift ;;
  esac
done
name="dropvia-$DROPVIA_SMOKE_TAG-linux-amd64.tar.gz"
base="https://github.com/VanyaKrotov/dropvia/releases/download/$DROPVIA_SMOKE_TAG"
case "$url" in
  https://api.github.com/repos/VanyaKrotov/dropvia/releases/latest)
    python3 - "$DROPVIA_SMOKE_TAG" "$base" "$name" > "$output" <<'PY'
import json,sys
t,b,n=sys.argv[1:]
print(json.dumps({'tag_name':t,'draft':False,'prerelease':False,'assets':[{'name':a,'browser_download_url':b+'/'+a} for a in [n,n+'.sha256']]}))
PY
    ;;
  "$base/$name") cp "$DROPVIA_SMOKE_ARCHIVE" "$output" ;;
  "$base/$name.sha256") cp "$DROPVIA_SMOKE_ARCHIVE.sha256" "$output" ;;
  *) printf 'Unexpected smoke-test request: %s\n' "$url" >&2; exit 1 ;;
esac
CURL
chmod 755 "$work/bin/curl"
export PATH="$work/bin:$PATH"
port=$(
  python3 - <<'PY'
import socket
with socket.socket() as s:
    s.bind(('127.0.0.1',0))
    print(s.getsockname()[1])
PY
)
printf '127.0.0.1\n%s\n' "$port" | "$work/dropvia" install
[[ "$(docker container inspect --format '{{.State.Running}}' dropvia)" == true ]]
"$work/dropvia" down
"$work/dropvia" down
"$work/dropvia" up
"$work/dropvia" up
"$work/dropvia" update
printf 'y\n\n\n' | "$work/dropvia" install
printf 'y\ny\nn\n' | "$work/dropvia" uninstall
if docker container inspect dropvia >/dev/null 2>&1; then
  printf 'Container was not removed.\n' >&2
  exit 1
fi
printf 'Ubuntu CLI Docker lifecycle smoke passed.\n'
