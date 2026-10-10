/**
 * Append-only event log: types, persistence, and cross-tab sync.
 *
 * OWNED BY THE MAIN SESSION. Screen components must never import this file —
 * they read and write through `useSessionState()`. See BUILD_BRIEF.md §12.
 *
 * Nothing is ever mutated or deleted. Removing a mark appends a second mark
 * event with `action: "remove"`; the current state is always folded out of the
 * log by `lib/state.ts`.
 *
 * This module is deliberately free of any knowledge of the seed data, so that
 * `lib/seed.ts` can import from it without a cycle.
 */

export const SESSION_ID = "sess_01";
export const TEACHER_ID = "ustadh_demo";
export const TEACHER_NAME = "Ustadh Demo";
export const STORAGE_KEY = "iqra_demo_log_v1";
export const CHANNEL_NAME = "iqra-demo";

/** The live student, i.e. whoever has the Student tab open. */
export const LIVE_STUDENT_ID = "student_a";
export const LIVE_STUDENT_NAME = "You (Student A)";

export type MistakeType =
  | "tajwid"
  | "makhraj"
  | "harakah"
  | "missed"
  | "extra"
  | "hesitation";

export const MISTAKE_TYPES: MistakeType[] = [
  "tajwid",
  "makhraj",
  "harakah",
  "missed",
  "extra",
  "hesitation",
];

/** Label and colour token for each mistake type. The colour IS the label, so
 *  these hues are fixed by the teacher mockup's legend. */
export const MISTAKE_META: Record<
  MistakeType,
  { label: string; color: string }
> = {
  tajwid: { label: "Tajwid", color: "var(--color-m-tajwid)" },
  makhraj: { label: "Makhraj", color: "var(--color-m-makhraj)" },
  harakah: { label: "Harakah", color: "var(--color-m-harakah)" },
  missed: { label: "Missed", color: "var(--color-m-missed)" },
  extra: { label: "Extra", color: "var(--color-m-extra)" },
  hesitation: { label: "Hesitation", color: "var(--color-m-hesitation)" },
};

export type RecitationType = "sabaq" | "sabqi" | "manzil";

export const RECITATION_META: Record<
  RecitationType,
  { label: string; hint: string }
> = {
  sabaq: { label: "Sabaq", hint: "New lesson" },
  sabqi: { label: "Sabqi", hint: "Recent" },
  manzil: { label: "Manzil", hint: "Old revision" },
};

export type AyahRange = {
  surah: number;
  from: number;
  to: number;
};

type EventBase = {
  id: string;
  sessionId: string;
  studentId: string;
  teacherId: string;
  /** ISO 8601. */
  timestamp: string;
};

/** Field names follow BUILD_BRIEF.md §11 exactly; `kind` is the discriminator. */
export type MarkEvent = EventBase & {
  kind: "mark";
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  type: MistakeType;
  note: string;
  action: "add" | "remove";
};

export type QueueJoinEvent = EventBase & {
  kind: "queue_join";
  name: string;
  range: AyahRange;
  recType: RecitationType;
};

export type RangeChangeEvent = EventBase & {
  kind: "range_change";
  range: AyahRange;
  by: "student" | "teacher";
};

export type TurnStartEvent = EventBase & { kind: "turn_start" };
export type TurnFinishEvent = EventBase & { kind: "turn_finish" };

export type BreakEvent = EventBase & {
  kind: "break";
  on: boolean;
};

export type DemoEvent =
  | MarkEvent
  | QueueJoinEvent
  | RangeChangeEvent
  | TurnStartEvent
  | TurnFinishEvent
  | BreakEvent;

/* -------------------------------------------------------------------------- */
/* ids                                                                         */
/* -------------------------------------------------------------------------- */

let counter = 0;

/**
 * Sortable id: time, then a zero-padded per-tab counter, then randomness.
 * The padding matters — ids are the tiebreak when two events share a
 * millisecond, and unpadded counters would sort "10" before "9".
 */
export function newId(): string {
  counter += 1;
  const t = Date.now().toString(36).padStart(9, "0");
  const n = counter.toString().padStart(6, "0");
  const r = Math.random().toString(36).slice(2, 7);
  return `evt_${t}_${n}_${r}`;
}

/** One event minus the envelope fields the factory fills in. */
type DraftOf<E extends DemoEvent> = Omit<
  E,
  "id" | "sessionId" | "teacherId" | "timestamp"
> &
  Partial<Pick<E, "id" | "timestamp">>;

/**
 * Spelled out per event type rather than as `DraftOf<DemoEvent>`: `Omit` over a
 * union keeps only the keys every member shares, which would silently reject
 * `surah`, `range`, `name` and friends.
 */
export type EventDraft =
  | DraftOf<MarkEvent>
  | DraftOf<QueueJoinEvent>
  | DraftOf<RangeChangeEvent>
  | DraftOf<TurnStartEvent>
  | DraftOf<TurnFinishEvent>
  | DraftOf<BreakEvent>;

