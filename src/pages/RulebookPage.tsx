import { ChevronDown, ChevronsDownUp, ChevronsUpDown, List, Printer, Search, X } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ClarificationNote, CLARIFICATION_LABEL } from '../components/ui/Clarification';
import { CostBadges } from '../components/ui/CostBadges';
import { RichText } from '../components/ui/RichText';
import { ALL_CLARIFICATIONS, GLOSSARY, RULE_SECTIONS, ruleText, type RuleItem } from '../data/rules';
import { usePageMeta } from '../lib/usePageMeta';

const EXTRA_SECTIONS = [
  { id: 'glossary', title: 'Glossary' },
  { id: 'clarifications', title: 'Playtest clarifications' },
];

function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function matches(item: RuleItem, q: string[]): boolean {
  if (!q.length) return true;
  const text = ruleText(item).toLowerCase();
  return q.every((t) => text.includes(t));
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps search terms in <mark>, preserving `**bold**` rendering. */
function Highlight({ text, q }: { text: string; q: string[] }): ReactNode {
  if (!q.length) return <RichText text={text} />;
  const re = new RegExp(`(${q.map(escapeRe).join('|')})`, 'gi');
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => {
    const bold = chunk.startsWith('**') && chunk.endsWith('**');
    const inner = bold ? chunk.slice(2, -2) : chunk;
    const parts = inner.split(re).map((p, j) =>
      j % 2 ? (
        <mark key={j} className="rounded-[2px] bg-brass/35 px-0.5 text-ivory">
          {p}
        </mark>
      ) : (
        <Fragment key={j}>{p}</Fragment>
      ),
    );
    return bold ? (
      <strong key={i} className="font-semibold text-ivory">
        {parts}
      </strong>
    ) : (
      <Fragment key={i}>{parts}</Fragment>
    );
  });
}

const CLARIFICATION_SOURCES = new Map<string, { id: string; title: string }[]>();
for (const s of RULE_SECTIONS)
  for (const item of s.items)
    for (const c of item.clarifications ?? []) {
      const list = CLARIFICATION_SOURCES.get(c.id) ?? [];
      list.push({ id: item.id, title: item.title });
      CLARIFICATION_SOURCES.set(c.id, list);
    }

