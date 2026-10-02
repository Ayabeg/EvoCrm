import { useEffect, useMemo, useState } from 'react';
import { crmMessages } from '@/evo/crm/messages';
import { QuoteWorkspace } from '@/evo/crm/quote/QuoteWorkspace';
import type { QuoteLine } from '@/evo/crm/quote/types';
import { Moon, Sun } from '@/evo/icons';
import {
    WEEK_STARTS_ON,
    formatMoney,
    formatPhone,
    formatTime,
} from '@/evo/lib/format';
import { hydrateI18n } from '@/lib/i18n';
import { getPr5Story } from '../data/pr5-story';

hydrateI18n('fr', crmMessages);

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark'
        ? 'dark'
        : 'light';
}

export function QuoteLabPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const story = useMemo(() => getPr5Story(), []);
    const [items, setItems] = useState<QuoteLine[]>(story.items);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const total = items.reduce(
        (sum, row) => sum + row.quantity * row.unitDzd,
        0,
    );
    const localeLine = `${story.company} · ${formatMoney(story.amountDzd)} · ${formatPhone('+213555000001')} · ${formatTime('2026-10-01T16:30:00+01:00')} · semaine samedi (${WEEK_STARTS_ON})`;

    return (
        <div className="pb-16" data-lab-page="quote">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Design Lab · PR5
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">
                        Devis
                    </h1>
                    <p className="mt-2 max-w-[640px] text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                        {story.title} v{story.quoteVersion} ·{' '}
                        {story.amountLabel}.
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)] tabular-nums">
                        {localeLine}
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[12px] font-medium"
                    onClick={() =>
                        setTheme((current) =>
                            current === 'dark' ? 'light' : 'dark',
                        )
                    }
                >
                    {theme === 'dark' ? (
                        <Sun className="size-3.5" />
                    ) : (
                        <Moon className="size-3.5" />
                    )}
                    {theme === 'dark' ? 'Clair' : 'Sombre'}
                </button>
            </header>

            <div className="h-[760px] overflow-hidden rounded-[10px] border border-[var(--evo-hairline)]">
                <QuoteWorkspace
                    quote={{
                        id: 47,
                        title: story.title,
                        number: story.quoteNumber,
                        status: 'draft',
                        statusLabel: 'Brouillon',
                        contactName: story.contact,
                        companyName: story.company,
                        ownerName: story.owner,
                        expiresAt: '15 oct. 2026',
                        items,
                        totals: { subtotalDzd: total, totalDzd: total },
                        previewHref: '#',
                    }}
                    onItemsChange={setItems}
                />
            </div>
        </div>
    );
}
