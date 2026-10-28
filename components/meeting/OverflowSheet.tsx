"use client";

/**
 * The call's "more" overflow sheet (the ⋯ button in `ControlBar`).
 *
 * This is pure composition over the shared sheet chrome in chrome.tsx —
 * `MeetingSheet` for the scrim/sheet surface, `SheetRow` for each row and
 * `SheetDivider` for the client's own grouping line. Nothing here reinvents
 * that chrome.
 *
 * The sheet is cloned in full because leaving rows out would misrepresent
 * the client, but a row that cannot act says so.
 *
 * Of the four rows the real client shows, only "Participants Stats" does
 * anything in this demo — it opens the screen in ParticipantsStats.tsx. Car
 * mode, low-bandwidth mode and breakout rooms have no backing feature here,
 * so each renders via `SheetRow`'s `disabledReason`, which both disables the
 * row and gives it a `title` explaining why, rather than leaving a row that
 * looks tappable and silently does nothing. Car mode and low-bandwidth mode
 * are literally about the audio/video pipeline, so `noMediaNote` is an exact
 * fit; breakout rooms isn't about media at all, but no closer string exists
 * in the table, so it reuses the same note as the nearest available
 * explanation of "not wired up in this demo."
 */

import { MeetingSheet, SheetDivider, SheetRow } from "./chrome";
import { IconBarChart, IconBreakoutRooms, IconCar, IconEye } from "./icons";
import { t } from "@/lib/i18n";

export function OverflowSheet({
  open,
  onClose,
  onStats,
}: {
  open: boolean;
  onClose: () => void;
  onStats: () => void;
}) {
  return (
    <MeetingSheet
      open={open}
      onClose={onClose}
      label={t.meeting.more}
      dismissLabel={t.meeting.dismissSheet}
    >
      <SheetRow
        icon={<IconCar size={24} />}
        label={t.meeting.moreCarMode}
        disabledReason={t.meeting.noMediaNote}
      />
      <SheetRow
        icon={<IconEye size={24} />}
        label={t.meeting.moreLowBandwidth}
        disabledReason={t.meeting.noMediaNote}
      />

      <SheetDivider />

      {/* The only live row: it really opens the stats screen. */}
      <SheetRow
        icon={<IconBarChart size={24} />}
        label={t.meeting.moreStats}
        onClick={onStats}
      />
      <SheetRow
        icon={<IconBreakoutRooms size={24} />}
        label={t.meeting.moreBreakout}
        disabledReason={t.meeting.notInDemo}
      />
    </MeetingSheet>
  );
}
