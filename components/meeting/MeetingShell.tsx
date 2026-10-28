"use client";

/**
 * The meeting both roles sit inside, and the frame the halaqah tool sits on.
 *
 * Two layers, deliberately not blended. Underneath is a clone of the video
 * client the circle actually meets in: neutral near-black, the client's blue,
 * its tile grid, its speaker stage, its filmstrip, its control bar. Above it
 * is the recitation panel, which keeps the green of the rest of this app. The
 * seam between them is honest — the correction tool is a proposal that would
 * sit on top of someone else's meeting, and pretending it was one product
 * would be the wrong picture to hand anyone.
 *
 * Nothing here carries audio or video, and the chrome never implies otherwise:
 * the mic glyph on a tile is a status indicator, the one control that changes
 * anything is your own microphone, and every cloned control that has nothing
 * to do in a demo says why instead of going quietly dead.
 *
 * View (grid versus speaker) and which overlay is open are per-viewer state and
 * stay in this component. Putting them in the synced log would push one tab's
 * choice of layout onto the other tab, which is not what either person asked
 * for.
 */

import { useMemo, useState, type ReactNode } from "react";

import type { ChatMessage } from "@/lib/state";
import { fmtCallTime, t } from "@/lib/i18n";
import { useElapsed } from "@/hooks/useElapsed";

import { ChatPanel } from "./ChatPanel";
import { ControlBar, type MeetingPerson, TopBar } from "./chrome";
import { OverflowSheet } from "./OverflowSheet";
import { ParticipantsStats } from "./ParticipantsStats";
import { Filmstrip, SpeakerStage, TileGrid } from "./Tiles";

type View = "speaker" | "tile";
type Overlay = "none" | "chat" | "stats" | "more";

export function MeetingShell({
  people,
  speakerId,
  startedAt,
  meId,
  micOpen,
  onToggleMic,
  chat,
  onSendChat,
  leftIds,
  onLeave,
  children,
}: {
  people: MeetingPerson[];
  /** Whoever holds the floor — normally the reciting student. */
  speakerId: string | null;
  startedAt: string | null;
  meId: string;
  micOpen: boolean;
  onToggleMic: () => void;
  chat: readonly ChatMessage[];
  onSendChat: (text: string) => void;
  leftIds: readonly string[];
  onLeave: () => void;
  /** The recitation panel that rides on top of the call. */
  children?: ReactNode;
}) {
  const [view, setView] = useState<View>("speaker");
  const [overlay, setOverlay] = useState<Overlay>("none");
  /** Collapses the call so the recitation panel gets the whole frame. */
  const [minimized, setMinimized] = useState(false);

  const seconds = useElapsed(startedAt);
  const elapsed = startedAt ? fmtCallTime(seconds) : "0:00";

  // The ring belongs to a person, so it is resolved once here and travels with
  // them through every layout below.
  const marked = useMemo(
    () => people.map((p) => ({ ...p, isDominant: p.id === speakerId })),
    [people, speakerId],
  );

  const speaker = marked.find((p) => p.id === speakerId) ?? null;
  const strip = marked.filter((p) => p.id !== speaker?.id);

  const closeOverlay = () => setOverlay("none");

  return (
    <div className="relative flex flex-1 min-h-0 flex-col bg-jitsi-ink">
      <TopBar
        elapsed={elapsed}
        subject={t.meeting.subject}
        participantCount={people.length}
        onMinimize={() => setMinimized((v) => !v)}
        minimized={minimized}
        onParticipants={() => setOverlay("stats")}
        labels={{
          minimize: minimized ? t.meeting.restore : t.meeting.minimize,
          audioOutput: t.meeting.audioOutput,
          participants: t.meeting.participants,
          noMedia: t.meeting.noMediaNote,
        }}
      />

      {minimized ? null : view === "tile" ? (
        <TileGrid
          people={marked}
          labels={{ moderator: t.meeting.moderator, muted: t.meeting.mute }}
        />
      ) : (
        <>
          <SpeakerStage
            person={speaker}
            emptyLabel={t.queue.nobodyReciting}
            avatarSize={children ? 104 : 168}
          />
          <Filmstrip
            people={strip}
            labels={{ moderator: t.meeting.moderator, muted: t.meeting.mute }}
          />
        </>
      )}

      {/* The recitation panel. Capped rather than free-growing so the call it
          sits on is never fully hidden — the point is that both are present. */}
      {children ? (
        <div
          className={[
            "overflow-y-auto scroll-area border-t border-line bg-ink text-fg",
            minimized ? "flex-1 min-h-0" : "shrink-0 max-h-[52%]",
          ].join(" ")}
        >
          {children}
        </div>
      ) : null}

      <ControlBar
        micOpen={micOpen}
        onToggleMic={onToggleMic}
        onChat={() => setOverlay("chat")}
        onToggleView={() => setView(view === "tile" ? "speaker" : "tile")}
        onMore={() => setOverlay("more")}
        onLeave={onLeave}
        labels={{
          mute: t.meeting.mute,
          unmute: t.meeting.unmute,
          chat: t.meeting.chat,
          view: view === "tile" ? t.meeting.speakerView : t.meeting.tileView,
          more: t.meeting.more,
          leave: t.meeting.leave,
        }}
      />

      {overlay === "chat" ? (
        <div className="absolute inset-0 z-40 flex flex-col bg-jitsi-ink">
          <ChatPanel
            messages={chat}
            meId={meId}
            onSend={onSendChat}
            onClose={closeOverlay}
          />
        </div>
      ) : null}

      {overlay === "stats" ? (
        <div className="absolute inset-0 z-40 flex flex-col bg-jitsi-ink">
          <ParticipantsStats
            people={marked}
            leftIds={leftIds}
            dominantId={speakerId}
            onClose={closeOverlay}
          />
        </div>
      ) : null}

      <OverflowSheet
        open={overlay === "more"}
        onClose={closeOverlay}
        onStats={() => setOverlay("stats")}
      />
    </div>
  );
}
