import type { jsPDF as JsPdf } from 'jspdf';
import { formatCost, COSTS } from '../data/costs';
import { slugify } from '../export/download';
import type { Block, PrintDoc } from './docs';

/** jsPDF's built-in fonts only cover WinAnsi; replace the few symbols our copy uses outside it. */
export function pdfSafe(s: string): string {
  return s
    .replace(/\*\*/g, '')
    .replace(/→/g, '->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/\u2009|\u202f/g, ' ')
    .replace(/[^\x20-\x7e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u00d7]/g, '');
}

const INK: [number, number, number] = [29, 26, 22];
const BRASS: [number, number, number] = [138, 106, 50];
const MUTED: [number, number, number] = [91, 77, 59];
const RUST: [number, number, number] = [165, 83, 44];

class Writer {
  y: number;
  readonly left: number;
  readonly width: number;
  readonly bottom: number;
  constructor(
    readonly pdf: JsPdf,
    readonly margin: number,
  ) {
    this.left = margin;
    this.width = pdf.internal.pageSize.getWidth() - margin * 2;
    this.bottom = pdf.internal.pageSize.getHeight() - margin;
    this.y = margin;
  }
  ensure(h: number) {
    if (this.y + h > this.bottom) this.newPage();
  }
  newPage() {
    this.pdf.addPage();
    this.y = this.margin;
  }
  font(style: 'heading' | 'body' | 'bold' | 'italic', size: number, color = INK) {
    const pdf = this.pdf;
    if (style === 'heading') pdf.setFont('times', 'bold');
    else pdf.setFont('helvetica', style === 'body' ? 'normal' : style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  }
  lineHeight(size: number, factor = 1.35) {
    return (size * factor * 25.4) / 72;
  }
  text(text: string, size: number, opts: { indent?: number; gapAfter?: number; bullet?: string } = {}) {
    const indent = opts.indent ?? 0;
    const lh = this.lineHeight(size);
    const lines: string[] = this.pdf.splitTextToSize(pdfSafe(text), this.width - indent);
    lines.forEach((line, i) => {
      this.ensure(lh);
      if (i === 0 && opts.bullet) this.pdf.text(opts.bullet, this.left + indent - 4.5, this.y + lh * 0.75);
      this.pdf.text(line, this.left + indent, this.y + lh * 0.75);
      this.y += lh;
    });
    this.y += opts.gapAfter ?? 0;
  }
  rule(color = BRASS, weight = 0.3) {
    this.pdf.setDrawColor(...color);
    this.pdf.setLineWidth(weight);
    this.pdf.line(this.left, this.y, this.left + this.width, this.y);
  }
}

function renderBlock(w: Writer, b: Block) {
  const pdf = w.pdf;
  switch (b.type) {
    case 'title':
      w.font('bold', 7.5, BRASS);
      pdf.setCharSpace(0.8);
      w.text('TAX THE RICHMEN', 7.5);
      pdf.setCharSpace(0);
      w.font('heading', 24);
      w.text(b.text, 24);
      if (b.subtitle) {
        w.font('body', 10.5, MUTED);
        w.text(b.subtitle, 10.5, { gapAfter: 1.5 });
      }
      w.rule(BRASS, 0.6);
      w.y += 4;
      return;
    case 'h2':
      w.ensure(16);
      w.y += 3;
      w.font('heading', 13);
      w.text(b.text, 13);
      w.rule([205, 187, 147], 0.25);
      w.y += 2;
      return;
    case 'h3':
      w.ensure(12);
      w.y += 1.5;
      w.font('heading', 11);
      w.text(b.text, 11, { gapAfter: 0.5 });
      return;
    case 'p':
      w.font('body', 10);
      w.text(b.text, 10, { gapAfter: 1.2 });
      return;
    case 'bullets':
    case 'steps':
      w.font('body', 10);
      b.items.forEach((t, i) => w.text(t, 10, { indent: 6, bullet: b.type === 'steps' ? `${i + 1}.` : '•', gapAfter: 0.4 }));
      w.y += 1;
      return;
    case 'costs':
      for (const r of b.rows) {
        w.ensure(6);
        const lh = w.lineHeight(9.5);
        w.font('bold', 9.5);
        pdf.text(pdfSafe(r.label), w.left, w.y + lh * 0.75);
        w.font('body', 9.5);
        const lines: string[] = pdf.splitTextToSize(pdfSafe(formatCost(COSTS[r.cost])), w.width * 0.55);
        lines.forEach((l, i) => pdf.text(l, w.left + w.width * 0.45, w.y + lh * (0.75 + i)));
        w.y += lh * Math.max(1, lines.length) + 0.8;
        pdf.setDrawColor(221, 208, 178);
        pdf.setLineWidth(0.15);
        pdf.line(w.left, w.y, w.left + w.width, w.y);
        w.y += 0.8;
      }
      w.y += 1.5;
      return;
    case 'table': {
      const cols = b.head.length;
      const colW = cols === 2 ? [w.width * 0.32, w.width * 0.68] : Array(cols).fill(w.width / cols);
      const row = (cells: string[], bold: boolean) => {
        w.font(bold ? 'bold' : 'body', 9);
        const lh = w.lineHeight(9);
        const wrapped = cells.map((c, i) => pdf.splitTextToSize(pdfSafe(c), colW[i] - 3) as string[]);
        const h = Math.max(...wrapped.map((l) => l.length)) * lh + 2;
        w.ensure(h);
        if (bold) {
          pdf.setFillColor(239, 229, 205);
          pdf.rect(w.left, w.y, w.width, h, 'F');
        }
        let x = w.left;
        wrapped.forEach((lines, i) => {
          lines.forEach((l, j) => pdf.text(l, x + 1.5, w.y + 1 + lh * (0.75 + j)));
          x += colW[i];
        });
        w.y += h;
        pdf.setDrawColor(221, 208, 178);
        pdf.setLineWidth(0.15);
        pdf.line(w.left, w.y, w.left + w.width, w.y);
      };
      row(b.head, true);
      b.rows.forEach((r) => row(r, false));
      w.y += 2.5;
      return;
    }
    case 'note': {
      const warn = b.label.startsWith('Playtest');
      w.font('bold', 9.5);
      const boldLabel = pdf.getTextWidth(`${b.label}:`);
      w.font('body', 9.5);
      const lh = w.lineHeight(9.5);
      const lines: string[] = pdf.splitTextToSize(pdfSafe(`${b.label}: ${b.text}`), w.width - 7 - (boldLabel - pdf.getTextWidth(`${b.label}:`)));
      const h = lines.length * lh + 3;
      w.ensure(h);
      pdf.setFillColor(...((warn ? [246, 228, 214] : [242, 234, 215]) as [number, number, number]));
      pdf.rect(w.left, w.y, w.width, h, 'F');
      pdf.setFillColor(...(warn ? RUST : BRASS));
      pdf.rect(w.left, w.y, 1, h, 'F');
      lines.forEach((l, i) => {
        w.font(i === 0 ? 'bold' : 'body', 9.5);
        if (i === 0) {
          const label = `${b.label}:`;
          pdf.text(label, w.left + 4, w.y + 1.5 + lh * 0.75);
          const labelWidth = pdf.getTextWidth(label);
          w.font('body', 9.5);
          pdf.text(l.slice(label.length), w.left + 4 + labelWidth, w.y + 1.5 + lh * 0.75);
        } else pdf.text(l, w.left + 4, w.y + 1.5 + lh * (0.75 + i));
      });
      w.y += h + 2;
      return;
    }
    case 'pagebreak':
      w.newPage();
      return;
  }
}

/** Builds a vector-text PDF (selectable, searchable) from a document model. */
export async function buildDocPdf(doc: PrintDoc): Promise<JsPdf> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: doc.orientation });
  pdf.setProperties({ title: `Tax the Richmen — ${doc.title}`, subject: 'Version 1 prototype rules', creator: 'Tax the Richmen companion site' });
  const w = new Writer(pdf, 16);
  for (const b of doc.blocks) renderBlock(w, b);

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    const ph = pdf.internal.pageSize.getHeight();
    const pw = pdf.internal.pageSize.getWidth();
    w.font('body', 7.5, MUTED);
    pdf.text(pdfSafe(`Tax the Richmen · ${doc.title} · Version 1 prototype rules`), 16, ph - 8);
    pdf.text(`${i} / ${pages}`, pw - 16, ph - 8, { align: 'right' });
  }
  return pdf;
}

export async function downloadDocPdf(doc: PrintDoc) {
  const pdf = await buildDocPdf(doc);
  pdf.save(`tax-the-richmen-${slugify(doc.title)}.pdf`);
}
