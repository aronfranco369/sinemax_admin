# SINEMAX Admin

Admin web app for the SINEMAX catalog — manage movies, series, episodes/files and engagement, with a bulk **Import & Approve** workflow. Built with Next.js (App Router) and backed by the **kitabu** Supabase project (`media` + `files` tables) instead of mock data.

## Pages

| Route | Page |
| --- | --- |
| `/` | Dashboard — stat cards + engagement chart & sortable table |
| `/library` | Media Library — search, filters, sorting, bulk delete |
| `/add` | Add New Media — type-first form, title autocomplete, files/episodes editor, live poster & video previews |
| `/edit/[id]` | Edit Media — same form, prefilled |
| `/import` | Import & Approve — drop/paste bulk JSON, validate into a pending queue (localStorage), inspect/edit, then approve to upload into Supabase |
| `/config` | Configuration — backend info, preferences, catalog reload |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase

The app talks to the `media` and `files` tables of the kitabu project. The project URL and publishable (anon) key are baked in as fallbacks in `lib/supabaseClient.js`; override them with env vars if needed:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`lib/catalog.jsx` loads both tables into memory once and exposes the synchronous read API the UI uses, plus async mutations that write through to Supabase and patch the cache.

> **Security note:** Row Level Security is currently **disabled** on `public.media` and `public.files`, so anyone with the anon key can read/write them. Before going to production, enable RLS and add policies (e.g. restrict writes to authenticated admins).

## Bulk import format

```json
{
  "version": 1,
  "media": [
    {
      "title": "Mlima wa Moto",
      "type": "movie",
      "description": "…",
      "poster_url": "https://…/poster.jpg",
      "country": "Tanzania",
      "year": 2026,
      "dj": "Afro",
      "genres": ["Action"],
      "tags": ["new-release"],
      "files": [
        { "label": "Full Movie", "season": null, "episode_number": 1, "download_url": "https://…/movie.mp4" }
      ]
    }
  ]
}
```

Valid items join the pending queue; nothing touches the catalog until approved. Approving an item whose title already exists merges only the new episodes/parts (duplicates are skipped).
