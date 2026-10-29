// Optional local discovery check. No model turn, configuration write or plugin install.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const expected = JSON.parse(
  await readFile(path.join(root, 'docs/skills-sources.json'), 'utf8'),
);
const executable = process.argv[2] || 'codex';
const child = spawn(executable, ['app-server', '--stdio'], {
  cwd: root,
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true,
});
const lines = createInterface({ input: child.stdout });

// Drain diagnostic output; it can contain user-level paths unrelated to this project.
child.stderr.resume();

const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);

try {
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Codex skills/list timed out')),
      30_000,
    );

    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Codex exited before discovery: ${code}`));
    });
    lines.on('line', (line) => {
      let message;

      try {
        message = JSON.parse(line);
      } catch {
        return;
      }

      if (message.id === 1) {
        if (message.error) {
          clearTimeout(timer);
          reject(new Error(message.error.message));

          return;
        }

        send({ method: 'initialized' });
        send({
          id: 2,
          method: 'skills/list',
          params: { cwds: [root], forceReload: true },
        });
      }

      if (message.id === 2) {
        clearTimeout(timer);

        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
      }
    });
    send({
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'dropvia-skill-discovery', version: '1.0.0' } },
    });
  });
  const listing = result.data.find(
    (entry) => path.resolve(entry.cwd) === path.resolve(root),
  );

  assert(listing, 'Codex returned no skill listing for this workspace');
  const localPath = path.join(root, '.agents/skills').toLowerCase();
  const repoSkills = listing.skills.filter((skill) =>
    skill.path.toLowerCase().startsWith(localPath),
  );
  const errors = listing.errors.filter((error) =>
    error.path.toLowerCase().startsWith(localPath),
  );

  assert.deepEqual(errors, [], 'Codex reported project skill parse errors');
  assert.deepEqual(
    repoSkills.map((skill) => skill.name).sort(),
    expected.map((entry) => entry.name).sort(),
  );
  assert(
    repoSkills.every((skill) => skill.enabled && skill.scope === 'repo'),
    'A project skill is disabled or has wrong scope',
  );
  const evidence = {
    checkedOn: new Date().toISOString().slice(0, 10),
    method: 'Codex app-server initialize + skills/list, forceReload=true; no model turn',
    skills: repoSkills
      .map(({ name, scope, enabled }) => ({ name, scope, enabled }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    errors,
  };

  await writeFile(
    path.join(root, 'docs/codex-skills-discovery.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  console.log(
    `Codex itself discovered ${repoSkills.length} enabled repo skills; project parse errors: ${errors.length}.`,
  );
} finally {
  lines.close();
  child.stdin.end();
  child.kill();
}
