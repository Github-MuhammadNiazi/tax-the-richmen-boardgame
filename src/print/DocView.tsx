import { COSTS, formatCost } from '../data/costs';
import type { Block, PrintDoc } from './docs';

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'title':
      return (
        <header className="doc-title">
          <p className="doc-kicker">Tax the Richmen</p>
          <h1>{block.text}</h1>
          {block.subtitle && <p className="doc-subtitle">{block.subtitle}</p>}
        </header>
      );
    case 'h2':
      return <h2>{block.text}</h2>;
    case 'h3':
      return <h3>{block.text}</h3>;
    case 'p':
      return <p>{block.text}</p>;
    case 'bullets':
      return (
        <ul>
          {block.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol>
          {block.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      );
    case 'costs':
      return (
        <table className="doc-costs">
          <tbody>
            {block.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>{formatCost(COSTS[r.cost])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'table':
      return (
        <table className="doc-table">
          <thead>
            <tr>
              {block.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'note':
      return (
        <aside className={block.label.startsWith('Playtest') ? 'doc-note doc-note-warn' : 'doc-note'}>
          <strong>{block.label}:</strong> {block.text}
        </aside>
      );
    case 'pagebreak':
      return <div className="doc-break" />;
  }
}

/** Light, paper-styled rendering of a printable document. Flows across pages when printed. */
export function DocView({ doc }: { doc: PrintDoc }) {
  return (
    <article className="doc-sheet" data-doc={doc.id}>
      {doc.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      <footer className="doc-footer">Tax the Richmen · {doc.title} · Version 1 prototype rules</footer>
    </article>
  );
}
