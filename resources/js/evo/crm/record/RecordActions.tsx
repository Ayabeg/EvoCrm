/**
 * Evo Design System — RecordActions
 * Registry: shadcn/ui — button-group + dropdown-menu
 * License: MIT (original composition)
 */

import type { ReactNode } from 'react';
import type { RecordActionItem } from '@/evo/crm/record/types';
import { DotsThree } from '@/evo/icons';
import { Button } from '@/evo/ui/button';
import { ButtonGroup } from '@/evo/ui/button-group';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { t } from '@/lib/i18n';

export function RecordActions({
    actions = [],
    overflow = [],
    secondary,
    children,
}: {
    actions?: RecordActionItem[];
    overflow?: RecordActionItem[];
    secondary?: ReactNode;
    children?: ReactNode;
}) {
    if (children) {
        return (
            <div
                className="flex flex-wrap items-center gap-2"
                data-evo="record-actions"
            >
                {children}
                {secondary}
            </div>
        );
    }

    return (
        <div
            className="flex flex-wrap items-center gap-2"
            data-evo="record-actions"
            role="toolbar"
            aria-label={t('Record actions')}
        >
            {actions.length > 0 ? (
                <ButtonGroup>
                    {actions.map((action) => (
                        <Button
                            key={action.id}
                            type="button"
                            variant={
                                action.variant === 'primary'
                                    ? 'default'
                                    : action.variant === 'ghost'
                                      ? 'ghost'
                                      : 'outline'
                            }
                            size="sm"
                            onClick={action.onSelect}
                            {...(action.href ? { asChild: true } : {})}
                        >
                            {action.href ? (
                                <a href={action.href}>{t(action.label)}</a>
                            ) : (
                                t(action.label)
                            )}
                        </Button>
                    ))}
                </ButtonGroup>
            ) : null}
            {overflow.length > 0 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t('More actions')}
                        >
                            <DotsThree
                                className="size-4"
                                weight="bold"
                                aria-hidden
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {overflow.map((action) => (
                            <DropdownMenuItem
                                key={action.id}
                                onSelect={() => {
                                    if (action.onSelect) {
                                        action.onSelect();

                                        return;
                                    }

                                    if (action.href) {
                                        window.location.assign(action.href);
                                    }
                                }}
                            >
                                {t(action.label)}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
            {secondary}
        </div>
    );
}
