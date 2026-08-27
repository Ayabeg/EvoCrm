/**
 * Product form-error compound wrapper.
 *
 * Authority: Aurora Callout (`ui/aurora/callout`) is the canonical status
 * primitive (info / success / warn / error / neutral). This file keeps the
 * shadcn Alert / AlertTitle / AlertDescription API used by existing
 * form-error surfaces. Destructive maps onto Aurora error tokens — it does
 * not invent a third alert system.
 */
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--evosales-canvas)] text-[var(--evosales-ink)] border-[var(--evosales-hairline)]",
        destructive:
          "bg-[var(--aurora-error-surface)] text-[var(--aurora-error-foreground)] border-[var(--aurora-error-border)] [&>svg]:text-[var(--aurora-error)] *:data-[slot=alert-description]:text-[var(--aurora-error-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
