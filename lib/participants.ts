/**
 * Builds the meeting's participant tiles from the queue.
 *
 * Shared by both routes so the two roles always see the same room: if the
 * student's tab and the teacher's tab disagreed about who is present, the whole
 * point of the sync demo would be lost.
 */

import type { Participant } from "@/components/shell/MeetingShell";
import { TEACHER_ID, TEACHER_NAME } from "./eventLog";
import type { QueueEntry } from "./state";

export function buildParticipants({
  queue,
  activeStudentId,
  isOnBreak,
}: {
  queue: readonly QueueEntry[];
  activeStudentId: string | null;
  isOnBreak: boolean;
}): Participant[] {
  const teacher: Participant = {
    id: TEACHER_ID,
    name: TEACHER_NAME,
    isTeacher: true,
    status: isOnBreak ? "On a break" : "Teaching",
  };

  // Queue membership is the gate: the live student gets a tile once they join
  // and not before, which falls out of the queue itself.
  const students = queue.map<Participant>((q) => ({
    id: q.studentId,
    name: q.name,
    isReciting: q.studentId === activeStudentId,
    status:
      q.studentId === activeStudentId
        ? "Reciting now"
        : q.status === "done"
          ? "Turn finished"
          : "Waiting",
  }));

  return [teacher, ...students];
}
