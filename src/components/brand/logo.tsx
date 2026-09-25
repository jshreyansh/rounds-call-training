/** The actual SwishX product mark (supplied by Shreyans), not a text
 *  wordmark stand-in. Lives in /public so it's served as a static asset. */
export function SwishxLogo({ className }: { className?: string }) {
  return <img src="/swishx-logo.svg" alt="SwishX" className={className} />;
}

/**
 * The icon-only mark, for dark grounds where the source's solid orange fill
 * (#fd4816) would vanish against a brand-orange button. A CSS mask (any
 * `background-color` standing in for the SVG's own fill) was the first
 * attempt, but this file's width/height are in `pt` units from its original
 * export, which Chromium's mask sizing doesn't resolve reliably — the mask
 * rendered as nothing. A pre-baked white export sidesteps that entirely.
 */
export function SwishxMark({ className }: { className?: string }) {
  return <img src="/swishx-icon-white.svg" alt="" className={className} />;
}
