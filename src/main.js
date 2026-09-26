import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './style.css';
import { createElement, FolderOpen, LibraryBig, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Minus, Plus, Scan, Bookmark, Sparkles, Settings2, Moon, Sun, Maximize, Minimize, BookOpen, ShieldCheck, X, House, BookDown } from 'lucide';

const icons = { FolderOpen, LibraryBig, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Minus, Plus, Scan, Bookmark, Sparkles, Settings2, Moon, Sun, Maximize, Minimize, BookOpen, ShieldCheck, X, House, BookDown };
import * as db from './db.js';

const ic = (name, size = 18) => {
  const el = createElement(icons[name]);
  el.setAttribute('width', size); el.setAttribute('height', size);
  el.setAttribute('stroke-width', '1.75');
  return el.outerHTML;
};
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const S = {
  view: 'home', books: [], book: null, doc: null, page: 0,
  mode: 'flip', zoom: 1, theme: 'light', effects: true, busy: false, flipping: false,
};

// ---------- toolbar ----------
function toolbar() {
  const r = S.view === 'reader' && S.doc;
  const dis = r ? '' : 'disabled';
  const count = r ? S.doc.count : 0;
  const bm = r && isBookmarked();
  const pageLabel = r ? pageText() : '— / —';
  const modeBtn = (m, label) =>
    `<button class="seg ${S.mode === m ? 'on' : ''}" data-mode="${m}" ${dis}>${label}</button>`;
  return `
  <header class="toolbar" role="toolbar">
    <div class="tb-group tb-left">
      <button class="brand" data-act="home" aria-label="Folio home">Folio<span>.</span></button>
      <span class="tb-sep"></span>
      <button class="tb-btn text" data-act="open" title="Open a book">${ic('FolderOpen', 17)}<span class="lbl">Open</span></button>
      <button class="tb-btn ${S.view === 'library' ? 'on' : ''}" data-act="library" title="Library">${ic('LibraryBig', 17)}</button>
    </div>
    <div class="tb-group tb-center">
      <div class="nav">
        <button class="tb-btn hide-sm" data-act="first" ${dis} title="First page">${ic('ChevronsLeft')}</button>
        <button class="tb-btn" data-act="prev" ${r && S.page > 0 ? '' : 'disabled'} title="Previous">${ic('ChevronLeft')}</button>
        <span class="counter ${r ? '' : 'muted'}">${pageLabel}</span>
        <button class="tb-btn" data-act="next" ${r && S.page < count - 1 ? '' : 'disabled'} title="Next">${ic('ChevronRight')}</button>
        <button class="tb-btn hide-sm" data-act="last" ${dis} title="Last page">${ic('ChevronsRight')}</button>
      </div>
      <div class="segmented hide-md">${modeBtn('flip', '3D Flip')}${modeBtn('two', 'Two Page')}${modeBtn('single', 'Single')}</div>
    </div>
    <div class="tb-group tb-right">
      <div class="zoom hide-md">
        <button class="tb-btn" data-act="zoomout" ${dis} title="Zoom out">${ic('Minus', 16)}</button>
        <span class="zoom-val ${r ? '' : 'muted'}">${Math.round(S.zoom * 100)}%</span>
        <button class="tb-btn" data-act="zoomin" ${dis} title="Zoom in">${ic('Plus', 16)}</button>
        <button class="tb-btn" data-act="fit" ${dis} title="Fit to window">${ic('Scan', 17)}</button>
      </div>
      <span class="tb-sep hide-md"></span>
      <button class="tb-btn ${bm ? 'on accent' : ''}" data-act="bookmark" ${dis} title="Bookmark (B)">${ic('Bookmark', 17)}</button>
      <button class="tb-btn hide-sm ${S.effects ? '' : 'off'}" data-act="effects" title="Page effects">${ic('Sparkles', 17)}</button>
      <button class="tb-btn" data-act="settings" title="Settings">${ic('Settings2', 17)}</button>
      <button class="tb-btn" data-act="theme" title="Theme (T)">${ic(S.theme === 'dark' ? 'Sun' : 'Moon', 17)}</button>
      <button class="tb-btn hide-sm" data-act="fullscreen" title="Fullscreen">${ic(document.fullscreenElement ? 'Minimize' : 'Maximize', 17)}</button>
    </div>
  </header>`;
}

