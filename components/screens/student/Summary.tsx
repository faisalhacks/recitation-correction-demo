"use client";

/**
 * Student's turn summary (BUILD_BRIEF.md §8.6).
 *
 * Opens automatically when the teacher finishes the student's turn — the
 * student's first sight of the marks, which were deliberately hidden during
 * recitation (see StudentMeeting.tsx). Reads as a debrief, not a scoreboard:
 * totals up front, the passage in context, then every mark spelled out.
 *
 * A mark can sit outside the current range if the teacher narrowed the range
 * mid-turn (§10 — marks outside a new range are kept, never deleted).
 * `AyahText` only renders words inside `range`, so those marks are listed
 * here but will not appear underlined in the passage above.
 */

import type { AyahRange, MistakeType, RecitationType } from "@/lib/eventLog";
import { MISTAKE_META, RECITATION_META } from "@/lib/eventLog";
import { formatRange, formatRangeShort, getWordText } from "@/lib/quran";
import { formatDuration } from "@/hooks/useElapsed";
import { AyahText } from "@/components/quran/AyahText";
import { Button, Card, Chip, Dot, EmptyState, SectionTitle, StatTile } from "@/components/ui/primitives";
import { t } from "@/lib/i18n";

export type SummaryMark = {
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  type: MistakeType;
  note: string;
};

function elapsedSeconds(startedAt: string, finishedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 1000));
}

function isOutOfRange(mark: SummaryMark, range: AyahRange): boolean {
  const lo = Math.min(range.from, range.to);
  const hi = Math.max(range.from, range.to);
  return mark.surah !== range.surah || mark.ayah < lo || mark.ayah > hi;
}

export function Summary({
  studentName,
  range,
  recType,
  marks,
  startedAt,
  finishedAt,
  ayahCount,
  wordCount,
  onViewProgress,
  onBackToMeeting,
}: {
  studentName: string;
  range: AyahRange;
  recType: RecitationType;
  marks: SummaryMark[];
  startedAt: string;
  finishedAt: string;
  ayahCount: number;
  wordCount: number;
  onViewProgress: () => void;
  onBackToMeeting: () => void;
}) {
  const duration = formatDuration(elapsedSeconds(startedAt, finishedAt));

  const counts = new Map<MistakeType, number>();
  for (const m of marks) counts.set(m.type, (counts.get(m.type) ?? 0) + 1);
  const occurredTypes = (Object.keys(MISTAKE_META) as MistakeType[]).filter(
    (t) => (counts.get(t) ?? 0) > 0,
  );

  const orderedMarks = [...marks].sort((a, b) =>
    a.surah !== b.surah
      ? a.surah - b.surah
      : a.ayah !== b.ayah
        ? a.ayah - b.ayah
        : a.wordIndex - b.wordIndex,
  );

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <Card className="px-4 py-3">
        <p className="text-[13px] text-dim">{t.summary.turnOf(studentName)}</p>
        <p className="text-[16px] font-medium text-fg mt-0.5">
          {formatRange(range.surah, range.from, range.to)}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Chip tone="green">{RECITATION_META[recType].label}</Chip>
          <Chip tone="neutral">{duration}</Chip>
        </div>
      </Card>

      <Card className="px-4 py-3 flex flex-col gap-3">
        <SectionTitle>{t.summary.totals}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label={t.summary.statAyahs} value={ayahCount} />
          <StatTile label={t.summary.statWords} value={wordCount} />
          <StatTile label={t.summary.statMarks} value={marks.length} />
        </div>
        {occurredTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {occurredTypes.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border bg-field text-muted border-line-strong"
              >
                <Dot color={MISTAKE_META[t].color} />
                {MISTAKE_META[t].label}
                <span className="text-fg font-medium tabular-nums">
                  {counts.get(t)}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="px-3 py-3">
        <SectionTitle>{t.summary.passage}</SectionTitle>
        <div className="mt-2">
          <AyahText surah={range.surah} from={range.from} to={range.to} marks={marks} />
        </div>
      </Card>

      <Card className="px-4 py-3 flex flex-col gap-3">
        <SectionTitle>{t.summary.markedWords}</SectionTitle>
        {orderedMarks.length === 0 ? (
          <EmptyState title={t.summary.cleanTurnTitle}>
            {t.summary.cleanTurnBody}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {orderedMarks.map((mark, i) => {
              const text = getWordText(mark.surah, mark.ayah, mark.wordIndex);
              const outOfRange = isOutOfRange(mark, range);
              return (
                <Card as="li" key={`${mark.surah}:${mark.ayah}:${mark.wordIndex}:${i}`} className="px-3 py-2.5 flex items-start gap-3">
                  <span
                    dir="rtl"
                    lang="ar"
                    className="arabic text-2xl shrink-0"
                    style={{ lineHeight: 1.6 }}
                  >
                    {text ?? "—"}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0 grow">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-dim tabular-nums">
                        {formatRangeShort(mark.surah, mark.ayah, mark.ayah)}
                      </span>
                      {outOfRange ? (
                        <Chip tone="neutral">{t.summary.outsideCurrentRange}</Chip>
                      ) : null}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg">
                      <Dot color={MISTAKE_META[mark.type].color} />
                      {MISTAKE_META[mark.type].label}
                    </span>
                    <p className="text-[13px] text-muted leading-snug">
                      {mark.note ? (
                        // Teacher-typed free text — script unknown, so let the
                        // browser pick its own direction rather than inherit ours.
                        <span dir="auto">{mark.note}</span>
                      ) : (
                        <span className="text-faint italic">{t.summary.noNoteAdded}</span>
                      )}
                    </p>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex flex-col gap-2 pb-2">
        <Button variant="primary" full onClick={onViewProgress}>
          {t.summary.viewProgress}
        </Button>
        <Button variant="secondary" full onClick={onBackToMeeting}>
          {t.summary.backToMeeting}
        </Button>
      </div>
    </div>
  );
}
