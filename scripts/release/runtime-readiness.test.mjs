import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { setTimeout } from 'node:timers';
import test from 'node:test';

const execute = promisify(execFile);
const windows = process.platform === 'win32';
const bash =
  process.env.CLI_TEST_BASH ?? (windows ? 'C:/Program Files/Git/bin/bash.exe' : 'bash');
const pathForBash = (path) =>
  windows
    ? path
        .replaceAll('\\', '/')
        .replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`)
    : path;

function readinessCommand() {
  const workflow = readFileSync(
    new URL('../../.github/workflows/docker-release.yml', import.meta.url),
    'utf8',
  );
  const block = workflow
    .split('- name: Verify non-root SSR runtime')[1]
    ?.split('- name:')[0];
  assert.ok(block, 'The SSR runtime smoke step must exist');
  const lines = block.split('\n');
  let index = lines.findIndex((line) => line.trimStart().startsWith('curl '));
  assert.ok(index >= 0, 'The runtime readiness request must exist');
  let command = lines[index].trim();
  while (command.endsWith('\\')) {
    command += '\n' + lines[++index].trim();
  }
  return command;
}

test('runtime readiness retries a connection reset and discards the partial response', async (t) => {
  const parent = resolve(tmpdir());
  const directory = mkdtempSync(join(parent, 'dropvia-runtime-test-'));
  t.after(() => {
    assert.equal(dirname(directory), parent);
    assert.ok(basename(directory).startsWith('dropvia-runtime-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  let requests = 0;
  const body = '<!doctype html><title>File storage and sharing | Dropvia</title>';
  const server = createServer((socket) => {
    socket.on('error', () => {});
    socket.once('data', () => {
      requests++;
      if (requests === 1) {
        socket.write(
          'HTTP/1.1 200 OK\r\nContent-Length: 999\r\n\r\nincomplete-startup-response',
        );
        setTimeout(() => socket.resetAndDestroy(), 30);
      } else {
        socket.end(
          `HTTP/1.1 200 OK\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`,
        );
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const command = readinessCommand().replace(
    'http://127.0.0.1:3000/',
    `http://127.0.0.1:${address.port}/`,
  );
  const result = await execute(bash, ['-c', 'set -euo pipefail;\n' + command], {
    env: { ...process.env, RUNNER_TEMP: pathForBash(directory) },
    timeout: 10_000,
  });
  const html = readFileSync(join(directory, 'home.html'), 'utf8');
  assert.equal(requests, 2, JSON.stringify({ command, ...result, html }));
  assert.equal(html, body);
});
