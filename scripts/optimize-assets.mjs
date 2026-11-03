// Converts generated master artwork in /art-source into web and print derivatives in /public/assets.
// Terrain receives a shared colour grade so every tile reads as one printed collection.
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'art-source';
const OUT = 'public/assets';

const files = (await readdir(SRC)).filter((f) => f.endsWith('.jpg'));

await mkdir(`${OUT}/terrain`, { recursive: true });
await mkdir(`${OUT}/print`, { recursive: true });
await mkdir(`${OUT}/components`, { recursive: true });
await mkdir(`${OUT}/hero`, { recursive: true });

const terrainGrade = (img) => img.modulate({ saturation: 0.86, brightness: 0.97 }).gamma(1.04);

for (const file of files) {
  const name = path.basename(file, '.jpg');
  const input = path.join(SRC, file);

  if (name.startsWith('terrain-') || name === 'tile-back-hidden') {
    await terrainGrade(sharp(input)).resize(512, 512).webp({ quality: 80 }).toFile(`${OUT}/terrain/${name}.webp`);
    await terrainGrade(sharp(input)).resize(1024, 1024).jpeg({ quality: 88, mozjpeg: true }).toFile(`${OUT}/print/${name}.jpg`);
  } else if (name.startsWith('comp-')) {
    await sharp(input).resize({ width: 1200, withoutEnlargement: false }).webp({ quality: 82 }).toFile(`${OUT}/components/${name}.webp`);
    await sharp(input).resize({ width: 640 }).webp({ quality: 78 }).toFile(`${OUT}/components/${name}-sm.webp`);
  } else if (name.startsWith('hero-')) {
    await sharp(input).resize({ width: 1920, kernel: 'lanczos3' }).sharpen({ sigma: 0.6 }).webp({ quality: 82 }).toFile(`${OUT}/hero/${name}.webp`);
    await sharp(input).resize({ width: 960 }).webp({ quality: 78 }).toFile(`${OUT}/hero/${name}-sm.webp`);
    await sharp(input).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(`public/og-image.jpg`);
  }
  console.log('optimized', name);
}
