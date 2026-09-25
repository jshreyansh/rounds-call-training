import { createPortal } from "react-dom";

/** Ported from SwishX's src/components/ui/portal.tsx. Renders at the end of
 *  <body> so the Call Brief sheet never inherits a transformed ancestor's
 *  containing block (the dark call stage uses several). */
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
