import { mkdirSync, writeFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import { COSTS, type Cost } from '../src/data/costs.ts';
import type { PlayerSymbol } from '../src/data/players.ts';
import {
  BACK_TITLE,
  BUILDING_COST_FILES,
  CARD_ACCENT,
  CARD_BLEED,
  CARD_TRIM,
  FRONT_TITLE,
  OFFICE_ALLOWED,
  OFFICE_BARRED,
  backCards,
  backSlots,
  cardMarks,
  constructionRows,
  frontSlots,
  improvementRows,
  marketRows,
  picturedCost,
  propertyRows,
  sheetOrigin,
  type CardSlot,
  type CostChip,
} from '../src/print/buildingCostCard.ts';
import {
  RESOURCE_GLYPH,
  bidPaddle,
  city,
  derrick,
  drawCheck,
  drawCross,
  drawHex,
  drawRoad,
  inspector,
  market,
  mine,
  mountain,
  mountainEntry,
  office,
  pipeline,
  port,
  roadPiece,
  setCardInk,
  steel,
  stone,
  tax,
  toll,
  upgrade,
  vault,
  village,
  water,
  type Rgb,
} from './card-art.ts';

const OUT = 'public/printables/cards';

const INK: Rgb = [42, 32, 24];
const BRASS: Rgb = [122, 90, 42];
const PARCHMENT: Rgb = [246, 237, 216];
const PARCHMENT_DEEP: Rgb = [234, 220, 190];
const HAIR: Rgb = [196, 170, 124];
const HEX_FACE: Rgb = [236, 224, 196];
const HEX_EDGE: Rgb = [92, 72, 48];

const PIECE: Record<string, (pdf: jsPDF, x: number, y: number, s: number) => void> = {
  City: city,
  Village: village,
  Mine: mine,
  Mountain: mountain,
  Road: roadPiece,
  'Mountain entry': mountainEntry,
  Pipeline: pipeline,
  Office: office,
  Toll: toll,
  Upgrade: upgrade,
  'Steel Vault': vault,
  Lease: derrick,
  Bid: bidPaddle,
  Steel: steel,
};

const MARKET_TINT: Record<string, Rgb> = {
  Wood: [148, 96, 52],
  Metal: [90, 96, 104],
  Fuel: [62, 72, 48],
  Stone: [120, 118, 112],
};

const SITE_GLYPH = { City: city, Village: village, Mine: mine, Mountain: mountain, Port: port, Rig: derrick, Water: water, Tax: tax };

function rgb(hex: string): Rgb {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

function doc() {
  return new jsPDF({ unit: 'mm', format: 'a4', compress: false });
}

function slotOrigin(slot: CardSlot) {
  const sheet = sheetOrigin();
  const bleedX = sheet.x + slot.col * (sheet.box.w + 8);
  const bleedY = sheet.y + slot.row * (sheet.box.h + 8);
  return { bleedX, bleedY, trimX: bleedX + CARD_BLEED, trimY: bleedY + CARD_BLEED };
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

function symbol(pdf: jsPDF, kind: PlayerSymbol, cx: number, cy: number, r: number, color: Rgb) {
  pdf.setDrawColor(...color);
  pdf.setFillColor(...color);
  pdf.setLineWidth(0.3);
  if (kind === 'circle') pdf.circle(cx, cy, r, 'F');
  else if (kind === 'square') pdf.rect(cx - r, cy - r, r * 2, r * 2, 'F');
  else if (kind === 'diamond') {
    const d: [number, number][] = [
      [cx, cy - r],
      [cx + r, cy],
      [cx, cy + r],
      [cx - r, cy],
    ];
    pdf.lines(
      d.map((point, i) => [d[(i + 1) % 4][0] - point[0], d[(i + 1) % 4][1] - point[1]]),
      d[0][0],
      d[0][1],
      [1, 1],
      'F',
      true,
    );
  } else {
    const top: [number, number] = [cx, cy - r];
    const right: [number, number] = [cx + r * 0.95, cy + r * 0.82];
    const left: [number, number] = [cx - r * 0.95, cy + r * 0.82];
    pdf.lines(
      [
        [right[0] - top[0], right[1] - top[1]],
        [left[0] - right[0], left[1] - right[1]],
        [top[0] - left[0], top[1] - left[1]],
      ],
      top[0],
      top[1],
      [1, 1],
      'F',
      true,
    );
  }
}

function text(pdf: jsPDF, value: string, x: number, y: number, size: number, style: 'normal' | 'bold' | 'italic' | 'bolditalic', color: Rgb, align: 'left' | 'center' | 'right' = 'left', baseline: 'alphabetic' | 'middle' = 'alphabetic') {
  pdf.setCharSpace(0);
  pdf.setFont('times', style);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  pdf.text(value, x, y, { align, baseline });
}

function widthOf(pdf: jsPDF, value: string, size: number, style: 'normal' | 'bold' | 'italic' | 'bolditalic') {
  pdf.setCharSpace(0);
  pdf.setFont('times', style);
  pdf.setFontSize(size);
  return pdf.getTextWidth(value);
}

function clusterWidth(pdf: jsPDF, entries: CostChip[], icon: number, numeralAt = 3) {
  const gap = icon * 0.14;
  let width = 0;
  entries.forEach((entry, index) => {
    if (index) width += gap * 0.35;
    if (entry.n >= numeralAt) width += widthOf(pdf, String(entry.n), 12, 'bold') + gap * 0.3 + icon;
    else width += entry.n * icon + Math.max(0, entry.n - 1) * gap;
  });
  return width;
}

function drawCluster(pdf: jsPDF, entries: CostChip[], left: number, cy: number, icon: number, numeralAt = 3) {
  const gap = icon * 0.14;
  let x = left;
  entries.forEach((entry, index) => {
    if (index) x += gap * 0.35;
    if (entry.key === 'action') throw new Error('action icons are not printed on the card');
    if (entry.n >= numeralAt) {
      const numeral = String(entry.n);
      text(pdf, numeral, x, cy, 12, 'bold', INK, 'left', 'middle');
      x += widthOf(pdf, numeral, 12, 'bold') + gap * 0.3;
      RESOURCE_GLYPH[entry.key](pdf, x, cy - icon / 2, icon);
      x += icon;
    } else {
      for (let n = 0; n < entry.n; n++) {
        RESOURCE_GLYPH[entry.key](pdf, x, cy - icon / 2, icon);
        x += icon + gap;
      }
      if (entry.n > 0) x -= gap;
    }
  });
  return x;
}

function cardChrome(pdf: jsPDF, bleedX: number, bleedY: number, trimX: number, trimY: number, accent: Rgb, low: boolean) {
  const box = { w: CARD_TRIM.w + CARD_BLEED * 2, h: CARD_TRIM.h + CARD_BLEED * 2 };
  pdf.setFillColor(...(low ? [255, 255, 255] : PARCHMENT));
  pdf.rect(bleedX, bleedY, box.w, box.h, 'F');
  if (!low) {
    pdf.setFillColor(232, 214, 176);
    pdf.rect(trimX + 1.2, trimY + 1.2, CARD_TRIM.w - 2.4, 1.1, 'F');
    pdf.rect(trimX + 1.2, trimY + CARD_TRIM.h - 2.3, CARD_TRIM.w - 2.4, 1.1, 'F');
  }
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.7);
  pdf.rect(trimX + 1.8, trimY + 1.8, CARD_TRIM.w - 3.6, CARD_TRIM.h - 3.6, 'S');
  pdf.setDrawColor(...BRASS);
  pdf.setLineWidth(0.15);
  pdf.rect(trimX + 2.8, trimY + 2.8, CARD_TRIM.w - 5.6, CARD_TRIM.h - 5.6, 'S');
  const L = 2.2;
  const inset = 3.5;
  pdf.setLineWidth(0.28);
  const corners: [number, number, number, number][] = [
    [trimX + inset, trimY + inset, 1, 1],
    [trimX + CARD_TRIM.w - inset, trimY + inset, -1, 1],
    [trimX + inset, trimY + CARD_TRIM.h - inset, 1, -1],
    [trimX + CARD_TRIM.w - inset, trimY + CARD_TRIM.h - inset, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    pdf.line(cx, cy, cx + sx * L, cy);
    pdf.line(cx, cy, cx, cy + sy * L);
  }
}

function badge(pdf: jsPDF, slot: CardSlot, trimX: number, trimY: number, accent: Rgb, side: 'left' | 'right') {
  const name = slot.player.label.toUpperCase();
  const nameW = widthOf(pdf, name, 8, 'bold');
  const cy = trimY + 7.15;
  if (side === 'left') {
    symbol(pdf, slot.player.symbol, trimX + 8.2, cy, 2.05, accent);
    text(pdf, name, trimX + 11.1, cy, 8, 'bold', accent, 'left', 'middle');
    return trimX + 11.1 + nameW;
  }
  const symbolX = trimX + CARD_TRIM.w - 6.6 - nameW;
  symbol(pdf, slot.player.symbol, symbolX, cy, 2.05, accent);
  text(pdf, name, symbolX + 2.7, cy, 8, 'bold', accent, 'left', 'middle');
  return symbolX - 2.3;
}

function sectionLabel(pdf: jsPDF, label: string, x: number, y: number, right: number) {
  pdf.setCharSpace(0.45);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...BRASS);
  pdf.text(label, x, y);
  const mark = pdf.getTextWidth(label);
  pdf.setCharSpace(0);
  pdf.setDrawColor(...HAIR);
  pdf.setLineWidth(0.16);
  pdf.line(x + mark + 1.6, y - 0.7, right, y - 0.7);
}

function propertyStrip(pdf: jsPDF, x: number, y: number, width: number) {
  const rows = propertyRows();
  const gap = 1.5;
  const tile = (width - gap * 3) / 4;
  const icon = 4.8;
  rows.forEach((row, index) => {
    const tx = x + index * (tile + gap);
    const art = 9.2;
    const draw = PIECE[row.label];
    draw(pdf, tx + (tile - art) / 2, y, art);
    text(pdf, row.label.toUpperCase(), tx + tile / 2, y + art + 3.15, 8, 'bold', INK, 'center');
    const entries = picturedCost(row.cost);
    const cluster = clusterWidth(pdf, entries, icon);
    const cy = y + art + 6.7;
    drawCluster(pdf, entries, tx + (tile - cluster) / 2, cy, icon);
  });
  return y + 17.2;
}

function costRow(pdf: jsPDF, label: string, cost: Cost, aside: string | undefined, x: number, y: number, width: number, height: number) {
  const icon = height - 1.15;
  const art = height - 0.7;
  const draw = PIECE[label];
  if (!draw) throw new Error(`missing piece art for ${label}`);
  draw(pdf, x, y + (height - art) / 2, art);
  const name = label.toUpperCase();
  const nameX = x + art + 1.3;
  const cy = y + height / 2;
  text(pdf, name, nameX, cy, 9, 'bold', INK, 'left', 'middle');
  let nameEnd = nameX + widthOf(pdf, name, 9, 'bold');
  if (aside) {
    text(pdf, aside, nameEnd + 1.3, cy, 8, 'italic', BRASS, 'left', 'middle');
    nameEnd += 1.3 + widthOf(pdf, aside, 8, 'italic');
  }
  const entries = picturedCost(cost);
  const cluster = clusterWidth(pdf, entries, icon);
  const left = x + width - cluster;
  if (nameEnd + 1.5 > left) throw new Error(`front row overlaps: ${label}`);
  drawCluster(pdf, entries, left, cy, icon);
  pdf.setDrawColor(...HAIR);
  pdf.setLineWidth(0.1);
  pdf.line(x, y + height, x + width, y + height);
}

function improvementCell(pdf: jsPDF, label: string, cost: Cost, x: number, y: number, width: number, height: number) {
  const art = Math.min(9.4, height - 1.4);
  PIECE[label](pdf, x, y + (height - art) / 2, art);
  const nameX = x + art + 1.2;
  text(pdf, label.toUpperCase(), nameX, y + 3.3, 8, 'bold', INK);
  const entries = picturedCost(cost);
  const icon = Math.min(6.1, height * 0.48);
  const cluster = clusterWidth(pdf, entries, icon);
  const left = x + width - cluster;
  if (left < nameX) throw new Error(`improvement overlaps: ${label}`);
  drawCluster(pdf, entries, left, y + height * 0.68, icon);
}

function marketRow(pdf: jsPDF, label: string, cost: Cost, x: number, y: number, width: number, height: number) {
  const art = height - 0.55;
  market(pdf, x, y + (height - art) / 2, art, MARKET_TINT[label]);
  const entries = picturedCost(cost);
  const icon = height - 1.05;
  const cluster = clusterWidth(pdf, entries, icon, 2);
  const name = label.toUpperCase();
  const nameX = x + art + 1.1;
  text(pdf, name, nameX, y + height / 2, 8, 'bold', INK, 'left', 'middle');
  const left = x + width - cluster;
  if (nameX + widthOf(pdf, name, 8, 'bold') + 1 > left) throw new Error(`market overlaps: ${label}`);
  drawCluster(pdf, entries, left, y + height / 2, icon, 2);
}

function oilBand(pdf: jsPDF, x: number, y: number, width: number, height: number) {
  const marks = cardMarks();
  const colW = width / 3;
  const art = 6.4;
  const icon = 5.3;
  const cy = y + 3.2 + art / 2;
  const leaseX = x;
  text(pdf, 'LEASE', leaseX, y + 2.6, 8, 'bold', INK);
  derrick(pdf, leaseX, y + 3.2, art);
  drawCluster(pdf, picturedCost(COSTS.oilLease), leaseX + art + 0.7, cy, icon);

  const bidX = x + colW;
  text(pdf, 'BID', bidX, y + 2.6, 8, 'bold', INK);
  bidPaddle(pdf, bidX, y + 3.2, art);
  const bidEnd = drawCluster(pdf, picturedCost(COSTS.oilBidMinimum), bidX + art + 0.7, cy, icon, 2);
  text(pdf, marks.bid, bidEnd + 1.1, cy, 8, 'italic', BRASS, 'left', 'middle');

  const steelX = x + colW * 2;
  text(pdf, 'STEEL', steelX, y + 2.6, 8, 'bold', INK);
  const steelEnd = drawCluster(pdf, picturedCost(COSTS.steelPurchase), steelX, cy, icon);
  text(pdf, '=', steelEnd + 0.8, cy, 11, 'bold', INK, 'left', 'middle');
  steel(pdf, steelEnd + 3.6, cy - icon / 2, icon);
  text(pdf, marks.raise, bidX + art, y + height - 0.35, 7.5, 'italic', BRASS);
  text(pdf, `${marks.steel} · ${marks.steelNote}`, steelX, y + height - 0.35, 7.5, 'italic', BRASS);
}

function front(pdf: jsPDF, slot: CardSlot, low: boolean) {
  const { bleedX, bleedY, trimX, trimY } = slotOrigin(slot);
  const accent = rgb(CARD_ACCENT[slot.player.id]);
  setCardInk(low);
  cardChrome(pdf, bleedX, bleedY, trimX, trimY, accent, low);
  crops(pdf, trimX, trimY);
  const frontBadge = badge(pdf, slot, trimX, trimY, accent, 'left');
  const frontSize = 13;
  const frontW = widthOf(pdf, FRONT_TITLE, frontSize, 'bold');
  const frontLeft = trimX + CARD_TRIM.w / 2 - frontW / 2;
  if (frontLeft < frontBadge + 1.4) throw new Error(`front title hits the ${slot.player.label} badge`);
  text(pdf, FRONT_TITLE, trimX + CARD_TRIM.w / 2, trimY + 7.2, frontSize, 'bold', INK, 'center', 'middle');

  const left = trimX + 5;
  const right = trimX + CARD_TRIM.w - 5;
  const width = right - left;
  let y = trimY + 11.2;
  sectionLabel(pdf, 'PROPERTY', left, y, right);
  y += 1.5;
  y = propertyStrip(pdf, left, y, width);
  y += 3.1;
  sectionLabel(pdf, 'INFRASTRUCTURE', left, y, right);
  y += 1.5;
  const marks = cardMarks();
  for (const row of constructionRows()) {
    const aside = row.label === 'Pipeline' ? marks.pipeline : undefined;
    costRow(pdf, row.label, row.cost, aside, left, y, width, 7.55);
    y += 7.55;
  }
  y += 2.6;
  const split = (width - 2.2) / 2;
  sectionLabel(pdf, 'IMPROVEMENTS', left, y, left + split);
  sectionLabel(pdf, 'PORT MARKETS', left + split + 2.2, y, right);
  y += 1.6;
  const improvements = improvementRows();
  const markets = marketRows();
  const block = 24.8;
  const rowH = block / markets.length;
  improvements.forEach((row, index) => improvementCell(pdf, row.label, row.cost, left, y + index * (block / improvements.length), split, block / improvements.length - 0.7));
  markets.forEach((row, index) => marketRow(pdf, row.label, row.cost, left + split + 2.2, y + index * rowH, split, rowH - 0.35));
  y += block + 2.4;
  sectionLabel(pdf, 'OIL AND STEEL', left, y, right);
  y += 1.2;
  oilBand(pdf, left, y, width, 12.4);
  y += 12.4;
  const footerY = trimY + CARD_TRIM.h - 5.15;
  if (y > footerY - 1.2) throw new Error(`front overflow by ${(y - (footerY - 1.2)).toFixed(2)} mm`);
  text(pdf, marks.footer, trimX + CARD_TRIM.w / 2, footerY, 8, 'italic', INK, 'center');
}

function back(pdf: jsPDF, slot: CardSlot, low: boolean) {
  const { bleedX, bleedY, trimX, trimY } = slotOrigin(slot);
  const accent = rgb(CARD_ACCENT[slot.player.id]);
  setCardInk(low);
  cardChrome(pdf, bleedX, bleedY, trimX, trimY, accent, low);
  crops(pdf, trimX, trimY);
  badge(pdf, slot, trimX, trimY - 0.85, accent, 'left');
  text(pdf, BACK_TITLE, trimX + CARD_TRIM.w / 2, trimY + 11.35, 11, 'bold', INK, 'center', 'middle');

  const cards = backCards();
  const left = trimX + 4.8;
  const top = trimY + 15.4;
  const gridW = CARD_TRIM.w - 9.6;
  const gridH = 100.2;
  const gap = 1.7;
  const cellW = (gridW - gap) / 2;
  const cellH = (gridH - gap * 3) / 4;
  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + col * (cellW + gap);
    const y = top + row * (cellH + gap);
    if (!low) {
      pdf.setFillColor(...PARCHMENT_DEEP);
      pdf.roundedRect(x, y, cellW, cellH, 1.1, 1.1, 'F');
    }
    pdf.setDrawColor(...HAIR);
    pdf.setLineWidth(0.12);
    pdf.roundedRect(x, y, cellW, cellH, 1.1, 1.1, 'S');
    text(pdf, card.title, x + 1.8, y + 3.5, 8, 'bold', BRASS);
    const captions = card.title === 'OFFICE SITES' ? [] : card.lines;
    const wrapped = captions.flatMap((line) => {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(8);
      return pdf.splitTextToSize(line, cellW - 3.6) as string[];
    });
    const captionH = wrapped.length * 3.05;
    wrapped.forEach((line, lineIndex) => {
      text(pdf, line, x + 1.8, y + cellH - 1.35 - (wrapped.length - 1 - lineIndex) * 3.05, 8, 'italic', INK);
    });
    const diagramTop = y + 5;
    const diagramBottom = y + cellH - captionH - 1.6;
    drawDiagram(pdf, card.title, x, diagramTop, cellW, Math.max(6, diagramBottom - diagramTop), accent);
  });
  text(pdf, cardMarks().backFooter, trimX + CARD_TRIM.w / 2, trimY + CARD_TRIM.h - 5.15, 8, 'italic', INK, 'center');
}

