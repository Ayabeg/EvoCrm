/**
 * Evo Design System — NextAction
 * Registry: custom Evo
 * License: MIT (original)
 */

import { PropertyGroup } from '@/evo/crm/record/RecordProperties';
import type { NextActionValue } from '@/evo/crm/record/types';
import { formatDateTime } from '@/evo/lib/format';
import { t } from '@/lib/i18n';

export function NextAction({
    action,
    empty = 'No next action',
}: {
    action?: NextActionValue | null;
    empty?: string;
}) {
    return (
        <PropertyGroup title="Next action">
            {action ? (
                <div data-evo="next-action">
                    <p className="text-[13px] font-medium text-[var(--evo-ink)]">
                        {action.href ? (
                            <a href={action.href} className="hover:underline">
                                {action.title}
                            </a>
                        ) : (
                            action.title
                        )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--evo-ink-muted)]">
                        {[
                            action.owner,
                            action.dueAt ? formatDateTime(action.dueAt) : null,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </div>
            ) : (
                <p className="text-[13px] text-[var(--evo-ink-muted)]">
                    {t(empty)}
                </p>
            )}
        </PropertyGroup>
    );
}
