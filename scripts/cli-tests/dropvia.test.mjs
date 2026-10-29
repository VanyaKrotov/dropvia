import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, chmodSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fixture, cliTest, dockerCalls, pathForBash } from './fixture.mjs';

cliTest(
  'install verifies release checksum and publishes the requested IPv6 address/port',
  (t) => {
    const f = fixture(t);
    const result = f.run('install', '::1\n9090\n');
    assert.equal(result.status, 0, result.stderr);
    const state = f.read();
    assert.equal(
      dockerCalls(state, 'container create')[0].includes('[::1]:9090:3000'),
      true,
    );
    assert.equal(Object.values(state.containers)[0].State.Running, true);
  },
);

cliTest('bad checksum leaves an existing working installation untouched', (t) => {
  const f = fixture(t, { badChecksum: true }, true);
  const result = f.run('install', 'y\n\n\n');
  assert.notEqual(result.status, 0);
  assert.equal(f.read().containers[f.containerId].State.Running, true);
  assert.equal(dockerCalls(f.read(), 'container rm').length, 0);
});

cliTest('declining reinstall does not stop the container or remove images', (t) => {
  const f = fixture(t, {}, true);
  const result = f.run('install', 'n\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(dockerCalls(f.read(), 'container stop').length, 0);
  assert.equal(dockerCalls(f.read(), 'image rm').length, 0);
});

cliTest('update preserves bind settings and rolls back a failed new start', (t) => {
  const f = fixture(t, { failStartVersion: 'v1.0.0' }, true);
  const result = f.run('update');
  assert.notEqual(result.status, 0);
  const old = f.read().containers[f.containerId];
  assert.equal(old.Name, '/dropvia');
  assert.equal(old.State.Running, true);
});

cliTest('up and down are idempotent', (t) => {
  const f = fixture(t, {}, true);
  assert.equal(f.run('up').status, 0);
  assert.equal(f.run('down').status, 0);
  assert.equal(f.run('down').status, 0);
  assert.equal(dockerCalls(f.read(), 'container start').length, 0);
  assert.equal(dockerCalls(f.read(), 'container stop').length, 1);
});

cliTest('uninstall respects independent container/image/CLI confirmations', (t) => {
  const f = fixture(t, {}, true);
  const result = f.run('uninstall', 'y\nn\nn\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(Object.keys(f.read().containers).length, 0);
  assert.equal(Object.keys(f.read().images).length, 1);
  assert.equal(existsSync(f.script), true);
});

cliTest(
  'confirmed reinstall removes only the old image before loading the replacement',
  (t) => {
    const f = fixture(t, {}, true);
    const result = f.run('install', 'y\n127.0.0.1\n8081\n');
    assert.equal(result.status, 0, result.stderr);
    const state = f.read();
    const removal = dockerCalls(state, 'image rm')[0];
    assert.deepEqual(removal, ['docker', 'image', 'rm', '--no-prune', f.imageId]);
    assert.ok(
      state.calls.indexOf(removal) <
        state.calls.indexOf(dockerCalls(state, 'image load')[0]),
    );
    assert.equal(Object.keys(state.containers).length, 1);
    assert.equal(
      Object.values(state.containers)[0].Config.Labels['io.dropvia.port'],
      '8081',
    );
  },
);

cliTest('failed reinstall image load restores the saved old image and container', (t) => {
  const f = fixture(t, { failLoad: true }, true);
  const result = f.run('install', 'y\n\n\n');
  assert.notEqual(result.status, 0);
  const restored = Object.values(f.read().containers)[0];
  assert.equal(restored.Name, '/dropvia');
  assert.equal(restored.Image, f.imageId);
  assert.equal(restored.State.Running, true);
});

cliTest('reinstall refuses to delete an image shared with another container', (t) => {
  const f = fixture(t, {}, true);
  f.edit((state) => {
    state.containers.b = {
      ...state.containers[f.containerId],
      Id: 'b'.repeat(64),
      Name: '/other',
    };
  });
  assert.notEqual(f.run('install', 'y\n\n\n').status, 0);
  assert.equal(dockerCalls(f.read(), 'container stop').length, 0);
  assert.equal(dockerCalls(f.read(), 'image rm').length, 0);
});

cliTest(
  'successful update preserves bind settings and removes only the previous image',
  (t) => {
    const f = fixture(t, {}, true);
    const result = f.run('update');
    assert.equal(result.status, 0, result.stderr);
    const current = Object.values(f.read().containers)[0];
    assert.equal(current.Config.Labels['io.dropvia.address'], '127.0.0.1');
    assert.equal(current.Config.Labels['io.dropvia.port'], '8080');
    assert.equal(current.State.Running, true);
    assert.equal(dockerCalls(f.read(), 'image rm')[0].at(-1), f.imageId);
  },
);

cliTest('update preserves a stopped container state', (t) => {
  const f = fixture(t, {}, true);
  f.edit((state) => {
    state.containers[f.containerId].State.Running = false;
  });
  const result = f.run('update');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(Object.values(f.read().containers)[0].State.Running, false);
  assert.equal(dockerCalls(f.read(), 'container start').length, 0);
});

cliTest(
  'latest equal or older than installed never loads an image or downgrades',
  (t) => {
    for (const latest of ['v0.1.0', 'v0.0.9']) {
      const f = fixture(t, { latest }, true);
      assert.equal(f.run('update').status, 0);
      assert.equal(dockerCalls(f.read(), 'image load').length, 0);
    }
  },
);

cliTest(
  'invalid IP/port and unavailable release assets make no destructive changes',
  (t) => {
    for (const input of ['example.com\n8080\n', '127.0.0.1\n70000\n', '127.0.0.1\n0\n']) {
      const f = fixture(t);
      assert.notEqual(f.run('install', input).status, 0);
      assert.equal(dockerCalls(f.read(), 'container create').length, 0);
    }
    const f = fixture(t, { missingAssets: true }, true);
    assert.notEqual(f.run('update').status, 0);
    assert.equal(f.read().containers[f.containerId].State.Running, true);
  },
);

cliTest('a foreign container with the reserved name is never removed', (t) => {
  const f = fixture(t, {}, true);
  f.edit((state) => {
    state.images[f.imageId].Config.Labels['org.opencontainers.image.source'] =
      'https://example.com/foreign';
  });
  assert.notEqual(f.run('install', 'y\n\n\n').status, 0);
  assert.equal(dockerCalls(f.read(), 'container rm').length, 0);
});

cliTest(
  'uninstall can remove all three targets, but never volumes or other images',
  (t) => {
    const f = fixture(t, {}, true);
    assert.equal(f.run('uninstall', 'y\ny\ny\n').status, 0);
    assert.equal(existsSync(f.script), false);
    assert.equal(Object.keys(f.read().images).length, 0);
    assert.deepEqual(dockerCalls(f.read(), 'image rm')[0], [
      'docker',
      'image',
      'rm',
      '--no-prune',
      f.imageId,
    ]);
  },
);

cliTest(
  'update-cli atomically replaces the executable without contacting Docker',
  (t) => {
    const f = fixture(t);
    const payload = join(f.directory, 'new-cli');
    writeFileSync(payload, `${readFileSync(f.script, 'utf8')}\n# Updated CLI fixture\n`);
    f.edit((state) => {
      state.cliPayload = payload;
    });
    const result = f.run('update-cli');
    assert.equal(result.status, 0, result.stderr);
    assert.ok(readFileSync(f.script, 'utf8').endsWith('# Updated CLI fixture\n'));
    assert.equal(
      f.read().calls.some(([tool]) => tool === 'docker'),
      false,
    );
  },
);

cliTest('invalid CLI download preserves the existing executable', (t) => {
  const f = fixture(t);
  const original = readFileSync(f.script, 'utf8');
  const payload = join(f.directory, 'bad-cli');
  writeFileSync(
    payload,
    '#!/usr/bin/env bash\n# Dropvia CLI managed executable (schema 1)\nif then\n',
  );
  f.edit((state) => {
    state.cliPayload = payload;
  });
  assert.notEqual(f.run('update-cli').status, 0);
  assert.equal(readFileSync(f.script, 'utf8'), original);
});

cliTest('busy lock prevents Docker operations', (t) => {
  const f = fixture(t, { busy: true }, true);
  assert.notEqual(f.run('down').status, 0);
  assert.equal(
    f.read().calls.some(([tool]) => tool === 'docker'),
    false,
  );
});

cliTest(
  'bootstrap installs the CLI and can immediately run container installation',
  (t) => {
    const f = fixture(t);
    const destination = join(f.directory, 'installed');
    f.env.DROPVIA_BIN_DIR = pathForBash(destination);
    const result = f.bootstrap('--install', '127.0.0.1\n3005\n');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(destination, 'dropvia')), true);
    assert.equal(Object.values(f.read().containers)[0].State.Running, true);
  },
);

