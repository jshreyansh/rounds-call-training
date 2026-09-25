import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";

/** Ported from SwishX's src/components/ui/panel.tsx — pinned header, one
 *  scrolling body, pinned footer. Sheet composes this rather than
 *  re-deriving the scroll contract. */
export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  header?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  dividers?: boolean;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { title, description, header, actions, footer, bodyClassName, dividers = true,
    className, children, ...props },
  ref,
) {
  const hasHeader = Boolean(header || title || actions);

  return (
    <div ref={ref} className={cn("flex min-h-0 flex-col overflow-hidden", className)} {...props}>
      {hasHeader && (
        <div className={cn(
          "flex shrink-0 items-start gap-3 px-5 py-4",
          dividers && "border-b border-hair",
        )}>
          {header ?? (
            <div className="min-w-0 flex-1">
              {title && <Text as="h2" size="subhead" weight="bold">{title}</Text>}
              {description && (
                <Text as="p" size="body" tone="subtle" className="mt-0.5">{description}</Text>
              )}
            </div>
          )}
          {actions}
        </div>
      )}

      <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName ?? "px-5 py-4")}>
        {children}
      </div>

      {footer && (
        <div className={cn(
          "flex shrink-0 items-center justify-end gap-2 px-5 py-3.5",
          dividers && "border-t border-hair",
        )}>
          {footer}
        </div>
      )}
    </div>
  );
});
