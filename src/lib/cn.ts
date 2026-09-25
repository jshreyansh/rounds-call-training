import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Ported from SwishX's src/lib/cn.ts — registers our token names in their
 * real tailwind-merge class groups so a call-site override (e.g. a custom
 * text size passed as className) actually wins instead of colliding with
 * Tailwind's own scale. Keep in step with the @theme block in globals.css.
 */
const FONT_SIZE = [
  "micro", "caption", "label", "body", "body-lg", "subhead",
  "title", "display", "display-lg", "hero", "hero-lg",
];

const RADIUS = ["chip", "control", "panel", "card"];

const SHADOW = ["hair", "soft", "float", "modal", "brand-soft", "brand-lift"];

const EASE = ["swish", "spring", "entrance", "exit"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZE }],
      rounded: [{ rounded: RADIUS }],
      shadow: [{ shadow: SHADOW }],
      ease: [{ ease: EASE }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
