import { useEffect, useMemo, useState } from 'react';
import { crmMessages } from '@/evo/crm/messages';
import { ActivityComposer } from '@/evo/crm/record/ActivityComposer';
import { ActivityTimeline } from '@/evo/crm/record/ActivityTimeline';
import { Associations } from '@/evo/crm/record/Associations';
import { CRMContext } from '@/evo/crm/record/CRMContext';
import { NextAction } from '@/evo/crm/record/NextAction';
import { QuickRecord } from '@/evo/crm/record/QuickRecord';
import { RecordActions } from '@/evo/crm/record/RecordActions';
import { RecordIdentity } from '@/evo/crm/record/RecordIdentity';
import { RecordPath } from '@/evo/crm/record/RecordPath';
import { RecordProperties } from '@/evo/crm/record/RecordProperties';
import { RecordWorkspace } from '@/evo/crm/record/RecordWorkspace';
import { RelatedRecords } from '@/evo/crm/record/RelatedRecords';
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

export function RecordLabPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const story = useMemo(() => getPr5Story(), []);
    const [peekOpen, setPeekOpen] = useState(false);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const descriptor = {
        ref: { type: 'deal' as const, id: 7 },
        title: story.title,
        subtitle: story.company,
        status: { label: 'Proposition', tone: 'neutral' as const },
        owner: { id: 3, name: story.owner },
        fullRecordHref: '/crm/deals/7',
        keyProperties: [
            { id: 'amount', label: 'Amount', value: story.amountLabel },
            { id: 'company', label: 'Company', value: story.company },
            { id: 'contact', label: 'Contact', value: story.contact },
            { id: 'owner', label: 'Owner', value: story.owner },
        ],
        associations: [
            { ref: { type: 'company' as const, id: 1 }, label: story.company },
            { ref: { type: 'contact' as const, id: 2 }, label: story.contact },
        ],
        activity: [],
        notes: [],
        tasks: [],
        actions: [],
        capabilities: {
            overview: true,
            activity: true,
            notes: true,
            tasks: true,
            associations: true,
            actions: true,
        },
        permissions: { can_view: true, can_update: true },
    };

    const localeLine = `${story.company} · ${formatMoney(story.amountDzd)} · ${formatPhone('+213555000001')} · ${formatTime('2026-10-01T16:30:00+01:00')} · semaine samedi (${WEEK_STARTS_ON})`;

    return (
        <div className="pb-16" data-lab-page="record">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Design Lab · PR5
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">
                        Fiche
                    </h1>
                    <p className="mt-2 max-w-[640px] text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                        RecordWorkspace · {story.title} · {story.company}.
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

            <div className="h-[720px] overflow-hidden rounded-[10px] border border-[var(--evo-hairline)]">
                <RecordWorkspace
                    header={
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <RecordIdentity
                                title={story.title}
                                kind="Deal"
                                subtitle={`${story.company} · ${story.amountLabel}`}
                                statusLabel="Proposition"
                            />
                            <RecordActions
                                actions={[
                                    {
                                        id: 'log',
                                        label: 'Note',
                                        variant: 'primary',
                                    },
                                    {
                                        id: 'quote',
                                        label: 'Quote',
                                        variant: 'secondary',
                                    },
                                ]}
                                overflow={[{ id: 'lost', label: 'Mark lost' }]}
                            />
                        </div>
                    }
                    path={
                        <RecordPath
                            current="proposition"
                            steps={[
                                { id: 'nouveau', label: 'Nouveau' },
                                { id: 'qualification', label: 'Qualification' },
                                {
                                    id: 'proposition',
                                    label: 'Proposition',
                                    current: true,
                                },
                                { id: 'negociation', label: 'Négociation' },
                                { id: 'gagne', label: 'Gagné' },
                            ]}
                        />
                    }
                    left={
                        <>
                            <RecordProperties
                                properties={[
                                    {
                                        id: 'amount',
                                        label: 'Amount',
                                        value: story.amountLabel,
                                        money: true,
                                    },
                                    {
                                        id: 'company',
                                        label: 'Company',
                                        value: story.company,
                                    },
                                    {
                                        id: 'contact',
                                        label: 'Contact',
                                        value: story.contact,
                                    },
                                    {
                                        id: 'owner',
                                        label: 'Owner',
                                        value: story.owner,
                                    },
                                ]}
                            />
                            <Associations
                                items={[
                                    {
                                        ref: { type: 'company', id: 1 },
                                        label: story.company,
                                    },
                                    {
                                        ref: { type: 'contact', id: 2 },
                                        label: story.contact,
                                    },
                                ]}
                            />
                        </>
                    }
                    center={
                        <>
                            <ActivityComposer />
                            <div className="mt-4">
                                <ActivityTimeline
                                    items={[
                                        {
                                            id: 1,
                                            type: 'note',
                                            title: 'Devis v2 envoyé',
                                            body: 'Équipement bloc opératoire — 1 280 000 DA',
                                            owner: story.owner,
                                            at: '2026-09-28T10:00:00+01:00',
                                        },
                                    ]}
                                />
                            </div>
                        </>
                    }
                    right={
                        <>
                            <NextAction
                                action={{
                                    title: 'Relancer Amine sur le devis v2',
                                    owner: story.owner,
                                    dueAt: '2026-10-03T09:00:00+01:00',
                                }}
                            />
                            <RelatedRecords
                                items={[
                                    {
                                        id: story.quoteNumber,
                                        label: story.quoteNumber,
                                        href: '#',
                                        meta: story.amountLabel,
                                    },
                                ]}
                            />
                            <button
                                type="button"
                                className="mt-3 text-[12px] text-[var(--evo-teal)] hover:underline"
                                onClick={() => setPeekOpen(true)}
                            >
                                Aperçu rapide
                            </button>
                        </>
                    }
                />
            </div>

            <div className="mt-6 rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]">
                <CRMContext
                    record={{
                        ref: { type: 'deal', id: 7 },
                        title: story.title,
                        subtitle: story.company,
                        status: { label: 'Proposition' },
                        owner: { id: 3, name: story.owner },
                        fullRecordHref: '#',
                        keyProperties: descriptor.keyProperties,
                        associations: descriptor.associations,
                        nextAction: { title: 'Relancer Amine sur le devis v2' },
                    }}
                />
            </div>

            <QuickRecord
                open={peekOpen}
                onOpenChange={setPeekOpen}
                preview={descriptor}
            />
        </div>
    );
}
