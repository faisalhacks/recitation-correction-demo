"use client";

/**
 * Teacher's view inside the simulated meeting (BUILD_BRIEF.md §18, §9.8).
 *
 * The Participants panel lives behind a Sheet reached from the control bar,
 * alongside the audit-log entry point. The meeting body itself stays a short
 * summary of who is reciting (or that nobody is), plus the break toggle —
 * the one piece of room state whose consequence the student tabs show too,
 * so it needs to read just as plainly here.
 */

import { useState } from "react";

import type { AyahRange, RecitationType } from "@/lib/eventLog";
import type { Participant } from "@/components/shell/MeetingShell";
import { MeetingShell } from "@/components/shell/MeetingShell";
import { Sheet } from "@/components/ui/Sheet";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
} from "@/components/ui/primitives";
import { RECITATION_META } from "@/lib/eventLog";
import { formatRange } from "@/lib/quran";

export type QueueRow = {
  studentId: string;
  name: string;
  range: AyahRange;
  recType: RecitationType;
  status: "waiting" | "reciting" | "done";
};

const STATUS_LABEL: Record<QueueRow["status"], string> = {
  waiting: "Waiting",
  reciting: "Reciting",
  done: "Done",
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

  let label = row.status === "done" ? "Start another turn" : "Start turn";
  if (isActive) label = "Open correction view";

  const disabledReason = blocked
    ? `Finish ${activeName ?? "the current student"}'s turn first`
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
        <span className="flex flex-col items-start min-w-0 text-left">
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
  queue,
  activeStudentId,
  isOnBreak,
  onStartTurn,
  onToggleBreak,
  onOpenAudit,
}: {
  participants: Participant[];
  speakerId: string | null;
  startedAt: string | null;
  queue: QueueRow[];
  activeStudentId: string | null;
  isOnBreak: boolean;
  onStartTurn: (studentId: string) => void;
  onToggleBreak: (on: boolean) => void;
  onOpenAudit: () => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeRow = queue.find((r) => r.studentId === activeStudentId);

  const controls = (
    <>
      <Button variant="secondary" onClick={() => setPanelOpen(true)}>
        Participants ({queue.length})
      </Button>
      <Button variant="secondary" onClick={onOpenAudit}>
        Audit log
      </Button>
    </>
  );

  return (
    <MeetingShell
      participants={participants}
      speakerId={speakerId}
      startedAt={startedAt}
      controls={controls}
    >
      <div className="px-4 py-4 flex flex-col gap-3">
        <Card className="px-4 py-3">
          {activeRow ? (
            <>
              <p className="text-[15px] font-medium text-green-bright">
                {activeRow.name} is reciting
              </p>
              <p className="text-xs text-dim mt-0.5">
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
                Nobody is reciting yet
              </p>
              <p className="text-xs text-dim mt-0.5">
                Open Participants to start a student&apos;s turn.
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
              {isOnBreak ? "Teacher is on a break" : "Break is off"}
            </p>
            <p className="text-xs text-dim mt-0.5">
              {isOnBreak
                ? "Students waiting in the queue see this too."
                : "Students can be called up as usual."}
            </p>
          </div>
          <Button
            variant={isOnBreak ? "primary" : "secondary"}
            onClick={() => onToggleBreak(!isOnBreak)}
          >
            {isOnBreak ? "End break" : "Take a break"}
          </Button>
        </Card>
      </div>

      <Sheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={`Participants (${queue.length})`}
      >
        {queue.length === 0 ? (
          <EmptyState title="No students in the queue">
            Students will appear here once they join the halaqah.
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
