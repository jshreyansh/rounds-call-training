import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/panel";
import { Portal } from "@/components/ui/portal";

/**
 * Ported from SwishX's src/components/patterns/sheet.tsx — an edge-anchored
 * Panel over a scrim. The source drives its enter/exit with Tailwind
 * `animate-in`/`slide-in-from-*` utilities that aren't wired up outside
 * SwishX's own build, so this port swaps in Framer Motion for the same
 * slide-and-fade, keeping the same props and edge/scrim/dismissal rules.
 */
export type SheetSide = "right" | "left" | "bottom";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  title?: string;
  description?: string;
  header?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  size?: number | string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

const EDGE: Record<SheetSide, string> = {
  right: "inset-y-0 right-0 border-l",
  left: "inset-y-0 left-0 border-r",
  bottom: "inset-x-0 bottom-0 border-t rounded-t-panel",
};

const OFFSCREEN: Record<SheetSide, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
};

export function Sheet({
  open, onClose, side = "right", title, description, header, actions, footer,
  size, className, bodyClassName, children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sizing = side === "bottom"
    ? { maxHeight: size ?? "85vh" }
    : { width: size ?? 410, maxWidth: "100vw" };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            <motion.button
              type="button"
              aria-label="Close"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ ...OFFSCREEN[side], opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ ...OFFSCREEN[side], opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className={cn("absolute max-h-full", EDGE[side])}
              style={sizing}
            >
              <Panel
                title={title}
                description={description}
                header={header}
                actions={actions}
                footer={footer}
                bodyClassName={bodyClassName}
                className={cn("h-full border-hair bg-card shadow-float", className)}
              >
                {children}
              </Panel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
