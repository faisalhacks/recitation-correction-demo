"use client";

import { useEffect, useState } from "react";

/**
 * Seconds elapsed since `startedAt`, ticking once a second.
 *
 * Kept out of `useSessionState` on purpose: a clock in the state hook would
 * re-render every screen once a second whether or not it shows a timer.
 * Returns 0 when `startedAt` is null, and stays at 0 until mounted so the
 * server and client agree on the first paint.
 */
export function useElapsed(startedAt: string | null): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  // Derived rather than reset in the effect: with no start time there is no
  // elapsed time, and saying so here keeps the effect to one job.
  return startedAt ? seconds : 0;
}

/** 185 -> "03:05", 3725 -> "1:02:05". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
