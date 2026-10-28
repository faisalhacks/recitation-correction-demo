"use client";

/**
 * The meeting chrome: the pieces every meeting screen is assembled from.
 *
 * This layer is a clone of the video client the halaqah actually runs on, so
 * its look is not ours to invent — the neutral near-black and the blue come
 * from `--color-jitsi-*` and deliberately share nothing with the green the
 * correction UI uses. The two layers are different products and should read
 * that way.
 *
 * What is ours: the whole thing is Arabic and right to left. Direction is not
 * applied uniformly, because mirroring everything is wrong:
 *
 *   - Reading chrome mirrors. Headers, list rows, search fields, name badges
 *     and stats rows all anchor to the inline-start edge, which is the right.
 *     Flex does this on its own; the code just avoids physical left/right.
 *   - The call control bar does NOT mirror. It is operated from muscle memory,
 *     often without looking, and the leave button moving across the screen
 *     with the locale is how someone drops a call by accident. It is pinned
 *     `dir="ltr"`, which is what Zoom, Meet and WhatsApp all do here.
 *   - The filmstrip does NOT mirror. People track faces by position; reordering
 *     them by reading direction is disorienting mid-call.
 *   - Pictograph icons never mirror in any direction — a microphone, a camera,
 *     a speaker and a handset are pictures of objects, not arrows.
 */

import type { ReactNode } from "react";

import {
  IconChat,
  IconChevronDown,
  IconClose,
  IconHangup,
  IconMic,
  IconMicOff,
  IconMore,
  IconParticipants,
  IconSearch,
  IconSpeaker,
  IconTileView,
} from "./icons";

/* -------------------------------------------------------------------------- */
/* people                                                                      */
/* -------------------------------------------------------------------------- */

export type MeetingPerson = {
  id: string;
  name: string;
  /** The teacher. Shown with the moderator badge instead of a mic glyph. */
  isModerator?: boolean;
  /** Whoever is looking at this tab. */
  isSelf?: boolean;
  muted: boolean;
  /** Holding the floor — the blue ring follows this person, not a position. */
  isDominant?: boolean;
  /** Seconds of floor time, for the stats list. */
  speakingSeconds?: number;
};

/**
 * Avatar tint.
 *
 * The real client shows uploaded photos; those are the participants' own and
 * not ours to reproduce, so everyone here is an initial on a flat tint. Self
 * keeps the purple from the screenshots; everyone else gets a stable tint from
 * their name, so a given person is the same colour on every screen and in
 * every tab.
 */
const TINTS = [
  "var(--color-jitsi-pink)",
  "#3f7f5f",
  "#7a5ea8",
  "#9a6a2f",
  "#2f6f8f",
  "#8f3f4f",
];

function tintFor(person: MeetingPerson): string {
  if (person.isSelf) return "var(--color-jitsi-purple)";
  let h = 0;
  for (let i = 0; i < person.id.length; i += 1) {
    h = (h * 31 + person.id.charCodeAt(i)) >>> 0;
  }
  return TINTS[h % TINTS.length];
}

/** First letter of the display name — Arabic or Latin, whichever it starts with. */
function initial(name: string): string {
  const trimmed = name.trim();
  // `(` guards the "أنت (الطالب أ)" shape: the bracket is not an initial.
  const first = [...trimmed].find((c) => /\p{L}/u.test(c));
  return first ?? "؟";
}

