"use client";

/**
 * Student's view inside the meeting (BUILD_BRIEF.md §18).
 *
 * Two states: waiting in the queue (range still editable, break banner) and
 * reciting (ayahs shown, no marks — the student only sees the teacher's marks
 * once the turn ends, per §4 "Mark visibility" and §10).
 *
 * This is the green panel that rides on top of the call. The meeting chrome
 * around it belongs to the other layer and is not restyled here.
 */

import type { ChatMessage } from "@/lib/state";
import type { AyahRange, RecitationType } from "@/lib/eventLog";
import type { MeetingPerson } from "@/components/meeting/chrome";
import { MeetingShell } from "@/components/meeting/MeetingShell";
import { AyahText } from "@/components/quran/AyahText";
import { Button, Card, Chip } from "@/components/ui/primitives";
import { RECITATION_META } from "@/lib/eventLog";
import { t } from "@/lib/i18n";
import { formatRange } from "@/lib/quran";

export function StudentMeeting({
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
  range,
  recType,
  position,
  amReciting,
  isOnBreak,
  onEditRange,
  onOpenProgress,
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
  range: AyahRange;
  recType: RecitationType;
  /** 1-based place in the waiting line, or null when not waiting. */
  position: number | null;
  amReciting: boolean;
  isOnBreak: boolean;
  onEditRange: () => void;
  onOpenProgress: () => void;
}) {
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
        {amReciting ? (
          <>
            <Card className="px-4 py-3">
              <p className="text-[15px] font-medium text-green-bright">
                {t.queue.recitingNowTitle}
              </p>
              <p className="text-xs text-dim mt-0.5">
                {formatRange(range.surah, range.from, range.to)} ·{" "}
                {RECITATION_META[recType].label}
              </p>
            </Card>

            <Card className="px-3 py-3">
              {/* Privacy rule (BUILD_BRIEF.md §4, §10): the student must not
                  see the teacher's marks while reciting, so no `marks` and no
                  `onWordTap` are passed here — marks only appear in the
                  summary after the turn ends. */}
              <AyahText
                surah={range.surah}
                from={range.from}
                to={range.to}
                marks={[]}
              />
            </Card>

            <p className="text-xs text-dim text-center px-2">
              {t.queue.willSeeNotesLater}
            </p>
          </>
        ) : (
          <>
            <Card className="px-4 py-3">
              <p className="text-[15px] font-medium text-fg">
                {t.queue.waitingTitle}
              </p>
              <p className="text-xs text-dim mt-0.5">
                {/* Cardinal, not an ordinal: Arabic ordinals turn irregular
                    past ten and buy nothing on a queue position. */}
                {position === null
                  ? t.queue.waitingSoonAdded
                  : t.queue.positionInLine(position)}
              </p>
            </Card>

            {isOnBreak ? (
              <Card className="px-4 py-3 border-amber/30 bg-amber/8">
                <p className="text-[13px] text-amber font-medium">
                  {t.queue.teacherOnBreak}
                </p>
                <p className="text-xs text-dim mt-0.5">
                  {t.queue.breakWillResume}
                </p>
              </Card>
            ) : null}

            <Card className="px-4 py-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] text-fg">
                    {formatRange(range.surah, range.from, range.to)}
                  </p>
                  <Chip tone="green" className="mt-1.5">
                    {RECITATION_META[recType].label}
                  </Chip>
                </div>
              </div>
              <Button variant="secondary" onClick={onEditRange}>
                {t.queue.changeRange}
              </Button>
              <Button variant="ghost" onClick={onOpenProgress}>
                {t.queue.progressButton}
              </Button>
            </Card>
          </>
        )}
      </div>
    </MeetingShell>
  );
}
