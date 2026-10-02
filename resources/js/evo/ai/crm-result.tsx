/**
 * Evo Design System — CRMResult
 * custom Evo — agent outputs render real record cards / peek links.
 */

import { Link } from '@inertiajs/react';
import { evoFocus } from '@/evo/ai/types';
import { ArrowSquareOut } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export function CrmResult({
    type,
    label,
    href,
    className,
}: {
    type: string;
    label: string;
    href: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex max-w-[330px] items-center gap-2 rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface px-3 py-2',
                className,
            )}
        >
            <span className="grid size-7 shrink-0 place-items-center rounded-[var(--evo-radius-compact)] bg-evo-teal-soft text-[10px] font-semibold tracking-[0.04em] text-evo-teal uppercase">
                {type.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold tracking-[0.1em] text-evo-ink-muted uppercase">
                    {recordTypeLabel(type)}
                </p>
                <p className="truncate text-[11px] font-medium text-evo-ink">{label}</p>
            </div>
            {href.startsWith('/') && !href.startsWith('//') ? (
                <Link
                    href={href}
                    className={cn(
                        'rounded px-1.5 py-1 text-[10px] font-medium text-evo-teal hover:bg-evo-teal-soft',
                        evoFocus,
                    )}
                >
                    Ouvrir
                    <ArrowSquareOut className="ms-1 inline size-3" weight="regular" aria-hidden />
                </Link>
            ) : null}
        </div>
    );
}

export function recordTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        company: 'Entreprise',
        contact: 'Contact',
        deal: 'Affaire',
        lead: 'Lead',
        quote: 'Devis',
    };

    return labels[type] ?? 'CRM';
}
