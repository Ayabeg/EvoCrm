import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /** Appends a rose required indicator (`*`) after the label text. */
  required?: boolean
  /** Dims the label to the muted tier (pairs with a disabled control). */
  disabled?: boolean
}

function Label({ className, style, required, disabled, children, ref, ...props }: LabelProps & { ref?: React.Ref<HTMLLabelElement> }) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-disabled={disabled ? "" : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        "aurora-text-label inline-flex items-center gap-1",
        "text-[var(--aurora-text-primary)]",
        "data-[disabled]:text-[var(--aurora-text-muted)]",
        className
      )}
      style={{
        cursor: disabled ? "not-allowed" : "default",
        ...style,
      }}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" style={{ color: "var(--aurora-accent-pink)" }}>
          *
        </span>
      )}
    </LabelPrimitive.Root>
  )
}

export { Label }
export default Label
