import { mkdirSync, writeFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import { COSTS, LIMITS, costEntries, type Cost } from '../src/data/costs.ts';
import type { PlayerSymbol } from '../src/data/players.ts';
import type { CostKey } from '../src/data/resources.ts';
import {
  BUILDING_COST_FILES,
  CARD_BLEED,
  CARD_BODY_PT,
  CARD_TRIM,
  backSections,
  backSlots,
  constructionRows,
  frontNotes,
  frontSlots,
  marketRows,
  propertyRows,
  sheetOrigin,
  type CardSlot,
} from '../src/print/buildingCostCard.ts';

const OUT = 'public/printables/cards';

type Rgb = [number, number, number];

const INK: Rgb = [42, 32, 24];
const BRASS: Rgb = [122, 90, 42];
const PARCHMENT: Rgb = [236, 224, 196];
const HAIR: Rgb = [168, 142, 96];
const OPEN: Rgb = [92, 42, 32];

const BODY = CARD_BODY_PT;

function rgb(hex: string): Rgb {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function shade(color: Rgb, factor: number): Rgb {
  return color.map((channel) => Math.round(channel * factor)) as Rgb;
}

function doc() {
  return new jsPDF({ unit: 'mm', format: 'a4', compress: false });
}

function slotOrigin(slot: CardSlot) {
  const sheet = sheetOrigin();
  const bleedX = sheet.x + slot.col * (sheet.box.w + 8);
  const bleedY = sheet.y + slot.row * (sheet.box.h + 8);
  return { bleedX, bleedY, trimX: bleedX + CARD_BLEED, trimY: bleedY + CARD_BLEED, sheet };
}

function crops(pdf: jsPDF, trimX: number, trimY: number) {
  const gap = CARD_BLEED + 0.7;
  const len = 3;
  pdf.setDrawColor(40);
  pdf.setLineWidth(0.12);
  const corners: [number, number, number, number][] = [
    [trimX, trimY, -1, -1],
    [trimX + CARD_TRIM.w, trimY, 1, -1],
    [trimX, trimY + CARD_TRIM.h, -1, 1],
    [trimX + CARD_TRIM.w, trimY + CARD_TRIM.h, 1, 1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    pdf.line(cx + sx * gap, cy, cx + sx * (gap + len), cy);
    pdf.line(cx, cy + sy * gap, cx, cy + sy * (gap + len));
  }
}

function symbol(pdf: jsPDF, kind: PlayerSymbol, cx: number, cy: number, r: number, color: Rgb, fill: boolean) {
  pdf.setDrawColor(...color);
  pdf.setFillColor(...color);
  pdf.setLineWidth(0.35);
  const mode = fill ? 'FD' : 'S';
  if (kind === 'circle') pdf.circle(cx, cy, r, mode);
  else if (kind === 'square') pdf.rect(cx - r, cy - r, r * 2, r * 2, mode);
  else if (kind === 'diamond') {
    const d = [
      [cx, cy - r],
      [cx + r, cy],
      [cx, cy + r],
      [cx - r, cy],
    ] as [number, number][];
    pdf.lines(
      d.map((point, i) => [d[(i + 1) % 4][0] - point[0], d[(i + 1) % 4][1] - point[1]]),
      d[0][0],
      d[0][1],
      [1, 1],
      mode,
      true,
    );
  } else {
    const top: [number, number] = [cx, cy - r];
    const right: [number, number] = [cx + r * 0.95, cy + r * 0.8];
    const left: [number, number] = [cx - r * 0.95, cy + r * 0.8];
    pdf.lines(
      [
        [right[0] - top[0], right[1] - top[1]],
        [left[0] - right[0], left[1] - right[1]],
        [top[0] - left[0], top[1] - left[1]],
      ],
      top[0],
      top[1],
      [1, 1],
      mode,
      true,
    );
  }
}

function icon(pdf: jsPDF, key: CostKey, x: number, y: number) {
  const s = 3.15;
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(0.28);
  if (key === 'money') {
    pdf.circle(x + s / 2, y, s / 2, 'S');
    pdf.line(x + s / 2, y - 1.05, x + s / 2, y + 1.05);
  } else if (key === 'wood') {
    pdf.roundedRect(x, y - 1.15, s, 0.85, 0.3, 0.3, 'S');
    pdf.roundedRect(x + 0.35, y + 0.15, s, 0.85, 0.3, 0.3, 'S');
  } else if (key === 'metal') {
    pdf.lines(
      [
        [s, 0],
        [-0.45, 1.5],
        [-s + 0.9, 0],
        [-0.45, -1.5],
      ],
      x,
      y - 0.75,
      [1, 1],
      'S',
      true,
    );
    pdf.line(x + 0.7, y - 0.75, x + 0.7, y + 0.75);
  } else if (key === 'fuel') {
    pdf.roundedRect(x + 0.35, y - 1.35, s - 0.7, 2.7, 0.45, 0.45, 'S');
    pdf.line(x + 0.35, y - 0.35, x + s - 0.35, y - 0.35);
    pdf.line(x + 0.35, y + 0.45, x + s - 0.35, y + 0.45);
  } else if (key === 'stone') {
    pdf.rect(x + 0.15, y - 1.2, s - 0.3, 2.4, 'S');
    pdf.line(x + 0.15, y - 0.2, x + s - 0.15, y + 0.7);
  } else if (key === 'steel') {
    pdf.circle(x + s / 2, y, s / 2 - 0.05, 'S');
    pdf.circle(x + s / 2, y, 0.45, 'S');
  } else {
    pdf.circle(x + s / 2, y, s / 2, 'S');
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      pdf.line(x + s / 2 + Math.cos(a) * 0.7, y + Math.sin(a) * 0.7, x + s / 2 + Math.cos(a) * 1.45, y + Math.sin(a) * 1.45);
    }
  }
  return s;
}

function chipsWidth(cost: Cost) {
  return costEntries(cost).length * 6.35;
}

function drawChips(pdf: jsPDF, cost: Cost, x: number, baseline: number) {
  let cursor = x;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(BODY);
  pdf.setTextColor(...INK);
  for (const [key, n] of costEntries(cost)) {
    const numeral = String(n);
    pdf.text(numeral, cursor, baseline);
    cursor += pdf.getTextWidth(numeral) + 0.45;
    icon(pdf, key, cursor, baseline - 0.35);
    cursor += 4.3;
  }
  return cursor;
}

class Frame {
  y: number;
  left: number;
  width: number;
  readonly bottom: number;
  readonly accent: Rgb;
  readonly name: string;

  constructor(
    readonly pdf: jsPDF,
    readonly trimX: number,
    readonly trimY: number,
    accent: Rgb,
    name: string,
  ) {
    this.left = trimX + 4.4;
    this.width = CARD_TRIM.w - 8.8;
    this.bottom = trimY + CARD_TRIM.h - 3.3;
    this.y = trimY + 4.6;
    this.accent = accent;
    this.name = name;
  }

  overflow() {
    if (this.y > this.bottom + 0.2) throw new Error(`${this.name} overflowed by ${(this.y - this.bottom).toFixed(1)} mm`);
  }

  text(value: string, size: number, style: 'normal' | 'bold' | 'italic', color: Rgb, width = this.width, x = this.left) {
    this.pdf.setFont('times', style);
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(...color);
    const lines: string[] = this.pdf.splitTextToSize(value, width);
    this.pdf.text(lines, x, this.y);
    this.y += lines.length * size * 0.3528 * 1.08 + 0.12;
    this.overflow();
    return lines.length;
  }

  rule() {
    this.pdf.setDrawColor(...HAIR);
    this.pdf.setLineWidth(0.15);
    this.pdf.line(this.left, this.y, this.left + this.width, this.y);
    this.y += 1.5;
    this.overflow();
  }

  heading(value: string) {
    this.y += 0.6;
    this.text(value.toUpperCase(), BODY, 'bold', this.accent);
    this.y -= 0.7;
    this.pdf.setDrawColor(...this.accent);
    this.pdf.setLineWidth(0.25);
    this.pdf.line(this.left, this.y, this.left + 16, this.y);
    this.y += 1.9;
    this.overflow();
  }
}

function legend(frame: Frame) {
  const items: [CostKey, string][] = [
    ['money', 'Money'],
    ['wood', 'Wood'],
    ['metal', 'Metal'],
    ['fuel', 'Fuel'],
    ['stone', 'Stone'],
    ['action', 'Action'],
  ];
  const slot = frame.width / items.length;
  const baseline = frame.y + 2.6;
  items.forEach(([key, label], i) => {
    const x = frame.left + i * slot;
    icon(frame.pdf, key, x, baseline - 0.3);
    frame.pdf.setFont('times', 'normal');
    frame.pdf.setFontSize(BODY);
    frame.pdf.setTextColor(...INK);
    frame.pdf.text(label, x + 3.7, baseline);
  });
  frame.y = baseline + 1.7;
  frame.rule();
}

function costLine(frame: Frame, label: string, cost: Cost, x: number, width: number) {
  const baseline = frame.y + 2.45;
  frame.pdf.setFont('times', 'normal');
  frame.pdf.setFontSize(BODY);
  frame.pdf.setTextColor(...INK);
  frame.pdf.text(label, x, baseline);
  const labelW = frame.pdf.getTextWidth(label);
  const chipsW = chipsWidth(cost);
  const chipsX = Math.max(x + labelW + 1.4, x + width - chipsW);
  if (chipsX + chipsW > x + width + 0.4) throw new Error(`${frame.name}: “${label}” chips do not fit`);
  drawChips(frame.pdf, cost, chipsX, baseline);
  frame.y = baseline + 1.2;
  frame.overflow();
}

function pair(frame: Frame, left: { label: string; cost: Cost }, right: { label: string; cost: Cost }) {
  const gap = 3;
  const col = (frame.width - gap) / 2;
  const saved = frame.y;
  costLine(frame, left.label, left.cost, frame.left, col);
  const next = frame.y;
  frame.y = saved;
  costLine(frame, right.label, right.cost, frame.left + col + gap, col);
  frame.y = Math.max(frame.y, next);
}

function front(pdf: jsPDF, slot: CardSlot, low: boolean) {
  const { bleedX, bleedY, trimX, trimY } = slotOrigin(slot);
  const accent = rgb(slot.player.hex);
  const textAccent = shade(accent, 0.72);
  if (!low) {
    pdf.setFillColor(...PARCHMENT);
    pdf.rect(bleedX, bleedY, CARD_TRIM.w + CARD_BLEED * 2, CARD_TRIM.h + CARD_BLEED * 2, 'F');
  }
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.7);
  pdf.rect(trimX + 1.6, trimY + 1.6, CARD_TRIM.w - 3.2, CARD_TRIM.h - 3.2);
  pdf.setDrawColor(...BRASS);
  pdf.setLineWidth(0.2);
  pdf.rect(trimX + 2.6, trimY + 2.6, CARD_TRIM.w - 5.2, CARD_TRIM.h - 5.2);
  crops(pdf, trimX, trimY);
  const frame = new Frame(pdf, trimX, trimY, textAccent, `${slot.player.id} front`);
  frame.y = trimY + 7.2;
  pdf.setCharSpace(0.6);
  frame.text('TAX THE RICHMEN', 8.5, 'bold', BRASS);
  pdf.setCharSpace(0);
  frame.y -= 0.4;
  frame.text('BUILDING COSTS', 13, 'bold', INK);
  frame.y -= 0.2;
  const name = `${slot.player.label.toUpperCase()}  ·  ${slot.player.symbol.toUpperCase()}`;
  frame.pdf.setFont('times', 'bold');
  frame.pdf.setFontSize(BODY);
  const nameW = frame.pdf.getTextWidth(name);
  symbol(pdf, slot.player.symbol, frame.left + (frame.width - nameW) / 2 - 2.2, frame.y - 1.1, 1.5, accent, !low);
  frame.text(name, BODY, 'bold', textAccent);
  legend(frame);

  const colGap = 3.4;
  const colW = (frame.width - colGap) / 2;
  const columnsTop = frame.y;
  const origin = frame.left;
  frame.width = colW;
  frame.heading('Property');
  for (const row of propertyRows()) costLine(frame, row.label, row.cost, frame.left, frame.width);
  const propertyBottom = frame.y;

  frame.y = columnsTop;
  frame.left = origin + colW + colGap;
  frame.heading('Construction');
  const built = constructionRows();
  costLine(frame, built[0].label, built[0].cost, frame.left, frame.width);
  costLine(frame, 'Pipeline', built[2].cost, frame.left, frame.width);
  costLine(frame, built[3].label, built[3].cost, frame.left, frame.width);
  costLine(frame, 'Toll', built[4].cost, frame.left, frame.width);
  const constructionBottom = frame.y;

  frame.left = origin;
  frame.width = CARD_TRIM.w - 8.8;
  frame.y = Math.max(propertyBottom, constructionBottom) + 2.4;
  costLine(frame, built[1].label, built[1].cost, frame.left, frame.width);
  costLine(frame, built[5].label, built[5].cost, frame.left, frame.width);
  costLine(frame, built[6].label, built[6].cost, frame.left, frame.width);
  frame.y += 1.8;
  for (const note of frontNotes().slice(0, 4)) frame.text(note, BODY, note.startsWith('Open') ? 'italic' : 'normal', note.startsWith('Open') ? OPEN : INK);
  for (const row of [built[1], built[5]]) {
    if (row.note) frame.text(row.note, BODY, 'italic', OPEN);
  }

  frame.heading('Port markets');
  const markets = marketRows();
  pair(frame, { label: 'Wood', cost: markets[0].cost }, { label: 'Metal', cost: markets[1].cost });
  pair(frame, { label: 'Fuel', cost: markets[2].cost }, { label: 'Stone', cost: markets[3].cost });

  frame.heading('Oil and Steel');
  drawOil(frame);
  frame.y += 0.4;
  pdf.setFillColor(...accent);
  if (!low) pdf.rect(trimX + 2.6, trimY + CARD_TRIM.h - 3.05, CARD_TRIM.w - 5.2, 1.15, 'F');
  else {
    pdf.setDrawColor(...accent);
    pdf.setLineWidth(0.4);
    pdf.line(trimX + 2.6, trimY + CARD_TRIM.h - 2.6, trimX + CARD_TRIM.w - 2.6, trimY + CARD_TRIM.h - 2.6);
  }
}

function drawOil(frame: Frame) {
  const gap = 3;
  const col = (frame.width - gap) / 2;
  const saved = frame.y;
  costLine(frame, 'Lease', COSTS.oilLease, frame.left, col);
  const next = frame.y;
  frame.y = saved;
  costLine(frame, 'Opening bid', COSTS.oilBidMinimum, frame.left + col + gap, col);
  frame.y = Math.max(frame.y, next) + 2.4;
  frame.text(`Raise by at least ${LIMITS.oilBidIncrement} Money. Paid at once, not refunded.`, BODY, 'normal', INK);
  frame.text('Open: Road access for a lease or bid is not decided.', BODY, 'italic', OPEN);
  const baseline = frame.y + 2.45;
  frame.pdf.setFont('times', 'normal');
  frame.pdf.setFontSize(BODY);
  frame.pdf.setTextColor(...INK);
  frame.pdf.text('Steel', frame.left, baseline);
  let x = frame.left + frame.pdf.getTextWidth('Steel') + 1.6;
  x = drawChips(frame.pdf, COSTS.steelPurchase, x, baseline);
  frame.pdf.setFont('times', 'bold');
  frame.pdf.text('=  1  Steel', x + 0.4, baseline);
  frame.y = baseline + 1.9;
  frame.text('Steel needs a Market and an activated Port. It is not an action.', BODY, 'normal', INK);
}

function columnText(pdf: jsPDF, lines: string[], x: number, y: number, width: number, color: Rgb, style: 'normal' | 'italic' = 'normal') {
  pdf.setFont('times', style);
  pdf.setFontSize(BODY);
  pdf.setTextColor(...color);
  let cursor = y;
  for (const line of lines) {
    const wrapped: string[] = pdf.splitTextToSize(line, width);
    pdf.text(wrapped, x, cursor);
    cursor += wrapped.length * BODY * 0.3528 * 1.08 + 0.28;
  }
  return cursor;
}

function back(pdf: jsPDF, slot: CardSlot, low: boolean) {
  const { bleedX, bleedY, trimX, trimY } = slotOrigin(slot);
  const accent = rgb(slot.player.hex);
  const textAccent = shade(accent, 0.72);
  if (!low) {
    pdf.setFillColor(...PARCHMENT);
    pdf.rect(bleedX, bleedY, CARD_TRIM.w + CARD_BLEED * 2, CARD_TRIM.h + CARD_BLEED * 2, 'F');
  }
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.7);
  pdf.rect(trimX + 1.6, trimY + 1.6, CARD_TRIM.w - 3.2, CARD_TRIM.h - 3.2);
  pdf.setDrawColor(...BRASS);
  pdf.setLineWidth(0.2);
  pdf.rect(trimX + 2.6, trimY + 2.6, CARD_TRIM.w - 5.2, CARD_TRIM.h - 5.2);
  crops(pdf, trimX, trimY);

  const frame = new Frame(pdf, trimX, trimY, textAccent, `${slot.player.id} back`);
  frame.y = trimY + 7.2;
  pdf.setCharSpace(0.6);
  frame.text('TAX THE RICHMEN', 8.5, 'bold', BRASS);
  pdf.setCharSpace(0);
  frame.y -= 0.4;
  frame.text('CONSTRUCTION & PLACEMENT', 11, 'bold', INK);
  const name = `${slot.player.label.toUpperCase()}  ·  ${slot.player.symbol.toUpperCase()}`;
  frame.pdf.setFont('times', 'bold');
  frame.pdf.setFontSize(BODY);
  const nameW = frame.pdf.getTextWidth(name);
  symbol(pdf, slot.player.symbol, frame.left + (frame.width - nameW) / 2 - 2.2, frame.y - 1.1, 1.5, accent, !low);
  frame.text(name, BODY, 'bold', textAccent);
  frame.rule();

  const sections = backSections();
  const leftTitles = new Set(['Roads', 'Owner priority', 'Tolls']);
  const left = sections.filter((section) => leftTitles.has(section.title));
  const right = sections.filter((section) => !leftTitles.has(section.title) && section.title !== 'Hidden terrain' && section.title !== 'Actions');
  const tail = sections.filter((section) => section.title === 'Hidden terrain' || section.title === 'Actions');
  const colW = (frame.width - 3.2) / 2;
  const start = frame.y + 0.4;
  let leftY = start;
  let rightY = start;
  for (const section of left) leftY = paintSection(pdf, section, frame.left, leftY, colW, textAccent);
  for (const section of right) rightY = paintSection(pdf, section, frame.left + colW + 3.2, rightY, colW, textAccent);
  frame.y = Math.max(leftY, rightY) + 1.2;
  frame.overflow();
  for (const section of tail) {
    frame.text(section.title.toUpperCase(), BODY, 'bold', textAccent, frame.width);
    frame.y -= 0.8;
    for (const line of section.lines) frame.text(line, BODY, line.startsWith('Open') ? 'italic' : 'normal', line.startsWith('Open') ? OPEN : INK);
  }
  if (frame.bottom - frame.y > 12) diagram(pdf, frame.left, frame.y + 0.6, frame.width, accent);
  if (!low) {
    pdf.setFillColor(...accent);
    pdf.rect(trimX + 2.6, trimY + CARD_TRIM.h - 3.05, CARD_TRIM.w - 5.2, 1.15, 'F');
  }
}

