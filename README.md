# Folio

A quiet, local-first PDF & EPUB reader with physical page turns and a persistent library.

```sh
npm install
npm run dev
```

- PDF rendering via PDF.js, EPUB via epub.js (typeset into fixed pages with CSS columns)
- 3D Flip / Two Page / Single reading modes, zoom, bookmarks, fullscreen, light/dark theme
- Books, covers, reading position and preferences are stored in IndexedDB — nothing leaves the browser