export function MeetingAvatar({
  person,
  size,
}: {
  person: MeetingPerson;
  size: number;
}) {
  return (
    <span
      className="inline-grid place-items-center rounded-full text-jitsi-fg font-medium select-none shrink-0"
      style={{
        width: size,
        height: size,
        background: tintFor(person),
        fontSize: Math.round(size * 0.42),
      }}
      aria-hidden
    >
      {initial(person.name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* screen header                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The bar at the top of a full-screen panel: close, then title.
 *
 * Close sits first in the DOM, so under RTL it lands at the right — the
 * inline-start edge, where a navigation control belongs. No physical side is
 * named anywhere here.
 */
export function ScreenHeader({
  title,
  onClose,
  closeLabel,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <header className="flex items-center gap-3 bg-jitsi-bar px-3 py-3 shrink-0">
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="grid place-items-center w-10 h-10 rounded-full text-jitsi-fg hover:bg-white/10 transition-colors"
      >
        <IconClose size={20} />
      </button>
      <h1 className="text-[17px] font-bold text-jitsi-fg truncate">{title}</h1>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* in-call top bar                                                             */
/* -------------------------------------------------------------------------- */

function BarButton({
  label,
  onClick,
  children,
  badge,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid place-items-center w-9 h-9 rounded-full text-jitsi-fg hover:bg-white/10 transition-colors disabled:opacity-40"
      disabled={!onClick}
    >
      {children}
      {badge !== undefined ? (
        <span
          // Counts read left to right in any locale; isolate so the badge can
          // never be reordered by the Arabic around it.
          dir="ltr"
          className="absolute -top-0.5 -end-0.5 min-w-[15px] h-[15px] px-1 grid place-items-center rounded-full bg-jitsi-blue text-[10px] font-bold text-white tnum"
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function TopBar({
  elapsed,
  subject,
  participantCount,
  onMinimize,
  minimized,
  onParticipants,
  labels,
}: {
  elapsed: string;
  subject: string;
  participantCount: number;
  onMinimize: () => void;
  /** Rotates the chevron so the control reads as a toggle, not a one-way door. */
  minimized: boolean;
  onParticipants: () => void;
  labels: {
    minimize: string;
    audioOutput: string;
    participants: string;
    noMedia: string;
  };
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-2 shrink-0">
      {/* Chevron-down minimises the call, as in the client. Here there is no
          picture-in-picture to shrink into, so it collapses the call and gives
          the whole frame to the recitation panel — which is what someone
          marking words actually wants. It rotates to show the way back. */}
      <BarButton label={labels.minimize} onClick={onMinimize}>
        <IconChevronDown
          size={22}
          className={minimized ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </BarButton>

      <span
        dir="ltr"
        className="rounded-md bg-white/10 px-2 py-1 text-[13px] font-bold text-jitsi-fg tnum shrink-0"
      >
        {elapsed}
      </span>

      <span className="rounded-md bg-white/10 px-2 py-1 text-[13px] text-jitsi-fg truncate min-w-0 flex-1">
        {subject}
      </span>

      {/* Audio output is a real device control; there is no audio here, so it
          says so rather than pretending to switch anything. */}
      <BarButton label={`${labels.audioOutput} — ${labels.noMedia}`}>
        <IconSpeaker size={22} />
      </BarButton>

      <BarButton
        label={labels.participants}
        onClick={onParticipants}
        badge={participantCount}
      >
        <IconParticipants size={22} />
      </BarButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* call control bar                                                            */
/* -------------------------------------------------------------------------- */

function ControlButton({
  label,
  onClick,
  children,
  tone = "plain",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "plain" | "leave";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "grid place-items-center transition-colors",
        tone === "leave"
          ? "w-[52px] h-10 rounded-jitsi-btn bg-jitsi-blue text-white hover:brightness-110"
          : "w-11 h-11 rounded-full text-jitsi-fg hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ControlBar({
  micOpen,
  onToggleMic,
  onChat,
  onToggleView,
  onMore,
  onLeave,
  labels,
}: {
  micOpen: boolean;
  onToggleMic: () => void;
  onChat: () => void;
  onToggleView: () => void;
  onMore: () => void;
  onLeave: () => void;
  labels: {
    mute: string;
    unmute: string;
    chat: string;
    view: string;
    more: string;
    leave: string;
  };
}) {
  return (
    // Pinned LTR on purpose: see the note at the top of this file. The leave
    // button stays in the same physical corner whatever the locale.
    <div
      dir="ltr"
      className="flex items-center justify-around gap-1 bg-jitsi-ink px-3 pb-3 pt-1.5 shrink-0"
    >
      <ControlButton
        label={micOpen ? labels.mute : labels.unmute}
        onClick={onToggleMic}
      >
        {micOpen ? <IconMic size={24} /> : <IconMicOff size={24} />}
      </ControlButton>
      <ControlButton label={labels.chat} onClick={onChat}>
        <IconChat size={24} />
      </ControlButton>
      <ControlButton label={labels.view} onClick={onToggleView}>
        <IconTileView size={24} />
      </ControlButton>
      <ControlButton label={labels.more} onClick={onMore}>
        <IconMore size={24} />
      </ControlButton>
      <ControlButton label={labels.leave} onClick={onLeave} tone="leave">
        <IconHangup size={22} />
      </ControlButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* bottom sheet                                                                */
/* -------------------------------------------------------------------------- */

export function MeetingSheet({
  open,
  onClose,
  label,
  dismissLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Names the sheet itself. */
  label: string;
  /** Names the scrim, which is a real control: tapping it closes the sheet.
   *  It needs its own name — announcing the sheet's title on the button that
   *  dismisses it tells a screen-reader user the opposite of what it does. */
  dismissLabel: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={onClose}
        className="absolute inset-0 jitsi-scrim"
      />
      <div
        role="dialog"
        aria-label={label}
        className="relative rounded-t-jitsi-sheet bg-jitsi-sheet pb-2 pt-1.5"
      >
        {children}
      </div>
    </div>
  );
}

/** One row of the overflow sheet: icon at the inline-start edge, then label. */
export function SheetRow({
  icon,
  label,
  onClick,
  disabledReason,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  /** Says why, rather than looking tappable and doing nothing. */
  disabledReason?: string;
}) {
  const off = Boolean(disabledReason) || !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={off}
      title={disabledReason}
      className={[
        "flex w-full items-center gap-4 px-4 py-3.5 text-start transition-colors",
        off ? "opacity-40" : "hover:bg-white/5",
      ].join(" ")}
    >
      <span className="text-jitsi-fg shrink-0">{icon}</span>
      <span className="text-[17px] text-jitsi-fg">{label}</span>
      {disabledReason ? (
        <span className="sr-only"> — {disabledReason}</span>
      ) : null}
    </button>
  );
}

export function SheetDivider() {
  return <div className="h-px bg-jitsi-divider" role="presentation" />;
}

/* -------------------------------------------------------------------------- */
/* search                                                                      */
/* -------------------------------------------------------------------------- */

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-jitsi-field bg-jitsi-field px-3 h-[38px] mx-3">
      <IconSearch size={16} className="text-jitsi-muted shrink-0" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-jitsi-fg placeholder:text-jitsi-muted outline-none"
      />
    </label>
  );
}
