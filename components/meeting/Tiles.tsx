"use client";

/**
 * Participant tiles: the grid, the speaker stage and the filmstrip.
 *
 * The blue ring is a property of a person, not of a seat. The same participant
 * keeps it as the layout reflows from a 2x2 grid to a 3-up grid to the speaker
 * stage, which is what the real client does and what makes the ring readable
 * at a glance.
 *
 * There is no video anywhere in this demo, so a tile is an avatar and a name
 * strip. The mic glyph on a tile is a status indicator, not a control — the
 * only microphone anyone can change here is their own, from the control bar.
 */

import { type MeetingPerson, MeetingAvatar } from "./chrome";
import { IconMicOff } from "./icons";

/* -------------------------------------------------------------------------- */
/* name badge                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The strip across the bottom of a tile.
 *
 * One leading glyph slot, as in the client: a muted participant shows the
 * crossed mic, a moderator who is not muted shows the moderator badge, and an
 * open mic shows nothing at all. Content sits at the inline-start edge, which
 * RTL puts on the right without any physical side being named.
 */
function NameBadge({
  person,
  moderatorLabel,
  mutedLabel,
  compact,
}: {
  person: MeetingPerson;
  moderatorLabel: string;
  mutedLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "absolute inset-x-0 bottom-0 flex items-center gap-1.5 jitsi-badge",
        compact ? "px-1.5 py-1" : "px-2 py-1.5",
      ].join(" ")}
    >
      {person.muted ? (
        <span className="text-jitsi-fg shrink-0" title={mutedLabel}>
          <span className="sr-only">{mutedLabel}</span>
          <IconMicOff size={compact ? 12 : 14} />
        </span>
      ) : person.isModerator ? (
        <span
          className="grid place-items-center w-[15px] h-[15px] shrink-0 rounded-[3px] border border-jitsi-fg/70 text-[9px] font-bold text-jitsi-fg"
          title={moderatorLabel}
        >
          <span className="sr-only">{moderatorLabel}</span>
          <span aria-hidden>M</span>
        </span>
      ) : null}
      {!compact ? (
        <span className="truncate text-[13px] text-jitsi-fg">{person.name}</span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* tile                                                                        */
/* -------------------------------------------------------------------------- */

export type TileLabels = {
  moderator: string;
  muted: string;
};

function Tile({
  person,
  labels,
  className = "",
}: {
  person: MeetingPerson;
  labels: TileLabels;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-jitsi-tile bg-jitsi-tile",
        person.isDominant ? "ring-2 ring-jitsi-blue" : "",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 grid place-items-center pb-5">
        <MeetingAvatar person={person} size={72} />
      </div>
      <NameBadge
        person={person}
        moderatorLabel={labels.moderator}
        mutedLabel={labels.muted}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* grid                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Two columns. An odd last tile is centred under the pair above rather than
 * stretched across or left hanging at one edge — the behaviour visible in the
 * three-participant screenshot.
 */
export function TileGrid({
  people,
  labels,
}: {
  people: MeetingPerson[];
  labels: TileLabels;
}) {
  const odd = people.length % 2 === 1;
  return (
    <div className="flex-1 min-h-0 overflow-y-auto scroll-area p-2">
      <div className="grid grid-cols-2 gap-1.5 content-center min-h-full">
        {people.map((p, i) => {
          const isLastOdd = odd && i === people.length - 1;
          return (
            <Tile
              key={p.id}
              person={p}
              labels={labels}
              className={[
                "aspect-square",
                isLastOdd ? "col-span-2 w-[calc(50%-3px)] justify-self-center" : "",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* speaker stage                                                               */
/* -------------------------------------------------------------------------- */

export function SpeakerStage({
  person,
  emptyLabel,
  avatarSize = 168,
}: {
  person: MeetingPerson | null;
  emptyLabel: string;
  /**
   * The stage gives up height first. On its own it shows the client's full
   * portrait; with the recitation panel open underneath, the panel is the
   * thing being read and the avatar shrinks rather than pushing the call
   * off the bottom of the frame.
   */
  avatarSize?: number;
}) {
  if (!person) {
    return (
      <div className="flex-1 min-h-0 grid place-items-center px-6">
        <p className="text-center text-[15px] text-jitsi-muted">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center gap-4 px-6 py-3">
      <span
        className={[
          "grid place-items-center rounded-full shrink-0",
          person.isDominant
            ? "ring-2 ring-jitsi-blue ring-offset-4 ring-offset-jitsi-ink"
            : "",
        ].join(" ")}
      >
        <MeetingAvatar person={person} size={avatarSize} />
      </span>
      <span className="rounded-md jitsi-badge px-3 py-1.5 text-[15px] text-jitsi-fg max-w-full truncate">
        {person.name}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* filmstrip                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pinned LTR deliberately. People find each other by position on this strip;
 * reversing the order because the interface language changed would move every
 * face mid-call for no benefit.
 */
export function Filmstrip({
  people,
  labels,
}: {
  people: MeetingPerson[];
  labels: TileLabels;
}) {
  if (people.length === 0) return null;
  return (
    <div
      dir="ltr"
      role="list"
      className="flex gap-1 overflow-x-auto scroll-area px-2 pb-2 shrink-0"
    >
      {people.map((p) => (
        <div role="listitem" key={p.id} className="shrink-0">
          <div
            className={[
              "relative w-[72px] h-[72px] overflow-hidden rounded-md bg-jitsi-tile",
              p.isDominant ? "ring-2 ring-jitsi-blue" : "",
            ].join(" ")}
            title={p.name}
          >
            <div className="absolute inset-0 grid place-items-center">
              <MeetingAvatar person={p} size={40} />
            </div>
            <NameBadge
              person={p}
              moderatorLabel={labels.moderator}
              mutedLabel={labels.muted}
              compact
            />
          </div>
        </div>
      ))}
    </div>
  );
}
