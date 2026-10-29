import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const stableTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateReleaseTag({ tag, commit, cwd = process.cwd() }) {
  if (typeof tag !== 'string' || tag.trim() !== tag || !stableTag.test(tag)) {
    throw new Error('Release tag must use stable vX.X.X format without leading zeros.');
  }

  if (typeof commit !== 'string' || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('The triggering commit must be a full Git SHA.');
  }

  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const expectedCommit = git('rev-parse', '--verify', `${commit}^{commit}`);
  const tagCommit = git('rev-parse', '--verify', `refs/tags/${tag}^{commit}`);
  const checkedOutCommit = git('rev-parse', 'HEAD');

  if (tagCommit !== expectedCommit || checkedOutCommit !== expectedCommit) {
    throw new Error(
      'The tag and checkout must match the triggering commit; the tag may have moved.',
    );
  }

  try {
    git('merge-base', '--is-ancestor', expectedCommit, 'refs/remotes/origin/main');
  } catch {
    throw new Error('Release commit must belong to the fetched origin/main history.');
  }

  const nodeVersion = readFileSync(join(cwd, '.nvmrc'), 'utf8').trim();

  if (!stableTag.test(`v${nodeVersion}`) || /\s/.test(nodeVersion)) {
    throw new Error('.nvmrc must contain an exact numeric Node.js version.');
  }

  return { tag, commit: expectedCommit, nodeVersion };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const result = validateReleaseTag({
      tag: process.env.RELEASE_TAG,
      commit: process.env.RELEASE_SHA,
    });

    if (!process.env.GITHUB_OUTPUT) {
      throw new Error('GITHUB_OUTPUT is required when running release validation.');
    }

    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `tag=${result.tag}\ncommit=${result.commit}\nnode_version=${result.nodeVersion}\n`,
    );
    console.log(`Validated ${result.tag} at ${result.commit} in main history.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Release validation failed.');
    process.exitCode = 1;
  }
}
