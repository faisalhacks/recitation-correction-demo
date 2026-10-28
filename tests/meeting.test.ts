/**
 * Scratch harness for the meeting state added to lib/state.ts: chat, per
 * person microphone, leaving, and floor time. Run with:
 *   npx --yes tsx tests/meeting.test.ts
 *
 * The thing most worth pinning down here is floor time. It is folded out of
 * turn boundaries rather than counted by a ticking timer, precisely so nothing
 * has to be written back to the log once a second — these checks fail if
 * someone ever reintroduces a stored counter, because a stored counter would
 * not survive a replay of the same events.
 */

import assert from "node:assert/strict";

import {
  type DemoEvent,
  LIVE_STUDENT_ID,
  TEACHER_ID,
  makeEvent,
} from "../lib/eventLog";
import { buildSeedEvents } from "../lib/seed";
import { deriveState } from "../lib/state";

let log: DemoEvent[] = buildSeedEvents();
const push = (...e: DemoEvent[]) => {
  log = [...log, ...e];
};

const RANGE = { surah: 1, from: 1, to: 7 };

/* --- 1. everyone starts muted -------------------------------------------- */
{
  const s = deriveState(log);
  assert.equal(
    s.muted[LIVE_STUDENT_ID],
    undefined,
    "mic: no event means no entry, which the UI reads as muted",
  );
  assert.deepEqual(s.chat, [], "chat: empty before anyone speaks");
  assert.deepEqual(s.leftIds, [], "presence: nobody has left");
}

/* --- 2. the microphone is a plain toggle --------------------------------- */
{
  push(makeEvent({ kind: "mic", who: LIVE_STUDENT_ID, muted: false }));
  assert.equal(
    deriveState(log).muted[LIVE_STUDENT_ID],
    false,
    "mic: opening is recorded",
  );

  push(makeEvent({ kind: "mic", who: LIVE_STUDENT_ID, muted: true }));
  assert.equal(
    deriveState(log).muted[LIVE_STUDENT_ID],
    true,
    "mic: the last event wins",
  );

  // One person's microphone must never move anyone else's.
  push(makeEvent({ kind: "mic", who: TEACHER_ID, muted: false }));
  const s = deriveState(log);
  assert.equal(s.muted[TEACHER_ID], false, "mic: teacher opened");
  assert.equal(s.muted[LIVE_STUDENT_ID], true, "mic: student unaffected");
}

/* --- 3. chat keeps its order and its sender ------------------------------ */
{
  push(
    makeEvent({
      kind: "chat",
      from: LIVE_STUDENT_ID,
      fromName: "الطالب",
      text: "السلام عليكم",
    }),
    makeEvent({
      kind: "chat",
      from: TEACHER_ID,
      fromName: "الأستاذ",
      text: "وعليكم السلام",
    }),
  );
  const s = deriveState(log);
  assert.equal(s.chat.length, 2, "chat: both messages kept");
  assert.equal(s.chat[0].from, LIVE_STUDENT_ID, "chat: oldest first");
  assert.equal(s.chat[1].from, TEACHER_ID, "chat: order preserved");
  assert.equal(
    s.chat[1].fromName,
    "الأستاذ",
    "chat: the sender's name travels on the event, not a lookup",
  );
}

/* --- 4. floor time comes from finished turns ----------------------------- */
{
  const base = Date.parse("2026-01-01T10:00:00.000Z");
  const at = (offsetMs: number) => new Date(base + offsetMs).toISOString();

  push(
    makeEvent({
      kind: "queue_join",
      studentId: LIVE_STUDENT_ID,
      name: "الطالب أ",
      range: RANGE,
      recType: "sabaq",
      timestamp: at(0),
    }),
    makeEvent({
      kind: "turn_start",
      studentId: LIVE_STUDENT_ID,
      timestamp: at(1000),
    }),
  );

  assert.equal(
    deriveState(log).speakingSeconds[LIVE_STUDENT_ID],
    undefined,
    "floor time: a turn in progress contributes nothing — the live part is " +
      "added by the component so the log never has to tick",
  );

  push(
    makeEvent({
      kind: "turn_finish",
      studentId: LIVE_STUDENT_ID,
      timestamp: at(91_000),
    }),
  );
  assert.equal(
    deriveState(log).speakingSeconds[LIVE_STUDENT_ID],
    90,
    "floor time: 90 seconds between start and finish",
  );

  // A second turn accumulates onto the first.
  push(
    makeEvent({
      kind: "turn_start",
      studentId: LIVE_STUDENT_ID,
      timestamp: at(100_000),
    }),
    makeEvent({
      kind: "turn_finish",
      studentId: LIVE_STUDENT_ID,
      timestamp: at(110_000),
    }),
  );
  assert.equal(
    deriveState(log).speakingSeconds[LIVE_STUDENT_ID],
    100,
    "floor time: turns accumulate",
  );
}

