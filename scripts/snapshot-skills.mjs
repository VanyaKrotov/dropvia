// Run only after reviewing upstream changes: node scripts/snapshot-skills.mjs --write
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

assert(
  process.argv.includes('--write'),
  'Explicit --write required after source/license review',
);
const root = fileURLToPath(new URL('../', import.meta.url));
const sources = JSON.parse(
  await readFile(path.join(root, 'docs/skills-sources.json'), 'utf8'),
);
const integrity = {
  version: 1,
  algorithm: 'SHA-256, UTF-8 text normalized to LF',
  skills: {},
};
const lock = { version: 1, skills: {} };

async function collect(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${entry.name}`);
    const relative = `${prefix}${entry.name}`;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(absolute, `${relative}/`)));
    else if (entry.isFile()) files.push({ relative, content: await readFile(absolute) });
  }
  return files.sort((a, b) => a.relative.localeCompare(b.relative));
}

for (const entry of sources.toSorted((a, b) => a.name.localeCompare(b.name))) {
  const files = await collect(path.join(root, '.agents/skills', entry.name));
  integrity.skills[entry.name] = {};
  const cliHash = createHash('sha256');
  for (const file of files) {
    const normalized = file.content.toString('utf8').replaceAll('\r\n', '\n');
    integrity.skills[entry.name][file.relative] = createHash('sha256')
      .update(normalized)
      .digest('hex');
    // Skills CLI 1.7.4 local-lock algorithm: sorted relative path + raw content.
    cliHash.update(file.relative).update(file.content);
  }
  const generated = entry.name === 'ui-ux-pro-max';
  lock.skills[entry.name] = {
    source: generated ? '.agents/skills/ui-ux-pro-max' : entry.source,
    sourceUrl: `https://github.com/${entry.source}/tree/${entry.commit}`,
    sourceType: generated ? 'local' : 'github',
    ref: entry.commit,
    ...(generated ? {} : { skillPath: `${entry.sourcePath}/SKILL.md` }),
    computedHash: cliHash.digest('hex'),
  };
}

await writeFile(
  path.join(root, 'docs/skills-integrity.json'),
  `${JSON.stringify(integrity, null, 2)}\n`,
);
await writeFile(
  path.join(root, 'skills-lock.json'),
  `${JSON.stringify(lock, null, 2)}\n`,
);
console.log(
  `Recorded reviewed snapshot for ${sources.length} skills. Review the changed registries before committing.`,
);
