"use client";

/**
 * The teacher's side: the meeting, with the correction view layered over it
 * (BUILD_BRIEF.md §18) and the audit log as a full screen.
 *
 * Only the teacher starts and finishes turns, so this route owns those writes.
 * Everything it renders comes from the same derived state the student tab
 * reads, which is what keeps the two in step.
 */

import { useState } from "react";

import { AuditLog } from "@/components/screens/teacher/AuditLog";
import { LiveCorrection } from "@/components/screens/teacher/LiveCorrection";
import { TeacherMeeting } from "@/components/screens/teacher/TeacherMeeting";
import { RangePicker } from "@/components/screens/student/RangePicker";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { useSessionState } from "@/hooks/useSessionState";
import { buildParticipants } from "@/lib/participants";

type View = "meeting" | "correction" | "range" | "audit";

export default function TeacherRoute() {
  const s = useSessionState("teacher");
  const [view, setView] = useState<View>("meeting");

  if (!s.ready) {
    return (
      <PhoneFrame>
        <div className="flex-1" />
      </PhoneFrame>
    );
  }

  const active =
    s.queue.find((q) => q.studentId === s.activeStudentId) ?? null;

  // Nobody reciting means there is nothing to correct — fall back rather than
  // render a correction view with no subject.
  const resolved: View =
    (view === "correction" || view === "range") && !active ? "meeting" : view;

  const participants = buildParticipants({
    queue: s.queue,
    activeStudentId: s.activeStudentId,
    isOnBreak: s.isOnBreak,
  });

  const meetingStartedAt = s.queue.length > 0 ? s.queue[0].joinedAt : null;

  if (resolved === "audit") {
    return (
      <PhoneFrame onReset={s.resetDemo}>
        <AuditLog
          events={s.events}
          onExport={s.exportJSON}
          onBack={() => setView("meeting")}
        />
      </PhoneFrame>
    );
  }

  if (resolved === "range" && active) {
    return (
      <PhoneFrame onReset={s.resetDemo}>
        <RangePicker
          initial={{ range: active.range, recType: active.recType }}
          submitLabel="Save range"
          onCancel={() => setView("correction")}
          onSubmit={(range) => {
            s.changeRange(active.studentId, range, "teacher");
            setView("correction");
          }}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame onReset={s.resetDemo}>
      <TeacherMeeting
        participants={participants}
        speakerId={s.activeStudentId}
        startedAt={meetingStartedAt}
        queue={s.queue}
        activeStudentId={s.activeStudentId}
        isOnBreak={s.isOnBreak}
        onStartTurn={(studentId) => {
          if (s.activeStudentId === null) s.startTurn(studentId);
          setView("correction");
        }}
        onToggleBreak={s.setBreak}
        onOpenAudit={() => setView("audit")}
      />

      {resolved === "correction" && active ? (
        <div className="absolute inset-0 z-20 bg-ink flex flex-col">
          <LiveCorrection
            studentName={active.name}
            range={active.range}
            recType={active.recType}
            marks={s.liveMarks}
            startedAt={s.liveStartedAt}
            onAddMark={s.addMark}
            onRemoveMark={s.removeMark}
            onChangeRange={() => setView("range")}
            onFinishTurn={() => {
              s.finishTurn(active.studentId);
              setView("meeting");
            }}
            onClose={() => setView("meeting")}
          />
        </div>
      ) : null}
    </PhoneFrame>
  );
}
