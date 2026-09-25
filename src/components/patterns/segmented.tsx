import { cn } from "@/lib/cn";

/** Ported from SwishX's src/components/patterns/segmented.tsx — a row of
 *  mutually exclusive options as one concentric control. Used for the
 *  mood and call-length picks on the setup screen. */
const PAD = 3;

export function Segmented({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("squircle flex shrink-0 gap-0.5 border border-hair-2 bg-subtle", className)}
      style={{
        borderRadius: "var(--radius-control)",
        padding: PAD,
        ...rest.style,
      }}
    >
      {children}
    </div>
  );
}

export function SegmentedButton({
  active,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={cn(
        "flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-label font-bold transition-colors",
        active ? "bg-card text-brand-deep shadow-2xs" : "text-ink-3 hover:text-ink",
        className,
      )}
      style={{
        borderRadius: `calc(var(--radius-control) - ${PAD}px)`,
        ...rest.style,
      }}
    >
      {children}
    </button>
  );
}