function paintSection(pdf: jsPDF, section: { title: string; lines: string[] }, x: number, y: number, width: number, accent: Rgb) {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(BODY);
  pdf.setTextColor(...accent);
  pdf.text(section.title.toUpperCase(), x, y);
  let cursor = y + 3.3;
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.2);
  pdf.line(x, y + 1.1, x + 12, y + 1.1);
  for (const line of section.lines) {
    cursor = columnText(pdf, [line], x, cursor, width, line.startsWith('Open') ? OPEN : INK, line.startsWith('Open') ? 'italic' : 'normal');
  }
  return cursor + 0.7;
}

function diagram(pdf: jsPDF, x: number, y: number, width: number, accent: Rgb) {
  const r = 4.2;
  const centers = [x + 14, x + width / 2, x + width - 14];
  const cy = y + r + 1.2;
  pdf.setDrawColor(...BRASS);
  pdf.setLineWidth(0.25);
  for (const cx of centers) {
    for (let k = 0; k < 6; k++) {
      const a0 = (Math.PI / 180) * 60 * k;
      const a1 = (Math.PI / 180) * 60 * ((k + 1) % 6);
      pdf.line(cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    }
  }
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.7);
  pdf.line(centers[0], cy, centers[1] - r - 0.4, cy);
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(0.45);
  pdf.line(centers[1] + r + 0.3, cy - 1.3, centers[2], cy - 1.3);
  pdf.circle(centers[1], cy, 1.1, 'S');
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...INK);
  pdf.text('Road', (centers[0] + centers[1]) / 2, cy + r + 3.6, { align: 'center' });
  pdf.text('Pipeline', (centers[1] + centers[2]) / 2, cy + r + 3.6, { align: 'center' });
  pdf.text('Rig', centers[1], cy - r - 1.3, { align: 'center' });
}

