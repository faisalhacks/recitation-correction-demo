"use client";

/**
 * The teacher's side: the meeting, with the correction view layered over it
 * (BUILD_BRIEF.md §18) and the audit log as a full screen.
 *
 * Only the teacher starts and finishes turns, so this route owns those writes.
 * Everything it renders comes from the same derived state the student tab
 * reads, which is what keeps the two in step.
 *
 * No prejoin screen here, unlike the student route. The student's typed name
 * becomes the display name on the `queue_join` event — a real destination.
 * The teacher has no such destination, so a name field would change nothing:
 * a decorative control, which this project forbids.
 */

import { useState } from "react";

import { CallEnded } from "@/components/meeting/CallEnded";
import { AuditLog } from "@/components/screens/teacher/AuditLog";
import { LiveCorrection } from "@/components/screens/teacher/LiveCorrection";
import { TeacherMeeting } from "@/components/screens/teacher/TeacherMeeting";
import { RangePicker } from "@/components/screens/student/RangePicker";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { useSessionState } from "@/hooks/useSessionState";
import { t } from "@/lib/i18n";
import { buildParticipants } from "@/lib/participants";

type View = "meeting" | "correction" | "range" | "audit";

export default function TeacherRoute() {
  const s = useSessionState("teacher");
  const [view, setView] = useState<View>("meeting");
  /** Whether this tab is in the call. Per-viewer, like the student's. */
  const [inCall, setInCall] = useState(true);

  if (!s.ready) {
    return (
      <PhoneFrame>
        <div className="flex-1" />
      </PhoneFrame>
    );
  }

  // Leaving does what the button says: this tab leaves the call view. Unlike
  // the student, the teacher appends no `leave` event — they host the room,
  // and tearing their tile out of every student's tab because one tab was
  // closed would be a worse lie than keeping it.
  if (!inCall) {
    return (
      <PhoneFrame onReset={s.resetDemo}>
        <CallEnded onRejoin={() => setInCall(true)} />
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
    muted: s.muted,
    speakingSeconds: s.speakingSeconds,
    meId: s.meId,
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
          submitLabel={t.range.submitSaveRange}
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
        meId={s.meId}
        micOpen={s.micOpen}
        onToggleMic={() => s.setMic(!s.micOpen)}
        chat={s.chat}
        onSendChat={s.sendChat}
        leftIds={s.leftIds}
        // The teacher hosts the room, so `leaveRoom()` is a no-op for them by
        // design (hooks/useSessionState.ts) — a host leaving would empty the
        // room for everyone else. Route the shell's leave control to the
        // audit log instead of wiring a leave that would not actually happen.
        onLeave={() => setInCall(false)}
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
