import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { PrintHost } from '../../print/PrintHost';
import { Footer } from './Footer';
import { Header } from './Header';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // Wait a frame so the target route has rendered.
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname, hash]);
  return null;
}

export function Layout() {
  return (
    <>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Suspense
          fallback={
            <div className="container-page flex min-h-[60vh] items-center justify-center" role="status">
              <span className="eyebrow animate-pulse">Loading…</span>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <PrintHost />
    </>
  );
}
