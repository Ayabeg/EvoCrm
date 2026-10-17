import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { automationMessages } from '@/evo/automation/messages';
import { SegmentRulesEditor } from '@/evo/automation/SegmentRulesEditor';
import type { SegmentFilters } from '@/evo/automation/SegmentRulesEditor';
import { WorkflowBuilder } from '@/evo/automation/WorkflowBuilder';
import { WorkflowList } from '@/evo/automation/WorkflowList';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Moon, Sun } from '@/evo/icons';
import { WEEK_STARTS_ON, formatMoney, formatPhone, formatTime } from '@/evo/lib/format';
import { Badge } from '@/evo/ui/badge';
import { hydrateI18n } from '@/lib/i18n';
import type { ListFieldDef } from '@/lib/list-view-config';
import { emptyWorkflowDraft } from '@/lib/workflow-authoring';
import type {
    WorkflowCapabilities,
    WorkflowConditionField,
    WorkflowDraft,
    WorkflowMember,
    WorkflowRow,
    WorkflowSequence,
    WorkflowStage,
    WorkflowTemplate,
} from '@/lib/workflow-authoring';

import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { owners } from '../data/evocrm-demo-data';
import { AUTOMATION_CHILDREN } from '../lib/nav';
import { navigateLab } from '../lib/routes';

hydrateI18n('fr', automationMessages);

const CAPABILITIES: WorkflowCapabilities = {
    can_manage: true,
    has_mailbox: true,
    has_sequences: true,
};

const STAGES: WorkflowStage[] = [
    { id: 1, name: 'Nouveau', slug: 'nouveau' },
    { id: 2, name: 'Qualification', slug: 'qualification' },
    { id: 3, name: 'Proposition', slug: 'proposition' },
    { id: 4, name: 'Négociation', slug: 'negociation' },
    { id: 5, name: 'Gagné', slug: 'gagne' },
];

const SEQUENCES: WorkflowSequence[] = [
    { id: 1, name: 'Nurture Pharmacie Centrale', channel: 'email' },
    { id: 2, name: 'Relance devis cliniques', channel: 'email' },
];

const SEGMENTS = [
    { id: 1, name: 'Cliniques Alger' },
    { id: 2, name: 'Hôpital Ibn Sina — suivi' },
];

const CONDITION_FIELDS: WorkflowConditionField[] = [
    { value: 'deal.amount', label: 'Montant affaire' },
    { value: 'deal.stage', label: 'Étape' },
    { value: 'contact.wilaya', label: 'Wilaya' },
    { value: 'contact.city', label: 'Ville' },
    { value: 'contact.source', label: 'Source' },
];

const FILTER_FIELDS: ListFieldDef[] = [
    { id: 'company', label: 'Société', type: 'text' },
    { id: 'wilaya', label: 'Wilaya', type: 'select', options: ['Alger', 'Oran', 'Constantine', 'Blida'] },
    { id: 'amount', label: 'Montant', type: 'number' },
];

const TEMPLATES: WorkflowTemplate[] = [
    {
        key: 'new-contact-task',
        name: 'Nouveau contact → tâche',
        description: 'Crée une tâche le jour même pour Clinique El Djazair.',
        trigger: 'contact.created',
        action: 'create_task',
    },
    {
        key: 'won-deal-notify',
        name: 'Affaire gagnée → notification',
        description: 'Prévenir le propriétaire quand Hôpital Ibn Sina gagne.',
        trigger: 'deal.stage_changed',
        action: 'notify_user',
    },
];

type HistoryRow = {
    id: number;
    workflow: string;
    record: string;
    status: 'completed' | 'failed' | 'pending';
    branch: 'then' | 'else';
    started: string;
    finished: string;
    amount: string;
};

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
}

function seedDraft(): WorkflowDraft {
    return {
        ...emptyWorkflowDraft(),
        name: 'Nouveau contact Clinique El Djazair',
        trigger: 'contact.created',
        action: 'create_task',
        subject: 'Appeler Clinique El Djazair',
        due_in_days: '1',
        condition_field: 'contact.wilaya',
        condition_operator: 'eq',
        condition_value: 'Alger',
        else_action: 'notify_user',
        else_notify_user_id: '1',
    };
}

