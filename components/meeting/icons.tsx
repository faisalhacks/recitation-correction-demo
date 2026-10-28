/**
 * Jitsi Meet meeting-chrome icons, hand-drawn as inline SVG.
 *
 * The Android client's toolbar, overflow menu and headers use a small fixed
 * set of glyphs (mic, camera, hang-up, tile view, and so on). Reproducing
 * them here as plain SVG keeps the clone pixel-faithful without pulling in
 * an icon library dependency. Every icon defaults to 24x24, but the actual
 * render size is always set by the caller via the `size` prop.
 */

export type IconProps = { size?: number; className?: string };

/* -------------------------------------------------------------------------- */
/* 1. close                                                                    */
/* -------------------------------------------------------------------------- */

export function IconClose({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. chevron down                                                            */
/* -------------------------------------------------------------------------- */

export function IconChevronDown({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <polyline
        points="6,9 12,15 18,9"
        stroke="currentColor"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. chevron start (back chevron, pointing left; mirror for RTL at call site) */
/* -------------------------------------------------------------------------- */

export function IconChevronStart({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <polyline
        points="14,6 8,12 14,18"
        stroke="currentColor"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. camera flip                                                             */
/* -------------------------------------------------------------------------- */

export function IconCameraFlip({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* camera body */}
      <rect
        x="4"
        y="7"
        width="16"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
      {/* viewfinder bump */}
      <path d="M9 7 L9.8 5 L14.2 5 L15 7 Z" fill="currentColor" />
      {/* lens */}
      <circle
        cx="12"
        cy="12.5"
        r="3"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
      {/* rotation arcs with arrowheads */}
      <path
        d="M2.3 6.8 A4 4 0 0 1 6.3 2.8"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <polygon points="7.6,2.2 7.1,4.3 5.2,3.3" fill="currentColor" />
      <path
        d="M21.7 17.2 A4 4 0 0 1 17.7 21.2"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <polygon points="16.4,21.8 16.9,19.7 18.8,20.7" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. speaker                                                                 */
/* -------------------------------------------------------------------------- */

export function IconSpeaker({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="3" y="9.5" width="3" height="5" rx="1" fill="currentColor" />
      <path d="M6 9.5 L9.5 7 L9.5 17 L6 14.5 Z" fill="currentColor" />
      <path
        d="M11.12 9.88 A3 3 0 0 1 11.12 14.12"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M13.24 7.76 A6 6 0 0 1 13.24 16.24"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. participants (no count badge — caller draws that)                      */
/* -------------------------------------------------------------------------- */

export function IconParticipants({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="8" cy="7" r="3" fill="currentColor" />
      <path
        d="M3 18 C3 13.5 5.2 11 8 11 C10.8 11 13 13.5 13 18 Z"
        fill="currentColor"
      />
      <circle cx="15" cy="10" r="3" fill="currentColor" />
      <path
        d="M10 20 C10 15.5 12.2 13 15 13 C17.8 13 20 15.5 20 20 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. mic                                                                     */
/* -------------------------------------------------------------------------- */

export function IconMic({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="8" y="2" width="8" height="12" rx="4" fill="currentColor" />
      <rect x="11" y="14" width="2" height="5" fill="currentColor" />
      <rect x="9" y="19" width="6" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. mic off                                                                 */
/* -------------------------------------------------------------------------- */

export function IconMicOff({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="8" y="2" width="8" height="12" rx="4" fill="currentColor" />
      <rect x="11" y="14" width="2" height="5" fill="currentColor" />
      <rect x="9" y="19" width="6" height="2" rx="1" fill="currentColor" />
      <line
        x1="4"
        y1="20"
        x2="20"
        y2="4"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. chat                                                                    */
/* -------------------------------------------------------------------------- */

export function IconChat({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="4"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
      <polyline
        points="7,17 6,21.5 11,17.2"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. tile view                                                             */
/* -------------------------------------------------------------------------- */

export function IconTileView({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" />
      <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" />
      <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" />
      <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. more (overflow)                                                       */
/* -------------------------------------------------------------------------- */

export function IconMore({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 12. hangup                                                                 */
/* -------------------------------------------------------------------------- */

export function IconHangup({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      {/*
       * The receiver is drawn as an "answer call" glyph — earpiece,
       * mouthpiece, and the curved band joining them — running from the
       * bottom-left to the top-right. Rotating the whole group 135deg
       * swings it around to read as "hang up", pointing down-left.
       */}
      <g transform="rotate(135 12 12)">
        <circle cx="6" cy="18" r="3.2" fill="currentColor" />
        <circle cx="18" cy="6" r="3.2" fill="currentColor" />
        <rect
          x="3.52"
          y="10"
          width="16.97"
          height="4"
          rx="2"
          transform="rotate(-45 12 12)"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 13. send                                                                   */
/* -------------------------------------------------------------------------- */

export function IconSend({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <g transform="rotate(-45 12 12)">
        <path
          d="M3 20 L21 12 L3 4 L3 10 L15 12 L3 14 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 14. search                                                                 */
/* -------------------------------------------------------------------------- */

export function IconSearch({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
      <line
        x1="14.74"
        y1="14.74"
        x2="20"
        y2="20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 15. car                                                                    */
/* -------------------------------------------------------------------------- */

export function IconCar({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect
        x="3"
        y="13"
        width="18"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d="M6 13 L8 8 L16 8 L18 13"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="7"
        cy="19"
        r="2"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
      <circle
        cx="17"
        cy="19"
        r="2"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 16. eye                                                                    */
/* -------------------------------------------------------------------------- */

export function IconEye({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M3 12 Q12 4 21 12 Q12 20 3 12 Z"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 17. bar chart                                                             */
/* -------------------------------------------------------------------------- */

export function IconBarChart({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M4 20 L4 15.5 Q4 14 5.5 14 L6 14 Q7.5 14 7.5 15.5 L7.5 20 Z"
        fill="currentColor"
      />
      <path
        d="M10.5 20 L10.5 11.5 Q10.5 10 12 10 L12.5 10 Q14 10 14 11.5 L14 20 Z"
        fill="currentColor"
      />
      <path
        d="M17 20 L17 7.5 Q17 6 18.5 6 L19 6 Q20.5 6 20.5 7.5 L20.5 20 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 18. breakout rooms                                                        */
/* -------------------------------------------------------------------------- */

export function IconBreakoutRooms({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="12" cy="8" r="3" fill="currentColor" />
      <circle cx="8" cy="17" r="3" fill="currentColor" />
      <circle cx="16" cy="17" r="3" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 19. picture in picture                                                    */
/* -------------------------------------------------------------------------- */

export function IconPictureInPicture({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect x="8" y="3" width="8" height="14" rx="2" fill="currentColor" />
      <path
        d="M5 19 Q12 25 19 19 Q12 22 5 19 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 20. music note                                                            */
/* -------------------------------------------------------------------------- */

export function IconMusicNote({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      focusable="false"
    >
      <ellipse
        cx="7"
        cy="18"
        rx="3.2"
        ry="2.4"
        transform="rotate(-20 7 18)"
        fill="currentColor"
      />
      <rect x="9.8" y="5" width="1.6" height="13.5" fill="currentColor" />
      <path
        d="M11.4 5 C15 6 16 9 13.5 12 C14.5 9.5 13 7 11.4 7 Z"
        fill="currentColor"
      />
    </svg>
  );
}
