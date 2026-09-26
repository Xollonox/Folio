import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function openPdf(data) {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const first = await pdf.getPage(1);
  const vp = first.getViewport({ scale: 1 });
  const cache = new Map();
  return {
    kind: 'pdf',
    count: pdf.numPages,
    aspect: vp.width / vp.height,
    async title() {
      try { const m = await pdf.getMetadata(); return m.info?.Title || ''; } catch { return ''; }
    },
    // Render page i (0-based) into element el at given css width
    async render(el, i, cssW) {
      const key = i + ':' + Math.round(cssW);
      el.innerHTML = '';
      let canvas = cache.get(key);
      if (!canvas) {
        const page = await pdf.getPage(i + 1);
        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vpt = page.getViewport({ scale: (cssW / base.width) * dpr });
        canvas = document.createElement('canvas');
        canvas.width = vpt.width; canvas.height = vpt.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vpt }).promise;
        cache.set(key, canvas);
        if (cache.size > 24) cache.delete(cache.keys().next().value);
      }
      const c = document.createElement('canvas');
      c.width = canvas.width; c.height = canvas.height;
      c.getContext('2d').drawImage(canvas, 0, 0);
      c.className = 'pdf-canvas';
      el.appendChild(c);
    },
    async cover() {
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const vpt = page.getViewport({ scale: 420 / base.width });
      const c = document.createElement('canvas');
      c.width = vpt.width; c.height = vpt.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vpt }).promise;
      return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    },
  };
}
