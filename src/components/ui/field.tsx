import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/text";

/** Ported from SwishX's src/components/ui/field.tsx. */

type FieldVariant = "bordered" | "bare";
type FieldSize = "sm" | "md";

const base =
  "w-full bg-transparent text-ink placeholder:text-ink-4 font-medium outline-none transition-colors disabled:opacity-50";

const variants: Record<FieldVariant, string> = {
  bordered:
    "border border-hair-2 bg-card rounded-control squircle focus:border-brand focus:ring-1 focus:ring-brand/20",
  bare: "border-0 focus:ring-0",
};

const sizes: Record<FieldSize, string> = {
  sm: "px-3 py-1.5 text-body",
  md: "px-3.5 py-2.5 text-body-lg",
};

const bareSizes: Record<FieldSize, string> = {
  sm: "text-body",
  md: "text-body-lg",
};

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  variant?: FieldVariant;
  size?: FieldSize;
  multiline?: boolean;
  rows?: number;
}

export const Field = forwardRef<HTMLInputElement | HTMLTextAreaElement, FieldProps>(
  function Field(props, ref) {
    const {
      label, hint, error, iconLeft, className,
      variant = "bordered", size = "md", multiline, ...rest
    } = props;

    const autoId = useId();
    const id = rest.id ?? autoId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    const controlClass = cn(
      base,
      variants[variant],
      variant === "bordered" ? sizes[size] : bareSizes[size],
      iconLeft && variant === "bordered" && (size === "sm" ? "pl-8" : "pl-9"),
      error && variant === "bordered" && "border-danger focus:border-danger focus:ring-danger/20",
      className,
    );

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <Text as="label" htmlFor={id} size="label" tone="muted" weight="semibold">
            {label}
          </Text>
        )}

        <div className={cn("relative flex w-full items-center", iconLeft && "isolate")}>
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 z-10 grid place-items-center text-ink-4">
              {iconLeft}
            </span>
          )}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={cn(controlClass, "resize-none leading-relaxed")}
              {...(rest as unknown as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={controlClass}
              {...rest}
            />
          )}
        </div>

        {error ? (
          <Text id={`${id}-error`} size="micro" tone="danger" weight="semibold">
            {error}
          </Text>
        ) : hint ? (
          <Text id={`${id}-hint`} size="micro" tone="subtle">
            {hint}
          </Text>
        ) : null}
      </div>
    );
  },
);
