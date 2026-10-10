"use client";

/**
 * The simulated meeting both roles sit inside.
 *
 * Deliberately inert: there is no audio, no video and no camera or microphone
 * control, and the UI says so rather than implying a call that isn't there.
 * The mic glyphs on the tiles are status indicators, not buttons — the only
 * interactive things in the chrome are Participants and Leave, which both do
 * what they say.
 *
 * Written by the main session as a shared primitive (BUILD_BRIEF.md §18).
 */

import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/primitives";
import { formatDuration, useElapsed } from "@/hooks/useElapsed";

const PLACEHOLDER_NOTE =
  "Placeholder – sits on top of the existing meeting. No audio or video in this demo.";

export type Participant = {
  id: string;
  name: string;
  isTeacher?: boolean;
  /** Drawn with the live ring and an open mic glyph. */
  isReciting?: boolean;
  /** Shown under the name on the strip tiles. */
  status?: string;
};

function MicGlyph({ on }: { on: boolean }) {
  return (
    <span
      className={on ? "text-green-bright" : "text-faint"}
      title={on ? "Microphone open" : "Microphone muted"}
    >
      <span className="sr-only">
        {on ? "Microphone open" : "Microphone muted"}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        {!on ? <path d="M4 4l16 16" /> : null}
      </svg>
    </span>
  );
}

function SpeakerTile({ person }: { person: Participant }) {
  return (
    <div
      className={`relative mx-4 rounded-tile border bg-surface-2 overflow-hidden ${
        person.isReciting ? "border-green-bright/60" : "border-line"
      }`}
    >
      {/* Flat geometric wash — no photography or borrowed imagery. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #86c9b0 0 2px, transparent 2px 14px)",
        }}
      />
      <div className="relative flex flex-col items-center justify-center gap-2.5 py-7">
        <Avatar
          name={person.name}
          size={62}
          tone={person.isTeacher ? "slate" : "green"}
        />
        <div className="text-center">
          <p className="text-[15px] font-medium">{person.name}</p>
          <p className="text-xs text-green-bright mt-0.5">
            {person.status ?? (person.isTeacher ? "Teacher" : "In the halaqah")}
          </p>
        </div>
      </div>
      <span className="absolute bottom-2.5 right-3">
        <MicGlyph on={Boolean(person.isReciting || person.isTeacher)} />
      </span>
    </div>
  );
}

function StripTile({ person }: { person: Participant }) {
  return (
    <div
      className={`shrink-0 w-[84px] rounded-xl border px-2 py-2.5 flex flex-col items-center gap-1.5 ${
        person.isReciting
          ? "border-green-bright/60 bg-green/15"
          : "border-line bg-surface"
      }`}
    >
      <Avatar
        name={person.name}
        size={30}
        tone={person.isTeacher ? "slate" : "green"}
      />
      <span className="text-[10px] text-fg leading-tight text-center line-clamp-1 w-full">
        {person.name}
      </span>
      <MicGlyph on={Boolean(person.isReciting || person.isTeacher)} />
    </div>
  );
}

export function MeetingShell({
  participants,
  speakerId,
  startedAt,
  children,
  controls,
}: {
  participants: Participant[];
  /** Whoever fills the large tile — normally the reciting student. */
  speakerId: string | null;
  startedAt: string | null;
  children: ReactNode;
  /** Extra controls for the bottom bar, e.g. the teacher's Participants button. */
  controls?: ReactNode;
}) {
  const seconds = useElapsed(startedAt);
  const speaker =
    participants.find((p) => p.id === speakerId) ??
    participants.find((p) => p.isTeacher) ??
    participants[0];
  const others = participants.filter((p) => p.id !== speaker?.id);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 pb-2.5 shrink-0">
        <span
          className="inline-flex items-center gap-2 text-xs text-muted"
          title={PLACEHOLDER_NOTE}
        >
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full bg-green-bright"
          />
          Simulated meeting
        </span>
        <span className="text-xs text-muted tabular-nums" aria-label="Call time">
          {startedAt ? formatDuration(seconds) : "--:--"}
        </span>
      </div>

      {speaker ? <SpeakerTile person={speaker} /> : null}

      {others.length > 0 ? (
        <div
          className="flex gap-2 px-4 pt-2.5 pb-1 overflow-x-auto shrink-0"
          role="list"
          aria-label="Other participants"
        >
          {others.map((p) => (
            <div role="listitem" key={p.id}>
              <StripTile person={p} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto scroll-area">
        {children}
      </div>

      <div className="shrink-0 border-t border-line bg-surface/60 px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-faint leading-tight max-w-[46%]">
          No audio or video — this stands in for the existing meeting.
        </span>
        <div className="flex items-center gap-2">{controls}</div>
      </div>
    </div>
  );
}
