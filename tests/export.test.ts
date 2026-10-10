/** Checks the labeled-data export. Run: npx --yes tsx scratch/export.test.ts */

import assert from "node:assert/strict";

import {
  type DemoEvent,
  LIVE_STUDENT_ID,
  buildExport,
  makeEvent,
} from "../lib/eventLog";
import { buildSeedEvents } from "../lib/seed";

const log: DemoEvent[] = [
  ...buildSeedEvents(),
  makeEvent({
    kind: "queue_join",
    studentId: LIVE_STUDENT_ID,
    name: "You (Student A)",
    range: { surah: 2, from: 3, to: 5 },
    recType: "sabaq",
  }),
  makeEvent({ kind: "turn_start", studentId: LIVE_STUDENT_ID }),
  makeEvent({
    kind: "mark",
    studentId: LIVE_STUDENT_ID,
    surah: 2,
    ayah: 3,
    wordIndex: 4,
    type: "tajwid",
    note: "Ghunnah held too short",
    action: "add",
  }),
  makeEvent({
    kind: "mark",
    studentId: LIVE_STUDENT_ID,
    surah: 2,
    ayah: 3,
    wordIndex: 4,
    type: "tajwid",
    note: "Ghunnah held too short",
    action: "remove",
  }),
];

const raw = buildExport(log);
const parsed = JSON.parse(raw) as {
  eventCount: number;
  events: DemoEvent[];
  sessionId: string;
};

assert.equal(parsed.eventCount, log.length, "export: count matches");
assert.equal(parsed.events.length, log.length, "export: all events present");
assert.equal(parsed.sessionId, "sess_01");

// The sample mark event in BUILD_BRIEF.md §11 must round-trip field for field.
// Be specific: the seeded history also contains marks, some on ayah 3.
const mark = parsed.events.find(
  (e) =>
    e.kind === "mark" &&
    e.action === "add" &&
    e.surah === 2 &&
    e.ayah === 3 &&
    e.wordIndex === 4,
);
assert.ok(mark && mark.kind === "mark", "export: mark event present");
for (const field of [
  "id",
  "sessionId",
  "studentId",
  "surah",
  "ayah",
  "wordIndex",
  "type",
  "note",
  "teacherId",
  "timestamp",
  "action",
]) {
  assert.ok(field in mark, `export: mark carries "${field}"`);
}
assert.equal(mark.wordIndex, 4, "export: wordIndex is 1-based");

// A remove is an extra event, never a deletion.
const removes = parsed.events.filter(
  (e) => e.kind === "mark" && e.action === "remove",
);
assert.equal(removes.length, 1, "export: the remove is in the log");

console.log(`export ok — ${parsed.eventCount} events, valid JSON`);
console.log(`sample mark: ${JSON.stringify(mark, null, 2).slice(0, 320)}`);
