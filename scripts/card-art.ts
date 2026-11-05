import { jsPDF } from 'jspdf';

export type Rgb = [number, number, number];
type Draw = (pdf: jsPDF, x: number, y: number, s: number) => void;

let lowInk = false;

export function setCardInk(low: boolean) {
  lowInk = low;
}

const INK: Rgb = [42, 32, 24];
const CREAM: Rgb = [244, 232, 206];
const WOOD_D: Rgb = [96, 58, 32];
const WOOD_M: Rgb = [148, 96, 52];
const WOOD_L: Rgb = [196, 150, 92];
const WOOD_E: Rgb = [226, 190, 132];
const BRASS_D: Rgb = [122, 86, 34];
const BRASS: Rgb = [186, 146, 68];
const BRASS_L: Rgb = [232, 204, 132];
const IRON_D: Rgb = [48, 52, 58];
const IRON: Rgb = [96, 102, 110];
const IRON_L: Rgb = [176, 182, 188];
const BARREL_D: Rgb = [36, 40, 32];
const BARREL: Rgb = [62, 72, 48];
const STONE_D: Rgb = [78, 76, 72];
const STONE: Rgb = [132, 130, 124];
const STONE_L: Rgb = [196, 194, 186];
const STEEL_D: Rgb = [110, 124, 136];
const STEEL: Rgb = [186, 198, 208];
const STEEL_L: Rgb = [236, 242, 246];
const WALL: Rgb = [222, 206, 176];
const ROOF: Rgb = [110, 52, 40];
const WINDOW: Rgb = [232, 206, 120];

function mix(color: Rgb): Rgb {
  if (!lowInk) return color;
  return color.map((channel) => Math.round(channel + (255 - channel) * 0.42)) as Rgb;
}

function fill(pdf: jsPDF, color: Rgb) {
  pdf.setFillColor(...mix(color));
}

function stroke(pdf: jsPDF, color: Rgb, width: number) {
  pdf.setDrawColor(...(lowInk ? INK : color));
  pdf.setLineWidth(width);
}

function poly(pdf: jsPDF, pts: Array<[number, number]>, style: 'F' | 'FD' | 'S') {
  const [x, y] = pts[0];
  const rel: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) rel.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  rel.push([x - pts[pts.length - 1][0], y - pts[pts.length - 1][1]]);
  pdf.lines(rel, x, y, [1, 1], style, true);
}

function prep(pdf: jsPDF) {
  pdf.setLineJoin('round');
  pdf.setLineCap('round');
}

function shadow(pdf: jsPDF, x: number, y: number, s: number) {
  fill(pdf, [206, 184, 146]);
  pdf.ellipse(x + s * 0.5, y + s * 0.9, s * 0.34, s * 0.07, 'F');
}

function coin(pdf: jsPDF, cx: number, cy: number, rx: number, ry: number) {
  fill(pdf, BRASS_D);
  pdf.ellipse(cx, cy + ry * 0.45, rx, ry, 'F');
  fill(pdf, BRASS);
  pdf.ellipse(cx, cy, rx, ry, 'F');
  stroke(pdf, BRASS_D, 0.08);
  pdf.ellipse(cx, cy, rx, ry, 'S');
  fill(pdf, BRASS_L);
  pdf.ellipse(cx, cy - ry * 0.15, rx * 0.55, ry * 0.45, 'F');
  stroke(pdf, BRASS_D, 0.06);
  pdf.ellipse(cx, cy, rx * 0.62, ry * 0.55, 'S');
}

export const money: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  coin(pdf, x + s * 0.5, y + s * 0.7, s * 0.36, s * 0.13);
  coin(pdf, x + s * 0.5, y + s * 0.5, s * 0.36, s * 0.13);
  coin(pdf, x + s * 0.5, y + s * 0.3, s * 0.36, s * 0.13);
};

