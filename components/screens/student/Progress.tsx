/**
 * Student Progress — the screen this whole demo argues for. The existing
 * app's Progress screen is all zeroes; every number here is computed from
 * saved turns and must visibly be so (BUILD_BRIEF.md §8.7).
 *
 * Returns only the inner content of the phone frame (no <PhoneFrame> here).
 */

import type { MistakeType } from "@/lib/eventLog";
import { MISTAKE_META, MISTAKE_TYPES } from "@/lib/eventLog";
import { Card, Chip, Dot, EmptyState, StatTile } from "@/components/ui/primitives";
import { t } from "@/lib/i18n";

export type ProgressTurn = {
  turnId: string;
  label: string;
  studentName: string;
  mistakes: number;
  ayahs: number;
  words: number;
  seeded: boolean;
};

export type ProgressData = {
  turns: number;
  ayahs: number;
  words: number;
  mistakes: number;
  avgMistakesPerTurn: number;
  accuracyPct: number;
  byType: Record<MistakeType, number>;
  mostCommonType: MistakeType | null;
  perTurn: ProgressTurn[];
  seededTurns: number;
};

function SampleNote({ count }: { count: number }) {
  if (count <= 0) return null;
  // sampleNote() already returns the full Arabic sentence with the count
  // agreed per Arabic's one/dual/few/many rule, not an English-shaped ternary.
  return <p className="text-[11px] text-dim mt-2">{t.progress.sampleNote(count)}</p>;
}

function StatGrid({ data }: { data: ProgressData }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatTile label={t.progress.statTurnsCompleted} value={data.turns} />
      <StatTile label={t.progress.statAyahsRecited} value={data.ayahs} />
      <StatTile label={t.progress.statWordsRecited} value={data.words} />
      <StatTile label={t.progress.statTotalMistakes} value={data.mistakes} />
      <StatTile
        label={t.progress.statAvgMistakesPerTurn}
        value={data.avgMistakesPerTurn.toFixed(1)}
      />
      <StatTile
        label={t.progress.statAccuracy}
        value={`${Math.round(data.accuracyPct)}%`}
      />
    </div>
  );
}

export function Progress({
  data,
  myData,
  onBack,
}: {
  /** Every completed turn in the halaqah, sample history included. */
  data: ProgressData;
  /** Only the live student's own completed turns. */
  myData: ProgressData;
  onBack: () => void;
}) {
  const maxTurnMistakes = Math.max(1, ...data.perTurn.map((t) => t.mistakes));
  const typeEntries = MISTAKE_TYPES.map((t) => ({
    type: t,
    count: data.byType[t],
  })).filter((e) => e.count > 0);
  const maxTypeCount = Math.max(1, ...typeEntries.map((e) => e.count));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.progress.backAria}
          className="text-[22px] text-fg leading-none px-1 -ms-1 rounded-field"
        >
          {/* Back-navigation chevron: directional, so it mirrors under RTL. */}
          ›
        </button>
        <span className="text-base font-medium">{t.progress.title}</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-6 flex flex-col gap-5">
        {/* --- your own turns ------------------------------------------- */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            {t.progress.yourTurns}
          </h2>
          {myData.turns === 0 ? (
            <EmptyState title={t.progress.noTurnsYetTitle}>
              {t.progress.noTurnsYetBody}
            </EmptyState>
          ) : (
            <>
              <StatGrid data={myData} />
              <SampleNote count={myData.seededTurns} />
            </>
          )}
        </section>

        {/* --- the whole halaqah ------------------------------------------ */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            {t.progress.wholeHalaqah}
          </h2>
          <StatGrid data={data} />
          <SampleNote count={data.seededTurns} />
        </section>

        {/* --- most common mistake type ------------------------------------ */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            {t.progress.mostCommonMistake}
          </h2>
          {data.mostCommonType ? (
            <Card className="px-3.5 py-3.5 flex items-center gap-2.5">
              <Dot color={MISTAKE_META[data.mostCommonType].color} />
              <span className="text-[15px] text-fg font-medium">
                {MISTAKE_META[data.mostCommonType].label}
              </span>
              <span className="text-[13px] text-dim ms-auto tabular-nums">
                {t.progress.marksCount(data.byType[data.mostCommonType])}
              </span>
            </Card>
          ) : (
            <EmptyState title={t.progress.noMistakesRecordedYet} />
          )}
          <SampleNote count={data.seededTurns} />
        </section>

        {/* --- mistakes per turn, and the per-turn list -------------------- */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            {t.progress.mistakesPerTurn}
          </h2>
          {data.perTurn.length === 0 ? (
            <EmptyState title={t.progress.noTurnsCompletedYet} />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.perTurn.map((turn) => (
                <li key={turn.turnId}>
                  <Card className="px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] text-fg font-medium">
                        {turn.label}
                      </span>
                      {/* Student-entered name — isolate it so Arabic around it
                          can't reorder a script we don't control. */}
                      <bdi className="text-[12px] text-dim truncate">
                        {turn.studentName}
                      </bdi>
                      {turn.seeded ? (
                        <Chip tone="amber" className="shrink-0">
                          {t.progress.sampleChip}
                        </Chip>
                      ) : null}
                      <span className="ms-auto text-[12px] text-dim tabular-nums shrink-0">
                        {t.progress.mistakesCount(turn.mistakes)}
                      </span>
                    </div>
                    <div className="h-2 bg-field rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-bright rounded-full"
                        style={{
                          width: `${(turn.mistakes / maxTurnMistakes) * 100}%`,
                        }}
                      />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <SampleNote count={data.seededTurns} />
        </section>

        {/* --- breakdown by mistake type ------------------------------------ */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            {t.progress.breakdownByType}
          </h2>
          {typeEntries.length === 0 ? (
            <EmptyState title={t.progress.noMistakesMarkedYet} />
          ) : (
            <ul className="flex flex-col gap-2">
              {typeEntries.map(({ type, count }) => (
                <li key={type} className="flex items-center gap-2.5">
                  <Dot color={MISTAKE_META[type].color} />
                  <span className="text-[13px] text-fg w-[80px] shrink-0">
                    {MISTAKE_META[type].label}
                  </span>
                  <div className="flex-1 h-2 bg-field rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / maxTypeCount) * 100}%`,
                        background: MISTAKE_META[type].color,
                      }}
                    />
                  </div>
                  <span className="text-[12px] text-dim tabular-nums w-6 text-end shrink-0">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <SampleNote count={data.seededTurns} />
        </section>
      </div>
    </div>
  );
}
