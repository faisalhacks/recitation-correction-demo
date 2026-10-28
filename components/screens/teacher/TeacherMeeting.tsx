"use client";

/**
 * Teacher's view inside the simulated meeting (BUILD_BRIEF.md §18, §9.8).
 *
 * The Participants panel lives behind a Sheet reached from a button in the
 * panel body, alongside the audit-log entry point. The meeting body itself
 * stays a short summary of who is reciting (or that nobody is), plus the
 * break toggle — the one piece of room state whose consequence the student
 * tabs show too, so it needs to read just as plainly here.
 */

import { useState } from "react";

import type { ChatMessage } from "@/lib/state";
import type { AyahRange, RecitationType } from "@/lib/eventLog";
import type { MeetingPerson } from "@/components/meeting/chrome";
import { MeetingShell } from "@/components/meeting/MeetingShell";
import { Sheet } from "@/components/ui/Sheet";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
} from "@/components/ui/primitives";
import { RECITATION_META } from "@/lib/eventLog";
import { t } from "@/lib/i18n";
import { formatRange } from "@/lib/quran";

export type QueueRow = {
  studentId: string;
  name: string;
  range: AyahRange;
  recType: RecitationType;
  status: "waiting" | "reciting" | "done";
};

const STATUS_LABEL: Record<QueueRow["status"], string> = {
  waiting: t.queue.statusWaiting,
  reciting: t.queue.statusReciting,
  done: t.queue.statusDone,
};

function statusChip(status: QueueRow["status"]) {
  const tone = status === "reciting" ? "green" : "neutral";
  return <Chip tone={tone}>{STATUS_LABEL[status]}</Chip>;
}

function QueueRowButton({
  row,
  activeStudentId,
  activeName,
  onStartTurn,
}: {
  row: QueueRow;
  activeStudentId: string | null;
  activeName: string | undefined;
  onStartTurn: (studentId: string) => void;
}) {
  const isActive = activeStudentId === row.studentId;
  const blocked = activeStudentId !== null && !isActive;

  let label: string =
    row.status === "done" ? t.queue.startAnotherTurn : t.queue.startTurn;
  if (isActive) label = t.queue.openCorrectionView;

  const disabledReason = blocked
    ? t.queue.finishOtherFirst(activeName ?? t.queue.currentStudentFallback)
    : undefined;

  return (
    <Button
      variant={isActive ? "primary" : "secondary"}
      disabledReason={disabledReason}
      full
      onClick={() => onStartTurn(row.studentId)}
      className="!justify-between !h-auto py-2.5"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <Avatar name={row.name} size={32} />
        <span className="flex flex-col items-start min-w-0 text-start">
          <span className="text-[14px] font-medium text-fg">{row.name}</span>
          <span className="text-[11px] text-dim truncate">
            {formatRange(row.range.surah, row.range.from, row.range.to)} ·{" "}
            {RECITATION_META[row.recType].label}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {statusChip(row.status)}
        <span className="text-xs">{label}</span>
      </span>
    </Button>
  );
}

export function TeacherMeeting({
  participants,
  speakerId,
  startedAt,
  meId,
  micOpen,
  onToggleMic,
  chat,
  onSendChat,
  leftIds,
  onLeave,
  queue,
  activeStudentId,
  isOnBreak,
  onStartTurn,
  onToggleBreak,
  onOpenAudit,
}: {
  participants: MeetingPerson[];
  speakerId: string | null;
  startedAt: string | null;
  meId: string;
  micOpen: boolean;
  onToggleMic: () => void;
  chat: readonly ChatMessage[];
  onSendChat: (text: string) => void;
  leftIds: readonly string[];
  onLeave: () => void;
  queue: QueueRow[];
  activeStudentId: string | null;
  isOnBreak: boolean;
  onStartTurn: (studentId: string) => void;
  onToggleBreak: (on: boolean) => void;
  onOpenAudit: () => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeRow = queue.find((r) => r.studentId === activeStudentId);

  return (
    <MeetingShell
      people={participants}
      speakerId={speakerId}
      startedAt={startedAt}
      meId={meId}
      micOpen={micOpen}
      onToggleMic={onToggleMic}
      chat={chat}
      onSendChat={onSendChat}
      leftIds={leftIds}
      onLeave={onLeave}
    >
      <div className="px-4 py-4 flex flex-col gap-3">
        <Card className="px-4 py-3">
          {activeRow ? (
            <>
              <p className="text-[15px] font-medium text-green-bright">
                {t.queue.recitingNowTitle}
              </p>
              <p className="text-xs text-dim mt-0.5">
                {activeRow.name} ·{" "}
                {formatRange(
                  activeRow.range.surah,
                  activeRow.range.from,
                  activeRow.range.to,
                )}{" "}
                · {RECITATION_META[activeRow.recType].label}
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-medium text-fg">
                {t.queue.nobodyReciting}
              </p>
              <p className="text-xs text-dim mt-0.5">
                {t.queue.openParticipantsHint}
              </p>
            </>
          )}
        </Card>

        <Card
          className={`px-4 py-3 flex items-center justify-between gap-3 ${
            isOnBreak ? "border-amber/30 bg-amber/8" : ""
          }`}
        >
          <div>
            <p
              className={`text-[13px] font-medium ${
                isOnBreak ? "text-amber" : "text-fg"
              }`}
            >
              {isOnBreak ? t.queue.teacherOnBreak : t.queue.breakOffTitle}
            </p>
            <p className="text-xs text-dim mt-0.5">
              {isOnBreak ? t.queue.breakOnHint : t.queue.breakOffHint}
            </p>
          </div>
          <Button
            variant={isOnBreak ? "primary" : "secondary"}
            onClick={() => onToggleBreak(!isOnBreak)}
          >
            {isOnBreak ? t.queue.endBreak : t.queue.takeBreak}
          </Button>
        </Card>

        {/* These two used to live in the shell's `controls` slot; the new
            shell has no such slot, so they are ordinary buttons here. */}
        <Card className="px-4 py-3 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => setPanelOpen(true)}>
            {t.meeting.participants} ({queue.length})
          </Button>
          <Button variant="secondary" onClick={onOpenAudit}>
            {t.queue.auditLogButton}
          </Button>
        </Card>
      </div>

      <Sheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={`${t.meeting.participants} (${queue.length})`}
      >
        {queue.length === 0 ? (
          <EmptyState title={t.queue.noStudentsInQueue}>
            {t.queue.studentsWillAppear}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {queue.map((row) => (
              <li key={row.studentId}>
                <QueueRowButton
                  row={row}
                  activeStudentId={activeStudentId}
                  activeName={activeRow?.name}
                  onStartTurn={(studentId) => {
                    onStartTurn(studentId);
                    setPanelOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </MeetingShell>
  );
}