export const wood: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  const logs = [
    { t: 0.62, body: WOOD_D, end: WOOD_M },
    { t: 0.42, body: WOOD_M, end: WOOD_L },
    { t: 0.24, body: WOOD_L, end: WOOD_E },
  ];
  for (const log of logs) {
    const ly = y + s * log.t;
    fill(pdf, log.body);
    pdf.roundedRect(x + s * 0.16, ly, s * 0.74, s * 0.2, s * 0.09, s * 0.09, 'F');
    fill(pdf, log.end);
    pdf.ellipse(x + s * 0.2, ly + s * 0.1, s * 0.09, s * 0.09, 'F');
    stroke(pdf, WOOD_D, 0.06);
    pdf.ellipse(x + s * 0.2, ly + s * 0.1, s * 0.045, s * 0.045, 'S');
  }
  fill(pdf, [72, 46, 28]);
  pdf.roundedRect(x + s * 0.46, y + s * 0.2, s * 0.08, s * 0.66, s * 0.02, s * 0.02, 'F');
  fill(pdf, BRASS_D);
  pdf.rect(x + s * 0.45, y + s * 0.44, s * 0.1, s * 0.06, 'F');
};

function ingot(pdf: jsPDF, x: number, y: number, s: number, light: boolean) {
  const body = light ? IRON_L : IRON;
  const top = light ? STEEL_L : IRON_L;
  const side = light ? IRON : IRON_D;
  fill(pdf, body);
  poly(pdf, [
    [x + s * 0.08, y + s * 0.42],
    [x + s * 0.78, y + s * 0.42],
    [x + s * 0.78, y + s * 0.68],
    [x + s * 0.08, y + s * 0.68],
  ], 'F');
  fill(pdf, top);
  poly(pdf, [
    [x + s * 0.08, y + s * 0.42],
    [x + s * 0.22, y + s * 0.28],
    [x + s * 0.92, y + s * 0.28],
    [x + s * 0.78, y + s * 0.42],
  ], 'F');
  fill(pdf, side);
  poly(pdf, [
    [x + s * 0.78, y + s * 0.42],
    [x + s * 0.92, y + s * 0.28],
    [x + s * 0.92, y + s * 0.54],
    [x + s * 0.78, y + s * 0.68],
  ], 'F');
}

export const metal: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  ingot(pdf, x, y + s * 0.28, s, false);
  ingot(pdf, x + s * 0.04, y + s * 0.08, s * 0.92, false);
  ingot(pdf, x + s * 0.08, y - s * 0.08, s * 0.84, true);
};

export const fuel: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  const cx = x + s * 0.5;
  fill(pdf, BARREL);
  pdf.rect(x + s * 0.24, y + s * 0.28, s * 0.52, s * 0.46, 'F');
  fill(pdf, BARREL_D);
  pdf.ellipse(cx, y + s * 0.74, s * 0.26, s * 0.09, 'F');
  fill(pdf, [92, 104, 70]);
  pdf.ellipse(cx, y + s * 0.28, s * 0.26, s * 0.1, 'F');
  stroke(pdf, BRASS, 0.28);
  pdf.line(x + s * 0.24, y + s * 0.4, x + s * 0.76, y + s * 0.4);
  pdf.line(x + s * 0.24, y + s * 0.62, x + s * 0.76, y + s * 0.62);
  fill(pdf, BRASS);
  pdf.circle(cx, y + s * 0.22, s * 0.05, 'F');
};

export const stone: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  fill(pdf, STONE);
  poly(pdf, [
    [x + s * 0.08, y + s * 0.62],
    [x + s * 0.02, y + s * 0.42],
    [x + s * 0.2, y + s * 0.26],
    [x + s * 0.42, y + s * 0.34],
    [x + s * 0.5, y + s * 0.56],
    [x + s * 0.34, y + s * 0.78],
  ], 'F');
  fill(pdf, STONE_L);
  poly(pdf, [
    [x + s * 0.2, y + s * 0.32],
    [x + s * 0.28, y + s * 0.28],
    [x + s * 0.36, y + s * 0.4],
  ], 'F');
  fill(pdf, STONE_D);
  poly(pdf, [
    [x + s * 0.4, y + s * 0.7],
    [x + s * 0.48, y + s * 0.4],
    [x + s * 0.72, y + s * 0.28],
    [x + s * 0.96, y + s * 0.48],
    [x + s * 0.86, y + s * 0.8],
    [x + s * 0.58, y + s * 0.84],
  ], 'F');
  fill(pdf, STONE_L);
  poly(pdf, [
    [x + s * 0.62, y + s * 0.4],
    [x + s * 0.74, y + s * 0.34],
    [x + s * 0.78, y + s * 0.5],
  ], 'F');
};

