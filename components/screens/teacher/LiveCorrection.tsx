"use client";

/**
 * Teacher's live correction view (BUILD_BRIEF.md §9, mockup
 * reference/teacher_live_correction_screen.html), rendered as a full-height
 * overlay on top of the meeting by the route. We return only the panel's own
 * content — no <PhoneFrame> and no overlay positioning here.
 *
 * Every count and highlight is derived from `marks`; nothing here is
 * hardcoded. No mic or voice-note control anywhere (BUILD_BRIEF.md §2c).
 */

import { useState } from "react";
import type { AyahRange, MistakeType, RecitationType } from "@/lib/eventLog";
import { MISTAKE_META, MISTAKE_TYPES, RECITATION_META } from "@/lib/eventLog";
import { formatRangeShort, getSurahMeta, getWordText } from "@/lib/quran";
import { AyahText, MistakeLegend } from "@/components/quran/AyahText";
import { Avatar, Button, Card, Chip, Dot } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { formatDuration, useElapsed } from "@/hooks/useElapsed";
import { t } from "@/lib/i18n";

export type LiveMark = {
  surah: number;
  ayah: number;
  /** 1-based. */
  wordIndex: number;
  type: MistakeType;
  note: string;
};

type TappedWord = {
  surah: number;
  ayah: number;
  wordIndex: number;
};

