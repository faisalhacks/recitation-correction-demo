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
  return (
    <p className="text-[11px] text-dim mt-2">
      Includes {count} sample {count === 1 ? "turn" : "turns"}.
    </p>
  );
}

function StatGrid({ data }: { data: ProgressData }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatTile label="Turns completed" value={data.turns} />
      <StatTile label="Ayahs recited" value={data.ayahs} />
      <StatTile label="Words recited" value={data.words} />
      <StatTile label="Total mistakes" value={data.mistakes} />
      <StatTile
        label="Avg mistakes / turn"
        value={data.avgMistakesPerTurn.toFixed(1)}
      />
      <StatTile
        label="Accuracy"
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
          aria-label="Back"
          className="text-[22px] text-fg leading-none px-1 -ml-1 rounded-field"
        >
          ‹
        </button>
        <span className="text-base font-medium">Progress</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-6 flex flex-col gap-5">
        {/* --- your own turns ------------------------------------------- */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            Your turns
          </h2>
          {myData.turns === 0 ? (
            <EmptyState title="You haven't recited a turn yet.">
              Take a turn in the queue and your own numbers will show up
              here.
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
            Whole halaqah
          </h2>
          <StatGrid data={data} />
          <SampleNote count={data.seededTurns} />
        </section>

        {/* --- most common mistake type ------------------------------------ */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            Most common mistake
          </h2>
          {data.mostCommonType ? (
            <Card className="px-3.5 py-3.5 flex items-center gap-2.5">
              <Dot color={MISTAKE_META[data.mostCommonType].color} />
              <span className="text-[15px] text-fg font-medium">
                {MISTAKE_META[data.mostCommonType].label}
              </span>
              <span className="text-[13px] text-dim ml-auto tabular-nums">
                {data.byType[data.mostCommonType]} marks
              </span>
            </Card>
          ) : (
            <EmptyState title="No mistakes recorded yet." />
          )}
          <SampleNote count={data.seededTurns} />
        </section>

        {/* --- mistakes per turn, and the per-turn list -------------------- */}
        <section>
          <h2 className="text-[15px] font-medium text-fg mb-2.5">
            Mistakes per turn
          </h2>
          {data.perTurn.length === 0 ? (
            <EmptyState title="No turns completed yet in this halaqah." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.perTurn.map((turn) => (
                <li key={turn.turnId}>
                  <Card className="px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] text-fg font-medium">
                        {turn.label}
                      </span>
                      <span className="text-[12px] text-dim truncate">
                        {turn.studentName}
                      </span>
                      {turn.seeded ? (
                        <Chip tone="amber" className="shrink-0">
                          Sample
                        </Chip>
                      ) : null}
                      <span className="ml-auto text-[12px] text-dim tabular-nums shrink-0">
                        {turn.mistakes}{" "}
                        {turn.mistakes === 1 ? "mistake" : "mistakes"}
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
            Breakdown by mistake type
          </h2>
          {typeEntries.length === 0 ? (
            <EmptyState title="No mistakes have been marked in these turns yet." />
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
                  <span className="text-[12px] text-dim tabular-nums w-6 text-right shrink-0">
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