// ---------- home ----------
function home() {
  const n = S.books.length;
  return `
  <main class="home">
    <section class="hero">
      <p class="eyebrow">A quiet reader for PDF &amp; EPUB</p>
      <h1><span class="l1">Crack the spine.</span><br><em>Turn real pages.</em></h1>
      <p class="lede">Drop a file anywhere on this window, or open one below. Folio lays it out like a bound novel — and every book you open is shelved in your library, ready to continue anytime.</p>
      <div class="ctas">
        <button class="btn primary" data-act="open">${ic('BookOpen', 18)}Open a book</button>
        <button class="btn ghost" data-act="library">${ic('LibraryBig', 18)}Your Library <span class="dot">·</span> ${n}</button>
      </div>
      <ul class="keys">
        <li><kbd>←</kbd><kbd>→</kbd> flip</li>
        <li><kbd class="wide">Space</kbd> next</li>
        <li><kbd>+</kbd><kbd>−</kbd> zoom</li>
        <li><kbd>T</kbd> theme</li>
        <li><kbd>B</kbd> bookmark</li>
      </ul>
      <p class="helper">${ic('ShieldCheck', 14)}Runs fully in your browser · books stay on this device</p>
    </section>
    <section class="hero-art" aria-hidden="true">
      <div class="hb-scene">
        <div class="hb">
          <div class="hb-back"></div>
          <div class="hb-block"></div>
          <div class="hb-page"></div>
          <div class="hb-cover">
            <div class="hb-frame">
              <span class="hb-press">Folio Press</span>
              <span class="hb-rule"></span>
              <span class="hb-title">The Art of<br><em>Turning Pages</em></span>
              <span class="hb-orn">❦</span>
              <span class="hb-no">№ 001</span>
            </div>
          </div>
        </div>
        <div class="hb-shadow"></div>
      </div>
    </section>
  </main>`;
}