export function LiveCorrection({
  studentName,
  range,
  recType,
  marks,
  startedAt,
  onAddMark,
  onRemoveMark,
  onChangeRange,
  onFinishTurn,
  onClose,
}: {
  studentName: string;
  range: AyahRange;
  recType: RecitationType;
  marks: LiveMark[];
  startedAt: string | null;
  onAddMark: (mark: LiveMark) => void;
  onRemoveMark: (surah: number, ayah: number, wordIndex: number) => void;
  onChangeRange: () => void;
  onFinishTurn: () => void;
  onClose: () => void;
}) {
  const elapsed = useElapsed(startedAt);

  const [tapped, setTapped] = useState<TappedWord | null>(null);
  const [selectedType, setSelectedType] = useState<MistakeType>(
    MISTAKE_TYPES[0],
  );
  const [note, setNote] = useState("");

  const surahName = getSurahMeta(range.surah)?.nameSimple ?? t.correction.surahFallback(range.surah);

  // Marks outside the current range are kept, never deleted (BUILD_BRIEF.md
  // §10) — but AyahText only renders words inside `range`, so we surface a
  // short count here or they'd silently disappear from the teacher's view.
  const outsideCount = marks.filter(
    (m) => m.surah !== range.surah || m.ayah < range.from || m.ayah > range.to,
  ).length;

  const existingMark = tapped
    ? marks.find(
        (m) =>
          m.surah === tapped.surah &&
          m.ayah === tapped.ayah &&
          m.wordIndex === tapped.wordIndex,
      ) ?? null
    : null;

  const tappedWordText = tapped
    ? getWordText(tapped.surah, tapped.ayah, tapped.wordIndex)
    : null;

  function handleWordTap(surah: number, ayah: number, wordIndex: number) {
    const existing = marks.find(
      (m) => m.surah === surah && m.ayah === ayah && m.wordIndex === wordIndex,
    );
    setSelectedType(existing?.type ?? MISTAKE_TYPES[0]);
    setNote(existing?.note ?? "");
    setTapped({ surah, ayah, wordIndex });
  }

  function closeSheet() {
    setTapped(null);
  }

  function handleSave() {
    if (!tapped) return;
    onAddMark({
      surah: tapped.surah,
      ayah: tapped.ayah,
      wordIndex: tapped.wordIndex,
      type: selectedType,
      note: note.trim(),
    });
    setTapped(null);
  }

  function handleRemove() {
    if (!tapped) return;
    onRemoveMark(tapped.surah, tapped.ayah, tapped.wordIndex);
    setTapped(null);
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.correction.closeAria}
          className="text-[22px] text-fg leading-none px-1 -ms-1 rounded-field"
        >
          {/* This is a chevron glyph, not an "X" — it is directional, so it mirrors under RTL. */}
          ›
        </button>
        <span className="text-base font-medium flex-1">{t.correction.title}</span>
        <span
          role="status"
          aria-label={t.correction.elapsedAria(formatDuration(elapsed))}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
            startedAt
              ? "bg-green-bright/12 text-green-bright"
              : "bg-field text-muted"
          }`}
        >
          <span
            aria-hidden
            className={`w-1.5 h-1.5 rounded-full ${
              startedAt ? "bg-green-bright animate-pulse" : "bg-faint"
            }`}
          />
          {/* A clock reading is a Latin/numeric run; isolate it from the Arabic around it. */}
          <span dir="ltr">{formatDuration(elapsed)}</span>
        </span>
      </div>

      <Card className="mx-4 px-3 py-3 flex items-center gap-3 shrink-0">
        <Avatar name={studentName} />
        <div className="flex-1 min-w-0">
          {/* Student-entered name — isolate it so Arabic around it can't reorder a script we don't control. */}
          <p className="text-sm font-medium text-fg truncate">
            <bdi>{studentName}</bdi>
          </p>
          <p className="text-xs text-green-bright">{t.correction.recitingNow}</p>
        </div>
      </Card>

      <div className="px-4 pt-3.5 flex flex-wrap items-center gap-2 shrink-0">
        <span className="text-sm font-medium text-fg">{surahName}</span>
        <Chip tone="green">
          <span dir="ltr">{formatRangeShort(range.surah, range.from, range.to)}</span>
        </Chip>
        <Chip>{RECITATION_META[recType].label}</Chip>
      </div>
      <div className="px-4 pt-1 pb-0.5 text-xs text-muted shrink-0">
        {t.correction.markedCount(marks.length)}
      </div>
      {outsideCount > 0 ? (
        <p className="px-4 pb-1 text-xs text-dim shrink-0">
          {t.correction.outsideRangeNote(outsideCount)}
        </p>
      ) : null}
      <p className="px-4 pb-2 text-xs text-dim shrink-0">
        {t.correction.tapWordHint}
      </p>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4 min-h-0">
        <Card className="px-3.5 py-4">
          <AyahText
            surah={range.surah}
            from={range.from}
            to={range.to}
            marks={marks}
            onWordTap={handleWordTap}
            size="large"
          />
        </Card>
        <MistakeLegend className="pt-3.5 px-1" />
      </div>

      <div className="flex gap-2.5 px-4 pb-4 pt-1 shrink-0">
        <Button variant="secondary" className="flex-1" onClick={onChangeRange}>
          {t.correction.changeRange}
        </Button>
        <Button className="flex-1" onClick={onFinishTurn}>
          {t.correction.finishTurn}
        </Button>
      </div>

      <Sheet open={tapped !== null} onClose={closeSheet} title={t.correction.markMistakeSheetTitle}>
        {tapped ? (
          <>
            <div
              dir="rtl"
              lang="ar"
              className="arabic text-center bg-field border border-line-strong rounded-field px-3 py-3.5 mb-3.5"
              style={{ fontSize: "30px" }}
            >
              {tappedWordText ?? "—"}
            </div>

            <div
              role="radiogroup"
              aria-label={t.correction.mistakeTypeAria}
              className="flex flex-wrap gap-2 mb-3.5"
            >
              {MISTAKE_TYPES.map((t) => {
                const meta = MISTAKE_META[t];
                const active = selectedType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedType(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] border transition-colors"
                    style={
                      active
                        ? {
                            borderColor: meta.color,
                            background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
                            color: meta.color,
                          }
                        : { borderColor: "var(--color-line-strong)" }
                    }
                  >
                    <Dot color={meta.color} />
                    <span className={active ? "" : "text-muted"}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="block mb-3.5">
              <span className="sr-only">{t.correction.noteSrLabel}</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.correction.notePlaceholder}
                // User-typed text of unknown script — let the browser pick direction.
                dir="auto"
                className="w-full h-10 bg-field border border-line-strong rounded-field px-3 text-[13px] text-fg"
              />
            </label>

            <div className="flex gap-2.5 items-center">
              <Button full onClick={handleSave}>
                {t.correction.saveMark}
              </Button>
              {existingMark ? (
                <Button variant="danger" onClick={handleRemove}>
                  {t.correction.remove}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
