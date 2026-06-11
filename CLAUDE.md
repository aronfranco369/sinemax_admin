# SINEMAX Admin — Codebase Map

Next.js 15 (App Router, plain JSX, no TypeScript) admin panel for a movie/series catalog backed by Supabase. React 19, supabase-js v2. No test suite, no linter configured.

**Workflow rules for Claude:**
- For small changes: read this file + only the target file(s). Do NOT sweep the whole codebase.
- Do NOT test/run/verify changes (no dev server, no scripts, no DB probing). The user tests manually and gives feedback.

## Pages (app/)
| Route | File | What it is |
|---|---|---|
| `/` | `app/page.jsx` | Dashboard: stat cards, engagement bar chart, sortable "All Titles by Engagement" table |
| `/library` | `app/library/page.jsx` | Media Library: search/filter/sort table, row + bulk delete, edit links |
| `/add` | `app/add/page.jsx` | Thin wrapper around `<MediaForm />` |
| `/edit/[id]` | `app/edit/[id]/page.jsx` | Wrapper around `<MediaForm mediaId={id} />` |
| `/import` | `app/import/page.jsx` | Import & Approve queue (uses `import-drawer.jsx` + `lib/import-queue.js`). Sortable column headers (own `SortTh`, same pattern as Dashboard); rows + drawer have a Delete button that removes from the queue immediately (no confirm modal) |
| `/config` | `app/config/page.jsx` | Settings: Supabase info, preference toggles (local state only, not persisted), reload catalog |

`app/layout.jsx` wraps everything in `<AppShell>`.

## Components
- `components/shell.jsx` — **AppShell**: Sidebar, Topbar, breadcrumb, the global `useApp()` context exposing `{ navigate, requestDelete, requestBulkDelete, beginUpload }`. Delete confirmation modals and the fake-progress upload overlay live here. Routing keys: dashboard/library/add/edit/import/config (NAV array).
- `components/media-form.jsx` — Add/Edit form. Contains `FieldSelect` (combobox), `FieldMultiSelect` (chips), `TitleAutocomplete` (dedupe by picking existing title), `FilesEditor` (movie parts / series seasons+episodes), `ImagePreview`/`VideoPreview`. `save()` validates required fields then writes media + files via catalog inside `beginUpload`. (Draft/localStorage functionality was removed 2026-06-11.)
- `components/import-drawer.jsx` — detail/edit drawer for import-queue items ("Save to pending"; its `draft` state is just an in-place edit buffer, unrelated to any draft feature).
- `components/ui.jsx` — shared primitives: `TableWrap` (table scroll container + sticky horizontal slider inside the card, synced both ways; used by Dashboard + Library tables), `Btn`, `IconBtn`, `Poster` (gradient placeholder), `Badge`/`TypeBadge`, `Field`, `TextInput`, `SearchInput`, `DropdownChip`, `TagInput`, `Segmented`, `PillTabs`, `ToastProvider`/`useToast`, `Overlay` (modal shell), `SectionDivider`, formatters (`fmtNum`, `fmtDate`, `djLabel`, `hexA`).
- `components/icons.jsx` — inline SVG icon set, exported as `Icons.<name>`.

## Data layer (lib/)
- `lib/supabaseClient.js` — Supabase client. Project **"kitabu"** (`nawgqawbwmfvhywfvoke`), publishable key hardcoded as fallback; `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` override.
- `lib/catalog.jsx` — `CatalogProvider` / `useCatalog()`. Loads `media` + `files` tables fully into memory (paged past the 1000-row PostgREST cap), exposes synchronous reads (`listMedia`, `getMedia`, `listFiles`, `filesCount`, `stats`, `distinct`, `distinctArray`) and async mutations (`insertMedia`, `updateMedia`, `deleteMedia`, `deleteManyMedia`, `insertFile`, `updateFile`, `deleteFile`) that write to Supabase then patch the local cache. IDs generated client-side (`crypto.randomUUID`).
- `lib/import-queue.js` — localStorage pending queue + JSON validation for the import/approve flow. Accepted JSON: `{ version, media: [...] }`; items support optional `created_at` (ISO string, passed through to Supabase on approve), `view_count`, `download_count`. `insertMedia`/`insertFile` in catalog.jsx honor a supplied `created_at`. Merge dedupe key is `season:episode_number:label` so multi-part episodes/movies merge correctly.

## Database (Supabase)
- Tables: `media` (title, description, type movie|series, year, country, dj, genres[], tags[], poster_url, view_count, download_count, timestamps) and `files` (media_id FK → media **ON DELETE CASCADE**, label, season, episode_number, download_url).
- RLS is **disabled** on both tables; anon role has full CRUD grants.

## Styling
Everything is in `app/globals.css` (CSS variables: `--blue`, `--panel`, `--line`, `--muted`, etc.). Sections in order: tokens, buttons (~L210), cards, forms, tables (~L415 — `.table-wrap` scrolls horizontally with hidden native scrollbar; `table.tbl` has `min-width: 1080px`; `.hscroll-sticky` is the slider, sticky to viewport bottom within the card), modals/overlays (~L552), media-form specifics, charts. Inline `style={{}}` used freely for one-offs. `.fade-in` (page entrance, ~L735) must NOT use a persistent fill mode (`both`/`forwards`) on its transform animation — that makes the page div the containing block for `position: fixed`, breaking `Overlay`-based modals rendered inside pages (e.g. import approve dialogs).

## Misc
- `mock-data-prompt.md` — ready-made LLM prompt that generates Import & Approve-compatible JSON (commented schema; 20 fixed poster URLs, single mov_bbb.mp4 download URL, Swahili descriptions, varied created_at).

## Conventions
- All components are `'use client'`.
- No API routes — the browser talks to Supabase directly.
- User feedback via `useToast()` (`'success' | 'info' | 'err'`).
- Destructive actions go through shell modals (`requestDelete` / `requestBulkDelete`), never delete inline.
