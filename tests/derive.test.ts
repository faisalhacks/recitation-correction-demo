/**
 * Scratch harness for the fold in lib/state.ts. Run with:
 *   npx --yes tsx scratch/derive.test.ts
 * Not part of the build; `scratch/` is gitignored.
 */

import assert from "node:assert/strict";

import { type DemoEvent, LIVE_STUDENT_ID, makeEvent } from "../lib/eventLog";
import { buildSeedEvents } from "../lib/seed";
import {
  computeProgress,
  deriveState,
  findEntry,
  lastTurnFor,
  queuePosition,
} from "../lib/state";

let log: DemoEvent[] = buildSeedEvents();
const push = (...e: DemoEvent[]) => {
  log = [...log, ...e];
};

/* --- 1. the seed ---------------------------------------------------------- */
{
  const s = deriveState(log);
  assert.equal(s.completedTurns.length, 3, "seed: 3 completed turns");
  assert.ok(
    s.completedTurns.every((t) => t.seeded),
    "seed: every seeded turn is flagged seeded",
  );
  assert.ok(
    s.completedTurns.every((t) => t.studentId === "student_b"),
    "seed: history belongs to the seeded student",
  );
  assert.equal(s.queue.length, 3, "seed: 3 students waiting");
  assert.ok(
    s.queue.every((q) => q.status === "waiting"),
    "seed: all waiting",
  );
  assert.equal(s.activeStudentId, null, "seed: nobody reciting");
  assert.equal(s.isOnBreak, false, "seed: not on break");

  // Every seeded mark must point at a word that actually exists.
  for (const t of s.completedTurns) {
    for (const m of t.marks) {
      assert.ok(m.wordIndex >= 1, "seed: wordIndex is 1-based");
      assert.ok(
        m.ayah >= t.range.from && m.ayah <= t.range.to,
        "seed: mark inside its range",
      );
    }
  }
  console.log("1. seed                      ok");
}

/* --- 2. the live student joins -------------------------------------------- */
{
  push(
    makeEvent({
      kind: "queue_join",
      studentId: LIVE_STUDENT_ID,
      name: "You (Student A)",
      range: { surah: 2, from: 3, to: 5 },
      recType: "sabaq",
    }),
  );
  const s = deriveState(log);
  assert.equal(s.queue.length, 4, "join: queue grows to 4");
  assert.equal(queuePosition(s, LIVE_STUDENT_ID), 4, "join: 4th in line");
  assert.equal(findEntry(s, LIVE_STUDENT_ID)?.status, "waiting");
  console.log("2. student joins             ok");
}

/* --- 3. teacher starts the turn ------------------------------------------- */
{
  push(makeEvent({ kind: "turn_start", studentId: LIVE_STUDENT_ID }));
  const s = deriveState(log);
  assert.equal(s.activeStudentId, LIVE_STUDENT_ID, "start: active student");
  assert.equal(findEntry(s, LIVE_STUDENT_ID)?.status, "reciting");
  assert.equal(queuePosition(s, LIVE_STUDENT_ID), null, "start: off the line");
  assert.deepEqual(s.liveRange, { surah: 2, from: 3, to: 5 });
  console.log("3. turn starts               ok");
}

/* --- 4. marks ------------------------------------------------------------- */
{
  push(
    makeEvent({
      kind: "mark",
      studentId: LIVE_STUDENT_ID,
      surah: 2,
      ayah: 3,
      wordIndex: 4,
      type: "tajwid",
      note: "Ghunnah",
      action: "add",
    }),
    makeEvent({
      kind: "mark",
      studentId: LIVE_STUDENT_ID,
      surah: 2,
      ayah: 5,
      wordIndex: 2,
      type: "makhraj",
      note: "",
      action: "add",
    }),
  );
  const s = deriveState(log);
  assert.equal(s.liveMarks.length, 2, "marks: two added");
  assert.deepEqual(
    s.liveMarks.map((m) => [m.ayah, m.wordIndex]),
    [
      [3, 4],
      [5, 2],
    ],
    "marks: sorted by ayah then word",
  );
  console.log("4. marks add                 ok");
}

