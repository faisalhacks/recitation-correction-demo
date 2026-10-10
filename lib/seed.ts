/**
 * The demo's starting log.
 *
 * OWNED BY THE MAIN SESSION. Imports from `eventLog.ts` only — never the other
 * way around, so there is no import cycle.
 *
 * Two jobs:
 *   1. Put Ustadh Demo's halaqah in a state that looks alive from either role:
 *      three students already waiting with a lesson queued (BUILD_BRIEF.md §18).
 *   2. Give Progress real history on first load, as three completed turns for
 *      a seeded student. These are ordinary events — nothing about Progress is
 *      hardcoded — and every turn they produce is flagged `seeded: true` so the
 *      UI can say so.
 *
 * Seed event ids are deterministic (`seed_###`) so that "Reset demo data"
 * restores exactly this state, and so `deriveState` can tell seeded turns from
 * live ones.
 */

import {
  type AyahRange,
  type DemoEvent,
  type MistakeType,
  type RecitationType,
  makeEvent,
} from "./eventLog";
import { getWords } from "./quran";

export const SEED_STUDENTS = {
  b: { id: "student_b", name: "Student B" },
  c: { id: "student_c", name: "Student C" },
  d: { id: "student_d", name: "Student D" },
} as const;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

let seq = 0;
const seedId = (): string => `seed_${String(++seq).padStart(3, "0")}`;
const at = (base: number, offsetMs: number): string =>
  new Date(base + offsetMs).toISOString();

/**
 * Deterministically pick `n` real word positions spread across a range.
 * Reading them out of the cached text means a seeded mark can never point at a
 * word that does not exist.
 */
function pickWords(
  range: AyahRange,
  n: number,
): { ayah: number; wordIndex: number }[] {
  const words = getWords(range.surah, range.from, range.to);
  if (words.length === 0) return [];
  const step = Math.max(1, Math.floor(words.length / (n + 1)));
  const out: { ayah: number; wordIndex: number }[] = [];
  for (let i = 1; i <= n; i += 1) {
    const w = words[Math.min(i * step, words.length - 1)];
    out.push({ ayah: w.ayah, wordIndex: w.wordIndex });
  }
  return out;
}

type SeedTurn = {
  range: AyahRange;
  recType: RecitationType;
  /** Days before now that this turn took place. */
  daysAgo: number;
  marks: { type: MistakeType; note: string }[];
};

/**
 * Student B's history. The mistake count falls across the three turns, which is
 * what makes the Progress trend worth looking at — and it is labeled as sample
 * data wherever it is shown.
 */
const HISTORY: SeedTurn[] = [
  {
    range: { surah: 78, from: 1, to: 5 },
    recType: "sabaq",
    daysAgo: 7,
    marks: [
      { type: "tajwid", note: "Ghunnah held too short" },
      { type: "makhraj", note: "" },
      { type: "tajwid", note: "Madd needs two counts" },
      { type: "harakah", note: "" },
      { type: "missed", note: "Skipped on the first pass" },
    ],
  },
  {
    range: { surah: 87, from: 1, to: 7 },
    recType: "sabaq",
    daysAgo: 4,
    marks: [
      { type: "tajwid", note: "Qalqalah too light" },
      { type: "harakah", note: "" },
      { type: "makhraj", note: "Letter formed too far forward" },
    ],
  },
  {
    range: { surah: 93, from: 1, to: 11 },
    recType: "sabqi",
    daysAgo: 2,
    marks: [
      { type: "tajwid", note: "" },
      { type: "hesitation", note: "Paused mid-ayah" },
    ],
  },
];

/** Who is waiting when the demo opens. All three have a lesson queued. */
const WAITING: {
  student: { id: string; name: string };
  range: AyahRange;
  recType: RecitationType;
}[] = [
  {
    student: SEED_STUDENTS.b,
    range: { surah: 2, from: 1, to: 5 },
    recType: "sabaq",
  },
  {
    student: SEED_STUDENTS.c,
    range: { surah: 1, from: 1, to: 7 },
    recType: "sabaq",
  },
  {
    student: SEED_STUDENTS.d,
    range: { surah: 91, from: 1, to: 8 },
    recType: "sabaq",
  },
];

export function buildSeedEvents(now: number = Date.now()): DemoEvent[] {
  seq = 0;
  const events: DemoEvent[] = [];
  const { id: studentId, name } = SEED_STUDENTS.b;

  // --- history: three completed turns for Student B --------------------------
  for (const turn of HISTORY) {
    const base = now - turn.daysAgo * DAY;
    const positions = pickWords(turn.range, turn.marks.length);

    events.push(
      makeEvent({
        kind: "queue_join",
        studentId,
        name,
        range: turn.range,
        recType: turn.recType,
        id: seedId(),
        timestamp: at(base, 0),
      }),
      makeEvent({
        kind: "turn_start",
        studentId,
        id: seedId(),
        timestamp: at(base, 2 * MINUTE),
      }),
    );

    turn.marks.forEach((mark, i) => {
      const pos = positions[i];
      if (!pos) return;
      events.push(
        makeEvent({
          kind: "mark",
          studentId,
          surah: turn.range.surah,
          ayah: pos.ayah,
          wordIndex: pos.wordIndex,
          type: mark.type,
          note: mark.note,
          action: "add",
          id: seedId(),
          timestamp: at(base, (3 + i) * MINUTE),
        }),
      );
    });

    events.push(
      makeEvent({
        kind: "turn_finish",
        studentId,
        id: seedId(),
        timestamp: at(base, (4 + turn.marks.length) * MINUTE),
      }),
    );
  }

  // --- today: the three students waiting in the halaqah ----------------------
  WAITING.forEach((w, i) => {
    events.push(
      makeEvent({
        kind: "queue_join",
        studentId: w.student.id,
        name: w.student.name,
        range: w.range,
        recType: w.recType,
        id: seedId(),
        timestamp: at(now, (-10 + i) * MINUTE),
      }),
    );
  });

  return events;
}
