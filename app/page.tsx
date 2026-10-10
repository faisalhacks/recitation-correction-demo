"use client";

import { Landing } from "@/components/screens/Landing";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { useSessionState } from "@/hooks/useSessionState";

/**
 * The demo's front door.
 *
 * Mounting the hook here seeds the log on a cold start, so whichever role is
 * opened first already finds Ustadh Demo's halaqah populated.
 */
export default function LandingRoute() {
  const { resetDemo } = useSessionState("student");

  return (
    <PhoneFrame onReset={resetDemo}>
      <Landing onReset={resetDemo} />
    </PhoneFrame>
  );
}
