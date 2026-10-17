import type { ReactNode } from 'react';
import { LanguageSelector } from '@/components/language-selector';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Moon, Sun } from '@/evo/icons';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type GlobalHeaderProps = {
    trailing?: ReactNode;
};

/**
 * Shared authenticated chrome. It lives above WorkspaceFrame so the controls
 * remain present while every Inertia page changes underneath it.
 */
export function GlobalHeader({ trailing }: GlobalHeaderProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const nextAppearance = resolvedAppearance === 'dark' ? 'light' : 'dark';
    const AppearanceIcon = resolvedAppearance === 'dark' ? Sun : Moon;

    return (
        <header
            className="evo-global-header flex min-h-12 shrink-0 items-center gap-2 border-b px-3 md:px-5"
            data-global-header="true"
        >
            <SidebarTrigger
                className="size-9 shrink-0 text-[var(--evo-ink)] min-[769px]:hidden"
                aria-label={t('Open menu')}
            />
            <div className="ms-auto flex items-center gap-1.5">
                <LanguageSelector variant="header" />
                <button
                    type="button"
                    className={cn('evo-global-control', 'size-9 justify-center px-0')}
                    onClick={() => updateAppearance(nextAppearance)}
                    aria-label={`${t('Appearance')}: ${t(nextAppearance)}`}
                    title={`${t('Appearance')}: ${t(nextAppearance)}`}
                    data-test="global-theme-toggle"
                >
                    <AppearanceIcon className="size-4" weight="regular" aria-hidden />
                </button>
                {trailing}
            </div>
        </header>
    );
}
