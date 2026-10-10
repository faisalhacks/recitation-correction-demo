"use client";

/**
 * Renders a range of ayahs word by word, with optional mistake marks.
 *
 * Shared by three screens that must agree exactly on word positions:
 *   - the student's reciting view (no marks — the student sees them only after
 *     the turn ends)
 *   - the teacher's live correction view (tap a word to mark it)
 *   - the summary (marks shown, not interactive)
 *
 * The Arabic comes from `lib/quran.ts`, never from a literal in a component.
 * `wordIndex` is 1-based.
 */

import type { MistakeType } from "@/lib/eventLog";
import { MISTAKE_META } from "@/lib/eventLog";
import { getAyahs } from "@/lib/quran";

export type WordMark = {
  surah: number;
  ayah: number;
  wordIndex: number;
  type: MistakeType;
  note: string;
};

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join("");
}

const key = (ayah: number, wordIndex: number) => `${ayah}:${wordIndex}`;

export function AyahText({
  surah,
  from,
  to,
  marks = [],
  onWordTap,
  size = "normal",
}: {
  surah: number;
  from: number;
  to: number;
  marks?: WordMark[];
  /** When set, every word becomes a button. */
  onWordTap?: (surah: number, ayah: number, wordIndex: number) => void;
  size?: "normal" | "large";
}) {
  const ayahs = getAyahs(surah, from, to);
  const byWord = new Map<string, WordMark>();
  for (const m of marks) {
    if (m.surah === surah) byWord.set(key(m.ayah, m.wordIndex), m);
  }

  const fontSize = size === "large" ? "31px" : "27px";

  if (ayahs.length === 0) {
    return (
      <p className="text-sm text-dim px-1 py-4">
        No cached text for this range.
      </p>
    );
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="arabic flex flex-wrap items-center gap-y-1 gap-x-0.5 justify-start"
      style={{ fontSize, lineHeight: 2.2 }}
    >
      {ayahs.map((a) => (
        <span key={a.ayah} className="contents">
          {a.words.map((text, i) => {
            const wordIndex = i + 1;
            const mark = byWord.get(key(a.ayah, wordIndex));
            const color = mark ? MISTAKE_META[mark.type].color : undefined;

            const style = mark
              ? {
                  background: `color-mix(in srgb, ${color} 16%, transparent)`,
                  borderBottom: `2px solid ${color}`,
                  borderRadius: "9px 9px 2px 2px",
                }
              : undefined;

            const label = mark
              ? `${text} — marked ${MISTAKE_META[mark.type].label}${
                  mark.note ? `: ${mark.note}` : ""
                }`
              : text;

            if (!onWordTap) {
              return (
                <span
                  key={wordIndex}
                  style={style}
                  aria-label={mark ? label : undefined}
                  className="px-[7px] py-[2px] rounded-[9px] inline-block"
                >
                  {text}
                </span>
              );
            }

            return (
              <button
                key={wordIndex}
                type="button"
                onClick={() => onWordTap(surah, a.ayah, wordIndex)}
                style={style}
                aria-label={`${label}. ${
                  mark ? "Change or remove this mark" : "Mark a mistake"
                }`}
                className="px-[7px] py-[2px] rounded-[9px] inline-block transition-colors hover:bg-white/8 font-[inherit]"
              >
                {text}
              </button>
            );
          })}
          <span
            aria-label={`End of ayah ${a.ayah}`}
            className="inline-grid place-items-center w-[30px] h-[30px] mx-1 rounded-full border border-green text-green-bright shrink-0"
            style={{ fontSize: "17px" }}
          >
            {toArabicDigits(a.ayah)}
          </span>
        </span>
      ))}
    </div>
  );
}

/** The six mistake colours with their names, under a marked passage. */
export function MistakeLegend({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap gap-x-3.5 gap-y-2 text-[11px] text-muted ${className}`}
    >
      {(Object.keys(MISTAKE_META) as MistakeType[]).map((t) => (
        <li key={t} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: MISTAKE_META[t].color }}
          />
          {MISTAKE_META[t].label}
        </li>
      ))}
    </ul>
  );
}