// ---------- library ----------
const coverUrls = new Map();
function coverFor(b) {
  if (b.cover && !coverUrls.has(b.id)) coverUrls.set(b.id, URL.createObjectURL(b.cover));
  return coverUrls.get(b.id);
}
function progress(b) {
  if (!b.page) return 'not started yet';
  return `page ${b.page + 1} of ${b.count}`;
}
function hue(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function library() {
  const items = S.books.map((b) => {
    const url = coverFor(b);
    const art = url
      ? `<img src="${url}" alt="" loading="lazy">`
      : `<div class="gen-cover" style="--h:${hue(b.name)}"><span>${esc(b.title || b.name)}</span></div>`;
    const pct = b.count ? Math.round(((b.page || 0) + 1) / b.count * 100) : 0;
    return `
    <li class="shelf-item">
      <button class="cover" data-open="${b.id}" title="${esc(b.name)}">${art}<span class="spine"></span>
        ${b.page ? `<span class="pbar"><i style="width:${pct}%"></i></span>` : ''}
      </button>
      <button class="remove" data-remove="${b.id}" title="Remove from library">${ic('X', 14)}</button>
      <div class="meta"><span class="name">${esc(b.name)}</span><span class="prog">${progress(b)}</span></div>
    </li>`;
  }).join('');
  return `
  <main class="library">
    <div class="lib-head">
      <div>
        <h2>Your Library</h2>
        <p>Shelved on this device — tap a cover to continue where you left off.</p>
      </div>
      <div class="lib-actions">
        <button class="btn primary sm" data-act="open">${ic('Plus', 17)}Add books</button>
        <button class="btn ghost sm" data-act="home">${ic('House', 17)}Home</button>
      </div>
    </div>
    ${S.books.length ? `<ul class="shelf">${items}</ul>` : `
      <div class="empty"><p>Your shelf is empty.</p><button class="btn ghost sm" data-act="open">${ic('FolderOpen', 17)}Open your first book</button></div>`}
  </main>`;
}

// ---------- reader ----------
function reader() {
  return `<main class="reader ${S.effects ? 'fx' : ''}"><div class="stage"><div class="book"></div></div>
    <div class="reader-foot"><span class="rf-title">${esc(S.book?.title || S.book?.name || '')}</span></div></main>`;
}

const isSpread = () => S.mode !== 'single' && innerWidth >= 760;
const spreadOf = (p) => Math.floor((p + 1) / 2);
const spreadPages = (k) => [2 * k - 1, 2 * k];
function pageText() {
  const n = S.doc.count;
  if (isSpread()) {
    const [l, r] = spreadPages(spreadOf(S.page));
    const a = Math.max(l, 0) + 1, b = Math.min(r, n - 1) + 1;
    return a === b ? `${a} / ${n}` : `${a}–${b} / ${n}`;
  }
  return `${S.page + 1} / ${n}`;
}
function visiblePages() {
  return isSpread() ? spreadPages(spreadOf(S.page)) : [S.page];
}
function isBookmarked() {
  const bms = S.book?.bookmarks || [];
  return visiblePages().some((p) => bms.includes(p));
}

function pageSize() {
  const topPad = innerWidth < 640 ? 76 : 96;
  const availH = innerHeight - topPad - 76;
  const availW = innerWidth - (innerWidth < 640 ? 24 : 96);
  const cols = isSpread() ? 2 : 1;
  let h = availH, w = h * S.doc.aspect;
  if (w * cols > availW) { w = availW / cols; h = w / S.doc.aspect; }
  return { w: Math.floor(w * S.zoom), h: Math.floor(h * S.zoom) };
}

function makePage(i, side) {
  const el = document.createElement('div');
  el.className = `page ${side}`;
  if (i < 0 || i >= S.doc.count) { el.classList.add('blank'); return el; }
  el.dataset.i = i;
  const inner = document.createElement('div');
  inner.className = 'page-content';
  el.appendChild(inner);
  S.doc.render(inner, i, S.size.w).catch(console.error);
  const shade = document.createElement('div');
  shade.className = 'gutter';
  el.appendChild(shade);
  return el;
}

function layoutBook() {
  const book = $('.book');
  if (!book || !S.doc) return;
  S.size = pageSize();
  if (S.doc.layoutFor) {
    const before = S.doc.count;
    S.doc.layoutFor(S.size.w);
    if (before && before !== S.doc.count) S.page = Math.min(Math.round(S.page * S.doc.count / before), S.doc.count - 1);
  }
  const { w, h } = S.size;
  const spread = isSpread();
  book.style.setProperty('--pw', w + 'px');
  book.style.setProperty('--ph', h + 'px');
  book.style.width = (spread ? w * 2 : w) + 'px';
  book.style.height = h + 'px';
  book.className = `book ${spread ? 'spread' : 'single'}`;
  book.innerHTML = '';
  if (spread) {
    const [l, r] = spreadPages(spreadOf(S.page));
    book.appendChild(makePage(l, 'left'));
    book.appendChild(makePage(r, 'right'));
    book.classList.toggle('closed-left', l < 0);
    book.classList.toggle('closed-right', r >= S.doc.count);
  } else {
    book.appendChild(makePage(S.page, 'solo'));
  }
  refreshToolbar();
}

async function goTo(target) {
  if (!S.doc || S.flipping) return;
  target = Math.max(0, Math.min(S.doc.count - 1, target));
  const spread = isSpread();
  const fromK = spread ? spreadOf(S.page) : S.page;
  const toK = spread ? spreadOf(target) : target;
  if (fromK === toK) { S.page = target; refreshToolbar(); return save(); }
  const dir = toK > fromK ? 1 : -1;
  const book = $('.book');
  if (S.mode === 'flip' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    S.flipping = true;
    try { await (spread ? flipSpread(book, fromK, toK, dir) : flipSingle(book, target, dir)); }
    finally { S.flipping = false; }
  } else if (book) {
    book.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 90, easing: 'ease-out' });
  }
  S.page = target;
  layoutBook();
  if (S.mode !== 'flip') $('.book')?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  save();
}

