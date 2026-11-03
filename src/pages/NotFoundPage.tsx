import { Link } from 'react-router';
import { usePageMeta } from '../lib/usePageMeta';

export default function NotFoundPage() {
  usePageMeta('Page not found', 'This page does not exist.');
  return (
    <section className="container-page section text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-lg mt-4 text-ivory">This road leads into the sea.</h1>
      <p className="lede mx-auto mt-5 max-w-lg">The page you were looking for is inaccessible — much like the Tax Office.</p>
      <Link to="/" className="btn btn-primary mt-10">
        Return home
      </Link>
    </section>
  );
}
