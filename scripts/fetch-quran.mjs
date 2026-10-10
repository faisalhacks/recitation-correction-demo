import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data', 'quran');

const API_BASE = 'https://api.quran.com/api/v4';
const DELAY_MS = 500; // Polite delay between requests

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchChapters() {
  console.log('Fetching chapters metadata...');
  const data = await fetchJSON(`${API_BASE}/chapters`);
  return data.chapters;
}

async function fetchVersesByChapter(chapterId, limit = null) {
  const verses = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/verses/by_chapter/${chapterId}?words=true&word_fields=text_uthmani&per_page=300&page=${page}`;
    console.log(`Fetching surah ${chapterId} page ${page}...`);

    const data = await fetchJSON(url);
    const pageVerses = data.verses || [];

    // Filter to only include verses up to limit if specified
    if (limit) {
      const filtered = pageVerses.filter(v => v.verse_number <= limit);
      verses.push(...filtered);
      if (filtered.length < pageVerses.length) {
        break; // Reached the limit
      }
    } else {
      verses.push(...pageVerses);
    }

    totalPages = data.pagination.total_pages;
    page++;

    if (page <= totalPages) {
      await delay(DELAY_MS);
    }
  }

  return verses;
}

function extractWords(words) {
  // Keep only words where char_type_name === "word", extract text_uthmani
  return words
    .filter(w => w.char_type_name === 'word')
    .map(w => w.text_uthmani);
}

async function main() {
  try {
    const chapters = await fetchChapters();
    await delay(DELAY_MS);

    const surahsToFetch = [
      { id: 1, limit: null },  // All ayahs
      { id: 2, limit: 20 },    // Ayahs 1-20 only
      ...Array.from({ length: 37 }, (_, i) => ({ id: 78 + i, limit: null })) // Surahs 78-114
    ];

    const cachedSurahs = [];

    for (const surahConfig of surahsToFetch) {
      const surahId = surahConfig.id;
      const limit = surahConfig.limit;

      const chapter = chapters.find(c => c.id === surahId);
      if (!chapter) {
        console.error(`Chapter ${surahId} not found`);
        continue;
      }

      const verses = await fetchVersesByChapter(surahId, limit);

      const ayahs = verses.map(verse => ({
        ayah: verse.verse_number,
        words: extractWords(verse.words)
      }));

      const cachedFrom = 1;
      const cachedTo = limit || chapter.verses_count;

      const surahData = {
        surah: surahId,
        nameSimple: chapter.name_simple,
        nameArabic: chapter.name_arabic,
        ayahCount: chapter.verses_count,
        cachedFrom: cachedFrom,
        cachedTo: cachedTo,
        source: 'Quran.com API v4 (text_uthmani)',
        fetchedAt: new Date().toISOString(),
        ayahs: ayahs
      };

      const fileName = path.join(dataDir, `surah-${String(surahId).padStart(3, '0')}.json`);
      fs.writeFileSync(fileName, JSON.stringify(surahData, null, 2));
      console.log(`Saved ${fileName}`);

      cachedSurahs.push({
        surah: surahId,
        nameSimple: chapter.name_simple,
        nameArabic: chapter.name_arabic,
        ayahCount: chapter.verses_count,
        cachedFrom: cachedFrom,
        cachedTo: cachedTo
      });

      if (surahConfig !== surahsToFetch[surahsToFetch.length - 1]) {
        await delay(DELAY_MS);
      }
    }

    // Write index.json
    const indexData = {
      source: 'Quran.com API v4 (text_uthmani)',
      sourceUrl: 'https://api.quran.com/api/v4',
      fetchedAt: new Date().toISOString(),
      surahs: cachedSurahs
    };

    const indexFile = path.join(dataDir, 'index.json');
    fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));
    console.log(`Saved ${indexFile}`);

    console.log('\nFetch completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