export const steel: Draw = (pdf, x, y, s) => {
  prep(pdf);
  shadow(pdf, x, y, s);
  const cx = x + s * 0.5;
  const cy = y + s * 0.48;
  fill(pdf, STEEL_D);
  pdf.ellipse(cx, cy + s * 0.08, s * 0.34, s * 0.28, 'F');
  fill(pdf, STEEL);
  pdf.ellipse(cx, cy, s * 0.34, s * 0.28, 'F');
  fill(pdf, CREAM);
  pdf.ellipse(cx, cy, s * 0.16, s * 0.12, 'F');
  stroke(pdf, STEEL_D, 0.1);
  pdf.ellipse(cx, cy, s * 0.34, s * 0.28, 'S');
  fill(pdf, STEEL_L);
  pdf.ellipse(cx - s * 0.1, cy - s * 0.08, s * 0.08, s * 0.05, 'F');
};

function windows(pdf: jsPDF, x: number, y: number, s: number) {
  fill(pdf, WINDOW);
  pdf.rect(x, y, s, s * 1.15, 'F');
}

export const city: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [168, 150, 124]);
  pdf.rect(x + s * 0.06, y + s * 0.84, s * 0.88, s * 0.08, 'F');
  fill(pdf, [186, 168, 140]);
  pdf.rect(x + s * 0.06, y + s * 0.42, s * 0.24, s * 0.42, 'F');
  fill(pdf, WALL);
  pdf.rect(x + s * 0.28, y + s * 0.16, s * 0.36, s * 0.68, 'F');
  fill(pdf, [196, 176, 146]);
  pdf.rect(x + s * 0.64, y + s * 0.34, s * 0.28, s * 0.5, 'F');
  fill(pdf, ROOF);
  pdf.rect(x + s * 0.4, y + s * 0.08, s * 0.08, s * 0.14, 'F');
  windows(pdf, x + s * 0.12, y + s * 0.52, s * 0.06);
  windows(pdf, x + s * 0.12, y + s * 0.66, s * 0.06);
  windows(pdf, x + s * 0.36, y + s * 0.28, s * 0.07);
  windows(pdf, x + s * 0.5, y + s * 0.28, s * 0.07);
  windows(pdf, x + s * 0.36, y + s * 0.44, s * 0.07);
  windows(pdf, x + s * 0.5, y + s * 0.44, s * 0.07);
  windows(pdf, x + s * 0.36, y + s * 0.6, s * 0.07);
  windows(pdf, x + s * 0.5, y + s * 0.6, s * 0.07);
  windows(pdf, x + s * 0.72, y + s * 0.46, s * 0.06);
  windows(pdf, x + s * 0.72, y + s * 0.6, s * 0.06);
  fill(pdf, [72, 48, 36]);
  pdf.rect(x + s * 0.4, y + s * 0.66, s * 0.1, s * 0.18, 'F');
};

