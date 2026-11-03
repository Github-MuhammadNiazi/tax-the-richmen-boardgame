import { createElement } from 'react';
import { HIDDEN_BACK, variantFile } from '../data/terrain';
import type { BoardMap } from '../map/types';
import { printPages } from '../print/PrintHost';
import { embeddedFontCss, embeddedImageResolver } from './assets';
import { BoardSheet, SHEET_HEIGHT, SHEET_WIDTH } from './BoardSheet';
import { canvasToBlob, downloadBlob, slugify, svgToCanvas } from './download';

export interface BoardExportOptions {
  revealAll?: boolean;
  showNumbers?: boolean;
}

function filesFor(map: BoardMap): string[] {
  return [HIDDEN_BACK.file, ...map.tiles.map((t) => variantFile(t.terrain, t.variant))];
}

/** Renders the board sheet to a self-contained SVG document (artwork and fonts embedded). */
export async function boardSvgString(map: BoardMap, opts: BoardExportOptions = {}): Promise<string> {
  const [{ renderToStaticMarkup }, imageFor, fontCss] = await Promise.all([import('react-dom/server'), embeddedImageResolver(filesFor(map)), embeddedFontCss()]);
  const markup = renderToStaticMarkup(createElement(BoardSheet, { map, imageFor, fontCss, standalone: true, ...opts }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

export async function exportBoardSvg(map: BoardMap, opts?: BoardExportOptions) {
  const svg = await boardSvgString(map, opts);
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${slugify(map.name)}-${map.seed}.svg`);
}

export async function exportBoardPng(map: BoardMap, opts?: BoardExportOptions, scale = 2) {
  const svg = await boardSvgString(map, opts);
  const canvas = await svgToCanvas(svg, SHEET_WIDTH, SHEET_HEIGHT, scale);
  downloadBlob(await canvasToBlob(canvas), `${slugify(map.name)}-${map.seed}.png`);
}

export async function exportBoardPdf(map: BoardMap, opts?: BoardExportOptions) {
  const [{ jsPDF }, svg] = await Promise.all([import('jspdf'), boardSvgString(map, opts)]);
  const canvas = await svgToCanvas(svg, SHEET_WIDTH, SHEET_HEIGHT, 2, '#21180f');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pw / SHEET_WIDTH, ph / SHEET_HEIGHT);
  const w = SHEET_WIDTH * ratio;
  const h = SHEET_HEIGHT * ratio;
  pdf.setProperties({ title: `${map.name} — Tax the Richmen board`, subject: `Seed ${map.seed}` });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
  pdf.save(`${slugify(map.name)}-${map.seed}.pdf`);
}

export function printBoard(map: BoardMap, opts?: BoardExportOptions) {
  return printPages(createElement('div', { className: 'print-page' }, createElement(BoardSheet, { map, ...opts })), 'A3', 'landscape');
}
