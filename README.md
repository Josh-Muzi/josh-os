# JoshOS

A Windows 95-style desktop that happens to be my portfolio.

**Live:** coming soon

Click around: desktop icons open draggable, resizable windows about me —
About (a working Notepad), Projects, Experience, Skills, Resume (with PDF
download), and Contact. Don't forget the Compost Bin.

## How it works

- **Desktop mode** (wide screens with a pointer): a custom window manager —
  a React Context + `useReducer` store handling open/close/focus/z-order/
  minimize/maximize, with de-duplication (re-opening an app focuses its
  window) and cascade placement. Windows drag and resize via `react-rnd`;
  desktop icons are draggable too and reset home on refresh. The chrome is
  hand-built and modern — the retro lives in the metaphor and the
  hand-drawn pixel icons, not in beveled borders.
- **Boring mode** (phones and small screens): a fast, accessible
  single-page site rendered from the same content. The entire desktop
  bundle — window manager, react-rnd — is lazy-loaded only when desktop
  mode engages, so mobile visitors never download it. Desktop mode also
  adapts to phones: windows become full-screen sheets.
- **Content as data**: bio, experience, projects, and skills live in typed
  modules under `src/content/` and feed both experiences.
- **Pixel icons**: hand-drawn 16x16 SVGs (`src/components/desktop/icons.tsx`),
  one shared palette, every icon carrying exactly one green accent.

## Run it locally

```bash
pnpm install
pnpm dev
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · react-rnd ·
Biome · pnpm · Vercel

## Credits

- [react-rnd](https://github.com/bokuweb/react-rnd) (MIT) — drag/resize
- Desktop concept inspired by [posthog.com](https://posthog.com); all code
  here is original.

---

Josh Muzi · [jmuzi04@gmail.com](mailto:jmuzi04@gmail.com) ·
[GitHub](https://github.com/TinyXIV) ·
[LinkedIn](https://www.linkedin.com/in/joshua-muzi-707386b2)
