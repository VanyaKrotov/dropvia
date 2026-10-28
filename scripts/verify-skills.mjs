import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sources = JSON.parse(
  await readFile(path.join(root, 'docs/skills-sources.json'), 'utf8'),
);
const expected = JSON.parse(
  await readFile(path.join(root, 'docs/skills-integrity.json'), 'utf8'),
);
const lock = JSON.parse(await readFile(path.join(root, 'skills-lock.json'), 'utf8'));
const skillRoot = path.join(root, '.agents/skills');

async function collect(directory, prefix = '') {
  const files = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Unexpected skill symlink: ${prefix}${entry.name}`);
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      Object.assign(
        files,
        await collect(path.join(directory, entry.name), `${relative}/`),
      );
    } else if (entry.isFile()) {
      const content = await readFile(path.join(directory, entry.name));
      // Git text checkout may normalize CRLF. The registry is intentionally LF-normalized.
      const normalized = content.toString('utf8').replaceAll('\r\n', '\n');
      files[relative] = createHash('sha256').update(normalized).digest('hex');
    }
  }
  return files;
}

const names = sources.map((entry) => entry.name).sort();
assert.equal(new Set(names).size, names.length, 'Duplicate skill manifest names');
assert.deepEqual(
  Object.keys(lock.skills).sort(),
  names,
  'Skills CLI lock does not match registry',
);
assert.deepEqual(
  Object.keys(expected.skills).sort(),
  names,
  'Integrity registry has missing/extra skills',
);
assert.deepEqual(
  (await readdir(skillRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(),
  names,
  'Unregistered skill directory',
);

let checkedFiles = 0;
for (const entry of sources) {
  assert.match(entry.commit, /^[0-9a-f]{40}$/, `Unpinned source: ${entry.name}`);
  assert.equal(
    lock.skills[entry.name].ref,
    entry.commit,
    `Unpinned CLI lock: ${entry.name}`,
  );
  const manifest = await readFile(path.join(skillRoot, entry.name, 'SKILL.md'), 'utf8');
  assert.match(manifest, /^---\r?\n/, `Missing frontmatter: ${entry.name}`);
  assert.match(
    manifest,
    new RegExp(`^name: ${entry.name}\\r?$`, 'm'),
    `Wrong name: ${entry.name}`,
  );
  assert.match(manifest, /^description:\s*\S/m, `Missing description: ${entry.name}`);
  const files = await collect(path.join(skillRoot, entry.name));
  assert.deepEqual(
    files,
    expected.skills[entry.name],
    `Skill changed or resource missing: ${entry.name}`,
  );
  assert(
    Object.keys(files).some((file) => /LICENSE|UPSTREAM-LICENSE/.test(file)),
    `License evidence missing: ${entry.name}`,
  );
  checkedFiles += Object.keys(files).length;
}

console.log(
  `Verified ${names.length} project skills, ${checkedFiles} files, unique manifests, licenses, pinned sources and normalized SHA-256 integrity.`,
);
