/**
 * Read-only access to the cached Uthmani text in `data/quran/`.
 *
 * Owned by the main session. Screens may import this freely — it holds no
 * mutable state. The Arabic itself is fetched by `scripts/fetch-quran.mjs`
 * from Quran.com API v4; nothing here generates or edits Arabic text.
 *
 * `wordIndex` is 1-BASED throughout the demo, matching the API's own `position`
 * field and the sample mark event in BUILD_BRIEF.md section 11 (2:3 wordIndex 4
 * is وَيُقِيمُونَ, the amber Tajwid word in the teacher mockup).
 */

import indexJson from "@/data/quran/index.json";
import s001 from "@/data/quran/surah-001.json";
import s002 from "@/data/quran/surah-002.json";
import s078 from "@/data/quran/surah-078.json";
import s079 from "@/data/quran/surah-079.json";
import s080 from "@/data/quran/surah-080.json";
import s081 from "@/data/quran/surah-081.json";
import s082 from "@/data/quran/surah-082.json";
import s083 from "@/data/quran/surah-083.json";
import s084 from "@/data/quran/surah-084.json";
import s085 from "@/data/quran/surah-085.json";
import s086 from "@/data/quran/surah-086.json";
import s087 from "@/data/quran/surah-087.json";
import s088 from "@/data/quran/surah-088.json";
import s089 from "@/data/quran/surah-089.json";
import s090 from "@/data/quran/surah-090.json";
import s091 from "@/data/quran/surah-091.json";
import s092 from "@/data/quran/surah-092.json";
import s093 from "@/data/quran/surah-093.json";
import s094 from "@/data/quran/surah-094.json";
import s095 from "@/data/quran/surah-095.json";
import s096 from "@/data/quran/surah-096.json";
import s097 from "@/data/quran/surah-097.json";
import s098 from "@/data/quran/surah-098.json";
import s099 from "@/data/quran/surah-099.json";
import s100 from "@/data/quran/surah-100.json";
import s101 from "@/data/quran/surah-101.json";
import s102 from "@/data/quran/surah-102.json";
import s103 from "@/data/quran/surah-103.json";
import s104 from "@/data/quran/surah-104.json";
import s105 from "@/data/quran/surah-105.json";
import s106 from "@/data/quran/surah-106.json";
import s107 from "@/data/quran/surah-107.json";
import s108 from "@/data/quran/surah-108.json";
import s109 from "@/data/quran/surah-109.json";
import s110 from "@/data/quran/surah-110.json";
import s111 from "@/data/quran/surah-111.json";
import s112 from "@/data/quran/surah-112.json";
import s113 from "@/data/quran/surah-113.json";
import s114 from "@/data/quran/surah-114.json";

export type Ayah = {
  ayah: number;
  words: string[];
};

export type SurahMeta = {
  surah: number;
  nameSimple: string;
  nameArabic: string;
  /** The surah's true ayah count (286 for Al-Baqarah). */
  ayahCount: number;
  /** First ayah actually cached in this demo. */
  cachedFrom: number;
  /** Last ayah actually cached in this demo. */
  cachedTo: number;
};

type SurahFile = SurahMeta & {
  source: string;
  fetchedAt: string;
  ayahs: Ayah[];
};

const FILES: Record<number, SurahFile> = {
  1: s001,
  2: s002,
  78: s078,
  79: s079,
  80: s080,
  81: s081,
  82: s082,
  83: s083,
  84: s084,
  85: s085,
  86: s086,
  87: s087,
  88: s088,
  89: s089,
  90: s090,
  91: s091,
  92: s092,
  93: s093,
  94: s094,
  95: s095,
  96: s096,
  97: s097,
  98: s098,
  99: s099,
  100: s100,
  101: s101,
  102: s102,
  103: s103,
  104: s104,
  105: s105,
  106: s106,
  107: s107,
  108: s108,
  109: s109,
  110: s110,
  111: s111,
  112: s112,
  113: s113,
  114: s114,
};

export const QURAN_SOURCE: string = indexJson.source;
export const QURAN_SOURCE_URL: string = indexJson.sourceUrl;

const LIST: SurahMeta[] = indexJson.surahs
  .map((s) => ({
    surah: s.surah,
    nameSimple: s.nameSimple,
    nameArabic: s.nameArabic,
    ayahCount: s.ayahCount,
    cachedFrom: s.cachedFrom,
    cachedTo: s.cachedTo,
  }))
  .sort((a, b) => a.surah - b.surah);

/** Every surah cached in this demo, in order. The picker lists only these. */
export function surahList(): SurahMeta[] {
  return LIST;
}

export function getSurahMeta(surah: number): SurahMeta | null {
  return LIST.find((s) => s.surah === surah) ?? null;
}

/** True when only part of the surah is cached (Al-Baqarah 1–20). */
export function isPartiallyCached(surah: number): boolean {
  const m = getSurahMeta(surah);
  return m ? m.cachedTo - m.cachedFrom + 1 < m.ayahCount : false;
}

export function getAyah(surah: number, ayah: number): Ayah | null {
  return FILES[surah]?.ayahs.find((a) => a.ayah === ayah) ?? null;
}

/** Ayahs `from`..`to` inclusive. Out-of-range values are clamped, not thrown. */
export function getAyahs(surah: number, from: number, to: number): Ayah[] {
  const file = FILES[surah];
  if (!file) return [];
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  return file.ayahs.filter((a) => a.ayah >= lo && a.ayah <= hi);
}

/**
 * Keep a range inside what is actually cached, with `from <= to`.
 * The picker calls this on every change so the steppers can never produce a
 * range the demo has no text for.
 */
export function clampRange(
  surah: number,
  from: number,
  to: number,
): { from: number; to: number } {
  const m = getSurahMeta(surah);
  if (!m) return { from, to };
  const lo = Math.min(Math.max(from, m.cachedFrom), m.cachedTo);
  const hi = Math.min(Math.max(to, m.cachedFrom), m.cachedTo);
  return hi < lo ? { from: lo, to: lo } : { from: lo, to: hi };
}

/** A word in a specific place, for rendering and for mark lookups. */
export type PositionedWord = {
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  text: string;
};

export function getWords(
  surah: number,
  from: number,
  to: number,
): PositionedWord[] {
  const out: PositionedWord[] = [];
  for (const a of getAyahs(surah, from, to)) {
    a.words.forEach((text, i) => {
      out.push({ surah, ayah: a.ayah, wordIndex: i + 1, text });
    });
  }
  return out;
}

export function countWords(surah: number, from: number, to: number): number {
  return getAyahs(surah, from, to).reduce((n, a) => n + a.words.length, 0);
}

export function countAyahs(surah: number, from: number, to: number): number {
  return getAyahs(surah, from, to).length;
}

export function getWordText(
  surah: number,
  ayah: number,
  wordIndex: number,
): string | null {
  return getAyah(surah, ayah)?.words[wordIndex - 1] ?? null;
}

/** "Al-Baqarah 2:3 – 2:5", or "Al-Baqarah 2:3" for a single ayah. */
export function formatRange(surah: number, from: number, to: number): string {
  const name = getSurahMeta(surah)?.nameSimple ?? `Surah ${surah}`;
  return from === to
    ? `${name} ${surah}:${from}`
    : `${name} ${surah}:${from} – ${surah}:${to}`;
}

/** "2:3 – 2:5" without the surah name, for tight chips. */
export function formatRangeShort(
  surah: number,
  from: number,
  to: number,
): string {
  return from === to
    ? `${surah}:${from}`
    : `${surah}:${from} – ${surah}:${to}`;
}
