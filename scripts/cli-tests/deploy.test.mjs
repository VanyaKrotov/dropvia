import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cliTest, fixture } from './fixture.mjs';

function host(t, changes = {}) {
  const f = fixture(t, changes);
  f.env.DROPVIA_BIN_DIR += '/deployed';
  return f;
}

cliTest(
  'deploy provisions missing packages and Docker before installing CLI/container',
  (t) => {
    const f = host(t, { packages: [], dockerUnit: false, dockerReady: false });
    const result = f.deploy('127.0.0.1\n3030\n');
    assert.equal(result.status, 0, result.stderr);
    assert.ok(
      f
        .read()
        .calls.some(
          ([tool, ...args]) =>
            tool === 'apt-get' &&
            args.includes('docker-ce') &&
            args.includes('--no-remove'),
        ),
    );
    const source = readFileSync(
      join(f.directory, 'apt/sources/dropvia-docker.sources'),
      'utf8',
    );
    assert.match(source, /URIs: https:\/\/download.docker.com\/linux\/ubuntu/);
    assert.match(source, /Suites: noble/);
    assert.match(source, /Signed-By: .+dropvia-docker.asc/);
    assert.equal(existsSync(join(f.directory, 'deployed/dropvia')), true);
    assert.equal(Object.values(f.read().containers)[0].State.Running, true);
  },
);

cliTest(
  'deploy preserves a ready existing Docker installation without apt engine changes',
  (t) => {
    const f = host(t);
    const result = f.deploy('127.0.0.1\n3030\n');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      f.read().calls.some(([tool]) => tool === 'apt-get'),
      false,
    );
    assert.equal(
      f
        .read()
        .calls.some(
          ([tool, operation]) => tool === 'systemctl' && operation === 'enable',
        ),
      false,
    );
    assert.equal(
      existsSync(join(f.directory, 'apt/sources/dropvia-docker.sources')),
      false,
    );
  },
);

cliTest(
  'deploy starts an installed stopped Docker service instead of replacing packages',
  (t) => {
    const f = host(t, { dockerReady: false });
    assert.equal(f.deploy('127.0.0.1\n3030\n').status, 0);
    assert.ok(
      f
        .read()
        .calls.some(
          ([tool, ...args]) =>
            tool === 'systemctl' &&
            args.includes('--now') &&
            args.includes('docker.service'),
        ),
    );
    assert.equal(
      f.read().calls.some(([tool]) => tool === 'apt-get'),
      false,
    );
  },
);

cliTest('unsupported OS or architecture aborts before package/system changes', (t) => {
  const f = host(t);
  writeFileSync(
    join(f.directory, 'os-release'),
    'ID=debian\nVERSION_ID=12\nVERSION_CODENAME=bookworm\n',
  );
  assert.notEqual(f.deploy().status, 0);
  assert.equal(
    f.read().calls.some(([tool]) => tool === 'apt-get'),
    false,
  );
  const arm = host(t, { architecture: 'arm64' });
  assert.notEqual(arm.deploy().status, 0);
  assert.equal(
    arm.read().calls.some(([tool]) => tool === 'apt-get'),
    false,
  );
});

cliTest(
  'conflicting runtime packages are reported without removal or CLI installation',
  (t) => {
    const f = host(t, {
      dockerUnit: false,
      dockerReady: false,
      packages: ['containerd'],
    });
    const result = f.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /containerd/);
    assert.equal(
      f
        .read()
        .calls.some(
          ([tool, ...args]) =>
            tool === 'apt-get' &&
            args.some((arg) => /remove|purge/.test(arg) && arg !== '--no-remove'),
        ),
      false,
    );
    assert.equal(existsSync(join(f.directory, 'deployed/dropvia')), false);
  },
);

cliTest(
  'a wrong Docker signing key never writes a trusted source or installs engine',
  (t) => {
    const f = host(t, { dockerUnit: false, dockerReady: false, badKeyFingerprint: true });
    const result = f.deploy();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fingerprint/);
    assert.equal(
      existsSync(join(f.directory, 'apt/sources/dropvia-docker.sources')),
      false,
    );
    assert.equal(
      f
        .read()
        .calls.some(
          ([tool, ...args]) => tool === 'apt-get' && args.includes('docker-ce'),
        ),
      false,
    );
  },
);

cliTest('failed APT or Docker startup prevents installer handoff', (t) => {
  for (const changes of [
    { packages: [], failAptUpdate: true },
    { packages: [], failAptInstall: true },
    { dockerReady: false, failDockerStart: true },
  ]) {
    const f = host(t, changes);
    assert.notEqual(f.deploy().status, 0);
    assert.equal(existsSync(join(f.directory, 'deployed/dropvia')), false);
  }
});

cliTest(
  'an existing official Docker APT source is reused without a duplicate key/source',
  (t) => {
    const f = host(t, { dockerUnit: false, dockerReady: false });
    const directory = join(f.directory, 'apt/sources');
    mkdirSync(directory, { recursive: true });
    const existing =
      'deb [signed-by=/existing/docker.gpg] https://download.docker.com/linux/ubuntu noble stable\n';
    writeFileSync(join(directory, 'docker.list'), existing);
    const result = f.deploy('127.0.0.1\n3030\n');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(directory, 'docker.list'), 'utf8'), existing);
    assert.equal(existsSync(join(directory, 'dropvia-docker.sources')), false);
    assert.equal(
      f
        .read()
        .calls.some(
          ([tool, ...args]) =>
            tool === 'curl' &&
            args.includes('https://download.docker.com/linux/ubuntu/gpg'),
        ),
      false,
    );
  },
);

cliTest('invalid downloaded CLI installer is never executed', (t) => {
  const f = host(t);
  const payload = join(f.directory, 'bad-installer');
  writeFileSync(payload, '<html>not a script</html>');
  f.edit((state) => {
    state.bootstrapPayload = payload;
  });
  const result = f.deploy();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /формат установщика/);
  assert.equal(existsSync(join(f.directory, 'deployed/dropvia')), false);
  assert.equal(Object.keys(f.read().containers).length, 0);
});

cliTest(
  'a keyring with an additional primary key is rejected before trusting the source',
  (t) => {
    const f = host(t, {
      dockerUnit: false,
      dockerReady: false,
      additionalPrimaryKey: true,
    });
    assert.notEqual(f.deploy().status, 0);
    assert.equal(
      existsSync(join(f.directory, 'apt/sources/dropvia-docker.sources')),
      false,
    );
    assert.equal(
      f
        .read()
        .calls.some(
          ([tool, ...args]) => tool === 'apt-get' && args.includes('docker-ce'),
        ),
      false,
    );
  },
);
