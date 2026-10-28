"use client";

/**
 * "Participants Stats" — a clone of the client's full-screen floor-time list.
 *
 * The screen exists to answer one question: who has spoken, for how long,
 * and who is speaking right now? That means three visually distinct states
 * per row, and they are not shades of the same thing:
 *
 *   1. Present. A normal row — full-colour avatar, full-brightness text,
 *      plain (non-pill) time. This is the default, unmarked state.
 *   2. Holding the floor right now. Layered ON TOP of "present" — the
 *      avatar and name are unchanged, but the time gets a filled
 *      `bg-jitsi-speaking` pill. It is not a replacement state; a person
 *      can only be dominant while also being present.
 *   3. Left the meeting. Independent of the above — dimmed avatar, and
 *      `text-jitsi-off` for both name and time. The list deliberately keeps
 *      people who left (their accumulated time is still meaningful), so
 *      dimming alone is not enough signal that they're gone: a muted
 *      "غادر" suffix says so in words too, since colour must never be the
 *      only carrier of meaning.
 *
 * Sort: longest floor time first, but the "left" partition always sits
 * below the "present" partition regardless of how long anyone spoke —
 * someone who left with 10 minutes of floor time still reads as further
 * down the list than someone present with 10 seconds.
 *
 * Row layout mirrors like the rest of the reading chrome (see the note at
 * the top of chrome.tsx): avatar + name anchor to the inline-start edge
 * (the right, under RTL), the time sits at the inline-end edge. `justify-
 * between` on a flex row gets this for free — no physical left/right here.
 */

import { useMemo, useState } from "react";

import { MeetingAvatar, ScreenHeader, SearchField, type MeetingPerson } from "./chrome";
import { fmtSpeaking, t } from "@/lib/i18n";

function StatsRow({
  person,
  isLeft,
  isDominant,
}: {
  person: MeetingPerson;
  isLeft: boolean;
  isDominant: boolean;
}) {
  const seconds = person.speakingSeconds ?? 0;
  const timeText = fmtSpeaking(seconds);

  return (
    <li className="flex h-[52px] shrink-0 items-center justify-between gap-3 px-4">
      {/* Avatar + name, anchored to the inline-start edge. */}
      <span className="flex min-w-0 items-center gap-3">
        <span className={isLeft ? "opacity-40" : undefined}>
          <MeetingAvatar person={person} size={36} />
        </span>
        <span
          className={[
            "min-w-0 truncate text-[16px]",
            isLeft ? "text-jitsi-off" : "text-jitsi-fg",
          ].join(" ")}
        >
          {person.name}
          {person.isSelf ? ` ${t.meeting.statsMe}` : ""}
        </span>
      </span>

      {/* Floor time, anchored to the inline-end edge. */}
      <span className="flex shrink-0 items-center gap-2">
        {isLeft ? (
          <span className="text-[12px] text-jitsi-off">{t.meeting.statsLeft}</span>
        ) : null}
        {isDominant ? (
          <span className="rounded-[6px] bg-jitsi-speaking px-2 py-1 text-[14px] font-bold text-jitsi-fg tnum">
            {timeText}
          </span>
        ) : (
          <span
            className={[
              "text-[14px] tnum",
              isLeft ? "text-jitsi-off" : "text-jitsi-fg",
            ].join(" ")}
          >
            {timeText}
          </span>
        )}
      </span>
    </li>
  );
}

export function ParticipantsStats({
  people,
  leftIds,
  dominantId,
  onClose,
}: {
  people: readonly MeetingPerson[];
  leftIds: readonly string[];
  dominantId: string | null;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const leftSet = useMemo(() => new Set(leftIds), [leftIds]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const matching = q
      ? people.filter((p) => p.name.toLocaleLowerCase().includes(q))
      : people;

    // Present-before-left wins over the clock; within each partition, the
    // longest floor time sorts first.
    return [...matching].sort((a, b) => {
      const aLeft = leftSet.has(a.id);
      const bLeft = leftSet.has(b.id);
      if (aLeft !== bLeft) return aLeft ? 1 : -1;
      return (b.speakingSeconds ?? 0) - (a.speakingSeconds ?? 0);
    });
  }, [people, query, leftSet]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-jitsi-ink">
      {/* No dedicated "close stats" string exists in the table, so this
          reuses the screen's own title as the close button's aria-label —
          the same reuse PrejoinScreen makes with `leaveTitle` for its close
          affordance. */}
      <ScreenHeader
        title={t.meeting.statsTitle}
        onClose={onClose}
        closeLabel={t.meeting.closeStats}
      />

      <div className="flex min-h-0 flex-1 flex-col pt-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={t.meeting.statsSearch}
        />
        <p className="mt-2 px-4 text-[12px] text-jitsi-muted">
          {t.meeting.statsExplain}
        </p>

        {rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-[14px] text-jitsi-muted">
              {t.meeting.statsNoResults}
            </p>
          </div>
        ) : (
          <ul className="scroll-area mt-2 min-h-0 flex-1 overflow-y-auto">
            {rows.map((person) => (
              <StatsRow
                key={person.id}
                person={person}
                isLeft={leftSet.has(person.id)}
                isDominant={!leftSet.has(person.id) && person.id === dominantId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
