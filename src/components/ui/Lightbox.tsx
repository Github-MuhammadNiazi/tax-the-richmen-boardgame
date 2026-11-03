import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

/** Modal image viewer built on <dialog>: focus is trapped by the browser and Escape closes it. */
export function Lightbox({ images, index, onIndex, onClose, title }: { images: LightboxImage[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index != null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);

  if (!open) return <dialog ref={ref} aria-label={title} className="hidden" />;
  const img = images[index];
  const many = images.length > 1;
  const go = (delta: number) => onIndex((index + delta + images.length) % images.length);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[94vh] w-[min(64rem,94vw)] overflow-visible rounded-lg border border-brass-dark bg-ink p-0 text-ivory shadow-lift backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <figure className="relative">
        <img src={img.src} alt={img.alt} className="max-h-[78vh] w-full rounded-t-lg bg-coal object-contain" />
        <figcaption className="flex items-center justify-between gap-4 border-t border-rivet px-5 py-3 text-sm">
          <span>
            <span className="font-display text-ivory">{title}</span>
            {img.caption && <span className="ml-2 text-muted">· {img.caption}</span>}
          </span>
          {many && (
            <span className="tabular-nums text-dim">
              {index + 1} / {images.length}
            </span>
          )}
        </figcaption>
        {many && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => go(-1)} className="absolute left-3 top-[39vh] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-rivet bg-ink/80 text-ivory hover:border-brass">
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button type="button" aria-label="Next image" onClick={() => go(1)} className="absolute right-3 top-[39vh] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-rivet bg-ink/80 text-ivory hover:border-brass">
              <ChevronRight size={18} aria-hidden />
            </button>
          </>
        )}
        <button type="button" aria-label="Close" onClick={onClose} autoFocus className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-rivet bg-ink/85 text-ivory hover:border-brass">
          <X size={16} aria-hidden />
        </button>
      </figure>
    </dialog>
  );
}
