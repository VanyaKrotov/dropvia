import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';

const [tool, ...args] = process.argv.slice(2);
const file = process.env.FAKE_HOST_STATE;
const state = JSON.parse(readFileSync(file, 'utf8'));
state.calls.push([tool, ...args]);
const save = () => writeFileSync(file, JSON.stringify(state));
const fail = (message) => {
  save();
  console.error(message);
  process.exit(1);
};
const imageFor = (ref) =>
  Object.values(state.images).find(
    (image) => image.Id === ref || image.RepoTags.includes(ref),
  );
const containerFor = (ref) =>
  Object.values(state.containers).find(
    (item) => item.Id === ref || item.Name === `/${ref}`,
  );
const print = (value) => {
  save();
  console.log(typeof value === 'string' ? value : JSON.stringify(value));
};

if (tool === 'id') {
  print('0');
} else if (tool === 'uname') {
  print(args[0] === '-m' ? (state.arch ?? 'x86_64') : 'Linux');
} else if (tool === 'flock') {
  if (state.busy) {
    fail('busy');
  }
  save();
} else if (tool === 'sleep') {
  save();
} else if (tool === 'install') {
  copyFileSync(args.at(-2), args.at(-1));
  chmodSync(args.at(-1), Number.parseInt(args[args.indexOf('-m') + 1], 8));
  save();
} else if (tool === 'dpkg-query') {
  if (!(state.packages ?? []).includes(args.at(-1))) {
    fail('not installed');
  }
  print('install ok installed');
} else if (tool === 'dpkg') {
  print(state.architecture ?? 'amd64');
} else if (tool === 'gpg') {
  print('pub:-:4096:1:8D81803C0EBFCD88:0:0::-:::scSC:');
  print(
    `fpr:::::::::${state.badKeyFingerprint ? '0'.repeat(40) : '9DC858229FC7DD38854AE2D88D81803C0EBFCD88'}:`,
  );
  print('sub:-:4096:1:SUBKEY:0:0:::::s:');
  print(`fpr:::::::::${'2'.repeat(40)}:`);
  if (state.additionalPrimaryKey) {
    print('pub:-:4096:1:OTHERKEY:0:0::-:::scSC:');
    print(`fpr:::::::::${'3'.repeat(40)}:`);
  }
} else if (tool === 'apt-get') {
  if (args.includes('update') && state.failAptUpdate) {
    fail('APT update failed');
  }
  if (args.includes('install')) {
    if (state.failAptInstall) {
      fail('APT install failed');
    }
    if (!args.includes('--no-remove')) {
      fail('APT must not remove packages');
    }
    const known = [
      'ca-certificates',
      'curl',
      'python3',
      'util-linux',
      'coreutils',
      'grep',
      'bash',
      'gnupg',
      'docker-ce',
      'docker-ce-cli',
      'containerd.io',
      'docker-buildx-plugin',
      'docker-compose-plugin',
    ];
    state.packages = [
      ...new Set([
        ...(state.packages ?? []),
        ...args.filter((arg) => known.includes(arg)),
      ]),
    ];
    if (args.includes('docker-ce')) {
      state.dockerUnit = true;
    }
  }
  save();
} else if (tool === 'systemctl') {
  if (args[0] === 'show') {
    print('255');
  } else if (args[0] === 'cat') {
    if (!state.dockerUnit) {
      fail('unit missing');
    }
    print('unit');
  } else if (args[0] === 'enable') {
    if (state.failDockerStart) {
      fail('service failed');
    }
    state.dockerReady = true;
    save();
  } else {
    fail('unexpected systemctl command');
  }
} else if (tool === 'curl') {
  const url = args.find((arg) => arg.startsWith('https://'));
  const output = args[args.indexOf('--output') + 1];
  const tag = state.latest ?? 'v1.0.0';
  const name = `dropvia-${tag}-linux-amd64.tar.gz`;
  const urlBase = `https://github.com/VanyaKrotov/dropvia/releases/download/${tag}`;
  const image = {
    Id: `sha256:${'2'.repeat(64)}`,
    Os: 'linux',
    Architecture: 'amd64',
    RepoTags: [`dropvia:${tag}`],
    Config: {
      Labels: {
        'org.opencontainers.image.source': 'https://github.com/VanyaKrotov/dropvia',
        'org.opencontainers.image.version': tag,
      },
    },
  };
  const archive = JSON.stringify(image);
  let body;
  if (state.failDownload) {
    fail('download failed');
  }
  if (url.endsWith('/releases/latest')) {
    body = JSON.stringify({
      tag_name: tag,
      draft: false,
      prerelease: false,
      assets: state.missingAssets
        ? []
        : [name, `${name}.sha256`].map((asset) => ({
            name: asset,
            browser_download_url: `${urlBase}/${asset}`,
          })),
    });
  } else if (url === `${urlBase}/${name}`) {
    body = archive;
  } else if (url === `${urlBase}/${name}.sha256`) {
    body = `${state.badChecksum ? '0'.repeat(64) : createHash('sha256').update(archive).digest('hex')}  ${name}\n`;
  } else if (
    url ===
    'https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/dropvia.sh'
  ) {
    body = readFileSync(state.cliPayload, 'utf8');
  } else if (
    url ===
    'https://raw.githubusercontent.com/VanyaKrotov/dropvia/main/scripts/install-cli.sh'
  ) {
    body = readFileSync(state.bootstrapPayload, 'utf8');
  } else if (url === 'https://download.docker.com/linux/ubuntu/gpg') {
    body = 'FAKE PUBLIC KEY\n';
  } else {
    fail(`unexpected URL ${url}`);
  }
  writeFileSync(output, body);
  save();
} else if (tool === 'docker') {
  const command = args.slice(0, 2).join(' ');
  if (args[0] === 'info') {
    if (state.dockerReady === false) {
      fail('engine unavailable');
    }
    if (args.includes('--format')) {
      print('linux');
    } else {
      save();
    }
  } else if (command === 'container inspect') {
    const item = containerFor(args.at(-1));
    if (!item) {
      fail('no container');
    }
    print([item]);
  } else if (command === 'image inspect') {
    const item = imageFor(args.at(-1));
    if (!item) {
      fail('no image');
    }
    print([item]);
  } else if (command === 'container ls') {
    const image = args.find((arg) => arg.startsWith('ancestor='))?.slice(9);
    print(
      Object.values(state.containers)
        .filter((item) => item.Image === image)
        .map((item) => item.Id)
        .join('\n'),
    );
  } else if (command === 'image save') {
    const image = imageFor(args.at(-1));
    if (!image) {
      fail('no saved image');
    }
    writeFileSync(args[args.indexOf('--output') + 1], JSON.stringify(image));
    save();
  } else if (command === 'image load') {
    const image = JSON.parse(readFileSync(args[args.indexOf('--input') + 1], 'utf8'));
    if (
      state.failLoad &&
      image.Config.Labels['org.opencontainers.image.version'] === state.latest
    ) {
      fail('load failed');
    }
    state.images[image.Id] = image;
    print('Loaded');
  } else if (command === 'image rm') {
    const image = imageFor(args.at(-1));
    if (!image) {
      fail('no image');
    }
    if (!args.includes('--no-prune') || args.includes('--force') || args.includes('-f')) {
      fail('unsafe image removal');
    }
    if (Object.values(state.containers).some((item) => item.Image === image.Id)) {
      fail('image in use');
    }
    if (image.RepoTags.length > 1) {
      fail('image has aliases');
    }
    delete state.images[image.Id];
    save();
  } else if (command === 'container create') {
    const name = args[args.indexOf('--name') + 1];
    if (containerFor(name)) {
      fail('name collision');
    }
    const image = imageFor(args.at(-1));
    if (!image) {
      fail('image unavailable');
    }
    const labels = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--label') {
        const [key, ...value] = args[i + 1].split('=');
        labels[key] = value.join('=');
      }
    }
    const id = (++state.counter).toString(16).padStart(64, '0');
    const binding = args[args.indexOf('--publish') + 1];
    const parts =
      binding.match(/^\[(.+)\]:([0-9]+):3000$/) ??
      binding.match(/^([^:]+):([0-9]+):3000$/);
    state.containers[id] = {
      Id: id,
      Image: image.Id,
      Name: `/${name}`,
      Config: { Image: args.at(-1), Labels: labels },
      HostConfig: {
        PortBindings: { '3000/tcp': [{ HostIp: parts[1], HostPort: parts[2] }] },
        ReadonlyRootfs: true,
        Init: true,
        NetworkMode: 'bridge',
        RestartPolicy: { Name: 'unless-stopped', MaximumRetryCount: 0 },
      },
      State: { Running: false, Status: 'created' },
      NetworkSettings: { Networks: { bridge: { Aliases: null, IPAMConfig: null } } },
      Mounts: [],
    };
    print(id);
  } else if (command === 'container start' || command === 'container stop') {
    const item = containerFor(args.at(-1));
    if (!item) {
      fail('no container');
    }
    if (
      command === 'container start' &&
      (state.failStartVersion === item.Config.Labels['io.dropvia.version'] ||
        (state.failStartVersions ?? []).includes(
          item.Config.Labels['io.dropvia.version'],
        ))
    ) {
      fail('start failed');
    }
    item.State.Running = command === 'container start';
    item.State.Status = item.State.Running ? 'running' : 'exited';
    save();
  } else if (command === 'container rename') {
    const item = containerFor(args.at(-2));
    if (!item || containerFor(args.at(-1))) {
      fail('rename failed');
    }
    item.Name = `/${args.at(-1)}`;
    save();
  } else if (command === 'container rm') {
    const item = containerFor(args.at(-1));
    if (!item || args.includes('--volumes') || args.includes('-v')) {
      fail('invalid removal');
    }
    delete state.containers[item.Id];
    save();
  } else if (command === 'container exec') {
    const item = containerFor(args[2]);
    if (
      !item?.State.Running ||
      state.failReadyVersion === item.Config.Labels['io.dropvia.version']
    ) {
      fail('not ready');
    }
    save();
  } else {
    fail(`unexpected docker operation: ${args.join(' ')}`);
  }
} else {
  fail(`unknown tool ${tool}`);
}
