"use client";

import * as React from "react";
import {
    EmptyIllustration,
    inferEmptyKind,
    type EmptyKind,
} from "@/components/ui/empty-illustration";
import { cn } from "@/lib/utils";

export type EmptyStateDensity = "page" | "panel" | "banner";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  /** Optional composed illustration. Takes precedence over `kind`. */
  illustration?: React.ReactNode;
  /** Line-art kind when no `illustration` or `icon` is supplied. */
  kind?: EmptyKind;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  density?: EmptyStateDensity;
  /** Heading level for the title. Defaults to "p" for flexibility; set to "h2"/"h3" when inside a section. */
  as?: "h1" | "h2" | "h3" | "h4" | "p";
}

export function EmptyState({
  ref,
  icon,
  illustration,
  kind,
  title,
  description,
  action,
  className,
  density = "page",
  as: Heading = "p",
  ...rest
}: EmptyStateProps & { ref?: React.Ref<HTMLDivElement> }) {
    const titleId = React.useId();
    const descriptionId = React.useId();
    const resolvedKind = kind ?? inferEmptyKind(title);
    const art =
      illustration ??
      (icon ? null : (
        <EmptyIllustration
          kind={resolvedKind}
          size={density === "page" ? "md" : "sm"}
        />
      ));
    const banner = density === "banner";

    return (
      <div
        ref={ref}
        role="status"
        data-empty-state={density}
        className={cn(
          "text-ink",
          banner
            ? "flex items-start gap-3 px-4 py-3 text-left sm:px-6"
            : "flex flex-col items-center justify-center text-center",
          density === "page" && "gap-4 px-6 py-12",
          density === "panel" && "gap-3 px-3 py-4",
          className,
        )}
        style={
          density === "page"
            ? {
                border: `1.5px dashed var(--aurora-border-default)`,
                borderRadius: 2,
                background: "var(--color-bg)",
              }
            : undefined
        }
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        {...rest}
      >
        {art ? (
          <span aria-hidden className={cn("shrink-0", banner && "mt-0.5")}>
            {art}
          </span>
        ) : null}

        {icon && !illustration ? (
          <span
            aria-hidden
            className="flex shrink-0 items-center justify-center"
            style={{
              width: density === "page" ? 52 : 36,
              height: density === "page" ? 52 : 36,
              background: "var(--aurora-control-surface)",
              border: `1px solid var(--aurora-border-strong)`,
              borderRadius: 2,
              color: "var(--aurora-text-muted)",
            }}
          >
            {icon}
          </span>
        ) : null}

        <div
          className={cn(
            "flex min-w-0 flex-col",
            banner ? "items-start gap-1" : "items-center gap-1.5",
          )}
        >
          <Heading
            id={titleId}
            className="aurora-text-section"
            style={{
              fontWeight: "var(--aurora-weight-heading)",
              lineHeight: "var(--aurora-line-dense)",
              color: "var(--aurora-text-primary)",
            }}
          >
            {title}
          </Heading>

          {description && (
            <div
              id={descriptionId}
              style={{
                color: "var(--aurora-text-muted)",
                fontFamily: "var(--aurora-font-sans)",
                fontSize: "var(--aurora-type-control)",
                lineHeight: "var(--aurora-line-body)",
                maxWidth: banner ? 420 : 320,
              }}
            >
              {description}
            </div>
          )}

          {action && banner ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">{action}</div>
          ) : null}
        </div>

        {action && !banner ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            {action}
          </div>
        ) : null}
      </div>
    );
}
