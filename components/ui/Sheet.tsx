"use client";

/**
 * Bottom sheet, scoped to the phone frame rather than the viewport.
 *
 * The frame is `relative`, so `absolute inset-0` keeps the scrim inside the
 * phone on desktop instead of dimming the whole page.
 */

import { useEffect, useRef, type ReactNode } from "react";

import { t } from "@/lib/i18n";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes; focus moves into the sheet so keyboard users land in it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label={t.common.dismiss}
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-sheet border-t border-line-strong rounded-t-[22px] px-4 pt-4 pb-6 max-h-[82%] overflow-y-auto scroll-area"
      >
        <div
          aria-hidden
          className="w-9 h-1 rounded-full bg-white/18 mx-auto mb-3.5"
        />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-medium">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:text-fg hover:bg-white/5 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