cliTest(
  'custom container settings block replacement before any stop or old-image removal',
  (t) => {
    for (const command of ['install', 'update']) {
      const f = fixture(t, {}, true);
      f.edit((state) => {
        state.containers[f.containerId].HostConfig.Memory = 128 * 1024 * 1024;
      });
      const result = f.run(command, command === 'install' ? 'y\n\n\n' : '');
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Нестандартный HostConfig/);
      assert.equal(f.read().containers[f.containerId].State.Running, true);
      assert.equal(dockerCalls(f.read(), 'container stop').length, 0);
      assert.equal(dockerCalls(f.read(), 'image rm').length, 0);
    }
  },
);

cliTest(
  'failed rollback retains the saved image and diagnostics for manual recovery',
  (t) => {
    const f = fixture(t, { failStartVersions: ['v1.0.0', 'v0.1.0'] }, true);
    const result = f.run('install', 'y\n\n\n');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Резервные файлы оставлены/);
    const stateDirectory = join(f.directory, 'state/dropvia');
    const work = readdirSync(stateDirectory).filter((name) => name.startsWith('tmp.'));
    assert.equal(work.length, 1);
    assert.equal(existsSync(join(stateDirectory, work[0], 'previous-image.tar')), true);
  },
);

cliTest('extra attached network without aliases blocks destructive replacement', (t) => {
  const f = fixture(t, {}, true);
  f.edit((state) => {
    state.containers[f.containerId].NetworkSettings.Networks.extra = {
      Aliases: null,
      IPAMConfig: null,
    };
  });
  const result = f.run('install', 'y\n\n\n');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /набор подключённых сетей/);
  assert.equal(f.read().containers[f.containerId].State.Running, true);
  assert.equal(dockerCalls(f.read(), 'container stop').length, 0);
});

cliTest('readiness failure after start restores the old running version', (t) => {
  const f = fixture(t, { failReadyVersion: 'v1.0.0' }, true);
  const result = f.run('update');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /readiness/);
  assert.equal(f.read().containers[f.containerId].Name, '/dropvia');
  assert.equal(f.read().containers[f.containerId].State.Running, true);
});

cliTest('failed atomic CLI rename leaves the original executable intact', (t) => {
  const f = fixture(t);
  const original = readFileSync(f.script, 'utf8');
  const payload = join(f.directory, 'new-cli');
  writeFileSync(payload, original + '\n# Candidate\n');
  f.edit((state) => {
    state.cliPayload = payload;
  });
  const mv = join(f.directory, 'bin/mv');
  writeFileSync(mv, '#!/usr/bin/env bash\nexit 1\n');
  chmodSync(mv, 0o755);
  const result = f.run('update-cli');
  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(f.script, 'utf8'), original);
  assert.deepEqual(
    readdirSync(f.directory).filter((name) => name.startsWith('.dropvia.')),
    [],
  );
});