function seedWorkflows(): WorkflowRow[] {
    return [
        {
            id: 1,
            name: 'Nouveau contact Clinique El Djazair',
            trigger: 'contact.created',
            trigger_stage: null,
            trigger_stage_id: null,
            trigger_status: null,
            trigger_status_label: null,
            trigger_saved_filter_id: null,
            action: 'create_task',
            action_config: { subject: 'Appeler Clinique El Djazair', due_in_days: 1 },
            condition_field: 'contact.wilaya',
            condition_operator: 'eq',
            condition_value: 'Alger',
            else_action: 'notify_user',
            else_action_config: {},
            active: true,
            template_key: 'new-contact-task',
            delay_minutes: 0,
            created_at: '2026-09-12T09:00:00+01:00',
            updated_at: '2026-09-28T16:30:00+01:00',
        },
        {
            id: 2,
            name: 'Affaire Hôpital Ibn Sina',
            trigger: 'deal.stage_changed',
            trigger_stage: 'proposition',
            trigger_stage_id: 3,
            trigger_status: null,
            trigger_status_label: null,
            trigger_saved_filter_id: null,
            action: 'notify_user',
            action_config: {},
            condition_field: 'deal.amount',
            condition_operator: 'gte',
            condition_value: '1280000',
            else_action: null,
            else_action_config: {},
            active: true,
            template_key: null,
            delay_minutes: 0,
            created_at: '2026-09-08T10:00:00+01:00',
            updated_at: '2026-09-27T11:15:00+01:00',
        },
        {
            id: 3,
            name: 'Devis Cabinet Dr. Amrani',
            trigger: 'deal.created',
            trigger_stage: null,
            trigger_stage_id: null,
            trigger_status: null,
            trigger_status_label: null,
            trigger_saved_filter_id: null,
            action: 'create_task',
            action_config: { subject: 'Relancer le devis', due_in_days: 2 },
            condition_field: null,
            condition_operator: null,
            condition_value: null,
            else_action: null,
            else_action_config: {},
            active: false,
            template_key: null,
            delay_minutes: 30,
            created_at: '2026-09-18T14:00:00+01:00',
            updated_at: '2026-09-22T09:40:00+01:00',
        },
        {
            id: 4,
            name: 'Pharmacie Centrale — séquence',
            trigger: 'segment.entered',
            trigger_stage: null,
            trigger_stage_id: null,
            trigger_status: null,
            trigger_status_label: null,
            trigger_saved_filter_id: 1,
            action: 'enroll_sequence',
            action_config: { sequence_id: 1 },
            condition_field: null,
            condition_operator: null,
            condition_value: null,
            else_action: null,
            else_action_config: {},
            active: true,
            template_key: null,
            delay_minutes: 0,
            created_at: '2026-09-04T08:00:00+01:00',
            updated_at: '2026-09-30T18:05:00+01:00',
        },
    ];
}

function seedHistory(): HistoryRow[] {
    return [
        {
            id: 41,
            workflow: 'Nouveau contact Clinique El Djazair',
            record: 'Clinique El Djazair',
            status: 'completed',
            branch: 'then',
            started: '02/10/2026 09:12',
            finished: '02/10/2026 09:12',
            amount: formatMoney(1_280_000),
        },
        {
            id: 42,
            workflow: 'Affaire Hôpital Ibn Sina',
            record: 'Hôpital Ibn Sina',
            status: 'completed',
            branch: 'then',
            started: '01/10/2026 16:30',
            finished: '01/10/2026 16:31',
            amount: formatMoney(2_450_000),
        },
        {
            id: 43,
            workflow: 'Devis Cabinet Dr. Amrani',
            record: 'Cabinet Dr. Amrani',
            status: 'failed',
            branch: 'else',
            started: '30/09/2026 11:04',
            finished: '30/09/2026 11:04',
            amount: formatMoney(420_000),
        },
        {
            id: 44,
            workflow: 'Pharmacie Centrale — séquence',
            record: 'Pharmacie Centrale',
            status: 'pending',
            branch: 'then',
            started: '02/10/2026 08:00',
            finished: 'Planifié 02/10/2026 08:30',
            amount: formatMoney(186_000),
        },
    ];
}