export const village: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [168, 150, 124]);
  pdf.rect(x + s * 0.04, y + s * 0.82, s * 0.92, s * 0.08, 'F');
  fill(pdf, WALL);
  pdf.rect(x + s * 0.08, y + s * 0.48, s * 0.4, s * 0.34, 'F');
  fill(pdf, ROOF);
  poly(pdf, [
    [x + s * 0.04, y + s * 0.5],
    [x + s * 0.28, y + s * 0.26],
    [x + s * 0.52, y + s * 0.5],
  ], 'F');
  fill(pdf, [206, 188, 156]);
  pdf.rect(x + s * 0.5, y + s * 0.56, s * 0.38, s * 0.26, 'F');
  fill(pdf, [140, 64, 48]);
  poly(pdf, [
    [x + s * 0.46, y + s * 0.58],
    [x + s * 0.69, y + s * 0.38],
    [x + s * 0.92, y + s * 0.58],
  ], 'F');
  fill(pdf, [72, 48, 36]);
  pdf.rect(x + s * 0.22, y + s * 0.62, s * 0.1, s * 0.2, 'F');
  windows(pdf, x + s * 0.62, y + s * 0.64, s * 0.08);
  fill(pdf, WOOD_D);
  pdf.rect(x + s * 0.24, y + s * 0.16, s * 0.05, s * 0.16, 'F');
};

export const mine: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, STONE);
  poly(pdf, [
    [x + s * 0.02, y + s * 0.86],
    [x + s * 0.18, y + s * 0.58],
    [x + s * 0.82, y + s * 0.58],
    [x + s * 0.98, y + s * 0.86],
  ], 'F');
  fill(pdf, WOOD_D);
  poly(pdf, [
    [x + s * 0.18, y + s * 0.62],
    [x + s * 0.5, y + s * 0.12],
    [x + s * 0.82, y + s * 0.62],
  ], 'F');
  fill(pdf, WOOD_M);
  pdf.rect(x + s * 0.22, y + s * 0.4, s * 0.56, s * 0.06, 'F');
  fill(pdf, [28, 26, 24]);
  poly(pdf, [
    [x + s * 0.36, y + s * 0.7],
    [x + s * 0.5, y + s * 0.48],
    [x + s * 0.64, y + s * 0.7],
    [x + s * 0.58, y + s * 0.86],
    [x + s * 0.42, y + s * 0.86],
  ], 'F');
  stroke(pdf, BRASS, 0.12);
  pdf.circle(x + s * 0.5, y + s * 0.28, s * 0.06, 'S');
};

export const mountain: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [98, 106, 112]);
  poly(pdf, [
    [x + s * 0.02, y + s * 0.86],
    [x + s * 0.34, y + s * 0.28],
    [x + s * 0.62, y + s * 0.86],
  ], 'F');
  fill(pdf, [128, 136, 142]);
  poly(pdf, [
    [x + s * 0.28, y + s * 0.86],
    [x + s * 0.64, y + s * 0.14],
    [x + s * 0.98, y + s * 0.86],
  ], 'F');
  fill(pdf, [236, 240, 242]);
  poly(pdf, [
    [x + s * 0.52, y + s * 0.34],
    [x + s * 0.64, y + s * 0.14],
    [x + s * 0.76, y + s * 0.34],
  ], 'F');
};

export const roadPiece: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [92, 78, 60]);
  poly(pdf, [
    [x + s * 0.06, y + s * 0.62],
    [x + s * 0.22, y + s * 0.28],
    [x + s * 0.94, y + s * 0.28],
    [x + s * 0.78, y + s * 0.62],
  ], 'F');
  fill(pdf, WOOD_M);
  for (const t of [0.32, 0.46, 0.6]) {
    pdf.rect(x + s * 0.2, y + s * t, s * 0.62, s * 0.05, 'F');
  }
  stroke(pdf, IRON_D, 0.1);
  pdf.line(x + s * 0.18, y + s * 0.32, x + s * 0.14, y + s * 0.58);
  pdf.line(x + s * 0.82, y + s * 0.32, x + s * 0.74, y + s * 0.58);
};

export const mountainEntry: Draw = (pdf, x, y, s) => {
  mountain(pdf, x + s * 0.18, y, s * 0.82);
  fill(pdf, [92, 78, 60]);
  poly(pdf, [
    [x + s * 0.02, y + s * 0.78],
    [x + s * 0.08, y + s * 0.62],
    [x + s * 0.7, y + s * 0.62],
    [x + s * 0.6, y + s * 0.78],
  ], 'F');
};

