/**
 * Evo Design System — Inbox Attachment
 * Registry: shadcn/ui — attachment (visual reference)
 * Source: https://ui.shadcn.com/docs/components/base/attachment
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-02
 * Modified: custom Evo chip; Phosphor; tokens only; French t().
 */

import { FileText, X } from '@/evo/icons';
import type { InboxAttachment } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export function Attachment({
    file,
    onRemove,
    className,
}: {
    file: InboxAttachment;
    onRemove?: () => void;
    className?: string;
}) {
    const inner = (
        <span
            data-inbox="attachment"
            className={cn(
                'inline-flex h-8 max-w-full items-center gap-1.5 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] px-2 text-[12px] text-[var(--evo-ink)]',
                className,
            )}
        >
            <FileText className="size-3.5 shrink-0 text-[var(--evo-ink-muted)]" aria-hidden />
            <span className="truncate">{file.name}</span>
            {onRemove ? (
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t('Remove attachment')}
                    onClick={onRemove}
                    className="size-6"
                >
                    <X className="size-3" />
                </Button>
            ) : null}
        </span>
    );

    if (file.href && !onRemove) {
        return (
            <a href={file.href} className="inline-flex min-w-0" target="_blank" rel="noreferrer">
                {inner}
            </a>
        );
    }

    return inner;
}