const FLIP_MS = 720;
const EASE = 'cubic-bezier(.45,.05,.25,1)';

function buildSheet(frontI, backI, side) {
  const sheet = document.createElement('div');
  sheet.className = `sheet ${side}`;
  const front = makePage(frontI, side === 'right' ? 'right' : 'left');
  front.classList.add('face', 'front');
  const back = makePage(backI, side === 'right' ? 'left' : 'right');
  back.classList.add('face', 'back');
  if (back.classList.contains('blank')) back.classList.add('reverse');
  [front, back].forEach((f) => { const s = document.createElement('div'); s.className = 'lighting'; f.appendChild(s); });
  sheet.append(front, back);
  return sheet;
}

function animateSheet(sheet, from, to, castEl) {
  const mid = (from + to) / 2;
  const lift = to < from ? -1 : 1;
  const anim = sheet.animate([
    { transform: `rotateY(${from}deg) translateZ(0.1px)` },
    { transform: `rotateY(${mid}deg) translateZ(4px) rotateX(${lift * 1.2}deg)`, offset: 0.5 },
    { transform: `rotateY(${to}deg) translateZ(0.1px)` },
  ], { duration: FLIP_MS, easing: EASE, fill: 'forwards' });
  const [lf, lb] = sheet.querySelectorAll('.lighting');
  const dirSign = Math.sign(to - from);
  // front darkens as it lifts away; back brightens as it lands
  lf.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: FLIP_MS / 2, easing: 'ease-in', fill: 'forwards' });
  lb.animate([{ opacity: 0.6 }, { opacity: 0.15, offset: 0.7 }, { opacity: 0 }], { duration: FLIP_MS, easing: 'ease-out', fill: 'forwards' });
  sheet.style.setProperty('--dir', dirSign);
  if (castEl) {
    castEl.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.35 }, { opacity: 0 }], { duration: FLIP_MS, easing: 'ease-out', fill: 'forwards' });
  }
  return anim.finished;
}

async function flipSpread(book, fromK, toK, dir) {
  const [cl, cr] = spreadPages(fromK);
  const [nl, nr] = spreadPages(toK);
  const leftSlot = book.querySelector('.page.left');
  const rightSlot = book.querySelector('.page.right');
  const cast = document.createElement('div');
  if (dir > 0) {
    // underneath the turning sheet: next spread's right page
    const under = makePage(nr, 'right'); under.classList.add('under');
    book.replaceChild(under, rightSlot);
    cast.className = 'cast right'; book.appendChild(cast);
    const sheet = buildSheet(cr, nl, 'right');
    book.appendChild(sheet);
    book.classList.toggle('closed-right', nr >= S.doc.count);
    await animateSheet(sheet, 0, -180, cast);
  } else {
    const under = makePage(nl, 'left'); under.classList.add('under');
    book.replaceChild(under, leftSlot);
    cast.className = 'cast left'; book.appendChild(cast);
    const sheet = buildSheet(cl, nr, 'left');
    book.appendChild(sheet);
    book.classList.toggle('closed-left', nl < 0);
    await animateSheet(sheet, 0, 180, cast);
  }
}