export const pipeline: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [88, 96, 90]);
  pdf.roundedRect(x + s * 0.04, y + s * 0.4, s * 0.92, s * 0.2, s * 0.08, s * 0.08, 'F');
  fill(pdf, BRASS);
  pdf.ellipse(x + s * 0.5, y + s * 0.5, s * 0.1, s * 0.16, 'F');
  fill(pdf, BRASS_D);
  pdf.circle(x + s * 0.5, y + s * 0.5, s * 0.045, 'F');
  stroke(pdf, IRON_D, 0.08);
  pdf.roundedRect(x + s * 0.04, y + s * 0.4, s * 0.92, s * 0.2, s * 0.08, s * 0.08, 'S');
};

export const office: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [186, 168, 142]);
  pdf.rect(x + s * 0.12, y + s * 0.48, s * 0.76, s * 0.4, 'F');
  fill(pdf, WALL);
  pdf.rect(x + s * 0.22, y + s * 0.28, s * 0.56, s * 0.24, 'F');
  fill(pdf, [206, 190, 160]);
  pdf.rect(x + s * 0.32, y + s * 0.12, s * 0.36, s * 0.2, 'F');
  fill(pdf, BRASS);
  pdf.rect(x + s * 0.46, y + s * 0.02, s * 0.08, s * 0.12, 'F');
  fill(pdf, [72, 48, 36]);
  pdf.rect(x + s * 0.42, y + s * 0.64, s * 0.16, s * 0.24, 'F');
  windows(pdf, x + s * 0.28, y + s * 0.36, s * 0.08);
  windows(pdf, x + s * 0.64, y + s * 0.36, s * 0.08);
  windows(pdf, x + s * 0.4, y + s * 0.18, s * 0.07);
  windows(pdf, x + s * 0.54, y + s * 0.18, s * 0.07);
};

export const toll: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, WOOD_D);
  pdf.rect(x + s * 0.16, y + s * 0.28, s * 0.08, s * 0.58, 'F');
  pdf.rect(x + s * 0.76, y + s * 0.28, s * 0.08, s * 0.58, 'F');
  fill(pdf, [150, 48, 40]);
  poly(pdf, [
    [x + s * 0.2, y + s * 0.32],
    [x + s * 0.84, y + s * 0.46],
    [x + s * 0.84, y + s * 0.54],
    [x + s * 0.2, y + s * 0.4],
  ], 'F');
  fill(pdf, WALL);
  pdf.rect(x + s * 0.34, y + s * 0.5, s * 0.28, s * 0.28, 'F');
  fill(pdf, ROOF);
  poly(pdf, [
    [x + s * 0.3, y + s * 0.52],
    [x + s * 0.48, y + s * 0.36],
    [x + s * 0.66, y + s * 0.52],
  ], 'F');
};

export const upgrade: Draw = (pdf, x, y, s) => {
  prep(pdf);
  office(pdf, x, y + s * 0.08, s * 0.86);
  fill(pdf, BRASS);
  pdf.rect(x + s * 0.7, y + s * 0.08, s * 0.08, s * 0.28, 'F');
  pdf.rect(x + s * 0.58, y + s * 0.16, s * 0.32, s * 0.08, 'F');
};

export const vault: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, IRON_D);
  pdf.roundedRect(x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76, s * 0.06, s * 0.06, 'F');
  fill(pdf, IRON);
  pdf.roundedRect(x + s * 0.2, y + s * 0.18, s * 0.6, s * 0.64, s * 0.04, s * 0.04, 'F');
  fill(pdf, BRASS);
  pdf.circle(x + s * 0.5, y + s * 0.48, s * 0.16, 'F');
  stroke(pdf, BRASS_L, 0.12);
  pdf.circle(x + s * 0.5, y + s * 0.48, s * 0.08, 'S');
  pdf.line(x + s * 0.5, y + s * 0.34, x + s * 0.5, y + s * 0.62);
  pdf.line(x + s * 0.36, y + s * 0.48, x + s * 0.64, y + s * 0.48);
  fill(pdf, BRASS_L);
  pdf.circle(x + s * 0.78, y + s * 0.36, s * 0.04, 'F');
};

