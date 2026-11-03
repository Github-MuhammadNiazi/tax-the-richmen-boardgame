import cinzel600 from '@fontsource/cinzel/files/cinzel-latin-600-normal.woff2?url';
import cinzel700 from '@fontsource/cinzel/files/cinzel-latin-700-normal.woff2?url';
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff2?url';
import { terrainImage } from '../data/terrain';

const cache = new Map<string, Promise<string>>();

/** Fetches a same-origin asset and returns it as a data URL (cached). */
export function toDataUrl(url: string): Promise<string> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
        return r.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = () => reject(fr.error);
            fr.readAsDataURL(blob);
          }),
      );
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

const FONTS: { family: string; weight: number; url: string }[] = [
  { family: 'Cinzel', weight: 600, url: cinzel600 },
  { family: 'Cinzel', weight: 700, url: cinzel700 },
  { family: 'Inter', weight: 400, url: inter400 },
  { family: 'Inter', weight: 600, url: inter600 },
];

/** @font-face rules with embedded font data, so standalone SVG/PNG output keeps the site typography. */
export async function embeddedFontCss(): Promise<string> {
  const rules = await Promise.all(
    FONTS.map(async (f) => `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;src:url(${await toDataUrl(f.url)}) format('woff2');}`),
  );
  return rules.join('');
}

const resized = new Map<string, Promise<string>>();

/** Loads an image and re-encodes it as JPEG no larger than `max` pixels on its longest side. */
export function toResizedDataUrl(url: string, max = 640, quality = 0.86): Promise<string> {
  const key = `${url}@${max}`;
  let p = resized.get(key);
  if (!p) {
    p = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas is not available in this browser.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error(`Could not load ${url}`));
      img.src = url;
    });
    p.catch(() => resized.delete(key));
    resized.set(key, p);
  }
  return p;
}

/** Preloads terrain art as compact data URLs and returns a synchronous resolver for TileFace. */
export async function embeddedImageResolver(files: string[], max = 640): Promise<(file: string) => string> {
  const unique = [...new Set(files)];
  const entries = await Promise.all(unique.map(async (f) => [f, await toResizedDataUrl(terrainImage(f, 'print'), max)] as const));
  const map = new Map(entries);
  return (file) => map.get(file) ?? terrainImage(file, 'print');
}
