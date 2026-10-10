"use client";

/**
 * "Before you join" — the student picks a surah, ayah range and recitation
 * type before entering the halaqah queue, or edits an existing turn's range.
 *
 * Returns only the inner content of the phone frame (no <PhoneFrame> here) —
 * it is composed inside the caller's frame on two screens: first join and
 * range editing during a turn.
 */

import { useMemo, useState } from "react";
import type { AyahRange, RecitationType } from "@/lib/eventLog";
import { RECITATION_META } from "@/lib/eventLog";
import {
  clampRange,
  countAyahs,
  getSurahMeta,
  isPartiallyCached,
  surahList,
} from "@/lib/quran";
import { AyahText } from "@/components/quran/AyahText";
import { Button, Label, Segmented, Stepper } from "@/components/ui/primitives";

const DEFAULT_RANGE: AyahRange = { surah: 2, from: 1, to: 5 };
const DEFAULT_REC_TYPE: RecitationType = "sabaq";

export function RangePicker({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { range: AyahRange; recType: RecitationType } | null;
  submitLabel: string;
  onSubmit: (range: AyahRange, recType: RecitationType) => void;
  onCancel?: () => void;
}) {
  const surahs = surahList();
  const [range, setRange] = useState<AyahRange>(initial?.range ?? DEFAULT_RANGE);
  const [recType, setRecType] = useState<RecitationType>(
    initial?.recType ?? DEFAULT_REC_TYPE,
  );

  const meta = getSurahMeta(range.surah);
  const partial = isPartiallyCached(range.surah);
  const ayahCount = countAyahs(range.surah, range.from, range.to);

  const typeOptions = useMemo(
    () =>
      (Object.keys(RECITATION_META) as RecitationType[]).map((value) => ({
        value,
        label: RECITATION_META[value].label,
        hint: RECITATION_META[value].hint,
      })),
    [],
  );

  function changeSurah(surah: number) {
    const m = getSurahMeta(surah);
    if (!m) return;
    const next = clampRange(surah, range.from, range.to);
    setRange({ surah, from: next.from, to: next.to });
  }

  function changeFrom(from: number) {
    const next = clampRange(range.surah, from, range.to);
    setRange({ surah: range.surah, from: next.from, to: next.to });
  }

  function changeTo(to: number) {
    const next = clampRange(range.surah, range.from, to);
    setRange({ surah: range.surah, from: next.from, to: next.to });
  }

  if (!meta) {
    return (
      <div className="px-4 py-10 text-center text-sm text-dim">
        No cached surahs available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-[22px] text-fg leading-none px-1 -ml-1 rounded-field"
          >
            ‹
          </button>
        ) : null}
        <span className="text-base font-medium">Before you join</span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4">
        <div className="text-xs font-medium text-green-bright tracking-wide pb-2.5">
          WHAT ARE YOU RECITING?
        </div>

        <Label>Surah</Label>
        <select
          value={range.surah}
          onChange={(e) => changeSurah(Number(e.target.value))}
          aria-label="Surah"
          className="w-full h-[46px] bg-field border border-line-strong rounded-field px-3.5 text-[15px] text-fg mb-3.5"
        >
          {surahs.map((s) => (
            <option key={s.surah} value={s.surah}>
              {s.surah}  {s.nameSimple}
            </option>
          ))}
        </select>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Label>From ayah</Label>
            <Stepper
              value={range.from}
              min={meta.cachedFrom}
              max={meta.cachedTo}
              onChange={changeFrom}
              ariaLabel="From ayah"
            />
          </div>
          <div className="flex-1">
            <Label>To ayah</Label>
            <Stepper
              value={range.to}
              min={meta.cachedFrom}
              max={meta.cachedTo}
              onChange={changeTo}
              ariaLabel="To ayah"
            />
          </div>
        </div>

        {partial ? (
          <p className="text-xs text-dim mb-4 -mt-1.5">
            Only ayahs {meta.cachedFrom}–{meta.cachedTo} of {meta.ayahCount} are
            cached for {meta.nameSimple} in this demo.
          </p>
        ) : null}

        <div className="bg-surface-2 border border-line rounded-card px-3.5 py-3.5 mb-4">
          <AyahText surah={range.surah} from={range.from} to={range.to} marks={[]} />
          <div className="text-xs text-dim mt-2 flex items-center gap-1.5">
            Starts at {range.surah}:{range.from} · {ayahCount}{" "}
            {ayahCount === 1 ? "ayah" : "ayahs"} selected
          </div>
        </div>

        <Label>Type</Label>
        <div className="mb-4">
          <Segmented
            options={typeOptions}
            value={recType}
            onChange={setRecType}
            ariaLabel="Recitation type"
          />
        </div>

        <p className="text-xs text-dim mb-4 leading-relaxed">
          Your teacher sees this range the moment you join, and marks mistakes
          on exactly these ayahs.
        </p>
      </div>

      <div className="px-4 pb-4 pt-1 shrink-0">
        <Button full onClick={() => onSubmit(range, recType)}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
