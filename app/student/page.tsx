"use client";

/**
 * The student's whole journey, as a state machine over derived state.
 *
 * There are no per-screen URLs on purpose. Which screen shows is a function of
 * the log, so when the teacher starts or finishes a turn in the other tab this
 * screen follows along by itself — no navigation to race, and the summary
 * "opens automatically" (BUILD_BRIEF.md §3.5) because the state says it should.
 *
 * Two things are NOT in the log and stay here: whether this tab has joined the
 * call, and which overlay this person has open. Both are one viewer's business.
 * Joining is per-tab by nature — reload and you are back at the join screen,
 * which is exactly how joining a call behaves.
 */

import { useState } from "react";

import { CallEnded } from "@/components/meeting/CallEnded";
import { PrejoinScreen } from "@/components/meeting/PrejoinScreen";
import { Progress } from "@/components/screens/student/Progress";
import { RangePicker } from "@/components/screens/student/RangePicker";
import { StudentMeeting } from "@/components/screens/student/StudentMeeting";
import { Summary } from "@/components/screens/student/Summary";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { useSessionState } from "@/hooks/useSessionState";
import { LIVE_STUDENT_ID, LIVE_STUDENT_NAME } from "@/lib/eventLog";
import { t } from "@/lib/i18n";
import { buildParticipants } from "@/lib/participants";

type CallState = "prejoin" | "in" | "left";

export default function StudentRoute() {
  const s = useSessionState("student");

  const [call, setCall] = useState<CallState>("prejoin");
  const [name, setName] = useState(LIVE_STUDENT_NAME);
  /** Overlays the student opens themselves; null means "follow the log". */
  const [overlay, setOverlay] = useState<"range" | "progress" | null>(null);
  /** The turn whose summary has been read, so it stops reappearing. */
  const [seenTurnId, setSeenTurnId] = useState<string | null>(null);

  if (!s.ready) {
    return (
      <PhoneFrame>
        <div className="flex-1" />
      </PhoneFrame>
    );
  }

  const frame = (children: React.ReactNode) => (
    <PhoneFrame onReset={s.resetDemo}>{children}</PhoneFrame>
  );

  /* --- the call itself ---------------------------------------------------- */

  if (call === "prejoin") {
    return frame(
      <PrejoinScreen
        person={{
          id: LIVE_STUDENT_ID,
          name,
          isSelf: true,
          muted: !s.micOpen,
        }}
        name={name}
        onNameChange={setName}
        micOpen={s.micOpen}
        onToggleMic={() => s.setMic(!s.micOpen)}
        onJoin={() => setCall("in")}
        onJoinLowBandwidth={() => setCall("in")}
        onClose={() => setCall("in")}
      />,
    );
  }

  if (call === "left") {
    return frame(<CallEnded onRejoin={() => setCall("in")} />);
  }

  /* --- overlays the student asked for ------------------------------------ */

  if (overlay === "progress") {
    return frame(
      <Progress
        data={s.progress}
        myData={s.progressFor(LIVE_STUDENT_ID)}
        onBack={() => setOverlay(null)}
      />,
    );
  }

  if (overlay === "range" && s.myEntry) {
    return frame(
      <RangePicker
        initial={{ range: s.myEntry.range, recType: s.myEntry.recType }}
        submitLabel={t.range.submitSaveRange}
        onCancel={() => setOverlay(null)}
        onSubmit={(range) => {
          s.changeRange(LIVE_STUDENT_ID, range, "student");
          setOverlay(null);
        }}
      />,
    );
  }

  /* --- otherwise the log decides ----------------------------------------- */

  const finishedTurn =
    s.myEntry?.status === "done" && s.myLastTurn ? s.myLastTurn : null;
  const unreadSummary =
    finishedTurn && finishedTurn.turnId !== seenTurnId ? finishedTurn : null;

  if (unreadSummary) {
    return frame(
      <Summary
        studentName={unreadSummary.name}
        range={unreadSummary.range}
        recType={unreadSummary.recType}
        marks={unreadSummary.marks}
        startedAt={unreadSummary.startedAt}
        finishedAt={unreadSummary.finishedAt}
        ayahCount={unreadSummary.ayahCount}
        wordCount={unreadSummary.wordCount}
        onViewProgress={() => {
          setSeenTurnId(unreadSummary.turnId);
          setOverlay("progress");
        }}
        onBackToMeeting={() => setSeenTurnId(unreadSummary.turnId)}
      />,
    );
  }

  // Not in the queue — a first visit, a finished turn already reviewed, or a
  // rejoin after leaving. In every case, picking a passage is how you go again.
  if (!s.myEntry || finishedTurn) {
    return frame(
      <RangePicker
        initial={
          s.myEntry
            ? { range: s.myEntry.range, recType: s.myEntry.recType }
            : null
        }
        submitLabel={t.range.submitJoin}
        onSubmit={(range, recType) => s.joinQueue(range, recType, name)}
      />,
    );
  }

  const participants = buildParticipants({
    queue: s.queue,
    activeStudentId: s.activeStudentId,
    muted: s.muted,
    speakingSeconds: s.speakingSeconds,
    meId: s.meId,
  });

  // The halaqah's clock: when the first student joined.
  const meetingStartedAt = s.queue.length > 0 ? s.queue[0].joinedAt : null;

  return frame(
    <StudentMeeting
      participants={participants}
      speakerId={s.activeStudentId}
      startedAt={meetingStartedAt}
      meId={s.meId}
      micOpen={s.micOpen}
      onToggleMic={() => s.setMic(!s.micOpen)}
      chat={s.chat}
      onSendChat={s.sendChat}
      leftIds={s.leftIds}
      onLeave={() => {
        s.leaveRoom();
        setCall("left");
      }}
      range={s.myEntry.range}
      recType={s.myEntry.recType}
      position={s.myPosition}
      amReciting={s.amReciting}
      isOnBreak={s.isOnBreak}
      onEditRange={() => setOverlay("range")}
      onOpenProgress={() => setOverlay("progress")}
    />,
  );
}