function RuleCard({ item, q, open, onToggle }: { item: RuleItem; q: string[]; open: boolean; onToggle: (open: boolean) => void }) {
  return (
    <details
      id={item.id}
      open={open}
      onToggle={(e) => {
        const now = (e.currentTarget as HTMLDetailsElement).open;
        if (now !== open) onToggle(now);
      }}
      className="group scroll-mt-28 rounded-md border border-rivet bg-coal/60 open:bg-coal"
    >
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-4 p-5 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-lg font-semibold tracking-[0.04em] text-ivory">
          <Highlight text={item.title} q={q} />
        </h3>
        <ChevronDown aria-hidden size={18} className="no-print row-span-2 mt-1 shrink-0 text-brass transition-transform group-open:rotate-180" />
        <span className="mt-1.5 block text-sm leading-relaxed text-parchment">
          <Highlight text={item.summary} q={q} />
        </span>
      </summary>
      <div className="space-y-4 border-t border-rivet/70 px-5 pb-5 pt-4 text-sm leading-relaxed">
        {item.body?.map((b) => (
          <p key={b} className="text-muted">
            <Highlight text={b} q={q} />
          </p>
        ))}
        {item.bullets && (
          <ul className="space-y-1.5">
            {item.bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-muted">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-brass" />
                <span>
                  <Highlight text={b} q={q} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {item.costs && (
          <table className="w-full max-w-xl text-sm">
            <caption className="sr-only">Costs for {item.title}</caption>
            <tbody>
              {item.costs.map((c) => (
                <tr key={c.label} className="border-b border-rivet/50 last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-parchment">
                    <Highlight text={c.label} q={q} />
                  </th>
                  <td className="py-2 text-right">
                    <CostBadges cost={c.cost} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {item.example && (
          <div className="parchment rounded-md p-4 text-[#2b2219]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7a5a2c]">Example</p>
            <p className="mt-1.5">
              <Highlight text={item.example} q={q} />
            </p>
          </div>
        )}
        {item.clarifications?.map((c) => (
          <ClarificationNote key={c.id} item={c} />
        ))}
        <a href={`#${item.id}`} className="no-print inline-block text-xs text-dim hover:text-brass">
          Link to this rule
        </a>
      </div>
    </details>
  );
}

export default function RulebookPage() {
  usePageMeta('Rulebook', 'The complete, searchable Version 1 rulebook for Tax the Richmen: setup, turns, Roads and tolls, Oil leasing, Pipelines, the Tax Inspector, Port Markets and Steel.');
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [paper, setPaper] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [active, setActive] = useState(RULE_SECTIONS[0].id);
  const q = useMemo(() => terms(query), [query]);

  const filtered = useMemo(
    () => RULE_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => matches(i, q)) })).filter((s) => s.items.length > 0),
    [q],
  );
  const textMatch = (s: string) => q.every((t) => s.toLowerCase().includes(t));
  const glossary = GLOSSARY.filter((g) => textMatch(`${g.term} ${g.definition}`));
  const clarifications = ALL_CLARIFICATIONS.filter((c) => textMatch(`${c.question} ${c.context}`));
  const resultCount = filtered.reduce((a, s) => a + s.items.length, 0);
  const allIds = useMemo(() => RULE_SECTIONS.flatMap((s) => s.items.map((i) => i.id)), []);

  useEffect(() => {
    const id = location.hash.slice(1);
    if (id && collapsed.has(id)) setCollapsed((c) => new Set([...c].filter((x) => x !== id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash]);

  useEffect(() => {
    const expand = () => setCollapsed(new Set());
    window.addEventListener('beforeprint', expand);
    return () => window.removeEventListener('beforeprint', expand);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    document.querySelectorAll('[data-rule-section]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered]);

  const print = () => {
    setCollapsed(new Set());
    setPaper(true);
    setTimeout(() => window.print(), 50);
  };

  const toc = (onNavigate?: () => void) => (
    <ol className="space-y-0.5 text-sm">
      {RULE_SECTIONS.map((s) => {
        const hits = filtered.find((f) => f.id === s.id)?.items.length ?? 0;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={onNavigate}
              aria-current={active === s.id ? 'location' : undefined}
              className={`flex items-baseline gap-3 rounded-sm px-3 py-1.5 transition-colors ${
                hits === 0 ? 'pointer-events-none text-dim/60' : active === s.id ? 'bg-steel text-ivory' : 'text-muted hover:bg-coal hover:text-parchment'
              }`}
            >
              <span className="w-6 font-display text-xs text-brass-dark">{s.number}</span>
              <span className="flex-1">{s.title}</span>
              {q.length > 0 && <span className="text-xs tabular-nums text-dim">{hits}</span>}
            </a>
          </li>
        );
      })}
      {EXTRA_SECTIONS.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} onClick={onNavigate} className={`flex items-baseline gap-3 rounded-sm px-3 py-1.5 transition-colors ${active === s.id ? 'bg-steel text-ivory' : 'text-muted hover:bg-coal hover:text-parchment'}`}>
            <span className="w-6 font-display text-xs text-brass-dark">·</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className={paper ? 'paper-view print-light' : ''}>
      <div className="container-page pb-24 pt-12 md:pt-16">
        <header className="max-w-3xl">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-brass-dark" />
            Rulebook · Version 1
          </p>
          <h1 className="display-lg text-ivory">The complete rules.</h1>
          <p className="lede mt-5">
            Every approved rule in one place. Open questions that playtesting has not yet settled are marked <em className="not-italic text-ember-light">{CLARIFICATION_LABEL}</em>.
          </p>
        </header>

        <div className="no-print keep-theme sticky top-[4.5rem] z-20 -mx-4 mt-8 border-y border-rivet bg-ink/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border-x">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              <label htmlFor="rule-search" className="sr-only">Search the rules</label>
              <input
                id="rule-search"
                type="search"
                className="field pl-9 pr-9"
                placeholder="Search rules — try “toll”, “vault” or “7”"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button type="button" aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted hover:text-ivory" onClick={() => setQuery('')}>
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>
            <button type="button" className="btn btn-ghost btn-sm lg:hidden" aria-expanded={tocOpen} aria-controls="mobile-toc" onClick={() => setTocOpen((o) => !o)}>
              <List size={14} aria-hidden /> Contents
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCollapsed(new Set())}>
              <ChevronsUpDown size={14} aria-hidden /> <span className="hidden sm:inline">Expand all</span>
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCollapsed(new Set(allIds))}>
              <ChevronsDownUp size={14} aria-hidden /> <span className="hidden sm:inline">Collapse all</span>
            </button>
            <button type="button" className="btn btn-ghost btn-sm" aria-pressed={paper} onClick={() => setPaper((p) => !p)}>
              <span className="hidden sm:inline">Printer-friendly</span>
              <span className="sm:hidden">Paper</span>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={print}>
              <Printer size={14} aria-hidden /> Print
            </button>
          </div>
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {q.length ? `${resultCount} rule${resultCount === 1 ? '' : 's'} match “${query.trim()}”.` : `${allIds.length} rules in ${RULE_SECTIONS.length} sections.`}
          </p>
          {tocOpen && (
            <nav id="mobile-toc" aria-label="Rulebook contents" className="mt-3 max-h-[60vh] overflow-y-auto border-t border-rivet pt-3 lg:hidden">
              {toc(() => setTocOpen(false))}
            </nav>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr] xl:gap-14">
          <nav aria-label="Rulebook contents" className="no-print hidden lg:sticky lg:top-48 lg:block lg:max-h-[calc(100vh-13rem)] lg:self-start lg:overflow-y-auto scrollbar-thin">
            <p className="label px-3">Contents</p>
            {toc()}
          </nav>

          <div className="min-w-0 space-y-16">
            {filtered.length === 0 && (
              <div className="plate-flat p-8 text-center">
                <p className="font-display text-xl text-ivory">No rules match “{query.trim()}”.</p>
                <p className="mt-2 text-sm text-muted">Try a shorter word, or browse the glossary below.</p>
              </div>
            )}
            {filtered.map((section) => (
              <section key={section.id} id={section.id} data-rule-section aria-labelledby={`${section.id}-title`} className="scroll-mt-48">
                <p className="font-display text-sm text-brass">Section {section.number}</p>
                <h2 id={`${section.id}-title`} className="display-md mt-1 text-ivory">
                  {section.title}
                </h2>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted">{section.intro}</p>
                <div className="mt-6 space-y-3">
                  {section.items.map((item) => (
                    <RuleCard
                      key={item.id}
                      item={item}
                      q={q}
                      open={q.length > 0 || !collapsed.has(item.id)}
                      onToggle={(open) =>
                        setCollapsed((c) => {
                          const next = new Set(c);
                          if (open) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            ))}

            <section id="glossary" data-rule-section aria-labelledby="glossary-title" className="scroll-mt-48">
              <p className="font-display text-sm text-brass">Reference</p>
              <h2 id="glossary-title" className="display-md mt-1 text-ivory">Glossary</h2>
              {glossary.length === 0 && <p className="mt-6 text-sm text-dim">No glossary terms match.</p>}
              <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {glossary.map((g) => (
                  <div key={g.term} className="border-b border-rivet/60 pb-4">
                    <dt className="font-semibold text-ivory">
                      {g.ref ? (
                        <a href={`#${g.ref}`} className="hover:text-brass-light">
                          {g.term}
                        </a>
                      ) : (
                        g.term
                      )}
                    </dt>
                    <dd className="mt-1 text-sm text-muted">{g.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="clarifications" data-rule-section aria-labelledby="clarifications-title" className="scroll-mt-48">
              <p className="font-display text-sm text-ember-light">Open questions</p>
              <h2 id="clarifications-title" className="display-md mt-1 text-ivory">Playtest clarifications</h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-muted">
                These edge cases are not settled by the approved Version 1 rules. They are listed so playtesters can agree a table ruling — the website does not invent answers for them.
              </p>
              <ol className="mt-6 space-y-3">
                {clarifications.length === 0 && <li className="text-sm text-dim">No clarifications match.</li>}
                {clarifications.map((c) => (
                  <li key={c.id} className="space-y-1.5">
                    <ClarificationNote item={c} />
                    {CLARIFICATION_SOURCES.get(c.id) && (
                      <p className="pl-1 text-xs text-dim">
                        Affects:{' '}
                        {CLARIFICATION_SOURCES.get(c.id)!.map((s, i) => (
                          <Fragment key={s.id}>
                            {i > 0 && ', '}
                            <a href={`#${s.id}`} className="text-muted underline-offset-2 hover:text-brass hover:underline">
                              {s.title}
                            </a>
                          </Fragment>
                        ))}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            <p className="no-print text-sm text-muted">
              Prefer to learn by doing? <Link to="/how-to-play" className="text-brass hover:text-brass-light">Walk through How to Play</Link> or download the{' '}
              <Link to="/print-export#rulebook-pdf" className="text-brass hover:text-brass-light">rulebook PDF</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
