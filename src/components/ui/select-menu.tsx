import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Adapted from SwishX's src/components/ui/select-menu.tsx — same trigger,
 * portal, fixed-position flip-above-when-tight behavior and radio-style
 * option list. The source animates open/close with named CSS keyframe
 * classes (select-pop / select-pop-out) that live only in SwishX's own
 * globals.css; this port drives the same motion with Framer Motion instead,
 * since that's already the animation primitive the rest of Rounds uses.
 *
 * Takes {value,label} options rather than the source's bare strings, since
 * Rounds needs an id distinct from its display label (mood "busy" → "Rushed").
 */
export interface SelectOption {
  value: string;
  label: string;
}

type Placement = { style: CSSProperties; above: boolean };

export function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  placeholder = "Select an option…",
  renderIcon,
}: {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  placeholder?: string;
  renderIcon?: (option: SelectOption) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const positionMenu = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const opensAbove = below < 260 && above > below;
      const maxHeight = Math.max(150, Math.min(360, (opensAbove ? above : below) - 8));
      setPlacement({
        above: opensAbove,
        style: {
          position: "fixed",
          left: rect.left,
          width: rect.width,
          maxHeight,
          ...(opensAbove ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
        },
      });
    };
    if (open) positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [open]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const menu = open && placement && (
    <motion.div
      ref={menuRef}
      style={placement.style}
      initial={{ opacity: 0, y: placement.above ? 5 : -5, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: placement.above ? 4 : -4, scale: 0.988 }}
      transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      className="squircle-panel z-[100] overflow-y-auto border border-hair-2 bg-card p-1.5 shadow-float"
      role="listbox"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              "squircle-control focus-ring flex min-h-10 w-full items-center gap-3 px-3 text-left text-body-lg transition-colors",
              isSelected ? "bg-tint font-semibold text-brand-deep" : "font-normal text-ink hover:bg-subtle",
            )}
          >
            <span className={cn("grid size-4.5 shrink-0 place-items-center rounded-full border", isSelected ? "border-brand" : "border-hair-2")}>
              <span className={cn("size-2 rounded-full bg-brand transition-transform", isSelected ? "scale-100" : "scale-0")} />
            </span>
            {renderIcon?.(option)}
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
          </button>
        );
      })}
    </motion.div>
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "focus-ring group flex h-10 w-full items-center justify-between rounded-control border bg-card px-3.5 text-left text-body-lg font-medium shadow-hair transition-colors",
          selected ? "text-ink" : "text-ink-4",
          open ? "border-brand shadow-[0_0_0_3px_rgba(253,72,22,0.12)]" : "border-hair-2 hover:border-hair-3",
        )}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              {renderIcon?.(selected)}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="truncate italic text-ink-4">{placeholder}</span>
          )}
        </span>
        <span className={cn("ml-2 grid size-6 shrink-0 place-items-center rounded-full text-ink-3 transition-transform", open ? "rotate-180 bg-tint text-brand" : "group-hover:bg-subtle")}>
          <ChevronDown className="size-4" />
        </span>
      </button>
      {typeof document !== "undefined" && createPortal(<AnimatePresence>{menu}</AnimatePresence>, document.body)}
    </div>
  );
}
