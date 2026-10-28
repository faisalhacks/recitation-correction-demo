"use client";

/**
 * The "join meeting" prejoin screen, cloned from the video client.
 *
 * Flow: close/title bar, subject line, a large avatar with the (inert) audio
 * device rail floating beside it, the real mic toggle, a real name field, and
 * the two ways to join (normal / low-bandwidth).
 *
 * The vertical capsule rail at the inline-end edge is the client's audio
 * output/input device picker. This demo carries no audio pipeline at all —
 * there is nothing to switch between — so rather than drawing a control that
 * looks tappable and silently does nothing (the one thing this project's
 * house rules forbid), the whole rail is rendered as a single disabled
 * button. Its `title`/`aria-label` says plainly, via `t.meeting
 * .prejoinAudioOptions` and `t.meeting.noMediaNote`, what it is and why it
 * can't be used — the same pattern `TopBar`'s audio-output button uses in
 * chrome.tsx.
 */

import { useId } from "react";

import { MeetingAvatar, ScreenHeader, type MeetingPerson } from "./chrome";
import { IconMic, IconMicOff, IconMore, IconMusicNote } from "./icons";
import { t } from "@/lib/i18n";

export function PrejoinScreen({
  person,
  name,
  onNameChange,
  micOpen,
  onToggleMic,
  onJoin,
  onJoinLowBandwidth,
  onClose,
}: {
  person: MeetingPerson;
  name: string;
  onNameChange: (next: string) => void;
  micOpen: boolean;
  onToggleMic: () => void;
  onJoin: () => void;
  onJoinLowBandwidth: () => void;
  onClose: () => void;
}) {
  const nameFieldId = useId();
  const trimmedName = name.trim();
  const joinDisabledReason = trimmedName
    ? undefined
    : t.meeting.prejoinNeedName;
  const audioRailLabel = `${t.meeting.prejoinAudioOptions} — ${t.meeting.noMediaNote}`;

  return (
    <div className="flex h-full flex-col bg-jitsi-ink">
      <ScreenHeader
        title={t.meeting.prejoinTitle}
        onClose={onClose}
        closeLabel={t.meeting.closePrejoin}
      />

      <div className="flex min-h-0 flex-1 flex-col items-center gap-6 px-4 pb-6 pt-5">
        <p className="w-full max-w-full truncate text-center text-[17px] text-jitsi-muted">
          {t.meeting.subject}
        </p>

        {/* Avatar band: the rail is pinned to the inline-end edge and
            vertically centred on the avatar itself, not the whole band. */}
        <div className="relative flex w-full flex-1 items-center justify-center">
          <MeetingAvatar person={person} size={168} />

          <button
            type="button"
            disabled
            title={audioRailLabel}
            aria-label={audioRailLabel}
            className="absolute end-2 top-1/2 flex h-[183px] w-[27px] -translate-y-1/2 flex-col items-center justify-between rounded-full bg-white/20 py-2 disabled:opacity-100"
          >
            <IconMore size={14} className="rotate-90 text-jitsi-fg/80" />
            <span className="grid h-[35px] w-[35px] place-items-center rounded-full bg-jitsi-fg">
              <IconMusicNote size={18} className="text-jitsi-ink" />
            </span>
          </button>
        </div>

        {/* Real control: this is the only functional thing on the screen
            besides the name field and the join buttons. */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={micOpen ? t.meeting.micOpen : t.meeting.micMuted}
          title={micOpen ? t.meeting.micOpen : t.meeting.micMuted}
          className="grid h-16 w-16 place-items-center rounded-jitsi-btn bg-jitsi-bar text-jitsi-fg transition-colors hover:brightness-110"
        >
          {micOpen ? <IconMic size={28} /> : <IconMicOff size={28} />}
        </button>

        <div className="w-full px-[15px]">
          <label htmlFor={nameFieldId} className="sr-only">
            {t.meeting.prejoinNamePlaceholder}
          </label>
          <input
            id={nameFieldId}
            type="text"
            dir="auto"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t.meeting.prejoinNamePlaceholder}
            className="h-11 w-full rounded-jitsi-field bg-jitsi-field px-3.5 text-[15px] text-jitsi-fg placeholder:text-jitsi-muted outline-none"
          />
        </div>

        <div className="w-full px-[15px]">
          <button
            type="button"
            onClick={onJoin}
            disabled={Boolean(joinDisabledReason)}
            title={joinDisabledReason}
            className="h-[45px] w-full rounded-jitsi-btn bg-jitsi-blue text-[16px] font-bold text-white transition-colors hover:brightness-110 disabled:opacity-40"
          >
            {t.meeting.prejoinJoin}
          </button>
        </div>

        <button
          type="button"
          onClick={onJoinLowBandwidth}
          className="text-center text-[15px] text-jitsi-muted underline-offset-2 hover:text-jitsi-fg hover:underline"
        >
          {t.meeting.prejoinLowBandwidth}
        </button>
      </div>
    </div>
  );
}
