import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ALL_CLARIFICATIONS, RULE_SECTIONS } from '../data/rules';
import { DocView } from './DocView';
import { inspectorDoc, oilBiddingDoc, playerReferenceDoc, portMarketDoc, quickStartDoc, roadPipelineDoc, rulebookDoc, type Block } from './docs';
import { buildDocPdf, pdfSafe } from './pdfDoc';
import { numberTokenPages, PROTO, steelCardPages, tileBackPages } from './sheets';

const ALL_DOCS = [playerReferenceDoc, roadPipelineDoc, portMarketDoc, oilBiddingDoc, inspectorDoc, rulebookDoc, quickStartDoc];

const textOf = (blocks: Block[]) =>
  blocks
    .map((b) => {
      if ('text' in b) return b.text;
      if ('items' in b) return b.items.join(' ');
      if (b.type === 'table') return [...b.head, ...b.rows.flat()].join(' ');
      if (b.type === 'costs') return b.rows.map((r) => r.label).join(' ');
      return '';
    })
    .join('\n');

describe('printable documents', () => {
  it('every document starts with a title block and has content', () => {
    for (const build of ALL_DOCS) {
      const doc = build();
      expect(doc.blocks[0].type).toBe('title');
      expect(doc.blocks.length).toBeGreaterThan(4);
    }
  });

  it('the rulebook includes every rule item and every playtest clarification', () => {
    const text = textOf(rulebookDoc().blocks);
    for (const item of RULE_SECTIONS.flatMap((s) => s.items)) expect(text).toContain(item.title);
    for (const c of ALL_CLARIFICATIONS) expect(text).toContain(c.question);
  });

  it('reference cards flag the open clarifications for their topic', () => {
    expect(textOf(roadPipelineDoc().blocks)).toContain('Which Road segments pay the Mountain surcharge?');
    expect(roadPipelineDoc().blocks.some((b) => b.type === 'note' && b.label === 'Playtest clarification required')).toBe(true);
  });

  it('renders as HTML with tables and cost rows', () => {
    const { container } = render(<DocView doc={playerReferenceDoc()} />);
    expect(container.querySelector('h1')).toHaveTextContent('Player Reference');
    expect(container.textContent).toContain('1 Wood + 1 Metal + 1 Fuel + 1 action');
    expect(container.querySelectorAll('table').length).toBeGreaterThanOrEqual(3);
  });
});

describe('PDF text output', () => {
  it('replaces characters outside the built-in PDF font encoding', () => {
    expect(pdfSafe('City → Money, ≥ 8')).toBe('City -> Money, >= 8');
    expect(pdfSafe('**Bold** — fine ×2')).toBe('Bold — fine ×2');
  });

  it('builds multi-page vector PDFs for every document', async () => {
    const pages: Record<string, number> = {};
    for (const build of ALL_DOCS) {
      const doc = build();
      const pdf = await buildDocPdf(doc);
      pages[doc.id] = pdf.getNumberOfPages();
    }
    expect(pages.rulebook).toBeGreaterThan(4);
    for (const n of Object.values(pages)) expect(n).toBeGreaterThanOrEqual(1);
  });
});

describe('component sheets', () => {
  it('lays out 8 tile backs over 2 A4 pages', () => {
    const pages = tileBackPages();
    expect(pages).toHaveLength(2);
    const { container } = render(<>{pages}</>);
    expect(container.querySelectorAll('image')).toHaveLength(8);
  });

  it('prints all 24 number tokens without a 7', () => {
    const { container } = render(<>{numberTokenPages()}</>);
    const values = [...container.querySelectorAll('text')].map((t) => t.textContent).filter((t) => /^\d+$/.test(t ?? ''));
    expect(values).toHaveLength(24);
    expect(values).not.toContain('7');
  });

  it('prints 20 Steel Card faces plus a sheet of backs', () => {
    const pages = steelCardPages();
    expect(pages).toHaveLength(4);
    const { container } = render(<>{pages.slice(0, 3)}</>);
    expect([...container.querySelectorAll('text')].filter((t) => t.textContent === 'STEEL CERTIFICATE')).toHaveLength(20);
  });

  it('uses the labelled prototype dimensions on physical sheets', () => {
    const { container } = render(<>{steelCardPages({ physical: true })[0]}</>);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('210mm');
    expect(container.textContent).toContain(`Prototype proposal: ${PROTO.card.w} × ${PROTO.card.h} mm`);
  });
});
