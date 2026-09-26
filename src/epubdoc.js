import ePub from 'epubjs';

// Paginates EPUB chapters into fixed-size pages using CSS columns so they can
// be laid out as book spreads and flipped like PDF pages.
export async function openEpub(data) {
  const book = ePub(data);
  await book.ready;
  await book.replacements().catch(() => {});
  const chapters = [];
  for (const section of book.spine.spineItems) {
    try {
      const html = await section.render(book.load.bind(book));
      const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');
      let body = doc.body || doc.querySelector('body');
      if (!body || doc.querySelector('parsererror')) body = new DOMParser().parseFromString(html, 'text/html').body;
      body.querySelectorAll('script,style,link,iframe,object').forEach((n) => n.remove());
      body.querySelectorAll('*').forEach((n) => {
        [...n.attributes].forEach((a) => { if (/^on/i.test(a.name) || a.name === 'style') n.removeAttribute(a.name); });
      });
      chapters.push(body.innerHTML);
    } catch { /* skip broken section */ }
  }
  const aspect = 0.68;
  let layout = null; // {w, pages:[{ch, col}]}

  const measureBox = document.createElement('div');
  measureBox.className = 'epub-measure';
  document.body.appendChild(measureBox);

  function paginate(w) {
    const h = w / aspect;
    const pages = [];
    const pad = Math.round(w * 0.1);
    const innerW = w - pad * 2;
    chapters.forEach((html, ch) => {
      measureBox.innerHTML = '';
      const flow = chapterFlow(html, innerW, h - pad * 2, w);
      measureBox.style.width = innerW + 'px';
      measureBox.appendChild(flow);
      const cols = Math.max(1, Math.ceil((flow.scrollWidth + Math.round(w * 0.2) - 2) / (innerW + Math.round(w * 0.2))));
      for (let c = 0; c < cols; c++) pages.push({ ch, col: c });
    });
    measureBox.innerHTML = '';
    layout = { w, pad, pages };
  }

  function chapterFlow(html, innerW, innerH, w) {
    const f = document.createElement('div');
    f.className = 'epub-flow';
    f.style.cssText = `width:${innerW}px;height:${innerH}px;column-width:${innerW}px;column-gap:${Math.round(w * 0.2)}px;font-size:${Math.max(11, w / 30)}px`;
    f.innerHTML = html;
    return f;
  }

  const api = {
    kind: 'epub',
    count: 0,
    aspect,
    async title() { return book.packaging?.metadata?.title || ''; },
    layoutFor(w) {
      if (!layout || Math.abs(layout.w - w) > 2) { paginate(w); api.count = layout.pages.length; }
      return api.count;
    },
    async render(el, i, w) {
      api.layoutFor(w);
      const p = layout.pages[i];
      el.innerHTML = '';
      if (!p) return;
      const h = w / aspect;
      const pad = layout.pad;
      const win = document.createElement('div');
      win.className = 'epub-window';
      win.style.cssText = `position:absolute;inset:${pad}px;overflow:hidden`;
      const flow = chapterFlow(chapters[p.ch], w - pad * 2, h - pad * 2, w);
      flow.style.transform = `translateX(${-p.col * (w - pad * 2 + Math.round(w * 0.2))}px)`;
      win.appendChild(flow);
      el.appendChild(win);
      const folio = document.createElement('div');
      folio.className = 'epub-folio';
      folio.textContent = i + 1;
      el.appendChild(folio);
    },
    async cover() {
      try {
        const url = await book.coverUrl();
        if (url) return await (await fetch(url)).blob();
      } catch {}
      return null;
    },
  };
  api.layoutFor(400);
  return api;
}
