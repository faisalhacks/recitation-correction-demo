"use client";

/**
 * What you see after leaving the call.
 *
 * Leaving has to land somewhere, and it has to be reversible: this is a demo
 * someone will click through, and a dead end would mean reloading the page to
 * carry on. Rejoining puts the student back in the room; their finished turns
 * and their floor time were never tied to their presence, so nothing is lost
 * by stepping out — which is also true of the real thing.
 *
 * Styled as part of the meeting layer, not the halaqah one: leaving is the
 * call's event, not the lesson's.
 */

import { t } from "@/lib/i18n";
import { IconHangup } from "./icons";

export function CallEnded({ onRejoin }: { onRejoin: () => void }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-6 bg-jitsi-ink px-8 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-full bg-jitsi-blue/15 text-jitsi-blue">
        <IconHangup size={26} />
      </span>
      <div className="space-y-2">
        <h1 className="text-[20px] font-bold text-jitsi-fg">
          {t.meeting.callEnded}
        </h1>
        <p className="text-[14px] leading-relaxed text-jitsi-muted">
          {t.meeting.leaveBody}
        </p>
      </div>
      <button
        type="button"
        onClick={onRejoin}
        className="min-h-11 rounded-jitsi-btn bg-jitsi-blue px-6 text-[16px] font-bold text-white transition hover:brightness-110"
      >
        {t.meeting.rejoin}
      </button>
    </div>
  );
}
