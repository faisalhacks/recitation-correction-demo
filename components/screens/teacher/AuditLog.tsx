"use client";

/**
 * Teacher's audit log (BUILD_BRIEF.md §9.10): the raw append-only event list
 * for the session, newest first, plus the export entry point.
 *
 * This screen exists to make one claim legible: nothing is ever deleted.
 * Every row below is exactly what got appended to the log — including a
 * "remove" mark, which stays in the log forever even though it cancels an
 * earlier mark out when the state is replayed. We never derive or hide
 * anything here; `events.length` is the only arithmetic on this screen.
 */

import type { DemoEvent } from "@/lib/eventLog";
import { MISTAKE_META, RECITATION_META } from "@/lib/eventLog";
import { formatRangeShort } from "@/lib/quran";
import { Button, Card, Chip, Dot, EmptyState } from "@/components/ui/primitives";

const KIND_LABEL: Record<DemoEvent["kind"], string> = {
  mark: "Mark",
  queue_join: "Queue join",
  range_change: "Range change",
  turn_start: "Turn start",
  turn_finish: "Turn finish",
  break: "Break",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** One event, rendered exactly as logged — never mutated, never summarised. */
function EventRow({ event }: { event: DemoEvent }) {
  const removed = event.kind === "mark" && event.action === "remove";

  return (
    <Card
      as="li"
      className={`px-3 py-2.5 flex flex-col gap-1.5 ${
        removed ? "border-danger-soft/30 bg-danger/5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Chip tone={removed ? "danger" : "neutral"}>
          {KIND_LABEL[event.kind]}
        </Chip>
        <time
          dateTime={event.timestamp}
          className="font-mono text-[11px] text-dim shrink-0"
        >
          {formatTime(event.timestamp)}
        </time>
      </div>

      <EventDetails event={event} />
    </Card>
  );
}

function EventDetails({ event }: { event: DemoEvent }) {
  switch (event.kind) {
    case "mark": {
      const meta = MISTAKE_META[event.type];
      const removed = event.action === "remove";
      return (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Dot color={meta.color} />
          <span
            className={`text-[13px] font-medium ${removed ? "line-through text-danger-soft" : ""}`}
            style={removed ? undefined : { color: meta.color }}
          >
            {meta.label}
          </span>
          <span
            className={`font-mono text-[12px] ${removed ? "line-through text-danger-soft" : "text-fg"}`}
          >
            {event.surah}:{event.ayah}:{event.wordIndex}
          </span>
          <Chip tone={removed ? "danger" : "green"}>
            {removed ? "Removed" : "Added"}
          </Chip>
          {event.note ? (
            <span className="text-[12px] text-dim break-words min-w-0 basis-full">
              “{event.note}”
            </span>
          ) : null}
        </div>
      );
    }

    case "range_change":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          <span className="font-mono">
            {formatRangeShort(event.range.surah, event.range.from, event.range.to)}
          </span>
          <span className="text-dim">
            changed by {event.by === "teacher" ? "Ustadh Demo" : "the student"}
          </span>
        </div>
      );

    case "turn_start":
    case "turn_finish":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          <span className="text-dim">Student</span>
          <span className="font-mono break-all">{event.studentId}</span>
        </div>
      );

    case "break":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg">
          <Chip tone={event.on ? "amber" : "neutral"}>
            {event.on ? "Break on" : "Break off"}
          </Chip>
        </div>
      );

    case "queue_join":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          <span className="truncate">{event.name}</span>
          <span className="font-mono">
            {formatRangeShort(event.range.surah, event.range.from, event.range.to)}
          </span>
          <Chip>{RECITATION_META[event.recType].label}</Chip>
        </div>
      );

    default:
      return null;
  }
}

export function AuditLog({
  events,
  onExport,
  onBack,
}: {
  /** The raw append-only log, oldest first. */
  events: DemoEvent[];
  onExport: () => void;
  onBack: () => void;
}) {
  // The prop is oldest-first (append order); copy before reversing so the
  // caller's array — the actual log — is never mutated.
  const newestFirst = [...events].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="text-[22px] text-fg leading-none px-1 -ml-1 rounded-field"
        >
          ‹
        </button>
        <span className="text-base font-medium flex-1">Audit log</span>
        <Chip>{events.length} events</Chip>
      </div>

      <p className="px-4 pb-3 text-[13px] text-dim leading-relaxed shrink-0">
        This is the raw, append-only record of the session — nothing is ever
        deleted. Removing a mark adds a new “remove” event rather than erasing
        the original; the current state you see elsewhere is just this log
        replayed in order.
      </p>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4 min-h-0">
        {newestFirst.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {newestFirst.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <EmptyState title="No events yet">
            Actions the teacher takes during the session will appear here as
            they happen.
          </EmptyState>
        )}
      </div>

      <div className="px-4 pb-4 pt-1 shrink-0">
        <Button full onClick={onExport}>
          Export labeled data
        </Button>
      </div>
    </div>
  );
}
