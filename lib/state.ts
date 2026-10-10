/**
 * Folds the append-only log into the current state.
 *
 * OWNED BY THE MAIN SESSION. Screen components must never import this file —
 * they read through `useSessionState()`. See BUILD_BRIEF.md §12.
 *
 * Every value here is derived. Nothing is cached between calls and nothing is
 * written back, so a given log always produces the same state in every tab.
 */

import {
  type AyahRange,
  type DemoEvent,
  type MistakeType,
  type RecitationType,
  MISTAKE_TYPES,
} from "./eventLog";
import { countAyahs, countWords } from "./quran";

export type QueueStatus = "waiting" | "reciting" | "done";

export type QueueEntry = {
  studentId: string;
  name: string;
  range: AyahRange;
  recType: RecitationType;
  status: QueueStatus;
  joinedAt: string;
  /** Completed turns so far in this session. */
  turnsDone: number;
};

export type Mark = {
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  type: MistakeType;
  note: string;
  at: string;
};

export type CompletedTurn = {
  turnId: string;
  studentId: string;
  name: string;
  /** The range as it stood when the turn finished. */
  range: AyahRange;
  recType: RecitationType;
  startedAt: string;
  finishedAt: string;
  marks: Mark[];
  ayahCount: number;
  wordCount: number;
  /** True for the sample turns shipped in the seed, false for live ones. */
  seeded: boolean;
};

export type DerivedState = {
  queue: QueueEntry[];
  activeStudentId: string | null;
  isOnBreak: boolean;
  /** Marks of the turn currently in progress, if any. */
  liveMarks: Mark[];
  /** The range of the turn in progress, if any. */
  liveRange: AyahRange | null;
  liveStartedAt: string | null;
  completedTurns: CompletedTurn[];
};

const markKey = (surah: number, ayah: number, wordIndex: number): string =>
  `${surah}:${ayah}:${wordIndex}`;

/** Marks read best in recitation order, not the order the teacher tapped them. */
function sortMarks(marks: Mark[]): Mark[] {
  return [...marks].sort(
    (a, b) => a.ayah - b.ayah || a.wordIndex - b.wordIndex,
  );
}

type OpenTurn = {
  turnId: string;
  studentId: string;
  startedAt: string;
  marks: Map<string, Mark>;
  seeded: boolean;
};

export function deriveState(events: readonly DemoEvent[]): DerivedState {
  const entries = new Map<string, QueueEntry>();
  const completedTurns: CompletedTurn[] = [];
  let open: OpenTurn | null = null;
  let isOnBreak = false;

  const closeTurn = (finishedAt: string) => {
    if (!open) return;
    const entry = entries.get(open.studentId);
    const range = entry?.range ?? { surah: 1, from: 1, to: 1 };
    completedTurns.push({
      turnId: open.turnId,
      studentId: open.studentId,
      name: entry?.name ?? open.studentId,
      range,
      recType: entry?.recType ?? "sabaq",
      startedAt: open.startedAt,
      finishedAt,
      marks: sortMarks([...open.marks.values()]),
      ayahCount: countAyahs(range.surah, range.from, range.to),
      wordCount: countWords(range.surah, range.from, range.to),
      seeded: open.seeded,
    });
    if (entry) {
      entry.status = "done";
      entry.turnsDone += 1;
    }
    open = null;
  };

  for (const e of events) {
    switch (e.kind) {
      case "queue_join": {
        const existing = entries.get(e.studentId);
        entries.set(e.studentId, {
          studentId: e.studentId,
          name: e.name,
          range: e.range,
          recType: e.recType,
          status: "waiting",
          joinedAt: e.timestamp,
          turnsDone: existing?.turnsDone ?? 0,
        });
        break;
      }

      case "range_change": {
        const entry = entries.get(e.studentId);
        if (entry) entry.range = e.range;
        break;
      }

      case "turn_start": {
        // A new turn supersedes any turn left open by a malformed log.
        if (open) closeTurn(e.timestamp);
        const entry = entries.get(e.studentId);
        if (!entry) break;
        entry.status = "reciting";
        open = {
          turnId: e.id,
          studentId: e.studentId,
          startedAt: e.timestamp,
          marks: new Map(),
          seeded: e.id.startsWith("seed_"),
        };
        break;
      }

      case "turn_finish": {
        if (open && open.studentId === e.studentId) closeTurn(e.timestamp);
        break;
      }

      case "mark": {
        // Marks only count inside the turn they were made in.
        if (!open || open.studentId !== e.studentId) break;
        const key = markKey(e.surah, e.ayah, e.wordIndex);
        if (e.action === "add") {
          open.marks.set(key, {
            surah: e.surah,
            ayah: e.ayah,
            wordIndex: e.wordIndex,
            type: e.type,
            note: e.note,
            at: e.timestamp,
          });
        } else {
          open.marks.delete(key);
        }
        break;
      }

      case "break": {
        isOnBreak = e.on;
        break;
      }
    }
  }

  const queue = [...entries.values()].sort((a, b) =>
    a.joinedAt < b.joinedAt ? -1 : a.joinedAt > b.joinedAt ? 1 : 0,
  );

  const activeStudentId = open ? (open as OpenTurn).studentId : null;
  const liveEntry = activeStudentId ? entries.get(activeStudentId) : undefined;

  return {
    queue,
    activeStudentId,
    isOnBreak,
    liveMarks: open ? sortMarks([...(open as OpenTurn).marks.values()]) : [],
    liveRange: liveEntry?.range ?? null,
    liveStartedAt: open ? (open as OpenTurn).startedAt : null,
    completedTurns,
  };
}