export function market(pdf: jsPDF, x: number, y: number, s: number, tint: Rgb) {
  prep(pdf);
  fill(pdf, WOOD_M);
  pdf.rect(x + s * 0.12, y + s * 0.58, s * 0.76, s * 0.08, 'F');
  pdf.rect(x + s * 0.16, y + s * 0.66, s * 0.06, s * 0.2, 'F');
  pdf.rect(x + s * 0.78, y + s * 0.66, s * 0.06, s * 0.2, 'F');
  fill(pdf, tint);
  poly(pdf, [
    [x + s * 0.04, y + s * 0.48],
    [x + s * 0.5, y + s * 0.16],
    [x + s * 0.96, y + s * 0.48],
  ], 'F');
  fill(pdf, CREAM);
  poly(pdf, [
    [x + s * 0.28, y + s * 0.42],
    [x + s * 0.5, y + s * 0.24],
    [x + s * 0.72, y + s * 0.42],
  ], 'F');
}

export const derrick: Draw = (pdf, x, y, s) => {
  prep(pdf);
  stroke(pdf, IRON_D, Math.max(0.18, s * 0.06));
  pdf.line(x + s * 0.28, y + s * 0.88, x + s * 0.46, y + s * 0.12);
  pdf.line(x + s * 0.72, y + s * 0.88, x + s * 0.54, y + s * 0.12);
  pdf.line(x + s * 0.34, y + s * 0.4, x + s * 0.66, y + s * 0.4);
  pdf.line(x + s * 0.32, y + s * 0.6, x + s * 0.68, y + s * 0.6);
  pdf.line(x + s * 0.3, y + s * 0.48, x + s * 0.7, y + s * 0.32);
  pdf.line(x + s * 0.3, y + s * 0.32, x + s * 0.7, y + s * 0.48);
  fill(pdf, IRON);
  pdf.rect(x + s * 0.4, y + s * 0.06, s * 0.2, s * 0.08, 'F');
  fill(pdf, BRASS);
  pdf.rect(x + s * 0.18, y + s * 0.84, s * 0.64, s * 0.08, 'F');
};

export const bidPaddle: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, WOOD_D);
  pdf.roundedRect(x + s * 0.44, y + s * 0.28, s * 0.12, s * 0.58, s * 0.04, s * 0.04, 'F');
  fill(pdf, BRASS);
  pdf.roundedRect(x + s * 0.18, y + s * 0.08, s * 0.64, s * 0.32, s * 0.06, s * 0.06, 'F');
  stroke(pdf, BRASS_D, 0.1);
  pdf.roundedRect(x + s * 0.26, y + s * 0.14, s * 0.48, s * 0.2, s * 0.04, s * 0.04, 'S');
};

export const port: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, WOOD_M);
  pdf.rect(x + s * 0.06, y + s * 0.62, s * 0.7, s * 0.1, 'F');
  pdf.rect(x + s * 0.14, y + s * 0.72, s * 0.06, s * 0.16, 'F');
  pdf.rect(x + s * 0.58, y + s * 0.72, s * 0.06, s * 0.16, 'F');
  stroke(pdf, IRON_D, Math.max(0.16, s * 0.05));
  pdf.line(x + s * 0.62, y + s * 0.62, x + s * 0.62, y + s * 0.18);
  pdf.line(x + s * 0.62, y + s * 0.22, x + s * 0.9, y + s * 0.4);
  pdf.line(x + s * 0.9, y + s * 0.4, x + s * 0.9, y + s * 0.62);
};

