import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Wordmark } from '../brand/Emblem';
import { NAV_LINKS } from './nav';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const first = panelRef.current?.querySelector<HTMLElement>('a');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header
        data-site-header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open ? 'border-rivet/80 bg-ink/95 backdrop-blur-sm' : 'border-transparent bg-ink/40'
        }`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-brass focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
          <Link to="/" aria-label="Tax the Richmen — home" className="shrink-0">
            <Wordmark />
          </Link>
  
          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `relative whitespace-nowrap px-2 py-2 font-display text-[0.72rem] font-semibold tracking-[0.1em] uppercase transition-colors ${
                        isActive ? 'text-brass' : 'text-ivory/80 hover:text-ivory'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        <span
                          aria-hidden
                          className={`absolute inset-x-2 -bottom-0.5 h-px bg-brass transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
  
          <div className="flex items-center gap-3">
            <Link to="/map-generator" className="btn btn-primary hidden sm:inline-flex">
              Generate Map
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="btn btn-ghost xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would become the containing block of this fixed panel. */}
      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 top-[4.5rem] bottom-0 z-40 overflow-y-auto border-t border-rivet bg-ink xl:hidden"
      >
        <nav aria-label="Mobile" className="container-page py-6">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l, i) => (
              <li key={l.to} className="border-b border-rivet/60">
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between py-4 font-display text-lg tracking-[0.12em] uppercase ${isActive ? 'text-brass' : 'text-ivory'}`
                  }
                >
                  <span>{l.label}</span>
                  <span className="font-sans text-xs text-dim">{String(i + 1).padStart(2, '0')}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/map-generator" className="btn btn-primary mt-8 w-full">
            Generate Map
          </Link>
        </nav>
      </div>
    </>
  );
}
