"use client";

/**
 * Shared UI primitives. Written by the main session before screen work began —
 * screen agents import these rather than restyling the same card six ways.
 *
 * Radii, surfaces and accents come from the tokens in `app/globals.css`, which
 * were sampled from the reference mockups. Don't introduce new colours here.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-green text-green-glow hover:bg-[#397f68] border border-green",
  secondary:
    "bg-field text-fg border border-line-strong hover:border-green-bright/50",
  ghost: "bg-transparent text-muted border border-transparent hover:text-fg",
  danger:
    "bg-transparent text-danger-soft border border-danger-soft/30 hover:border-danger-soft/60",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /**
   * When set, the button renders disabled and explains why on hover and to
   * screen readers. A control in this demo either works or says why it can't —
   * there are no decorative buttons.
   */
  disabledReason?: string;
  full?: boolean;
};

export function Button({
  variant = "primary",
  disabledReason,
  full,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const off = Boolean(disabledReason) || rest.disabled;
  return (
    <button
      {...rest}
      disabled={off}
      title={disabledReason}
      aria-describedby={undefined}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-field",
        "px-4 min-h-11 text-[15px] font-medium transition-colors",
        BUTTON_STYLES[variant],
        off ? "opacity-45 pointer-events-auto" : "",
        full ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
      {disabledReason ? <span className="sr-only"> — {disabledReason}</span> : null}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`bg-surface border border-line rounded-card ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Small caption above a field. Sentence case, never tracked-out caps. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="block text-xs text-muted mb-1.5">{children}</span>
  );
}

/** A quiet section heading inside the frame. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[15px] font-medium text-fg">{children}</h2>
  );
}

/* -------------------------------------------------------------------------- */
/* chips and dots                                                              */
/* -------------------------------------------------------------------------- */

export function Dot({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${className}`}
      style={{ background: color }}
    />
  );
}

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-field text-muted border-line-strong",
    green: "bg-green-bright/12 text-green-bright border-green-bright/25",
    amber: "bg-amber/12 text-amber border-amber/30",
    danger: "bg-danger/14 text-danger-soft border-danger-soft/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* stat tile — the Progress screen's unit, from the app screenshot             */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  hint,
  wide,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`bg-surface-2 border border-line rounded-tile px-3 py-4 flex flex-col items-center justify-center text-center gap-1.5 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <span className="text-[13px] font-medium text-fg leading-tight">
        {label}
      </span>
      <span className="text-2xl font-semibold text-green-bright tabular-nums leading-none">
        {value}
      </span>
      {hint ? <span className="text-[11px] text-dim">{hint}</span> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* segmented control — Sabaq / Sabqi / Manzil                                  */
/* -------------------------------------------------------------------------- */

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-1.5 bg-field border border-line-strong rounded-field p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-[10px] px-1 py-2 text-center transition-colors border ${
              active
                ? "bg-green/35 border-green"
                : "border-transparent hover:bg-white/4"
            }`}
          >
            <span
              className={`block text-sm font-medium ${
                active ? "text-green-glow" : "text-muted"
              }`}
            >
              {o.label}
            </span>
            {o.hint ? (
              <span
                className={`block text-[10px] ${
                  active ? "text-green-bright" : "text-dim"
                }`}
              >
                {o.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* stepper — ayah numbers                                                      */
/* -------------------------------------------------------------------------- */

export function Stepper({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  const step = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="h-11 flex items-center justify-between bg-field border border-line-strong rounded-field px-1">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={atMin}
        aria-label={`${ariaLabel}: one less`}
        className="w-10 h-9 grid place-items-center text-xl text-green-bright rounded-[10px] disabled:opacity-30 hover:bg-white/5"
      >
        −
      </button>
      <span
        aria-label={ariaLabel}
        role="status"
        className="text-[17px] font-medium tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={atMax}
        aria-label={`${ariaLabel}: one more`}
        className="w-10 h-9 grid place-items-center text-xl text-green-bright rounded-[10px] disabled:opacity-30 hover:bg-white/5"
      >
        +
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* avatar                                                                      */
/* -------------------------------------------------------------------------- */

/** Flat initial on a tinted ground — no photos anywhere in this demo. */
export function Avatar({
  name,
  size = 40,
  tone = "green",
}: {
  name: string;
  size?: number;
  tone?: "green" | "slate";
}) {
  const initial = (name.match(/\(([A-Za-z])/)?.[1] ?? name.trim()[0] ?? "?")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`grid place-items-center rounded-[30%] font-medium shrink-0 ${
        tone === "green"
          ? "bg-green/45 text-green-glow"
          : "bg-[#2a3340] text-[#c3cedd]"
      }`}
    >
      {initial}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-[15px] text-fg mb-1.5">{title}</p>
      {children ? (
        <p className="text-[13px] text-dim leading-relaxed">{children}</p>
      ) : null}
    </div>
  );
}
