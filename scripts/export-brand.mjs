import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Reproducible raster exports from the approved vector, no image dependencies.
const brandRoot = new URL('../public/brand/', import.meta.url);
const publicRoot = new URL('../public/', import.meta.url);
const [adaptive, onDark, onLight] = await Promise.all([
  readFile(new URL('dropvia-mark.svg', brandRoot), 'utf8'),
  readFile(new URL('dropvia-mark-on-dark.svg', brandRoot), 'utf8'),
  readFile(new URL('dropvia-mark-on-light.svg', brandRoot), 'utf8'),
]);

await writeFile(new URL('favicon.svg', publicRoot), adaptive);

const browser = await chromium.launch();

try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  async function render(svg, size, background = 'transparent') {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><head><style>html,body{margin:0;width:100%;height:100%;background:${background}}svg{display:block;width:100%;height:100%}</style></head><body>${svg}</body></html>`,
    );

    return page.screenshot({ omitBackground: background === 'transparent' });
  }

  const icoFrames = [];

  // Fixed midnight plate keeps the fallback recognizable in either browser theme.
  for (const size of [16, 32, 48]) {
    const png = await render(onDark, size, '#05060f');

    await writeFile(new URL(`favicon-${size}x${size}.png`, publicRoot), png);
    icoFrames.push({ size, png });
  }

  const header = Buffer.alloc(6);

  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoFrames.length, 4);
  let offset = 6 + 16 * icoFrames.length;
  const entries = icoFrames.map(({ size, png }) => {
    const entry = Buffer.alloc(16);

    entry[0] = size;
    entry[1] = size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;

    return entry;
  });

  await writeFile(
    new URL('favicon.ico', publicRoot),
    Buffer.concat([header, ...entries, ...icoFrames.map(({ png }) => png)]),
  );
  await writeFile(
    new URL('apple-touch-icon.png', publicRoot),
    await render(onDark, 180, '#05060f'),
  );
  await writeFile(
    new URL('dropvia-mark-on-dark-512.png', brandRoot),
    await render(onDark, 512),
  );
  await writeFile(
    new URL('dropvia-mark-on-light-512.png', brandRoot),
    await render(onLight, 512),
  );
} finally {
  await browser.close();
}

console.log('Exported adaptive favicon, ICO 16/32/48, PNG marks and Apple touch icon.');
