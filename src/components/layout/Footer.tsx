import { Link } from 'react-router';
import { Wordmark } from '../brand/Emblem';
import { NAV_LINKS } from './nav';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-site-footer className="no-print border-t border-rivet bg-ink-2">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            A premium economic strategy board game for 2–4 players. Build roads, control resources, outbid your rivals for oil,
            survive the Tax Inspector, and connect your City to your Port. The first to launch their ship wins.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="eyebrow mb-4">Explore</h2>
          <ul className="grid gap-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted transition-colors hover:text-brass">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="eyebrow mb-4">The Game</h2>
          <ul className="grid gap-2 text-sm text-muted">
            <li>30 hex tiles · 8 terrain types</li>
            <li>2–4 players · balanced for 4</li>
            <li>First to 10 Steel wins</li>
            <li>
              <Link to="/rulebook#clarifications" className="hover:text-brass">
                Playtest clarifications
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rivet/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Tax the Richmen. All rights reserved.</p>
          <p>Companion website · Version 1 prototype · Runs entirely in your browser.</p>
        </div>
      </div>
    </footer>
  );
}
