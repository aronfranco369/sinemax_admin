# LLM Prompt — Generate SINEMAX Mock Media JSON (Import & Approve format)

Copy everything below the line into the LLM. Adjust the count in the first sentence as needed.

---

Generate mock catalog data for a  movie/series streaming admin panel: **50 titles**, roughly half movies and half series. Follow the schema below exactly — every rule you need is in the `//` comments. Output ONLY the final JSON (no markdown fences, no explanations), valid and parseable, in this shape:

```jsonc
{
  "version": 1,
  "media": [                       // array with one object per title
    {
      "title": "",                 // REQUIRED. Real or plausible movie/series name from the title's country (use well-known international and local titles). No duplicate titles within the output.
      "type": "",                  // REQUIRED. Exactly "movie" or "series" — nothing else. ~50/50 mix overall.
      "description": "",           // 3–5 sentence synopsis written in SWAHILI, e
      "poster_url": "",            // "https://nawgqawbwmfvhywfvoke.supabase.co/storage/v1/object/public/posters/posterN.jpg" where N is 1–20. Cycle through all 20 so each is used roughly evenly.
      "country": "",               // Exactly one of: "tanzania", "india", "south_korea", "turkey", "usa" (lowercase, underscore). Spread titles across ALL five; title/description must be culturally plausible for the country.
      "year": 2020,                // Integer release year, 2013–2026, spread across decades but weighted toward 2021–2026.
      "dj": "",                    // Narrator name WITHOUT the "DJ " prefix (the app adds it). Pick from: Afro, Ally, Banza, Black, Carlos, Choka, J4, Juma Khan, Kingononga, Lufufu, Mack, Master, Murphy, Nasso, Six Fingers, Skills, Smart, Tino, Uncle, Young Money.
      "genres": [],                // 1–3 strings, ONLY from: Action, Adventure, Biography, Comedy, Crime, Drama, Family, Fantasy, History, Horror, Musical, Mystery, Romance, Sci-Fi, Sport, Thriller, War. Cover a wide spread overall.
      "tags": [],                  // 0–3 strings, ONLY from: award winning, based on true story, binge worthy, blockbuster, classic, critically acclaimed, cult classic, dark, fan favorite, feel good, hidden gem, mind blowing, must watch, new release, overrated, popular, throwback, top rated, trending, underrated.
      "created_at": "",            // ISO timestamp, e.g. "2025-11-03T14:22:07Z". EVERY title must have a DIFFERENT value — spread randomly between 2025-06 and 2026-06 with random times of day (this is mock data; varied dates matter).
      "view_count": 0,             // Integer 0–500, varied: many titles low, a few very popular.
      "download_count": 0,         // Integer, always less than or equal to view_count.
      "files": [                   // REQUIRED. Movies: usually 1 entry, but ~1 in 4 movies is split into 2–5 PARTS (one entry per part). Series: 1–2 seasons with 4–12 episodes per season, one entry per episode — and ~1 in 5 series has ONE episode split into 2 parts (two entries for that episode).
        {
          "label": "",             // REQUIRED. Movie single file: "Full Movie". Movie with parts: "<Title> - Part 1", "<Title> - Part 2", … (or Part A/B). Series episode: "Episode N - <short episode title>". Series episode split into parts: "Episode N - Part A" and "Episode N - Part B".
          "season": null,          // Movies: MUST be null on every entry, parts included (the importer rejects anything else). Series: integer season number starting at 1; parts of the same episode share the same season.
          "episode_number": 1,     // Movies: 1; for a movie split into parts it INCREASES per part (Part 1 → 1, Part 2 → 2, …). Series: REQUIRED integer, episode number within its season starting at 1; parts of the SAME episode SHARE the same episode_number (only the label's Part A/B differs).
          "download_url": ""       // ALWAYS exactly "https://www.w3schools.com/html/mov_bbb.mp4" — the single mock video URL for every file.
        }
      ]
    }
  ]
}
```