export const water: Draw = (pdf, x, y, s) => {
  prep(pdf);
  stroke(pdf, [64, 104, 124], Math.max(0.22, s * 0.07));
  pdf.line(x + s * 0.12, y + s * 0.38, x + s * 0.32, y + s * 0.28);
  pdf.line(x + s * 0.32, y + s * 0.28, x + s * 0.52, y + s * 0.38);
  pdf.line(x + s * 0.52, y + s * 0.38, x + s * 0.72, y + s * 0.28);
  pdf.line(x + s * 0.72, y + s * 0.28, x + s * 0.9, y + s * 0.38);
  pdf.line(x + s * 0.12, y + s * 0.58, x + s * 0.32, y + s * 0.48);
  pdf.line(x + s * 0.32, y + s * 0.48, x + s * 0.52, y + s * 0.58);
  pdf.line(x + s * 0.52, y + s * 0.58, x + s * 0.72, y + s * 0.48);
  pdf.line(x + s * 0.72, y + s * 0.48, x + s * 0.9, y + s * 0.58);
};

export const tax: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, WALL);
  pdf.rect(x + s * 0.18, y + s * 0.4, s * 0.64, s * 0.46, 'F');
  fill(pdf, [92, 70, 48]);
  poly(pdf, [
    [x + s * 0.1, y + s * 0.42],
    [x + s * 0.5, y + s * 0.14],
    [x + s * 0.9, y + s * 0.42],
  ], 'F');
  fill(pdf, BRASS);
  pdf.circle(x + s * 0.5, y + s * 0.58, s * 0.12, 'F');
  stroke(pdf, BRASS_D, 0.08);
  pdf.circle(x + s * 0.5, y + s * 0.58, s * 0.06, 'S');
};

export const inspector: Draw = (pdf, x, y, s) => {
  prep(pdf);
  fill(pdf, [42, 40, 44]);
  pdf.ellipse(x + s * 0.5, y + s * 0.3, s * 0.28, s * 0.06, 'F');
  pdf.roundedRect(x + s * 0.36, y + s * 0.1, s * 0.28, s * 0.18, s * 0.06, s * 0.04, 'F');
  fill(pdf, [214, 176, 140]);
  pdf.circle(x + s * 0.5, y + s * 0.36, s * 0.1, 'F');
  fill(pdf, [54, 62, 78]);
  poly(pdf, [
    [x + s * 0.28, y + s * 0.88],
    [x + s * 0.36, y + s * 0.48],
    [x + s * 0.64, y + s * 0.48],
    [x + s * 0.72, y + s * 0.88],
  ], 'F');
  fill(pdf, BRASS);
  pdf.circle(x + s * 0.5, y + s * 0.6, s * 0.04, 'F');
};

export function drawHex(pdf: jsPDF, cx: number, cy: number, r: number, face: Rgb, edge: Rgb) {
  prep(pdf);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((30 + i * 60) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  fill(pdf, face);
  stroke(pdf, edge, 0.25);
  poly(pdf, pts, 'FD');
}

export function drawRoad(pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, color: Rgb, width: number) {
  prep(pdf);
  stroke(pdf, color, width);
  pdf.line(x1, y1, x2, y2);
}

export function drawCheck(pdf: jsPDF, x: number, y: number, s: number) {
  prep(pdf);
  stroke(pdf, [36, 92, 58], Math.max(0.28, s * 0.12));
  pdf.line(x + s * 0.15, y + s * 0.52, x + s * 0.4, y + s * 0.78);
  pdf.line(x + s * 0.4, y + s * 0.78, x + s * 0.86, y + s * 0.22);
}

export function drawCross(pdf: jsPDF, x: number, y: number, s: number) {
  prep(pdf);
  stroke(pdf, [122, 42, 36], Math.max(0.28, s * 0.12));
  pdf.line(x + s * 0.22, y + s * 0.22, x + s * 0.78, y + s * 0.78);
  pdf.line(x + s * 0.78, y + s * 0.22, x + s * 0.22, y + s * 0.78);
}

export const RESOURCE_GLYPH = { money, wood, metal, fuel, stone, steel } as const;