/* -------------------------------------------------------------------------- */
/* progress                                                                    */
/* -------------------------------------------------------------------------- */

export type TurnPoint = {
  turnId: string;
  label: string;
  studentName: string;
  mistakes: number;
  ayahs: number;
  words: number;
  seeded: boolean;
};

export type ProgressStats = {
  turns: number;
  ayahs: number;
  words: number;
  mistakes: number;
  avgMistakesPerTurn: number;
  /** Share of recited words with no mark against them, 0–100. */
  accuracyPct: number;
  byType: Record<MistakeType, number>;
  mostCommonType: MistakeType | null;
  perTurn: TurnPoint[];
  /** How many of these turns came from the demo seed rather than live use. */
  seededTurns: number;
};

const emptyByType = (): Record<MistakeType, number> =>
  MISTAKE_TYPES.reduce(
    (acc, t) => ({ ...acc, [t]: 0 }),
    {} as Record<MistakeType, number>,
  );

export function computeProgress(turns: readonly CompletedTurn[]): ProgressStats {
  const byType = emptyByType();
  let ayahs = 0;
  let words = 0;
  let mistakes = 0;
  const perTurn: TurnPoint[] = [];

  turns.forEach((t, i) => {
    ayahs += t.ayahCount;
    words += t.wordCount;
    mistakes += t.marks.length;
    for (const m of t.marks) byType[m.type] += 1;
    perTurn.push({
      turnId: t.turnId,
      label: `Turn ${i + 1}`,
      studentName: t.name,
      mistakes: t.marks.length,
      ayahs: t.ayahCount,
      words: t.wordCount,
      seeded: t.seeded,
    });
  });

  let mostCommonType: MistakeType | null = null;
  let best = 0;
  for (const t of MISTAKE_TYPES) {
    if (byType[t] > best) {
      best = byType[t];
      mostCommonType = t;
    }
  }

  return {
    turns: turns.length,
    ayahs,
    words,
    mistakes,
    avgMistakesPerTurn: turns.length ? mistakes / turns.length : 0,
    accuracyPct: words ? ((words - mistakes) / words) * 100 : 0,
    byType,
    mostCommonType,
    perTurn,
    seededTurns: turns.filter((t) => t.seeded).length,
  };
}

/* -------------------------------------------------------------------------- */
/* lookups                                                                     */
/* -------------------------------------------------------------------------- */

export function findEntry(
  state: DerivedState,
  studentId: string,
): QueueEntry | null {
  return state.queue.find((q) => q.studentId === studentId) ?? null;
}

export function lastTurnFor(
  state: DerivedState,
  studentId: string,
): CompletedTurn | null {
  for (let i = state.completedTurns.length - 1; i >= 0; i -= 1) {
    if (state.completedTurns[i].studentId === studentId) {
      return state.completedTurns[i];
    }
  }
  return null;
}

export function queuePosition(
  state: DerivedState,
  studentId: string,
): number | null {
  const waiting = state.queue.filter((q) => q.status === "waiting");
  const i = waiting.findIndex((q) => q.studentId === studentId);
  return i === -1 ? null : i + 1;
}

/** Marks grouped by ayah, for rendering a summary ayah by ayah. */
export function marksByAyah(marks: readonly Mark[]): Map<number, Mark[]> {
  const out = new Map<number, Mark[]>();
  for (const m of marks) {
    const list = out.get(m.ayah);
    if (list) list.push(m);
    else out.set(m.ayah, [m]);
  }
  return out;
}

/** True when a mark no longer falls inside the turn's range. Such marks are
 *  kept, never deleted (BUILD_BRIEF.md §10), but the UI flags them. */
export function isOutsideRange(mark: Mark, range: AyahRange): boolean {
  return (
    mark.surah !== range.surah ||
    mark.ayah < range.from ||
    mark.ayah > range.to
  );
}
