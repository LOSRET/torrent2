# AGENTS.md

Compact guide for OpenCode sessions working in this repo. High-signal, repo-specific facts only.

## What this is

Pure client-side BitTorrent `.torrent` / magnet parser (Vue 3 + TS + Vite + Tailwind v4). All parsing runs in the browser; **no backend, no API calls** (the only external script is analytics hardcoded in `index.html`). Do not add server or network code.

Deployed to Cloudflare Pages via Wrangler (`wrangler.jsonc`, worker name `torrents`, assets dir `./dist`, `nodejs_compat` flag, compat date `2026-06-09`).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — **this is the only verification step**. Runs `vue-tsc -b` (typecheck across project references) then `vite build`. No tests, no lint, no format script exist.
- Typecheck only: `npx vue-tsc -b`
- Deploy: `npm run build && npx wrangler deploy` (wrangler is NOT in devDependencies — invoke via `npx`)

Fix all type errors before declaring done; the build will fail otherwise.

## TypeScript constraints

Both `tsconfig.app.json` and `tsconfig.node.json` enable `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Consequences an agent commonly gets wrong:

- **No enums, no parameter properties, no runtime namespaces** (`erasableSyntaxOnly`). Use `as const` objects or plain classes with explicit field declarations.
- Unused imports/vars/params fail the build. Prefix intentionally-unused params with `_`.
- Project references: `tsconfig.app.json` covers `src/**`, `tsconfig.node.json` covers `vite.config.ts`. Don't add a single tsconfig; extend the right one.

Toolchain is very recent (TypeScript ~6, Vite ^8, vue-tsc ^3, @vitejs/plugin-vue ^6) — don't assume older syntaxes/defaults.

## Tailwind v4 (no config file)

Styling uses **Tailwind v4 via `@tailwindcss/vite`** — there is no `tailwind.config.js`. Theme tokens are defined in `src/style.css` with `@theme { ... }` backed by CSS variables, with dark mode via `prefers-color-scheme`.

Use the **semantic token classes**, not raw Tailwind palette colors:

`bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `text-text`, `text-text-muted`, `text-accent`, `bg-accent`, `bg-accent-bright`, `text-success`, `text-warning`, `text-danger`

Add new colors by extending the CSS variables in `src/style.css` (`:root` + `@media (prefers-color-scheme: dark)`), then mapping them in `@theme`.

## Architecture

- `src/main.ts` → `createApp(App).mount('#app')`
- `src/App.vue` — root; renders a view-state machine (`idle | loading | error | results`) driven by the `useTorrentParser` composable.
- `src/composables/useTorrentParser.ts` — the state machine. `parseFiles(files)` accepts **only `.torrent` files** (filters by extension). `parseMagnet(text)` / `handleInput(text)` handle magnet URIs. `results` is an array (batch upload); `activeIndex` tracks the selected tab.
- `src/lib/` — core parsing logic (framework-agnostic, no Vue):
  - `bencode.ts` — `BencodeDecoder`, `bdecode()`, `bytesToHex()`, `BencodeDecodeError`.
  - `torrent-file.ts` — `TorrentFile` class. Info hashes are **async** (`crypto.subtle` SHA-1 / SHA-256); `infoHashV1()`/`infoHashV2()` are called by the composable and injected back into the `ParsedTorrent` dict. Supports BitTorrent v1, v2, and hybrid.
  - `magnet.ts` — `MagnetLink` class, `isMagnetLink()`, `base32ToHex()`. Supports `urn:btih` (hex or base32) and `urn:btmh:1220` (sha2-256).
  - `types.ts` — `ParsedTorrent` (the canonical parsed shape), `BencodeValue`, `BencodeDict`.
  - `format.ts` — formatting helpers.
- `src/components/` — presentational SFCs. `ResultsSection.vue` orchestrates the sub-panels (TorrentInfo, FileTable, TrackerList, BencodeTree, etc.).

### Bencode dict quirk (important)

`BencodeDecoder._decodeDict` attaches a **non-enumerable `__keyBytes`** property to each `BencodeDict` holding the raw key bytes. `TorrentFile.pieceLayers` reads `(dict as any).__keyBytes[key]` to recompute v2 piece-layer keys as hex. If you `structuredClone` / `JSON.stringify` / spread a decoded dict, you lose `__keyBytes` and v2 piece-layer keys will be wrong. Preserve the original decoded dict when you need raw key bytes.

## Conventions

- UI copy is **Chinese (zh-CN)** — keep user-facing strings in Chinese; identifiers/comments in English.
- SFCs use `<script setup lang="ts">`.
- `public/` (`_headers`, `robots.txt`, `sitemap.xml`, `favicon.svg`, `icons.svg`) is copied verbatim to `dist` — Cloudflare Pages static files. Edit directly, no build step.
- `index.html` carries SEO/structured data and the analytics script; preserve it when editing.
- No tests exist; if you add parsing logic to `src/lib/`, keep it pure (no DOM/Vue imports) so it stays unit-testable.
