"use client";

/**
 * The single interface every screen uses to read and write demo state.
 *
 * OWNED BY THE MAIN SESSION — frozen before screen work began. Screens call
 * this hook or take props; they never import `eventLog.ts` or `state.ts`.
 * If a screen needs something this hook does not expose, report it rather than
 * reaching past it (BUILD_BRIEF.md §12).
 *
 * `ready` is false until the first client-side read of localStorage. Render a
 * placeholder until then: the server has no access to the log, so painting
 * derived values before mount would cause a hydration mismatch.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  type AyahRange,
  type DemoEvent,
  type MistakeType,
  type RecitationType,
  LIVE_STUDENT_ID,
  LIVE_STUDENT_NAME,
  TEACHER_ID,
  appendEvents,
  buildExport,
  getServerSnapshot,
  getSnapshot,
  makeEvent,
  replaceLog,
  subscribeStore,
} from "@/lib/eventLog";
import {
  type CompletedTurn,
  type DerivedState,
  type Mark,
  type ProgressStats,
  type QueueEntry,
  computeProgress,
  deriveState,
  findEntry,
  lastTurnFor,
  queuePosition,
} from "@/lib/state";
import { buildSeedEvents } from "@/lib/seed";

export type Role = "student" | "teacher";

export type NewMark = {
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  type: MistakeType;
  note: string;
};

export type SessionState = {
  /** False until the log has been read in the browser. */
  ready: boolean;
  role: Role;
  /** The live student's id, or the teacher's id, depending on `role`. */
  meId: string;

  // --- derived state -------------------------------------------------------
  queue: QueueEntry[];
  activeStudentId: string | null;
  isOnBreak: boolean;
  liveMarks: Mark[];
  liveRange: AyahRange | null;
  liveStartedAt: string | null;
  completedTurns: CompletedTurn[];
  /** The raw log, oldest first — for the audit view. */
  events: DemoEvent[];

  // --- the live student's own view ----------------------------------------
  myEntry: QueueEntry | null;
  /** 1-based position among waiting students, or null if not waiting. */
  myPosition: number | null;
  myLastTurn: CompletedTurn | null;
  amReciting: boolean;

  // --- progress ------------------------------------------------------------
  /** Across every completed turn in the log, seeded history included. */
  progress: ProgressStats;
  progressFor: (studentId: string) => ProgressStats;

  // --- actions -------------------------------------------------------------
  joinQueue: (range: AyahRange, recType: RecitationType) => void;
  changeRange: (
    studentId: string,
    range: AyahRange,
    by: "student" | "teacher",
  ) => void;
  startTurn: (studentId: string) => void;
  finishTurn: (studentId: string) => void;
  addMark: (mark: NewMark) => void;
  removeMark: (surah: number, ayah: number, wordIndex: number) => void;
  setBreak: (on: boolean) => void;
  resetDemo: () => void;
  /** Downloads the whole log as JSON. */
  exportJSON: () => void;
};

const EMPTY: DerivedState = {
  queue: [],
  activeStudentId: null,
  isOnBreak: false,
  liveMarks: [],
  liveRange: null,
  liveStartedAt: null,
  completedTurns: [],
};

/** Stable snapshots for the mounted flag — see `ready` below. */
const alwaysTrue = () => true;
const alwaysFalse = () => false;
const noopSubscribe = () => () => {};

