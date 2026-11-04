import { mkdirSync, writeFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import { writeBuildingCostCards } from './building-cost-pdf.ts';
import { quickStartLines, referenceCards, steelCardValues } from '../src/print/tableCards.ts';

const OUT = 'public/printables/cards';
mkdirSync(OUT, { recursive: true });

const CARD_W = 60;
const CARD_H = 85;
const COLS = 3;
const ROWS = 3;
const GX = 8;
const GY = 6;

function doc() {
  return new jsPDF({ unit: 'mm', format: 'a4', compress: true });
}

function gridOrigin() {
  const w = COLS * CARD_W + (COLS - 1) * GX;
  const h = ROWS * CARD_H + (ROWS - 1) * GY;
  return { x: (210 - w) / 2, y: (297 - h) / 2 };
}

function cell(col: number, row: number) {
  const o = gridOrigin();
  return { x: o.x + col * (CARD_W + GX), y: o.y + row * (CARD_H + GY) };
}

function crops(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  const len = 2.4;
  const gap = 0.8;
  pdf.setDrawColor(30);
  pdf.setLineWidth(0.12);
  const corners: [number, number, number, number][] = [
    [x, y, -1, -1],
    [x + w, y, 1, -1],
    [x, y + h, -1, 1],
    [x + w, y + h, 1, 1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    pdf.line(cx + sx * gap, cy, cx + sx * (gap + len), cy);
    pdf.line(cx, cy + sy * gap, cx, cy + sy * (gap + len));
  }
}

function frame(pdf: jsPDF, x: number, y: number, w: number, h: number, ink: boolean) {
  pdf.setDrawColor(ink ? 40 : 90, ink ? 32 : 70, ink ? 24 : 40);
  pdf.setLineWidth(0.45);
  pdf.rect(x + 2.4, y + 2.4, w - 4.8, h - 4.8);
  pdf.setLineWidth(0.2);
  pdf.rect(x + 3.6, y + 3.6, w - 7.2, h - 7.2);
}

function steelFront(pdf: jsPDF, x: number, y: number, value: number, serial: number, ink: boolean) {
  if (!ink) {
    pdf.setFillColor(243, 232, 208);
    pdf.rect(x, y, CARD_W, CARD_H, 'F');
  }
  frame(pdf, x, y, CARD_W, CARD_H, ink);
  crops(pdf, x, y, CARD_W, CARD_H);
  pdf.setTextColor(ink ? 20 : 55, ink ? 16 : 40, 12);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(8);
  pdf.text('TAX THE RICHMEN', x + CARD_W / 2, y + 9, { align: 'center' });
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text('SHIPPING CERTIFICATE', x + CARD_W / 2, y + 14, { align: 'center' });
  pdf.setFontSize(22);
  pdf.text(String(value), x + 8, y + 12);
  pdf.text(String(value), x + CARD_W - 8, y + CARD_H - 8, { align: 'right' });
  pdf.setFontSize(28);
  pdf.text('STEEL', x + CARD_W / 2, y + 38, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.text(value === 1 ? '1 STEEL' : `${value} STEEL`, x + CARD_W / 2, y + 46, { align: 'center' });
  // Ingot
  const ix = x + 16;
  const iy = y + 52;
  pdf.setLineWidth(0.3);
  pdf.rect(ix, iy, 28, 12);
  pdf.line(ix + 4, iy, ix + 8, iy - 3);
  pdf.line(ix + 28, iy, ix + 32, iy - 3);
  pdf.line(ix + 8, iy - 3, ix + 32, iy - 3);
  pdf.line(ix + 32, iy - 3, ix + 32, iy + 9);
  pdf.line(ix + 32, iy + 9, ix + 28, iy + 12);
  pdf.setFontSize(8);
  pdf.text(`No. ${String(serial).padStart(2, '0')}  ·  value ${value}`, x + CARD_W / 2, y + CARD_H - 8, { align: 'center' });
}

function steelBack(pdf: jsPDF, x: number, y: number, ink: boolean) {
  if (!ink) {
    pdf.setFillColor(36, 40, 43);
    pdf.rect(x, y, CARD_W, CARD_H, 'F');
    pdf.setTextColor(232, 214, 176);
    pdf.setDrawColor(198, 161, 91);
  } else {
    pdf.setTextColor(20);
    pdf.setDrawColor(20);
  }
  frame(pdf, x, y, CARD_W, CARD_H, true);
  crops(pdf, x, y, CARD_W, CARD_H);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  pdf.text('TAX THE', x + CARD_W / 2, y + 28, { align: 'center' });
  pdf.setFontSize(16);
  pdf.text('RICHMEN', x + CARD_W / 2, y + 36, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  pdf.text('STEEL DECK', x + CARD_W / 2, y + 46, { align: 'center' });
  pdf.setLineWidth(0.25);
  pdf.circle(x + CARD_W / 2, y + 60, 8);
  pdf.setFontSize(12);
  pdf.text('1', x + CARD_W / 2, y + 61.5, { align: 'center' });
}

function pagesOf(values: number[]) {
  const pages: number[][] = [];
  for (let i = 0; i < values.length; i += COLS * ROWS) pages.push(values.slice(i, i + COLS * ROWS));
  return pages;
}

function steelPdf(kind: 'fronts' | 'backs' | 'duplex' | 'low-ink') {
  const pdf = doc();
  const values = steelCardValues();
  const pages = pagesOf(values);
  const ink = kind === 'low-ink';
  const drawFronts = () => {
    pages.forEach((page, pi) => {
      if (pi > 0) pdf.addPage();
      page.forEach((value, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const at = cell(col, row);
        const serial = pi * COLS * ROWS + i + 1;
        steelFront(pdf, at.x, at.y, value, serial, ink);
      });
    });
  };
  const drawBacks = (followsFronts: boolean) => {
    pages.forEach((page, pi) => {
      if (pi > 0 || followsFronts) pdf.addPage();
      page.forEach((_value, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        // Long-edge duplex flips left-right, so the back art is placed in the mirrored column.
        const at = cell(COLS - 1 - col, row);
        steelBack(pdf, at.x, at.y, ink);
      });
    });
  };
  if (kind === 'fronts') drawFronts();
  else if (kind === 'backs') drawBacks(false);
  else {
    drawFronts();
    drawBacks(true);
  }
  const name =
    kind === 'fronts'
      ? 'steel-cards-fronts.pdf'
      : kind === 'backs'
        ? 'steel-cards-backs.pdf'
        : kind === 'duplex'
          ? 'steel-cards-duplex.pdf'
          : 'steel-cards-low-ink.pdf';
  writeFileSync(`${OUT}/${name}`, Buffer.from(pdf.output('arraybuffer')));
}

function referencePdf(ink: boolean) {
  const pdf = doc();
  const cards = referenceCards();
  const w = 92;
  const h = 126;
  const originX = (210 - (w * 2 + 8)) / 2;
  const originY = (297 - (h * 2 + 8)) / 2;
  cards.forEach((card, i) => {
    const x = originX + (i % 2) * (w + 8);
    const y = originY + Math.floor(i / 2) * (h + 8);
    if (!ink) {
      pdf.setFillColor(243, 232, 208);
      pdf.rect(x, y, w, h, 'F');
    }
    pdf.setDrawColor(40);
    pdf.setLineWidth(0.4);
    pdf.rect(x + 2, y + 2, w - 4, h - 4);
    crops(pdf, x, y, w, h);
    pdf.setTextColor(25);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.text(card.title.toUpperCase(), x + w / 2, y + 12, { align: 'center' });
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    let cursor = y + 20;
    for (const line of card.lines) {
      const wrapped = pdf.splitTextToSize(line, w - 12);
      pdf.text(wrapped, x + 6, cursor);
      cursor += wrapped.length * 4.2 + 1.2;
    }
  });
  writeFileSync(`${OUT}/${ink ? 'player-reference-low-ink.pdf' : 'player-reference.pdf'}`, Buffer.from(pdf.output('arraybuffer')));
}

function quickStart() {
  const pdf = doc();
  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.text('TAX THE RICHMEN', 105, 22, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Quick start', 105, 32, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  let y = 48;
  for (const line of quickStartLines()) {
    const wrapped = pdf.splitTextToSize(line, 170);
    pdf.text(wrapped, 20, y);
    y += wrapped.length * 6 + 4;
  }
  pdf.setFontSize(9);
  pdf.text('Card size on the Steel sheets is a prototype proposal: 60 × 85 mm. Cut on the crop marks. Print at 100% scale.', 20, 270, { maxWidth: 170 });
  writeFileSync(`${OUT}/quick-start.pdf`, Buffer.from(pdf.output('arraybuffer')));
}

function hexTemplate() {
  const pdf = doc();
  const flat = 62;
  const R = flat / Math.sqrt(3);
  const labels = ['City', 'Village', 'Mine', 'Port', 'Oil Rig', 'Mountain', 'Water', 'Tax Office'];
  pdf.setFont('times', 'bold');
  pdf.setFontSize(16);
  pdf.text('Artwork-topper inserts', 105, 14, { align: 'center' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  pdf.text('Cut on the line. Each hex is 62 mm across the flats, the rebate in the printed-artwork topper.', 105, 20, { align: 'center' });
  labels.forEach((label, i) => {
    if (i === 6) pdf.addPage();
    const index = i < 6 ? i : i - 6;
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cx = 58 + col * 94;
    const cy = 64 + row * (flat + 12);
    pdf.setDrawColor(20);
    pdf.setLineWidth(0.25);
    for (let k = 0; k < 6; k++) {
      const a0 = (Math.PI / 180) * (60 * k);
      const a1 = (Math.PI / 180) * (60 * ((k + 1) % 6));
      pdf.line(cx + R * Math.cos(a0), cy + R * Math.sin(a0), cx + R * Math.cos(a1), cy + R * Math.sin(a1));
    }
    pdf.setFontSize(10);
    pdf.text(label, cx, cy + 1, { align: 'center' });
  });
  pdf.setFontSize(8);
  pdf.text('One reusable outline per terrain. Print the detailed terrain artwork separately and trim it to this hex. Prototype size, not a manufacturing specification.', 20, 288, { maxWidth: 170 });
  writeFileSync(`${OUT}/hex-insert-template.pdf`, Buffer.from(pdf.output('arraybuffer')));
}

writeBuildingCostCards();
steelPdf('fronts');
steelPdf('backs');
steelPdf('duplex');
steelPdf('low-ink');
referencePdf(false);
referencePdf(true);
quickStart();
hexTemplate();
console.log('cards written', steelCardValues().length);