/* --- 5. removing a mark appends, never deletes ---------------------------- */
{
  const before = log.length;
  push(
    makeEvent({
      kind: "mark",
      studentId: LIVE_STUDENT_ID,
      surah: 2,
      ayah: 5,
      wordIndex: 2,
      type: "makhraj",
      note: "",
      action: "remove",
    }),
  );
  const s = deriveState(log);
  assert.equal(log.length, before + 1, "remove: log grew");
  assert.equal(s.liveMarks.length, 1, "remove: one mark left");
  assert.equal(s.liveMarks[0].ayah, 3, "remove: the right one went");
  console.log("5. mark removal appends      ok");
}

/* --- 6. range change keeps out-of-range marks ----------------------------- */
{
  push(
    makeEvent({
      kind: "range_change",
      studentId: LIVE_STUDENT_ID,
      range: { surah: 2, from: 4, to: 6 },
      by: "teacher",
    }),
  );
  const s = deriveState(log);
  assert.deepEqual(s.liveRange, { surah: 2, from: 4, to: 6 }, "range: updated");
  assert.equal(
    s.liveMarks.length,
    1,
    "range: the 2:3 mark survives a range that excludes it",
  );
  assert.equal(s.liveMarks[0].ayah, 3);
  console.log("6. range change keeps marks  ok");
}

/* --- 7. finish the turn --------------------------------------------------- */
{
  push(makeEvent({ kind: "turn_finish", studentId: LIVE_STUDENT_ID }));
  const s = deriveState(log);
  assert.equal(s.activeStudentId, null, "finish: nobody reciting");
  assert.equal(s.completedTurns.length, 4, "finish: 4 turns on record");
  const mine = lastTurnFor(s, LIVE_STUDENT_ID);
  assert.ok(mine, "finish: the student has a turn");
  assert.equal(mine.marks.length, 1, "finish: one surviving mark");
  assert.equal(mine.seeded, false, "finish: a live turn is not seeded");
  assert.deepEqual(mine.range, { surah: 2, from: 4, to: 6 });
  assert.equal(mine.ayahCount, 3, "finish: 3 ayahs in 2:4-6");
  assert.ok(mine.wordCount > 0, "finish: word count derived from the text");
  assert.equal(findEntry(s, LIVE_STUDENT_ID)?.status, "done");
  console.log("7. turn finishes             ok");
}

/* --- 8. break ------------------------------------------------------------- */
{
  push(makeEvent({ kind: "break", studentId: "", on: true }));
  assert.equal(deriveState(log).isOnBreak, true, "break: on");
  push(makeEvent({ kind: "break", studentId: "", on: false }));
  assert.equal(deriveState(log).isOnBreak, false, "break: off");
  console.log("8. break toggles             ok");
}

/* --- 9. progress ---------------------------------------------------------- */
{
  const s = deriveState(log);
  const all = computeProgress(s.completedTurns);
  assert.equal(all.turns, 4, "progress: 4 turns");
  assert.equal(all.seededTurns, 3, "progress: 3 of them seeded");
  assert.equal(
    all.mistakes,
    s.completedTurns.reduce((n, t) => n + t.marks.length, 0),
    "progress: mistake total matches the turns",
  );
  assert.equal(all.mostCommonType, "tajwid", "progress: tajwid most common");
  assert.ok(
    all.accuracyPct > 0 && all.accuracyPct < 100,
    "progress: accuracy in range",
  );

  const mine = computeProgress(
    s.completedTurns.filter((t) => t.studentId === LIVE_STUDENT_ID),
  );
  assert.equal(mine.turns, 1, "progress: scoped to one student");
  assert.equal(mine.seededTurns, 0, "progress: the live turn is not seeded");
  console.log("9. progress                  ok");
}

/* --- 10. determinism ------------------------------------------------------ */
{
  const a = JSON.stringify(deriveState(log));
  const shuffled = [...log].sort(() => Math.random() - 0.5);
  // deriveState expects sorted input, so sort the way the log module does.
  shuffled.sort((x, y) =>
    x.timestamp !== y.timestamp
      ? x.timestamp < y.timestamp
        ? -1
        : 1
      : x.id < y.id
        ? -1
        : x.id > y.id
          ? 1
          : 0,
  );
  assert.equal(JSON.stringify(deriveState(shuffled)), a, "same log, same state");
  console.log("10. deterministic             ok");
}

console.log(`\nAll checks passed. ${log.length} events in the log.`);
