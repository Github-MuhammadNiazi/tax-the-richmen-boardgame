import { useEffect, useRef, useState, type ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  as: Tag = 'h2',
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  id?: string;
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && (
        <p className={`eyebrow mb-4 flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
          <span aria-hidden className="h-px w-8 bg-brass-dark" />
          {eyebrow}
          {align === 'center' && <span aria-hidden className="h-px w-8 bg-brass-dark" />}
        </p>
      )}
      <Tag id={id} className={Tag === 'h1' ? 'display-xl text-ivory' : 'display-lg text-ivory'}>
        {title}
      </Tag>
      {lede && <p className="lede mt-5">{lede}</p>}
    </div>
  );
}

/** Fades content up once it enters the viewport. Disabled automatically under reduced motion via CSS. */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${className} ${shown ? 'animate-rise' : 'opacity-0'}`}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export const HEX_CLIP = 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)';

export function HexImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[1.1547] ${className}`} style={{ filter: 'drop-shadow(0 10px 18px rgb(0 0 0 / 0.55))' }}>
      <div className="absolute inset-0 bg-[#0b0f10]" style={{ clipPath: HEX_CLIP, transform: 'translateY(3%)' }} />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: HEX_CLIP }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ clipPath: HEX_CLIP, background: 'radial-gradient(circle at 42% 38%, transparent 55%, rgb(0 0 0 / 0.38))' }}
      />
    </div>
  );
}