async function flipSingle(book, target, dir) {
  const cur = book.querySelector('.page.solo');
  const cast = document.createElement('div');
  cast.className = 'cast solo';
  if (dir > 0) {
    const under = makePage(target, 'solo'); under.classList.add('under');
    book.replaceChild(under, cur);
    book.appendChild(cast);
    const sheet = buildSheet(S.page, -1, 'right');
    sheet.classList.add('solo-sheet');
    book.appendChild(sheet);
    const fade = sheet.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: FLIP_MS, fill: 'forwards' });
    await Promise.all([animateSheet(sheet, 0, -180, cast), fade.finished]);
  } else {
    book.appendChild(cast);
    const sheet = buildSheet(target, -1, 'right');
    sheet.classList.add('solo-sheet');
    book.appendChild(sheet);
    sheet.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1 }], { duration: FLIP_MS, fill: 'forwards' });
    await animateSheet(sheet, -180, 0, cast);
  }
}

const step = () => (isSpread() ? 2 : 1);
function next() {
  if (!S.doc) return;
  if (isSpread()) goTo(2 * (spreadOf(S.page) + 1) - 1 < 0 ? 0 : 2 * (spreadOf(S.page) + 1) - 1);
  else goTo(S.page + 1);
}
function prev() {
  if (!S.doc) return;
  if (isSpread()) goTo(Math.max(0, 2 * (spreadOf(S.page) - 1) - 1 < 0 ? 0 : 2 * (spreadOf(S.page) - 1) - 1));
  else goTo(S.page - step());
}

let saveT;
function save() {
  if (!S.book) return;
  S.book.page = S.page; S.book.count = S.doc.count;
  clearTimeout(saveT);
  saveT = setTimeout(() => db.updateBook(S.book.id, { page: S.page, count: S.doc.count, openedAt: Date.now() }), 250);
}

// ---------- files ----------
async function loadDoc(blob, name) {
  const buf = await blob.arrayBuffer();
  if (/\.epub$/i.test(name) || blob.type === 'application/epub+zip') {
    const { openEpub } = await import('./epubdoc.js');
    return openEpub(buf);
  }
  const { openPdf } = await import('./pdfdoc.js');
  return openPdf(buf);
}

async function importFiles(list) {
  const files = [...list].filter((f) => /\.(pdf|epub)$/i.test(f.name));
  if (!files.length) return toast('Folio reads PDF and EPUB files.');
  let last;
  for (const f of files) {
    const id = `${f.name}-${f.size}-${f.lastModified}`;
    let b = await db.getBook(id);
    if (!b) {
      toast(`Shelving “${f.name}”…`);
      try {
        const doc = await loadDoc(f, f.name);
        const [title, cover] = await Promise.all([doc.title(), doc.cover().catch(() => null)]);
        b = { id, name: f.name.replace(/\.(pdf|epub)$/i, ''), title, kind: doc.kind, count: doc.count, page: 0, bookmarks: [], cover, addedAt: Date.now(), openedAt: Date.now() };
        await db.putFile(id, f);
        await db.putBook(b);
      } catch (e) { console.error(e); toast(`Couldn't open “${f.name}”.`); continue; }
    }
    last = b;
  }
  S.books = await db.listBooks();
  if (files.length === 1 && last) openBook(last.id);
  else { S.view = 'library'; render(); }
}

async function openBook(id) {
  const b = await db.getBook(id);
  const blob = await db.getFile(id);
  if (!b || !blob) return toast('That book is no longer on this device.');
  S.view = 'reader'; S.book = b; S.doc = null; render();
  $('.stage').innerHTML = '<div class="loading">Opening…</div>';
  try {
    S.doc = await loadDoc(blob, b.kind === 'epub' ? 'x.epub' : 'x.pdf');
  } catch (e) { console.error(e); toast('This file could not be read.'); return go('library'); }
  S.page = Math.min(b.page || 0, S.doc.count - 1);
  $('.stage').innerHTML = '<div class="book"></div>';
  layoutBook();
  save();
}

function pickFiles() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.pdf,.epub,application/pdf,application/epub+zip'; inp.multiple = true;
  inp.onchange = () => importFiles(inp.files);
  inp.click();
}

