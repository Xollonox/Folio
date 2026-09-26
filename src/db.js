import { createStore, get, set, del, entries } from 'idb-keyval';

const books = createStore('folio-books', 'books');
const files = createStore('folio-files', 'files');
const prefs = createStore('folio-prefs', 'prefs');

export const listBooks = async () =>
  (await entries(books)).map(([, v]) => v).sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0));
export const getBook = (id) => get(id, books);
export const putBook = (b) => set(b.id, b, books);
export const updateBook = async (id, patch) => {
  const b = await get(id, books);
  if (b) await set(id, { ...b, ...patch }, books);
};
export const getFile = (id) => get(id, files);
export const putFile = (id, blob) => set(id, blob, files);
export const removeBook = async (id) => { await del(id, books); await del(id, files); };
export const getPref = (k, d) => get(k, prefs).then((v) => (v === undefined ? d : v));
export const setPref = (k, v) => set(k, v, prefs);
