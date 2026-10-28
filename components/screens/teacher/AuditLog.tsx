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
import { MISTAKE_META, RECITATION_META, TEACHER_NAME } from "@/lib/eventLog";
import { formatRangeShort } from "@/lib/quran";
import { Button, Card, Chip, Dot, EmptyState } from "@/components/ui/primitives";
import { t } from "@/lib/i18n";

// Local rather than part of the `t` table: these name internal log *event
// kinds* (the discriminator on DemoEvent), not product copy, so they don't
// belong in the shared string table.
const KIND_LABEL: Record<DemoEvent["kind"], string> = {
  mark: "ملاحظة",
  queue_join: "انضمام إلى الطابور",
  range_change: "تغيير النطاق",
  turn_start: "بداية الدور",
  turn_finish: "نهاية الدور",
  break: "استراحة",
  chat: "رسالة",
  mic: "الميكروفون",
  leave: "مغادرة",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // "ar-u-nu-latn" pins Western digits — a bare "ar" locale would silently
  // switch to Arabic-Indic numerals, which this chrome never uses.
  return d.toLocaleTimeString("ar-u-nu-latn", {
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
        {/* A clock reading is a Latin/numeric run; isolate it from the Arabic around it. */}
        <time
          dateTime={event.timestamp}
          dir="ltr"
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
            dir="ltr"
            className={`font-mono text-[12px] ${removed ? "line-through text-danger-soft" : "text-fg"}`}
          >
            {event.surah}:{event.ayah}:{event.wordIndex}
          </span>
          <Chip tone={removed ? "danger" : "green"}>
            {removed ? t.audit.removedChip : t.audit.addedChip}
          </Chip>
          {event.note ? (
            <span className="text-[12px] text-dim break-words min-w-0 basis-full">
              {/* Teacher-typed free text — script unknown, isolate it. */}
              “<bdi>{event.note}</bdi>”
            </span>
          ) : null}
        </div>
      );
    }

    case "range_change":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          <span dir="ltr" className="font-mono">
            {formatRangeShort(event.range.surah, event.range.from, event.range.to)}
          </span>
          <span className="text-dim">
            {t.audit.changedBy(event.by === "teacher" ? TEACHER_NAME : t.audit.theStudent)}
          </span>
        </div>
      );

    case "turn_start":
    case "turn_finish":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          <span className="text-dim">{t.audit.theStudent}</span>
          {/* An internal id, not Arabic text — isolate it. */}
          <span dir="ltr" className="font-mono break-all">{event.studentId}</span>
        </div>
      );

    case "break":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg">
          <Chip tone={event.on ? "amber" : "neutral"}>
            {event.on ? t.audit.breakOnChip : t.audit.breakOffChip}
          </Chip>
        </div>
      );

    case "queue_join":
      return (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg min-w-0">
          {/* Student-entered name — isolate it, script unknown. */}
          <bdi className="truncate">{event.name}</bdi>
          <span dir="ltr" className="font-mono">
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
          aria-label={t.audit.backAria}
          className="text-[22px] text-fg leading-none px-1 -ms-1 rounded-field"
        >
          {/* Back-navigation chevron: directional, so it mirrors under RTL. */}
          ›
        </button>
        <span className="text-base font-medium flex-1">{t.audit.title}</span>
        <Chip>{t.audit.eventsCount(events.length)}</Chip>
      </div>

      <p className="px-4 pb-3 text-[13px] text-dim leading-relaxed shrink-0">
        {t.audit.description}
      </p>

      <div className="flex-1 overflow-y-auto scroll-area px-4 pb-4 min-h-0">
        {newestFirst.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {newestFirst.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <EmptyState title={t.audit.noEventsTitle}>
            {t.audit.noEventsBody}
          </EmptyState>
        )}
      </div>

      <div className="px-4 pb-4 pt-1 shrink-0">
        <Button full onClick={onExport}>
          {t.audit.exportLabeledData}
        </Button>
      </div>
    </div>
  );
}
