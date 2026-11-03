import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';

export type PageSize = 'A4' | 'A3' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

interface PrintJob {
  node: ReactNode;
  size: PageSize;
  orientation: Orientation;
}

const usePrintStore = create<{ job: PrintJob | null }>(() => ({ job: null }));

function printRoot(): HTMLElement {
  let el = document.getElementById('print-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'print-root';
    document.body.appendChild(el);
  }
  return el;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

async function waitForImages(root: HTMLElement, timeout = 8000) {
  const images = [...root.querySelectorAll('image, img')];
  const loads = images.map(
    (node) =>
      new Promise<void>((resolve) => {
        const href = node.getAttribute('href') || node.getAttribute('src');
        if (!href) return resolve();
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = href;
      }),
  );
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeout))]);
}

/** Renders printable pages into an isolated print root, waits for artwork, and opens the browser print dialog. */
let activeJob = 0;

export async function printPages(node: ReactNode, size: PageSize = 'A4', orientation: Orientation = 'portrait', marginMm = 0) {
  const token = ++activeJob;
  usePrintStore.setState({ job: { node, size, orientation } });
  await nextFrame();
  await nextFrame();
  await waitForImages(printRoot());
  await document.fonts?.ready;
  if (token !== activeJob) return;

  document.getElementById('print-page-size')?.remove();
  const style = document.createElement('style');
  style.id = 'print-page-size';
  style.textContent = `@page { size: ${size} ${orientation}; margin: ${marginMm}mm; }`;
  document.head.appendChild(style);
  document.body.classList.add('printing-job');

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    style.remove();
    window.removeEventListener('afterprint', cleanup);
    if (token !== activeJob) return;
    document.body.classList.remove('printing-job');
    usePrintStore.setState({ job: null });
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Some browsers do not fire afterprint reliably; print() is blocking in most of them.
  setTimeout(cleanup, 1500);
}

export function PrintHost() {
  const job = usePrintStore((s) => s.job);
  if (!job || typeof document === 'undefined') return null;
  return createPortal(<div className="print-job">{job.node}</div>, printRoot());
}