/** Stamp a draft with the envelope fields, keeping its specific event type. */
export function makeEvent<D extends EventDraft>(
  draft: D,
): Extract<DemoEvent, { kind: D["kind"] }> {
  return {
    sessionId: SESSION_ID,
    teacherId: TEACHER_ID,
    ...draft,
    id: draft.id ?? newId(),
    timestamp: draft.timestamp ?? new Date().toISOString(),
    // The spread provably carries `kind` plus that variant's own fields, but
    // TypeScript can't relate a generic spread back to the narrowed union.
  } as unknown as Extract<DemoEvent, { kind: D["kind"] }>;
}

/* -------------------------------------------------------------------------- */
/* ordering and merging                                                        */
/* -------------------------------------------------------------------------- */

export function sortEvents(events: DemoEvent[]): DemoEvent[] {
  return [...events].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp < b.timestamp ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Union by id, then sorted. Two tabs appending at once converge on this. */
export function mergeEvents(
  a: readonly DemoEvent[],
  b: readonly DemoEvent[],
): DemoEvent[] {
  const byId = new Map<string, DemoEvent>();
  for (const e of a) byId.set(e.id, e);
  for (const e of b) byId.set(e.id, e);
  return sortEvents([...byId.values()]);
}

/* -------------------------------------------------------------------------- */
/* persistence                                                                 */
/* -------------------------------------------------------------------------- */

const isBrowser = (): boolean => typeof window !== "undefined";

function isDemoEvent(value: unknown): value is DemoEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return typeof e.id === "string" && typeof e.kind === "string";
}

export function loadLog(): DemoEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortEvents(parsed.filter(isDemoEvent));
  } catch {
    // Corrupt or unavailable storage (private mode, cleared site data).
    return [];
  }
}

function writeLog(events: DemoEvent[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Quota or blocked storage: the tab still works for this session.
  }
}

/* -------------------------------------------------------------------------- */
/* cross-tab sync                                                              */
/* -------------------------------------------------------------------------- */

type Message =
  | { type: "append"; events: DemoEvent[] }
  | { type: "replace"; events: DemoEvent[] };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function publish(message: Message): void {
  getChannel()?.postMessage(message);
}

/**
 * Listen for changes made in other tabs. Returns an unsubscribe function.
 *
 * BroadcastChannel carries the events directly; the `storage` event is a
 * fallback for browsers without it, and re-reads from localStorage.
 */
function subscribeRaw(onChange: (events: DemoEvent[]) => void): () => void {
  if (!isBrowser()) return () => {};

  const ch = getChannel();

  const onMessage = (ev: MessageEvent<Message>) => {
    const msg = ev.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "replace") {
      onChange(sortEvents(msg.events));
    } else if (msg.type === "append") {
      onChange(mergeEvents(loadLog(), msg.events));
    }
  };

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== null && ev.key !== STORAGE_KEY) return;
    onChange(loadLog());
  };

  ch?.addEventListener("message", onMessage);
  window.addEventListener("storage", onStorage);

  return () => {
    ch?.removeEventListener("message", onMessage);
    window.removeEventListener("storage", onStorage);
  };
}

/* -------------------------------------------------------------------------- */
/* the store                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A `useSyncExternalStore`-shaped view of the log.
 *
 * The snapshot is cached at module scope and only replaced when the log
 * actually changes, so React can compare it by reference. `getServerSnapshot`
 * returns a frozen empty array: the server cannot see localStorage, and
 * returning the same reference every time is what keeps hydration stable.
 */

// One shared instance: referential stability is what React compares, so this
// must never be rebuilt per call.
const EMPTY_LOG: DemoEvent[] = [];

let snapshot: DemoEvent[] = EMPTY_LOG;
let hydrated = false;
const listeners = new Set<() => void>();

function setSnapshot(next: DemoEvent[]): void {
  snapshot = next;
  hydrated = true;
  for (const listener of listeners) listener();
}

export function getSnapshot(): DemoEvent[] {
  if (!hydrated) {
    snapshot = loadLog();
    hydrated = true;
  }
  return snapshot;
}

export function getServerSnapshot(): DemoEvent[] {
  return EMPTY_LOG;
}

export function subscribeStore(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const stopCrossTab = subscribeRaw((events) => setSnapshot(events));
  return () => {
    listeners.delete(onStoreChange);
    stopCrossTab();
  };
}

/* -------------------------------------------------------------------------- */
/* writes                                                                      */
/* -------------------------------------------------------------------------- */

/** Append events, persist, update the snapshot, and tell the other tabs. */
export function appendEvents(incoming: DemoEvent[]): DemoEvent[] {
  if (incoming.length === 0) return getSnapshot();
  const next = mergeEvents(getSnapshot(), incoming);
  writeLog(next);
  setSnapshot(next);
  publish({ type: "append", events: incoming });
  return next;
}

/** Overwrite the whole log — used only by "Reset demo data". */
export function replaceLog(events: DemoEvent[]): DemoEvent[] {
  const next = sortEvents(events);
  writeLog(next);
  setSnapshot(next);
  publish({ type: "replace", events: next });
  return next;
}

/* -------------------------------------------------------------------------- */
/* export                                                                      */
/* -------------------------------------------------------------------------- */

/** The labeled-data export: the raw log, unmodified, plus provenance. */
export function buildExport(events: DemoEvent[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionId: SESSION_ID,
      note:
        "Concept demo. Append-only correction log; current state is derived by folding these events in order. wordIndex is 1-based.",
      eventCount: events.length,
      events,
    },
    null,
    2,
  );
}
