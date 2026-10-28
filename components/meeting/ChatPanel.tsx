"use client";

/**
 * The "Chat and CC" overlay, cloned from the video client's chat screen.
 *
 * This is reading chrome, same family as the headers and list rows chrome.tsx
 * already mirrors in RTL: a message bubble is anchored relative to who sent
 * it, and "who sent it, relative to me" flips with the locale exactly the way
 * a name badge or a search field does. Other participants' bubbles sit at the
 * inline-start edge (right, here) with their avatar beside them; the viewer's
 * own bubbles sit at the inline-end edge (left) with no avatar, because the
 * reader already knows who they are. That is implemented purely with
 * `justify-start` / `justify-end` on each row — never with physical left or
 * right utilities — so it mirrors automatically if the surrounding direction
 * ever changes.
 *
 * This is NOT the call control bar. That bar is pinned `dir="ltr"` on purpose
 * (see the note at the top of chrome.tsx) because it is operated from muscle
 * memory and must not move when the locale changes. Chat has no such muscle
 * memory — it is read, not reached for blindly — so it is free to mirror like
 * the rest of the reading chrome, and doing so is what makes it feel native
 * rather than translated.
 *
 * `chatPlaceholder` ("Aa") is intentionally left untranslated: the real
 * client ships that exact placeholder in every locale, so keeping it as-is is
 * the faithful choice, not an oversight.
 */

import { useState, type FormEvent } from "react";

import { MeetingAvatar, ScreenHeader } from "./chrome";
import { IconSend } from "./icons";
import { t } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/state";

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * HH:MM in forced Western digits. `toLocaleTimeString("ar", ...)` would
 * silently switch to Arabic-Indic digits (the `arab` numbering system) —
 * wrong for UI chrome in this project, so the string is built by hand from
 * the Date fields instead.
 */
function formatClock(at: string): string {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ChatPanel({
  messages,
  meId,
  onSend,
  onClose,
}: {
  messages: readonly ChatMessage[];
  meId: string;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");

  const trimmed = draft.trim();
  // No decorative controls: the send button either works, or says — via
  // `title` — why it can't, mirroring the Button primitive's
  // `disabledReason` convention: an empty composer says what it wants
   // rather than offering a send button that quietly does nothing. The closest
  // existing copy for the same idea.
  const sendDisabledReason = trimmed ? undefined : t.meeting.chatEmptyHint;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) return;
    onSend(value);
    setDraft("");
  }

  // Consecutive messages from the same sender repeat neither the name nor
  // the avatar — real client behaviour, and what keeps a halaqah's rapid
  // back-and-forth readable instead of a wall of repeated names.
  const rows = messages.map((message, i) => ({
    message,
    showMeta: i === 0 || messages[i - 1].from !== message.from,
  }));

  return (
    <div className="flex h-full flex-col bg-jitsi-ink">
      {/* `chatTitle` doubles as the close button's label: there is no
          separate "close chat" string in the table, and the screen's own
          title is the closest fit — the same pattern PrejoinScreen uses with
          `leaveTitle`. */}
      <ScreenHeader
        title={t.meeting.chatTitle}
        onClose={onClose}
        closeLabel={t.meeting.closeChat}
      />

      <div className="scroll-area flex min-h-0 flex-1 flex-col bg-jitsi-ink">
        {messages.length === 0 ? (
          // An empty chat is an invitation to act, not a blank: say so, and
          // say what to do about it.
          <div className="m-auto max-w-[260px] px-6 text-center">
            <p className="text-[15px] font-bold text-jitsi-fg">
              {t.meeting.chatEmpty}
            </p>
            <p className="mt-1.5 text-[13px] text-jitsi-muted">
              {t.meeting.chatEmptyHint}
            </p>
          </div>
        ) : (
          // `mt-auto` inside this flex column — not a reversed array — is
          // what anchors a short conversation to the bottom, just above the
          // composer, with empty space left above it.
          <div className="mt-auto flex flex-col gap-3 px-3 py-3">
            {rows.map(({ message, showMeta }) => {
              const isMine = message.from === meId;
              const bubble = (
                <div className="rounded-jitsi-tile bg-jitsi-tile px-3 py-3">
                  {showMeta ? (
                    <p className="text-[15px] font-bold text-jitsi-fg">
                      {message.fromName}
                    </p>
                  ) : null}
                  {/* A participant may type Arabic or Latin; the bubble
                      follows the message's own direction, not the page's. */}
                  <p
                    dir="auto"
                    className="break-words text-[15px] text-jitsi-fg"
                  >
                    {message.text}
                  </p>
                </div>
              );
              const timestamp = (
                // A Latin-digit run, isolated so the surrounding Arabic can
                // never reorder it.
                <span
                  dir="ltr"
                  className="tnum mt-1 text-[13px] text-jitsi-muted"
                >
                  {formatClock(message.at)}
                </span>
              );

              if (isMine) {
                return (
                  <div
                    key={message.id}
                    className="flex items-start justify-end gap-2"
                  >
                    <div className="flex max-w-[78%] flex-col items-end">
                      {bubble}
                      {timestamp}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className="flex items-start justify-start gap-2"
                >
                  {/* Fixed-width column so a grouped message (no avatar
                      drawn) still lines up under the one above it. */}
                  <div className="w-9 shrink-0">
                    {showMeta ? (
                      <MeetingAvatar
                        person={{
                          id: message.from,
                          name: message.fromName,
                          muted: false,
                        }}
                        size={36}
                      />
                    ) : null}
                  </div>
                  <div className="flex max-w-[78%] flex-col items-start">
                    {bubble}
                    {timestamp}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-jitsi-divider bg-jitsi-ink px-3 py-2 shrink-0"
      >
        <input
          type="text"
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.meeting.chatPlaceholder}
          aria-label={t.meeting.chatSend}
          className="h-10 min-w-0 flex-1 rounded-jitsi-field bg-jitsi-field px-3.5 text-[15px] text-jitsi-fg placeholder:text-jitsi-muted outline-none"
        />
        <button
          type="submit"
          disabled={Boolean(sendDisabledReason)}
          title={sendDisabledReason ?? t.meeting.chatSend}
          aria-label={t.meeting.chatSend}
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-jitsi-btn transition-colors",
            sendDisabledReason
              ? "bg-jitsi-field-off"
              : "bg-jitsi-blue hover:brightness-110",
          ].join(" ")}
        >
          <IconSend size={20} className="text-white" />
          {sendDisabledReason ? (
            <span className="sr-only"> — {sendDisabledReason}</span>
          ) : null}
        </button>
      </form>
    </div>
  );
}
