import { createElement, Fragment, type ReactNode } from 'react';
import { embeddedFontCss, embeddedImageResolver } from '../export/assets';
import { slugify, svgToCanvas } from '../export/download';
import { HIDDEN_BACK } from '../data/terrain';
import type { SheetOptions } from './sheets';

/** 150 dpi is ample for cut-out cards and tokens and keeps files small. */
const PX_PER_MM = 150 / 25.4;

export async function exportSheetPdf(title: string, build: (opts: SheetOptions) => ReactNode[]) {
  const pdf = await buildSheetPdf(title, build);
  pdf.save(`tax-the-richmen-${slugify(title)}.pdf`);
}

/** Rasterizes A4 sheet pages (artwork and fonts embedded) into a multi-page PDF. */
export async function buildSheetPdf(title: string, build: (opts: SheetOptions) => ReactNode[]) {
  const [{ jsPDF }, { renderToStaticMarkup }, imageFor, fontCss] = await Promise.all([
    import('jspdf'),
    import('react-dom/server'),
    embeddedImageResolver([HIDDEN_BACK.file], 1200),
    embeddedFontCss(),
  ]);
  const pages = build({ imageFor, fontCss, pxPerMm: PX_PER_MM });
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  pdf.setProperties({ title: `Tax the Richmen — ${title}`, subject: 'Print at 100% scale', creator: 'Tax the Richmen companion site' });
  for (let i = 0; i < pages.length; i++) {
    const svg = renderToStaticMarkup(createElement(Fragment, null, pages[i]));
    const canvas = await svgToCanvas(svg, 210 * PX_PER_MM, 297 * PX_PER_MM, 1, '#ffffff');
    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  }
  return pdf;
}