export function useSessionState(role: Role): SessionState {
  // The log lives outside React (localStorage plus a BroadcastChannel), which
  // is exactly what useSyncExternalStore is for: it handles the server/client
  // split without an effect that sets state during hydration.
  const events = useSyncExternalStore(
    subscribeStore,
    getSnapshot,
    getServerSnapshot,
  );

  const ready = useSyncExternalStore(noopSubscribe, alwaysTrue, alwaysFalse);

  // Seeding is a write to the store, not to React state — appending notifies
  // every subscriber, so this re-renders through the same path as any other
  // change.
  useEffect(() => {
    if (getSnapshot().length === 0) appendEvents(buildSeedEvents());
  }, []);

  const derived = useMemo(
    () => (ready ? deriveState(events) : EMPTY),
    [events, ready],
  );

  const commit = useCallback((drafts: DemoEvent[]) => {
    appendEvents(drafts);
  }, []);

  /* --- actions ------------------------------------------------------------ */

  const joinQueue = useCallback(
    (range: AyahRange, recType: RecitationType) => {
      commit([
        makeEvent({
          kind: "queue_join",
          studentId: LIVE_STUDENT_ID,
          name: LIVE_STUDENT_NAME,
          range,
          recType,
        }),
      ]);
    },
    [commit],
  );

  const changeRange = useCallback(
    (studentId: string, range: AyahRange, by: "student" | "teacher") => {
      commit([
        makeEvent({ kind: "range_change", studentId, range, by }),
      ]);
    },
    [commit],
  );

  const startTurn = useCallback(
    (studentId: string) => {
      commit([makeEvent({ kind: "turn_start", studentId })]);
    },
    [commit],
  );

  const finishTurn = useCallback(
    (studentId: string) => {
      commit([makeEvent({ kind: "turn_finish", studentId })]);
    },
    [commit],
  );

  const addMark = useCallback(
    (mark: NewMark) => {
      const studentId = derived.activeStudentId;
      if (!studentId) return;
      commit([
        makeEvent({
          kind: "mark",
          studentId,
          surah: mark.surah,
          ayah: mark.ayah,
          wordIndex: mark.wordIndex,
          type: mark.type,
          note: mark.note,
          action: "add",
        }),
      ]);
    },
    [commit, derived.activeStudentId],
  );

  const removeMark = useCallback(
    (surah: number, ayah: number, wordIndex: number) => {
      const studentId = derived.activeStudentId;
      if (!studentId) return;
      // The remove event carries the type of the mark it undoes, so the log
      // stays readable on its own without replaying the whole session.
      const existing = derived.liveMarks.find(
        (m) =>
          m.surah === surah && m.ayah === ayah && m.wordIndex === wordIndex,
      );
      if (!existing) return;
      commit([
        makeEvent({
          kind: "mark",
          studentId,
          surah,
          ayah,
          wordIndex,
          type: existing.type,
          note: existing.note,
          action: "remove",
        }),
      ]);
    },
    [commit, derived.activeStudentId, derived.liveMarks],
  );

  const setBreak = useCallback(
    (on: boolean) => {
      commit([makeEvent({ kind: "break", studentId: "", on })]);
    },
    [commit],
  );

  const resetDemo = useCallback(() => {
    replaceLog(buildSeedEvents());
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([buildExport(events)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recitation-correction-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [events]);

  /* --- student conveniences ---------------------------------------------- */

  const myEntry = useMemo(
    () => findEntry(derived, LIVE_STUDENT_ID),
    [derived],
  );
  const myPosition = useMemo(
    () => queuePosition(derived, LIVE_STUDENT_ID),
    [derived],
  );
  const myLastTurn = useMemo(
    () => lastTurnFor(derived, LIVE_STUDENT_ID),
    [derived],
  );

  const progress = useMemo(
    () => computeProgress(derived.completedTurns),
    [derived.completedTurns],
  );

  const progressFor = useCallback(
    (studentId: string) =>
      computeProgress(
        derived.completedTurns.filter((t) => t.studentId === studentId),
      ),
    [derived.completedTurns],
  );

  return {
    ready,
    role,
    meId: role === "teacher" ? TEACHER_ID : LIVE_STUDENT_ID,

    queue: derived.queue,
    activeStudentId: derived.activeStudentId,
    isOnBreak: derived.isOnBreak,
    liveMarks: derived.liveMarks,
    liveRange: derived.liveRange,
    liveStartedAt: derived.liveStartedAt,
    completedTurns: derived.completedTurns,
    events,

    myEntry,
    myPosition,
    myLastTurn,
    amReciting: derived.activeStudentId === LIVE_STUDENT_ID,

    progress,
    progressFor,

    joinQueue,
    changeRange,
    startTurn,
    finishTurn,
    addMark,
    removeMark,
    setBreak,
    resetDemo,
    exportJSON,
  };
}
