import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  chmodSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const windows = process.platform === 'win32';
const bash =
  process.env.CLI_TEST_BASH ?? (windows ? 'C:/Program Files/Git/bin/bash.exe' : 'bash');
const python =
  process.env.CLI_TEST_PYTHON ??
  (windows
    ? ''
    : execFileSync('python3', ['-c', 'import sys; print(sys.executable)'], {
        encoding: 'utf8',
      }).trim());
export const pathForBash = (path) =>
  windows
    ? path
        .replaceAll('\\', '/')
        .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`)
    : path;

export function fixture(t, changes = {}, installed = false) {
  const parent = resolve(tmpdir());
  const directory = mkdtempSync(join(parent, 'dropvia-cli-test-'));
  t.after(() => {
    assert.equal(dirname(directory), parent);
    assert.ok(basename(directory).startsWith('dropvia-cli-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const script = join(directory, 'dropvia');
  copyFileSync(join(root, 'scripts/dropvia.sh'), script);
  chmodSync(script, 0o755);
  const stateFile = join(directory, 'host.json');
  writeFileSync(
    join(directory, 'os-release'),
    'ID=ubuntu\nVERSION_ID=24.04\nVERSION_CODENAME=noble\n',
  );
  const imageId = `sha256:${'1'.repeat(64)}`;
  const containerId = 'a'.repeat(64);
  const labels = {
    'io.dropvia.managed': 'true',
    'io.dropvia.version': 'v0.1.0',
    'io.dropvia.address': '127.0.0.1',
    'io.dropvia.port': '8080',
  };
  const state = {
    calls: [],
    counter: 100,
    latest: 'v1.0.0',
    cliPayload: script,
    bootstrapPayload: join(root, 'scripts/install-cli.sh'),
    packages: [
      'ca-certificates',
      'curl',
      'python3',
      'util-linux',
      'coreutils',
      'grep',
      'bash',
    ],
    dockerUnit: true,
    images: {},
    containers: {},
    ...changes,
  };
  if (installed) {
    state.images[imageId] = {
      Id: imageId,
      Os: 'linux',
      Architecture: 'amd64',
      RepoTags: ['dropvia:v0.1.0'],
      Config: {
        Labels: {
          'org.opencontainers.image.source': 'https://github.com/VanyaKrotov/dropvia',
          'org.opencontainers.image.version': 'v0.1.0',
        },
      },
    };
    state.containers[containerId] = {
      Id: containerId,
      Image: imageId,
      Name: '/dropvia',
      Config: { Image: 'dropvia:v0.1.0', Labels: labels },
      HostConfig: {
        PortBindings: { '3000/tcp': [{ HostIp: '127.0.0.1', HostPort: '8080' }] },
        ReadonlyRootfs: true,
        Init: true,
        NetworkMode: 'bridge',
        RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 0 },
      },
      State: { Running: true, Status: 'running' },
      NetworkSettings: { Networks: { bridge: { Aliases: null, IPAMConfig: null } } },
      Mounts: [],
    };
  }
  writeFileSync(stateFile, JSON.stringify(state));
  const node = pathForBash(process.execPath);
  const fake = pathForBash(join(root, 'scripts/cli-tests/fake-host.mjs'));
  for (const tool of [
    'docker',
    'curl',
    'id',
    'uname',
    'flock',
    'sleep',
    'install',
    'dpkg-query',
    'dpkg',
    'apt-get',
    'systemctl',
    'gpg',
  ]) {
    const file = join(bin, tool);
    writeFileSync(file, `#!/usr/bin/env bash\nexec '${node}' '${fake}' '${tool}' "$@"\n`);
    chmodSync(file, 0o755);
  }
  writeFileSync(
    join(bin, 'python3'),
    `#!/usr/bin/env bash\nset -o pipefail\n'${pathForBash(python)}' "$@" | tr -d '\\r'\n`,
  );
  chmodSync(join(bin, 'python3'), 0o755);
  const env = {
    ...process.env,
    PATH: `${bin}${windows ? ';' : ':'}${process.env.PATH}`,
    FAKE_HOST_STATE: stateFile,
    FAKE_ROOT: pathForBash(directory),
    DROPVIA_STATE_DIR: `${pathForBash(directory)}/state/dropvia`,
    DROPVIA_BIN_DIR: pathForBash(directory),
    PYTHONIOENCODING: 'utf-8',
  };
  const runFile = (file, command, input = '') =>
    spawnSync(
      bash,
      [
        '-c',
        'export PATH="$1:$PATH"; exec bash "$2" "$3"',
        'dropvia-test',
        pathForBash(bin),
        pathForBash(file),
        command,
      ],
      { env, input, encoding: 'utf8', timeout: 45_000 },
    );
  const run = (command, input = '') => runFile(script, command, input);
  const bootstrap = (command = '', input = '') =>
    runFile(join(root, 'scripts/install-cli.sh'), command, input);
  const deploy = (input = '') =>
    spawnSync(
      bash,
      [
        '-c',
        'export PATH="$1:$PATH"; source "$2"; OS_RELEASE_FILE="$FAKE_ROOT/os-release"; APT_MAIN_SOURCE_FILE="$FAKE_ROOT/apt/sources.list"; APT_SOURCES_DIR="$FAKE_ROOT/apt/sources"; KEYRINGS_DIR="$FAKE_ROOT/apt/keyrings"; main',
        'deploy-test',
        pathForBash(bin),
        pathForBash(join(root, 'scripts/deploy.sh')),
      ],
      { env, input, encoding: 'utf8', timeout: 45_000 },
    );
  const read = () => JSON.parse(readFileSync(stateFile, 'utf8'));
  const edit = (fn) => {
    const next = read();
    fn(next);
    writeFileSync(stateFile, JSON.stringify(next));
  };
  return {
    run,
    bootstrap,
    deploy,
    read,
    edit,
    script,
    directory,
    env,
    containerId,
    imageId,
  };
}

export const cliTest = (name, fn) => test(name, { skip: !python }, fn);
export const dockerCalls = (state, operation) =>
  state.calls.filter(([tool, a, b]) => tool === 'docker' && `${a} ${b}` === operation);
