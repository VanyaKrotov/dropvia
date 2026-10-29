import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateReleaseTag } from './validate-tag.mjs';

function fixture(t) {
  const parent = resolve(tmpdir());
  const cwd = mkdtempSync(join(parent, 'dropvia-release-'));

  t.after(() => {
    assert.equal(dirname(cwd), parent);
    assert.ok(basename(cwd).startsWith('dropvia-release-'));
    rmSync(cwd, { recursive: true, force: true });
  });

  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

  git('init', '--initial-branch=main');
  git('config', 'user.name', 'Release tests');
  git('config', 'user.email', 'release-tests@example.invalid');
  git('commit', '--allow-empty', '-m', 'Initial main commit');
  const first = git('rev-parse', 'HEAD');

  git('commit', '--allow-empty', '-m', 'Next main commit');
  const commit = git('rev-parse', 'HEAD');

  git('update-ref', 'refs/remotes/origin/main', commit);
  writeFileSync(join(cwd, '.nvmrc'), '22.22.3\n');

  return { cwd, git, first, commit };
}

test('accepts a lightweight stable tag on main', (t) => {
  const { cwd, git, commit } = fixture(t);

  git('tag', 'v1.2.3');
  assert.deepEqual(validateReleaseTag({ cwd, tag: 'v1.2.3', commit }), {
    tag: 'v1.2.3',
    commit,
    nodeVersion: '22.22.3',
  });
});

test('accepts an annotated tag and resolves the tag object to its commit', (t) => {
  const { cwd, git, commit } = fixture(t);

  git('tag', '-a', 'v0.1.0', '-m', 'Release');
  const tagObject = git('rev-parse', 'refs/tags/v0.1.0');

  assert.equal(
    validateReleaseTag({ cwd, tag: 'v0.1.0', commit: tagObject }).commit,
    commit,
  );
});

test('accepts an earlier main commit without building the current main tip', (t) => {
  const { cwd, git, first } = fixture(t);

  git('tag', 'v1.0.0', first);
  git('checkout', '--detach', first);
  assert.equal(validateReleaseTag({ cwd, tag: 'v1.0.0', commit: first }).commit, first);
});

test('resolves the tag namespace when a branch has the same release name', (t) => {
  const { cwd, git, first, commit } = fixture(t);

  git('branch', 'v1.2.3', first);
  git('tag', 'v1.2.3', commit);
  assert.equal(validateReleaseTag({ cwd, tag: 'v1.2.3', commit }).commit, commit);
});

test('rejects a tag on an unmerged feature commit', (t) => {
  const { cwd, git } = fixture(t);

  git('checkout', '-b', 'feature');
  git('commit', '--allow-empty', '-m', 'Unmerged feature');
  const commit = git('rev-parse', 'HEAD');

  git('tag', 'v1.2.3');
  assert.throws(() => validateReleaseTag({ cwd, tag: 'v1.2.3', commit }), /main/);
});

test('rejects a tag moved after the triggering commit', (t) => {
  const { cwd, git, first, commit } = fixture(t);

  git('tag', 'v1.2.3', commit);
  git('checkout', '--detach', first);
  assert.throws(() => validateReleaseTag({ cwd, tag: 'v1.2.3', commit: first }), /match/);
});

test('rejects non-release refs and malformed stable versions', () => {
  for (const tag of [
    'main',
    '1.2.3',
    'v1.2',
    'v1.2.3.4',
    'v01.2.3',
    'v1.2.3-rc.1',
    'v1.2.3+build',
    'v1.2.3\n',
    'v1.2.3\nforged=value',
  ]) {
    assert.throws(() => validateReleaseTag({ tag, commit: 'a'.repeat(40) }), /vX\.X\.X/);
  }
});

test('fails closed when the main reference is missing', (t) => {
  const { cwd, git, commit } = fixture(t);

  git('tag', 'v1.2.3');
  git('update-ref', '-d', 'refs/remotes/origin/main');
  assert.throws(() => validateReleaseTag({ cwd, tag: 'v1.2.3', commit }), /main/);
});

test('the workflow CLI emits validated outputs and leaves them unchanged on rejection', (t) => {
  const { cwd, git, commit } = fixture(t);

  git('tag', 'v1.2.3');
  const output = join(cwd, 'github-output');
  const script = fileURLToPath(new URL('./validate-tag.mjs', import.meta.url));
  const env = {
    ...process.env,
    RELEASE_TAG: 'v1.2.3',
    RELEASE_SHA: commit,
    GITHUB_OUTPUT: output,
  };

  execFileSync(process.execPath, [script], { cwd, env, stdio: 'pipe' });
  const expected = `tag=v1.2.3\ncommit=${commit}\nnode_version=22.22.3\n`;

  assert.equal(readFileSync(output, 'utf8'), expected);
  assert.throws(() =>
    execFileSync(process.execPath, [script], {
      cwd,
      env: { ...env, RELEASE_TAG: 'main' },
      stdio: 'pipe',
    }),
  );
  assert.equal(readFileSync(output, 'utf8'), expected);
});
