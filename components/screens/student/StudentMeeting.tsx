"use client";

/**
 * Student's view inside the simulated meeting (BUILD_BRIEF.md §18).
 *
 * Two states: waiting in the queue (range still editable, break banner) and
 * reciting (ayahs shown, no marks — the student only sees the teacher's
 * marks once the turn ends, per §4 "Mark visibility" and §10).
 */

import type { AyahRange, RecitationType } from "@/lib/eventLog";
import type { Participant } from "@/components/shell/MeetingShell";
import { MeetingShell } from "@/components/shell/MeetingShell";
import { AyahText } from "@/components/quran/AyahText";
import { Button, Card, Chip } from "@/components/ui/primitives";
import { RECITATION_META } from "@/lib/eventLog";
import { formatRange } from "@/lib/quran";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function StudentMeeting({
  participants,
  speakerId,
  startedAt,
  range,
  recType,
  position,
  amReciting,
  isOnBreak,
  onEditRange,
  onOpenProgress,
}: {
  participants: Participant[];
  speakerId: string | null;
  startedAt: string | null;
  range: AyahRange;
  recType: RecitationType;
  /** 1-based place in the waiting line, or null when not waiting. */
  position: number | null;
  amReciting: boolean;
  isOnBreak: boolean;
  onEditRange: () => void;
  onOpenProgress: () => void;
}) {
  const controls = (
    <Button variant="secondary" onClick={onOpenProgress}>
      Progress
    </Button>
  );

  return (
    <MeetingShell
      participants={participants}
      speakerId={speakerId}
      startedAt={startedAt}
      controls={controls}
    >
      <div className="px-4 py-4 flex flex-col gap-3">
        {amReciting ? (
          <>
            <Card className="px-4 py-3">
              <p className="text-[15px] font-medium text-green-bright">
                Reciting now
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
              <AyahText surah={range.surah} from={range.from} to={range.to} marks={[]} />
            </Card>

            <p className="text-xs text-dim text-center px-2">
              You&apos;ll see the teacher&apos;s notes when your turn ends.
            </p>
          </>
        ) : (
          <>
            <Card className="px-4 py-3">
              <p className="text-[15px] font-medium text-fg">
                Waiting for your turn
              </p>
              <p className="text-xs text-dim mt-0.5">
                {position === null
                  ? "You'll be added to the line shortly."
                  : `You're ${ordinal(position)} in line`}
              </p>
            </Card>

            {isOnBreak ? (
              <Card className="px-4 py-3 border-amber/30 bg-amber/8">
                <p className="text-[13px] text-amber font-medium">
                  Teacher is on a break
                </p>
                <p className="text-xs text-dim mt-0.5">
                  The halaqah will resume shortly.
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
                Change range
              </Button>
            </Card>
          </>
        )}
      </div>
    </MeetingShell>
  );
}