function drawDiagram(pdf: jsPDF, title: string, x: number, y: number, w: number, h: number, accent: Rgb) {
  const cy = y + h / 2;
  const mid = x + w / 2;
  if (title === 'ROADS') {
    const r = Math.min(4.6, h * 0.42);
    drawHex(pdf, mid - r - 1.1, cy, r, HEX_FACE, HEX_EDGE);
    drawHex(pdf, mid + r + 1.1, cy, r, HEX_FACE, HEX_EDGE);
    drawRoad(pdf, mid - 1.1, cy, mid + 1.1, cy, accent, 1.15);
  } else if (title === 'MOUNTAINS') {
    const r = Math.min(4.4, h * 0.4);
    drawHex(pdf, mid - r - 1.6, cy, r, HEX_FACE, HEX_EDGE);
    drawHex(pdf, mid + r + 1.6, cy, r, HEX_FACE, HEX_EDGE);
    mountain(pdf, mid + r + 1.6 - 3.1, cy - 3.3, 6.2);
    drawRoad(pdf, mid - 1.6, cy, mid + r + 1.6 - r * 0.75, cy, accent, 1.05);
    stone(pdf, mid + 0.2, cy - r - 0.2, 3.3);
  } else if (title === 'OFFICES') {
    const r = Math.min(4.2, h * 0.38);
    drawHex(pdf, mid - r - 0.6, cy, r, HEX_FACE, HEX_EDGE);
    drawHex(pdf, mid + r + 2.4, cy, r, [226, 214, 188], HEX_EDGE);
    office(pdf, mid - r - 0.6 - 2.5, cy - 3.1, 5);
    drawRoad(pdf, mid - 0.6, cy, mid + 2.4, cy, accent, 0.9);
  } else if (title === 'TOLLS') {
    const yRoad = cy + 0.4;
    drawRoad(pdf, x + 2.2, yRoad, x + w * 0.34, yRoad, accent, 1.5);
    drawRoad(pdf, x + w * 0.66, yRoad, x + w - 2.2, yRoad, accent, 1.5);
    toll(pdf, mid - 3.2, cy - 4.2, 6.4);
    const tollMoney = picturedCost(COSTS.toll).find((chip) => chip.key === 'money');
    if (!tollMoney) throw new Error('toll is missing its money cost');
    text(pdf, String(tollMoney.n), x + w - 8.4, cy - 1.6, 9, 'bold', INK, 'right', 'middle');
    RESOURCE_GLYPH.money(pdf, x + w - 8, cy - 3.5, 3.6);
  } else if (title === 'PIPELINES') {
    const r = Math.min(3.8, h * 0.34);
    drawHex(pdf, x + r + 1.2, cy, r, HEX_FACE, HEX_EDGE);
    drawHex(pdf, x + w - r - 1.2, cy, r, HEX_FACE, HEX_EDGE);
    derrick(pdf, mid - 2.6, cy - 4.4, 5.2);
    strokePipe(pdf, x + r * 2 + 1.2, cy, mid - 2.6, cy);
    strokePipe(pdf, mid + 2.6, cy, x + w - r * 2 - 1.2, cy);
  } else if (title === 'INSPECTOR') {
    const r = Math.min(4.8, h * 0.42);
    drawHex(pdf, mid - 2, cy + 0.4, r, HEX_FACE, HEX_EDGE);
    inspector(pdf, mid - 4.6, cy - r + 0.4, Math.min(8, h * 0.7));
    drawRoad(pdf, mid + r - 2, cy + 0.4, x + w - 3.2, cy + 0.4, [120, 96, 64], 0.8);
    drawCross(pdf, x + w - 5.4, cy - 1.5, 2.8);
  } else if (title === 'ACCESS') {
    const r = Math.min(4.4, h * 0.36);
    drawHex(pdf, mid, cy, r, HEX_FACE, HEX_EDGE);
    drawRoad(pdf, x + 2, cy, mid - r * 0.7, cy, accent, 1.15);
    drawRoad(pdf, mid + r * 0.7, cy, x + w - 2, cy, accent, 1.15);
    drawRoad(pdf, mid, cy + r * 0.65, mid, y + h - 0.6, accent, 1.05);
  } else if (title === 'OFFICE SITES') {
    const rows = [
      { label: 'Allowed', names: OFFICE_ALLOWED, mark: drawCheck },
      { label: 'Not allowed', names: OFFICE_BARRED, mark: drawCross },
    ];
    const rowH = h / 2;
    const labelW = 15.5;
    const glyph = Math.min(6.4, rowH - 1.2, (w - labelW - 2) / 4 - 0.5);
    rows.forEach((entry, row) => {
      const cy = y + rowH * row + rowH / 2;
      text(pdf, entry.label, x + 1.3, cy, 7, 'bold', INK, 'left', 'middle');
      entry.names.forEach((name, col) => {
        const slot = (w - labelW - 1.2) / 4;
        const gx = x + labelW + col * slot + (slot - glyph) / 2;
        SITE_GLYPH[name](pdf, gx, cy - glyph / 2, glyph);
        entry.mark(pdf, gx + glyph - 1.8, cy - glyph / 2 - 0.2, 2.2);
      });
    });
  }
}

function strokePipe(pdf: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  pdf.setDrawColor(70, 78, 72);
  pdf.setLineWidth(0.85);
  pdf.line(x1, y1, x2, y2);
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
    'Cardstock around 250–300 gsm is a practical choice for a hand of cards. That weight is a suggestion, not a tested specification. The low-ink file is the same duplex pair on a white ground, with the same pictures.',
    'Costs are the pictures, read from the Version 1 rules. The footer is the action. Steel is marked Trade because it is not an action. Unresolved rules are not printed on these cards. They stay in the rulebook.',
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