/* --- 5. leaving takes the tile, not the history -------------------------- */
{
  const before = deriveState(log);
  const turnsBefore = before.completedTurns.filter(
    (t) => t.studentId === LIVE_STUDENT_ID,
  ).length;
  const secondsBefore = before.speakingSeconds[LIVE_STUDENT_ID];
  assert.ok(turnsBefore > 0, "leave: there is history to preserve");

  push(makeEvent({ kind: "leave", studentId: LIVE_STUDENT_ID }));
  const s = deriveState(log);

  assert.ok(
    !s.queue.some((q) => q.studentId === LIVE_STUDENT_ID),
    "leave: the tile goes",
  );
  assert.ok(s.leftIds.includes(LIVE_STUDENT_ID), "leave: recorded as left");
  assert.equal(
    s.completedTurns.filter((t) => t.studentId === LIVE_STUDENT_ID).length,
    turnsBefore,
    "leave: finished turns stay",
  );
  assert.equal(
    s.speakingSeconds[LIVE_STUDENT_ID],
    secondsBefore,
    "leave: floor time stays — the stats list keeps people who left",
  );
  assert.equal(
    s.chat.length,
    2,
    "leave: messages stay; the transcript is not rewritten",
  );
}

/* --- 6. leaving mid-turn closes the turn rather than losing it ----------- */
{
  let fresh: DemoEvent[] = [];
  const base = Date.parse("2026-02-01T09:00:00.000Z");
  const at = (offsetMs: number) => new Date(base + offsetMs).toISOString();

  fresh = [
    makeEvent({
      kind: "queue_join",
      studentId: "student_z",
      name: "الطالب ز",
      range: RANGE,
      recType: "sabaq",
      timestamp: at(0),
    }),
    makeEvent({
      kind: "turn_start",
      studentId: "student_z",
      timestamp: at(1000),
    }),
    makeEvent({
      kind: "mark",
      studentId: "student_z",
      surah: 1,
      ayah: 1,
      wordIndex: 1,
      type: "tajwid",
      note: "",
      action: "add",
      timestamp: at(2000),
    }),
    makeEvent({
      kind: "leave",
      studentId: "student_z",
      timestamp: at(31_000),
    }),
  ];

  const s = deriveState(fresh);
  assert.equal(s.activeStudentId, null, "leave mid-turn: nobody is reciting");
  assert.equal(
    s.completedTurns.length,
    1,
    "leave mid-turn: the turn is closed, not dropped",
  );
  assert.equal(
    s.completedTurns[0].marks.length,
    1,
    "leave mid-turn: marks made during it survive",
  );
  assert.equal(
    s.completedTurns[0].name,
    "الطالب ز",
    "leave mid-turn: closed before the entry is dropped, so the name is known",
  );
  assert.equal(
    s.speakingSeconds["student_z"],
    30,
    "leave mid-turn: floor time counted up to the moment of leaving",
  );
}

/* --- 7. replay is deterministic ------------------------------------------ */
{
  const a = deriveState(log);
  const b = deriveState([...log]);
  assert.deepEqual(
    { chat: a.chat, muted: a.muted, speaking: a.speakingSeconds, left: a.leftIds },
    { chat: b.chat, muted: b.muted, speaking: b.speakingSeconds, left: b.leftIds },
    "replay: the same log always folds to the same meeting state",
  );
}

console.log("meeting state ok — chat, mic, leave and floor time all fold cleanly.");
