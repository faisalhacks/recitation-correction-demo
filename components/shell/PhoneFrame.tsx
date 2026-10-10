"use client";

/**
 * The phone frame every screen lives in, plus the demo footer beneath it.
 *
 * Full-bleed on a real phone, a 390px frame centred on desktop. The frame is
 * `relative` so bottom sheets and overlays can be absolutely positioned inside
 * it rather than over the whole page.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import { QURAN_SOURCE, QURAN_SOURCE_URL } from "@/lib/quran";

export function PhoneFrame({
  children,
  footer = true,
  onReset,
}: {
  children: ReactNode;
  footer?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center">
      <div
        className={[
          "relative w-full max-w-[390px] flex flex-col overflow-hidden",
          "bg-ink text-fg",
          "flex-1 sm:flex-none sm:my-6 sm:h-[812px]",
          "sm:rounded-phone sm:border sm:border-line-strong",
        ].join(" ")}
      >
        {children}
      </div>
      {footer ? <DemoFooter onReset={onReset} /> : null}
    </div>
  );
}

export function DemoFooter({ onReset }: { onReset?: () => void }) {
  return (
    <footer className="w-full max-w-[390px] px-5 pb-7 pt-3 sm:pt-0 text-center">
      <p className="text-[11px] text-dim leading-relaxed">
        Concept demo – not affiliated with any organisation.
      </p>
      <p className="text-[11px] text-faint leading-relaxed mt-1">
        Quran text from{" "}
        <a
          href={QURAN_SOURCE_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:text-muted"
        >
          {QURAN_SOURCE}
        </a>
      </p>
      <div className="mt-2.5 flex items-center justify-center gap-4">
        <Link
          href="/"
          className="text-[11px] text-muted underline underline-offset-2 hover:text-fg"
        >
          Start over
        </Link>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-muted underline underline-offset-2 hover:text-fg"
          >
            Reset demo data
          </button>
        ) : null}
      </div>
    </footer>
  );
}

/** Thin status strip at the top of the frame, echoing the app screenshots. */
export function StatusBar() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-between px-5 pt-3 pb-1.5 text-[11px] text-dim shrink-0"
    >
      <span className="tabular-nums">10:20</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3.5 h-2 rounded-[2px] border border-current" />
        <span className="tabular-nums">75</span>
      </span>
    </div>
  );
}

/** In-frame header with an optional back link and trailing slot. */
export function FrameHeader({
  title,
  back,
  trailing,
}: {
  title: string;
  back?: { href: string; label: string } | { onClick: () => void; label: string };
  trailing?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-2.5 px-4 pb-2.5 shrink-0">
      {back ? (
        "href" in back ? (
          <Link
            href={back.href}
            aria-label={back.label}
            className="w-8 h-8 -ml-1 grid place-items-center rounded-lg text-fg hover:bg-white/5 text-xl leading-none"
          >
            ‹
          </Link>
        ) : (
          <button
            type="button"
            onClick={back.onClick}
            aria-label={back.label}
            className="w-8 h-8 -ml-1 grid place-items-center rounded-lg text-fg hover:bg-white/5 text-xl leading-none"
          >
            ‹
          </button>
        )
      ) : null}
      <h1 className="text-base font-medium flex-1 truncate">{title}</h1>
      {trailing}
    </header>
  );
}
