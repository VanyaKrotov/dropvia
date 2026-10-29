import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const inputs = JSON.parse(
  await readFile(new URL('../artifacts/dashboard-inputs.json', import.meta.url), 'utf8'),
);
const output = new URL('../public/images/dashboard/', import.meta.url);

await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const manifest = [];

try {
  const page = await browser.newPage();

  for (const input of inputs) {
    const png = await readFile(input.path);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const mobile = input.key.startsWith('mobile');
    const variants = [];

    for (const targetWidth of mobile ? [480, 960] : [800, 1600]) {
      const targetHeight = Math.round((targetWidth * height) / width);
      // Encoding/resizing only: the approved generated artwork is unchanged.
      const data = await page.evaluate(
        async ({ source, targetWidth, targetHeight }) => {
          const image = new globalThis.Image();

          image.src = source;
          await image.decode();
          const canvas = globalThis.document.createElement('canvas');

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Canvas unavailable');
          }

          context.imageSmoothingQuality = 'high';
          context.drawImage(image, 0, 0, targetWidth, targetHeight);

          return canvas.toDataURL('image/webp', 0.92).split(',')[1];
        },
        {
          source: `data:image/png;base64,${png.toString('base64')}`,
          targetWidth,
          targetHeight,
        },
      );
      const file = `${input.key}-${targetWidth}.webp`;
      const buffer = Buffer.from(data, 'base64');

      await writeFile(new URL(file, output), buffer);
      variants.push({
        file,
        width: targetWidth,
        height: targetHeight,
        bytes: buffer.length,
      });
    }

    manifest.push({
      key: input.key,
      generator: 'Built-in image_gen',
      prompt: input.prompt,
      sourceWidth: width,
      sourceHeight: height,
      variants,
    });
  }
} finally {
  await browser.close();
}

await writeFile(
  new URL('../docs/dashboard-image-manifest.json', import.meta.url),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log(
  `Exported ${manifest.length} generated screenshots as 16 responsive WebP assets.`,
);
