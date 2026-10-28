/**
 * Landing — the demo's front door (BUILD_BRIEF.md §18).
 *
 * Calmer and more typographic than the in-app screens it leads to: a
 * heading, one honest line about what this demo is, two equally-weighted
 * entry points, and a quiet note about running it in two tabs. `onReset` is
 * accepted for the exact prop signature the route expects, but the frame's
 * footer already renders "Reset demo data", so this screen does not repeat
 * that control.
 */

import Link from "next/link";

import { t } from "@/lib/i18n";

export function Landing({ onReset }: { onReset: () => void }) {
  void onReset;

  return (
    <div className="flex-1 flex flex-col justify-center gap-10 px-6 py-10">
      <div className="text-center space-y-3">
        <h1 className="text-[28px] font-semibold leading-tight text-fg">
          {t.landing.title}
        </h1>
        <p className="text-[15px] text-muted leading-relaxed">
          {t.landing.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/student"
          className="min-h-14 rounded-field bg-green text-green-glow border border-green flex items-center justify-center text-base font-semibold transition-colors hover:bg-[#397f68]"
        >
          {t.landing.joinAsStudent}
        </Link>
        <Link
          href="/teacher"
          className="min-h-14 rounded-field bg-surface-2 text-green-bright border border-green-bright/40 flex items-center justify-center text-base font-semibold transition-colors hover:border-green-bright/70 hover:bg-white/4"
        >
          {t.landing.joinAsTeacher}
        </Link>
      </div>

      <div className="text-center space-y-2">
        <p className="text-[13px] text-dim leading-relaxed">
          {t.landing.twoTabsNote}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/student"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-muted underline underline-offset-2 hover:text-fg"
          >
            {t.landing.openStudentNewTab}
          </Link>
          <Link
            href="/teacher"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-muted underline underline-offset-2 hover:text-fg"
          >
            {t.landing.openTeacherNewTab}
          </Link>
        </div>
      </div>
    </div>
  );
}