function StateBlock({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
            data-lab-state={id}
        >
            <header className="mb-4">
                <h2 className="text-[14px] font-semibold text-[var(--evo-ink)]">{title}</h2>
                <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">{description}</p>
            </header>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

export function AutomationLabPage({ view = 'workflows' }: { view?: string }) {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const [draft, setDraft] = useState<WorkflowDraft>(seedDraft);
    const [workflows, setWorkflows] = useState<WorkflowRow[]>(seedWorkflows);
    const [filters, setFilters] = useState<SegmentFilters>({
        wilaya: 'Alger',
        city: 'Alger',
        filter_groups: {
            logic: 'and',
            groups: [
                {
                    logic: 'or',
                    rules: [
                        { field: 'company', operator: 'contains', value: 'Clinique' },
                        { field: 'company', operator: 'contains', value: 'Hôpital' },
                    ],
                },
                {
                    logic: 'and',
                    rules: [{ field: 'wilaya', operator: 'eq', value: 'Alger' }],
                },
            ],
        },
    });

    const members: WorkflowMember[] = useMemo(
        () => owners.slice(0, 4).map((owner, index) => ({ id: index + 1, name: owner.name })),
        [],
    );
    const history = useMemo(() => seedHistory(), []);
    const activeView = view === 'overview' ? 'workflows' : view;

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const localeLine = `Clinique El Djazair · ${formatMoney(1_280_000)} · ${formatPhone('+213551234567')} · ${formatTime('2026-10-01T16:30:00+01:00')} · semaine samedi (${WEEK_STARTS_ON})`;

    const historyColumns: EvoDataGridColumn<HistoryRow>[] = [
        {
            id: 'status',
            header: 'Statut',
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'failed' ? 'destructive' : 'outline'}>
                    {row.original.status === 'completed'
                        ? 'Terminé'
                        : row.original.status === 'failed'
                          ? 'Échec'
                          : 'En attente'}
                </Badge>
            ),
        },
        { id: 'workflow', header: 'Workflow', accessorFn: (row) => row.workflow },
        { id: 'record', header: 'Fiche', accessorFn: (row) => row.record },
        { id: 'branch', header: 'Branche', accessorFn: (row) => (row.branch === 'then' ? 'ALORS' : 'SINON') },
        { id: 'amount', header: 'Montant', accessorFn: (row) => row.amount },
        { id: 'started', header: 'Début', accessorFn: (row) => row.started },
        { id: 'finished', header: 'Fin', accessorFn: (row) => row.finished },
    ];

    return (
        <div className="mx-auto max-w-[1120px] space-y-7 pb-16" data-lab-page="automation">
            <PageHeader
                title="Automatisation"
                descriptor="WHEN / IF / THEN · Clinique El Djazair · septembre 2026"
                context={
                    <>
                        {AUTOMATION_CHILDREN.map((child) => (
                            <LabLink key={child.id} to={child.to}>
                                <ContextChip active={activeView === child.id}>{child.label}</ContextChip>
                            </LabLink>
                        ))}
                    </>
                }
                actions={
                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[12px] font-medium"
                        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    >
                        {theme === 'dark' ? (
                            <Sun className="size-3.5" weight="regular" />
                        ) : (
                            <Moon className="size-3.5" weight="regular" />
                        )}
                        {theme === 'dark' ? 'Clair' : 'Sombre'}
                    </button>
                }
            />
            <p className="text-[12px] tabular-nums text-[var(--evo-ink-muted)]">{localeLine}</p>

            {activeView === 'editor' ? (
                <StateBlock
                    id="editor"
                    title="Éditeur QUAND / SI / ALORS"
                    description="Déclencheur, une condition, action et sinon. Accessible au clavier."
                >
                    <WorkflowBuilder
                        draft={draft}
                        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
                        stages={STAGES}
                        sequences={SEQUENCES}
                        segments={SEGMENTS}
                        members={members}
                        conditionFields={CONDITION_FIELDS}
                        ticketStatuses={[
                            { value: 'new', label: 'Nouveau' },
                            { value: 'closed', label: 'Fermé' },
                        ]}
                        capabilities={CAPABILITIES}
                        errors={{}}
                    />
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Review configuration — Ceci relit la structure. Ça n’exécute pas le workflow.
                    </p>
                </StateBlock>
            ) : null}

            {activeView === 'segments' ? (
                <StateBlock
                    id="segments"
                    title="Règles de segment"
                    description="Groupes ET / OU du constructeur de filtres CRM · Clinique El Djazair / Hôpital Ibn Sina."
                >
                    <SegmentRulesEditor
                        entity="contact"
                        filters={filters}
                        onChange={setFilters}
                        members={members}
                        cities={['Alger', 'Oran', 'Constantine', 'Blida']}
                        wilayas={['Alger', 'Oran', 'Constantine', 'Blida']}
                        stages={STAGES}
                        filterFields={FILTER_FIELDS}
                    />
                </StateBlock>
            ) : null}

            {activeView === 'history' ? (
                <StateBlock
                    id="history"
                    title="Historique d’exécution"
                    description="La relance n’est pas disponible. Relancer risquerait des effets de bord en double."
                >
                    <DataGrid
                        columns={historyColumns}
                        data={history}
                        getRowId={(row) => String(row.id)}
                        density="compact"
                        enableSelection={false}
                        pagination="none"
                        hideColumnPicker
                        embedded
                        enableSorting={false}
                        emptyTitle="Aucune exécution"
                    />
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">Retry is not available</p>
                </StateBlock>
            ) : null}

            {activeView === 'workflows' || activeView === 'overview' ? (
                <StateBlock
                    id="workflows"
                    title="Workflows"
                    description="Modèles Evo et workflows du jeu Design Lab."
                >
                    <WorkflowList
                        workflows={workflows}
                        templates={TEMPLATES}
                        conditionFields={CONDITION_FIELDS}
                        stages={STAGES}
                        canManage
                        mutating={false}
                        onEdit={(workflow) => {
                            setDraft({
                                ...seedDraft(),
                                name: workflow.name,
                                trigger: workflow.trigger,
                                action: workflow.action,
                            });
                            navigateLab({ name: 'automation', view: 'editor' });
                        }}
                        onToggle={(workflow) => {
                            setWorkflows((current) =>
                                current.map((row) =>
                                    row.id === workflow.id ? { ...row, active: !row.active } : row,
                                ),
                            );
                        }}
                        onDelete={(workflow) => {
                            setWorkflows((current) => current.filter((row) => row.id !== workflow.id));
                        }}
                        onRestore={() => {}}
                        onUseTemplate={(key) => {
                            const template = TEMPLATES.find((item) => item.key === key);

                            if (template) {
                                setDraft({
                                    ...seedDraft(),
                                    name: template.name,
                                    trigger: template.trigger,
                                    action: template.action,
                                });
                                navigateLab({ name: 'automation', view: 'editor' });
                            }
                        }}
                    />
                </StateBlock>
            ) : null}
        </div>
    );
}
