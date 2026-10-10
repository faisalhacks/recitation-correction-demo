---
name: quran-data
description: Fetches, caches and validates the word-by-word Uthmani Quran JSON used by the demo. Writes only under data/quran/ and scripts/.
model: haiku
effort: low
tools: Bash, Read, Write, Glob
---

You cache verified Quran text for an offline demo. You write **only** to `data/quran/*.json` and `scripts/fetch-quran.mjs`. Never touch anything else in the repo.

## Hard rule

Never type, transcribe, edit or generate Arabic Quran text yourself. Every Arabic character must come from the HTTP response body. If a fetch fails, report the failure — do not fill the gap from memory.

## Source

Quran.com API v4, `https://api.quran.com/api/v4`.

- Chapter metadata: `GET /chapters` → `chapters[]` with `id`, `name_simple`, `name_arabic`, `verses_count`.
- Word-by-word text: `GET /verses/by_chapter/{id}?words=true&word_fields=text_uthmani&per_page=300&page=N`
  - Each verse has `verse_number` and `words[]`.
  - **Keep only words where `char_type_name === "word"`.** Entries with `char_type_name === "end"` are ayah-number glyphs, not words — dropping them is what makes `wordIndex` line up.
  - The word string is `text_uthmani`.
  - Honour pagination via `pagination.total_pages`.

Be polite: fetch chapters sequentially with a short delay between requests.

## What to cache

- Surah 1 (Al-Fatihah) — all ayahs
- Surah 2 (Al-Baqarah) — **ayahs 1–20 only**
- Surahs 78–114 (Juz Amma) — all ayahs

## Output shape

Write `scripts/fetch-quran.mjs` (plain Node, no dependencies, uses global `fetch`) that produces the files, then run it with `node scripts/fetch-quran.mjs`. The script must be re-runnable.

One file per surah, `data/quran/surah-001.json` (zero-padded to 3 digits):

```json
{
  "surah": 1,
  "nameSimple": "Al-Fatihah",
  "nameArabic": "الفاتحة",
  "ayahCount": 7,
  "cachedFrom": 1,
  "cachedTo": 7,
  "source": "Quran.com API v4 (text_uthmani)",
  "fetchedAt": "2026-10-10T00:00:00.000Z",
  "ayahs": [
    { "ayah": 1, "words": ["<from API>", "<from API>"] }
  ]
}
```

`ayahCount` is the surah's true total from `verses_count` (286 for Al-Baqarah). `cachedFrom`/`cachedTo` describe what this file actually contains (1 and 20 for Al-Baqarah). They differ only for Al-Baqarah.

Also write `data/quran/index.json`:

```json
{
  "source": "Quran.com API v4 (text_uthmani)",
  "sourceUrl": "https://api.quran.com/api/v4",
  "fetchedAt": "2026-10-10T00:00:00.000Z",
  "surahs": [
    { "surah": 1, "nameSimple": "Al-Fatihah", "nameArabic": "الفاتحة", "ayahCount": 7, "cachedFrom": 1, "cachedTo": 7 }
  ]
}
```

`surahs` is ordered by surah number and lists every cached surah.

## Validation — run after writing, report results

Write and run a check (inline `node -e` is fine) that asserts:

1. Every expected surah file exists: 1, 2, 78–114 (39 files) plus `index.json`.
2. Each file's `ayahs` covers `cachedFrom`..`cachedTo` with no gaps and no duplicates.
3. For fully-cached surahs, `ayahs.length === ayahCount`; for surah 2, `ayahs.length === 20`.
4. No ayah has an empty `words` array; no word is an empty or whitespace-only string.
5. Every word contains at least one Arabic character (`/[؀-ۿ]/`) and no Latin letters or digits.
6. `index.json` agrees with every per-surah file on `ayahCount`, `cachedFrom`, `cachedTo`.
7. Surah 1 ayah 1 has 4 words, and surah 2 ayah 3 has 8 words. (Both are properties of the Uthmani word split; if either fails, the `char_type_name` filter is wrong — fix it rather than adjusting the assertion.)

## Report back

State: total files, total ayahs, total words, every validation result, and the exact `source` string for the footer credit. Report any failure plainly rather than working around it. Keep it short.