function paintSide(pdf: jsPDF, slots: CardSlot[], side: 'front' | 'back', low: boolean) {
  slots.forEach((slot) => (side === 'front' ? front(pdf, slot, low) : back(pdf, slot, low)));
}

function guide(pdf: jsPDF) {
  pdf.setFillColor(...PARCHMENT);
  pdf.rect(0, 0, 210, 297, 'F');
  pdf.setTextColor(...INK);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(18);
  pdf.text('Building cost cards', 16, 20);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  const paragraphs = [
    'Print on A4 paper at Actual size, 100% scale. Do not use “fit to page”.',
    'Each card trims to 90 × 128 mm. The sheet has a 3 mm bleed and crop marks. Cut on the crop marks, not on the outer edge of the colour.',
    'The duplex file is two pages. Page 1 is the four fronts: Red (circle), Blue (square), Green (triangle), Gold (diamond). Page 2 is the four backs, already mirrored left to right.',
    'For double-sided printing, flip on the long edge. After that flip, each coloured back should sit on the front with the same name and symbol. This alignment has not been checked on a physical printer. Hold the sheet to a window before you cut a whole set.',
    'Single-sided alternative: print the fronts file and the backs file on two sheets. Cut the eight cards apart and glue each back to the front with the same player name and symbol. Do not glue the sheets corner to corner without flipping them — the backs file is arranged for a long-edge flip, so an unflipped stack pairs Red with Blue.',
    'A short alignment test: print only the duplex file’s first page, draw a pencil cross in the margin, flip the paper on the long edge, and print page 2. The crop marks should meet. If your printer shifts them, use the single-sided method.',
    'Cardstock around 250–300 gsm is a practical choice for a hand of cards. That weight is a suggestion, not a tested specification. The low-ink file is the same duplex pair without the parchment fill.',
    'Every card carries the same costs, read from the Version 1 rules. Lines that begin with “Open” are playtest questions. They are not answers.',
    'These sheets do not replace the Steel Cards or the other reference sheets.',
  ];
  let y = 32;
  for (const paragraph of paragraphs) {
    const lines: string[] = pdf.splitTextToSize(paragraph, 178);
    pdf.text(lines, 16, y);
    y += lines.length * 5.2 + 3.2;
  }
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10);
  pdf.text('No physical paper test was made for this file.', 16, 280);
}

