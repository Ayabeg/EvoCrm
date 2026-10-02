import { useEffect, useMemo, useState } from 'react';
import { crmMessages } from '@/evo/crm/messages';
import { DealCard } from '@/evo/crm/pipeline/DealCard';
import { ForecastBar } from '@/evo/crm/pipeline/ForecastBar';
import { LostReasonDialog } from '@/evo/crm/pipeline/LostReasonDialog';
import { Pipeline } from '@/evo/crm/pipeline/Pipeline';
import type {
    LostReasonPending,
    PipelineColumnData,
} from '@/evo/crm/pipeline/types';
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

const COLUMNS: PipelineColumnData[] = [
    {
        id: 'nouveau',
        name: 'Nouveau',
        slug: 'nouveau',
        count: 2,
        amount: '3 200 000 DA',
        accent: 'var(--evo-hairline-strong)',
    },
    {
        id: 'qualification',
        name: 'Qualification',
        slug: 'qualification',
        count: 1,
        amount: '2 400 000 DA',
        accent: 'var(--evo-ink-faint)',
    },
    {
        id: 'proposition',
        name: 'Proposition',
        slug: 'proposition',
        count: 1,
        amount: '1 280 000 DA',
        accent: 'var(--evo-teal)',
        weighted: '640 000 DA',
        probability: 50,
    },
    {
        id: 'negociation',
        name: 'Négociation',
        slug: 'negociation',
        count: 1,
        amount: '860 000 DA',
        accent: 'var(--evo-teal-ink)',
    },
    {
        id: 'gagne',
        name: 'Gagné',
        slug: 'gagne',
        count: 0,
        amount: '0 DA',
        accent: 'var(--evo-success)',
        isWon: true,
    },
    {
        id: 'perdu',
        name: 'Perdu',
        slug: 'perdu',
        count: 0,
        amount: '0 DA',
        accent: 'var(--evo-danger)',
        isLost: true,
    },
];

export function PipelineLabPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const story = useMemo(() => getPr5Story(), []);
    const [columnOf, setColumnOf] = useState<Record<string, string>>({
        'deal:7': 'proposition',
        'deal:8': 'nouveau',
        'deal:9': 'qualification',
        'deal:10': 'negociation',
        'deal:11': 'nouveau',
    });
    const [lost, setLost] = useState<LostReasonPending | null>(null);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const deals = {
        'deal:7': {
            id: 7,
            title: story.title,
            amount: story.amountLabel,
            association: story.company,
            owner: story.owner,
            href: '#',
            quotes: 'Devis v2',
        },
        'deal:8': {
            id: 8,
            title: 'Maintenance IRM',
            amount: formatMoney(1_800_000),
            association: story.company,
            owner: story.owner,
            href: '#',
        },
        'deal:9': {
            id: 9,
            title: 'Modernisation CRM',
            amount: formatMoney(2_400_000),
            association: story.company,
            owner: story.owner,
            href: '#',
        },
        'deal:10': {
            id: 10,
            title: 'Pack stérilisation',
            amount: formatMoney(860_000),
            association: story.company,
            owner: story.owner,
            href: '#',
        },
        'deal:11': {
            id: 11,
            title: 'Consommables bloc',
            amount: formatMoney(1_400_000),
            association: story.company,
            owner: story.owner,
            href: '#',
        },
    };

    const itemsByColumn = COLUMNS.reduce<Record<string, string[]>>(
        (acc, column) => {
            acc[column.id] = Object.entries(columnOf)
                .filter(([, id]) => id === column.id)
                .map(([itemId]) => itemId);

            return acc;
        },
        {},
    );

    const localeLine = `${story.company} · ${formatMoney(story.amountDzd)} · ${formatPhone('+213555000001')} · ${formatTime('2026-10-01T16:30:00+01:00')} · semaine samedi (${WEEK_STARTS_ON})`;

    return (
        <div className="pb-16" data-lab-page="pipeline">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Design Lab · PR5
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">
                        Pipeline
                    </h1>
                    <p className="mt-2 max-w-[640px] text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                        Tableau dnd-kit, annonces FR, ForecastBar sur
                        evo/charts.
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

            <ForecastBar
                forecast={{
                    count: 5,
                    amount: formatMoney(7_740_000),
                    weighted: formatMoney(2_860_000),
                    band: '1,9 – 3,4 M DA',
                    narrative: 'Fourchette pondérée · Clinique El Djazair',
                }}
                stages={story.stages}
            />

            <div className="mt-4 h-[560px] overflow-hidden rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]">
                <Pipeline
                    columns={COLUMNS}
                    itemsByColumn={itemsByColumn}
                    renderCard={(id) => (
                        <DealCard deal={deals[id as keyof typeof deals]} />
                    )}
                    renderOverlay={(id) =>
                        deals[id as keyof typeof deals]?.title
                    }
                    onMove={({ itemId, toColumnId }) => {
                        if (toColumnId === 'perdu') {
                            setLost({
                                itemId,
                                columnId: toColumnId,
                                title:
                                    deals[itemId as keyof typeof deals]
                                        ?.title ?? itemId,
                            });

                            return;
                        }

                        setColumnOf((current) => ({
                            ...current,
                            [itemId]: toColumnId,
                        }));
                    }}
                />
            </div>

            <LostReasonDialog
                pending={lost}
                onCancel={() => setLost(null)}
                onConfirm={() => {
                    if (lost) {
                        setColumnOf((current) => ({
                            ...current,
                            [lost.itemId]: lost.columnId,
                        }));
                    }

                    setLost(null);
                }}
            />
        </div>
    );
}