// ---------- chrome ----------
let toastT;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

function refreshToolbar() {
  const old = $('.toolbar');
  if (!old) return;
  const tmp = document.createElement('div'); tmp.innerHTML = toolbar();
  old.replaceWith(tmp.firstElementChild);
}

function render() {
  document.documentElement.dataset.theme = S.theme;
  const body = S.view === 'home' ? home() : S.view === 'library' ? library() : reader();
  $('#app').innerHTML = toolbar() + body;
  $('#app').dataset.view = S.view;
  closePopover();
}

function go(view) {
  S.view = view;
  if (view !== 'reader') { S.doc = null; S.book = null; }
  db.listBooks().then((b) => { S.books = b; render(); });
  render();
}

function setZoom(z) {
  S.zoom = Math.round(Math.max(0.5, Math.min(2.5, z)) * 100) / 100;
  db.setPref('zoom', S.zoom);
  layoutBook();
}

async function toggleBookmark() {
  if (!S.book) return;
  const bms = new Set(S.book.bookmarks || []);
  const vis = visiblePages().filter((p) => p >= 0 && p < S.doc.count);
  if (vis.some((p) => bms.has(p))) vis.forEach((p) => bms.delete(p));
  else bms.add(vis[vis.length - 1] ?? S.page);
  S.book.bookmarks = [...bms].sort((a, b) => a - b);
  await db.updateBook(S.book.id, { bookmarks: S.book.bookmarks });
  toast(isBookmarked() ? 'Bookmarked' : 'Bookmark removed');
  refreshToolbar();
}

function closePopover() { $('.popover')?.remove(); }
function settingsPopover() {
  if ($('.popover')) return closePopover();
  const bms = S.book?.bookmarks || [];
  const p = document.createElement('div');
  p.className = 'popover';
  p.innerHTML = `
    <h4>Reading mode</h4>
    <div class="segmented full">${['flip', 'two', 'single'].map((m) => `<button class="seg ${S.mode === m ? 'on' : ''}" data-mode="${m}">${{ flip: '3D Flip', two: 'Two Page', single: 'Single' }[m]}</button>`).join('')}</div>
    <h4>Zoom</h4>
    <div class="row"><button class="tb-btn" data-act="zoomout" ${S.doc ? '' : 'disabled'}>${ic('Minus', 16)}</button><span class="zoom-val">${Math.round(S.zoom * 100)}%</span><button class="tb-btn" data-act="zoomin" ${S.doc ? '' : 'disabled'}>${ic('Plus', 16)}</button></div>
    <label class="toggle"><input type="checkbox" data-act="theme-toggle" ${S.theme === 'dark' ? 'checked' : ''}> Dark theme</label>
    <label class="toggle"><input type="checkbox" data-act="effects-toggle" ${S.effects ? 'checked' : ''}> Paper texture &amp; page shading</label>
    <h4>Bookmarks</h4>
    ${S.book ? (bms.length ? `<ul class="bms">${bms.map((b) => `<li><button data-goto="${b}">${ic('Bookmark', 14)} Page ${b + 1}</button></li>`).join('')}</ul>` : '<p class="note">No bookmarks yet — press B while reading.</p>') : '<p class="note">Open a book to see its bookmarks.</p>'}`;
  document.body.appendChild(p);
}