function writeNamed(pdf: jsPDF, file: string) {
  writeFileSync(`${OUT}/${file}`, Buffer.from(pdf.output('arraybuffer')));
}

export function writeBuildingCostCards() {
  mkdirSync(OUT, { recursive: true });
  const fronts = doc();
  paintSide(fronts, frontSlots(), 'front', false);
  writeNamed(fronts, 'building-cost-cards-a4-fronts.pdf');

  const backs = doc();
  paintSide(backs, backSlots(), 'back', false);
  writeNamed(backs, 'building-cost-cards-a4-backs.pdf');

  const duplex = doc();
  paintSide(duplex, frontSlots(), 'front', false);
  duplex.addPage();
  paintSide(duplex, backSlots(), 'back', false);
  writeNamed(duplex, 'building-cost-cards-a4-duplex.pdf');

  const low = doc();
  paintSide(low, frontSlots(), 'front', true);
  low.addPage();
  paintSide(low, backSlots(), 'back', true);
  writeNamed(low, 'building-cost-cards-a4-low-ink.pdf');

  const instructions = doc();
  guide(instructions);
  writeNamed(instructions, 'building-cost-cards-printing-guide.pdf');

  const names = BUILDING_COST_FILES.map((item) => item.file.split('/').pop());
  console.log('building cost cards', names.join(', '));
}
