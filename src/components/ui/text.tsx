import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Ported from SwishX's src/components/ui/text.tsx — every piece of text in
 *  Rounds goes through here rather than a raw text-[Npx] class. */

export type TextSize =
  | "micro" | "caption" | "label" | "body" | "body-lg"
  | "subhead" | "title" | "display" | "display-lg" | "hero" | "hero-lg";

export type TextTone =
  | "default" | "muted" | "subtle" | "faint"
  | "brand" | "brand-deep" | "ok" | "warn" | "danger" | "inverse";

type TextWeight = "normal" | "medium" | "semibold" | "bold" | "extrabold" | "black";
type TextLeading = "none" | "tight" | "snug" | "normal" | "relaxed";
type TextTracking = "tighter" | "tight" | "normal" | "wide" | "wider";

const sizes: Record<TextSize, string> = {
  micro: "text-micro",
  caption: "text-caption",
  label: "text-label",
  body: "text-body",
  "body-lg": "text-body-lg",
  subhead: "text-subhead",
  title: "text-title",
  display: "text-display",
  "display-lg": "text-display-lg",
  hero: "text-hero",
  "hero-lg": "text-hero-lg",
};

const tones: Record<TextTone, string> = {
  default: "text-ink",
  muted: "text-ink-2",
  subtle: "text-ink-3",
  faint: "text-ink-4",
  brand: "text-brand",
  "brand-deep": "text-brand-deep",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  inverse: "text-white",
};

const weights: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
};

const leadings: Record<TextLeading, string> = {
  none: "leading-none",
  tight: "leading-tight",
  snug: "leading-snug",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
};

const clamps: Record<1 | 2 | 3 | 4, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

const trackings: Record<TextTracking, string> = {
  tighter: "tracking-tighter",
  tight: "tracking-tight",
  normal: "tracking-normal",
  wide: "tracking-wide",
  wider: "tracking-wider",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
  leading?: TextLeading;
  tracking?: TextTracking;
  uppercase?: boolean;
  truncate?: boolean;
  tabular?: boolean;
  clamp?: 1 | 2 | 3 | 4;
  px?: number;
  htmlFor?: string;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as: Tag = "span",
    size = "body",
    tone = "default",
    weight,
    leading,
    tracking,
    uppercase,
    truncate,
    tabular,
    clamp,
    px,
    className,
    style,
    ...props
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        px === undefined && sizes[size],
        tones[tone],
        weight && weights[weight],
        leading && leadings[leading],
        tracking && trackings[tracking],
        uppercase && "uppercase",
        truncate && "truncate",
        tabular && "[font-variant-numeric:tabular-nums]",
        clamp && clamps[clamp],
        className,
      )}
      style={px === undefined ? style : { fontSize: `${px}px`, ...style }}
      {...props}
    />
  );
});

export const Label = forwardRef<HTMLElement, Omit<TextProps, "uppercase">>(
  function Label({ size = "micro", tone = "subtle", weight = "bold", ...props }, ref) {
    return (
      <Text
        ref={ref}
        as="span"
        size={size}
        tone={tone}
        weight={weight}
        tracking="wider"
        uppercase
        {...props}
      />
    );
  },
);