function setMode(m) {
  S.mode = m; db.setPref('mode', m);
  if ($('.popover')) { closePopover(); settingsPopover(); }
  if (S.doc) layoutBook(); else refreshToolbar();
}

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act],[data-mode],[data-open],[data-remove],[data-goto]');
  if (!t) { if (!e.target.closest('.popover')) closePopover(); return; }
  if (t.dataset.mode) return setMode(t.dataset.mode);
  if (t.dataset.open) return openBook(t.dataset.open);
  if (t.dataset.goto) { closePopover(); return goTo(+t.dataset.goto); }
  if (t.dataset.remove) {
    await db.removeBook(t.dataset.remove);
    S.books = await db.listBooks(); return render();
  }
  switch (t.dataset.act) {
    case 'home': return go('home');
    case 'library': return go('library');
    case 'open': return pickFiles();
    case 'first': return goTo(0);
    case 'last': return goTo(S.doc.count - 1);
    case 'prev': return prev();
    case 'next': return next();
    case 'zoomin': return setZoom(S.zoom + 0.1);
    case 'zoomout': return setZoom(S.zoom - 0.1);
    case 'fit': return setZoom(1);
    case 'bookmark': return toggleBookmark();
    case 'effects': S.effects = !S.effects; db.setPref('effects', S.effects); $('.reader')?.classList.toggle('fx', S.effects); return refreshToolbar();
    case 'settings': e.stopPropagation(); return settingsPopover();
    case 'theme': S.theme = S.theme === 'dark' ? 'light' : 'dark'; db.setPref('theme', S.theme); document.documentElement.dataset.theme = S.theme; return refreshToolbar();
    case 'fullscreen':
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.dataset.act === 'theme-toggle') { S.theme = e.target.checked ? 'dark' : 'light'; db.setPref('theme', S.theme); document.documentElement.dataset.theme = S.theme; refreshToolbar(); }
  if (e.target.dataset.act === 'effects-toggle') { S.effects = e.target.checked; db.setPref('effects', S.effects); $('.reader')?.classList.toggle('fx', S.effects); refreshToolbar(); }
});
document.addEventListener('fullscreenchange', () => { refreshToolbar(); });

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 't' || k === 'T') { S.theme = S.theme === 'dark' ? 'light' : 'dark'; db.setPref('theme', S.theme); document.documentElement.dataset.theme = S.theme; return refreshToolbar(); }
  if (k === 'Escape') return closePopover();
  if (!S.doc) return;
  if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
  else if (k === ' ') { e.preventDefault(); e.shiftKey ? prev() : next(); }
  else if (k === 'Home') goTo(0);
  else if (k === 'End') goTo(S.doc.count - 1);
  else if (k === '+' || k === '=') setZoom(S.zoom + 0.1);
  else if (k === '-' || k === '_') setZoom(S.zoom - 0.1);
  else if (k === '0') setZoom(1);
  else if (k === 'b' || k === 'B') toggleBookmark();
});

// click / swipe on pages
let touchX = null;
document.addEventListener('pointerdown', (e) => { if (e.target.closest('.book')) touchX = e.clientX; });
document.addEventListener('pointerup', (e) => {
  if (touchX === null || !e.target.closest('.book')) { touchX = null; return; }
  const dx = e.clientX - touchX; touchX = null;
  if (Math.abs(dx) > 40) return dx < 0 ? next() : prev();
  const r = $('.book').getBoundingClientRect();
  (e.clientX - r.left > r.width / 2 ? next : prev)();
});

// drag and drop anywhere
let dragDepth = 0;
const dropEl = document.createElement('div');
dropEl.className = 'drop';
dropEl.innerHTML = `<div class="drop-card">${ic('BookDown', 34)}<p>Drop to shelve &amp; open</p><span>PDF or EPUB</span></div>`;
document.body.appendChild(dropEl);
addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { dragDepth++; dropEl.classList.add('show'); } });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dropEl.classList.remove('show'); } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => { e.preventDefault(); dragDepth = 0; dropEl.classList.remove('show'); if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); });

let rT;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => (S.doc ? layoutBook() : refreshToolbar()), 120); });

(async () => {
  [S.mode, S.theme, S.zoom, S.effects] = await Promise.all([
    db.getPref('mode', 'flip'), db.getPref('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    db.getPref('zoom', 1), db.getPref('effects', true),
  ]);
  S.books = await db.listBooks();
  const v = location.hash.slice(1);
  S.view = v === 'library' ? 'library' : 'home';
  render();
})();
