/**
 * Builds the meeting's participant tiles from the queue.
 *
 * Shared by both routes so the two roles always see the same room: if the
 * student's tab and the teacher's tab disagreed about who is present, the whole
 * point of the sync demo would be lost.
 *
 * Everything here is derived from the log. Nothing about a tile — who is in the
 * room, who holds the floor, whose microphone is open, how long anyone has
 * recited — is stored separately, so the two tabs cannot drift apart.
 */

import type { MeetingPerson } from "@/components/meeting/chrome";
import { TEACHER_ID, TEACHER_NAME } from "./eventLog";
import type { QueueEntry } from "./state";

export function buildParticipants({
  queue,
  activeStudentId,
  muted,
  speakingSeconds,
  meId,
}: {
  queue: readonly QueueEntry[];
  activeStudentId: string | null;
  /** Microphone state by id. Missing means muted — everyone joins muted. */
  muted: Record<string, boolean>;
  speakingSeconds: Record<string, number>;
  /** Whoever is looking at this tab. */
  meId: string;
}): MeetingPerson[] {
  const isMuted = (id: string): boolean => muted[id] !== false;

  const teacher: MeetingPerson = {
    id: TEACHER_ID,
    name: TEACHER_NAME,
    isModerator: true,
    isSelf: meId === TEACHER_ID,
    muted: isMuted(TEACHER_ID),
    speakingSeconds: speakingSeconds[TEACHER_ID] ?? 0,
  };

  // Queue membership is the gate: a student gets a tile once they join and not
  // before, and loses it when they leave — both of which fall out of the queue
  // itself rather than a second list that could disagree with it.
  const students = queue.map<MeetingPerson>((q) => ({
    id: q.studentId,
    name: q.name,
    isSelf: q.studentId === meId,
    muted: isMuted(q.studentId),
    isDominant: q.studentId === activeStudentId,
    speakingSeconds: speakingSeconds[q.studentId] ?? 0,
  }));

  return [teacher, ...students];
}
