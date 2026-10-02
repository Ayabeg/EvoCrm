import { FilterBuilder } from '@/evo/data/filters';
import { Checkbox } from '@/evo/ui/checkbox';
import { Label } from '@/evo/ui/label';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';
import type { ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';

export type SegmentFilters = {
    stage?: string;
    owner?: string;
    city?: string;
    wilaya?: string;
    last_activity?: string;
    created?: string;
    status?: string;
    unanswered?: boolean;
    unassigned?: boolean;
    enrolled_in_sequence?: string;
    email_replied?: boolean;
    email_opened?: boolean;
    filter_groups?: unknown;
};

type Member = { id: number; name: string };
type Stage = { id: number; name: string; slug: string };

export type SegmentRulesEditorProps = {
    entity: 'contact' | 'deal';
    filters: SegmentFilters;
    onChange: (next: SegmentFilters) => void;
    members: Member[];
    cities: string[];
    wilayas: string[];
    stages: Stage[];
    filterFields?: ListFieldDef[];
};

export function SegmentRulesEditor({
    entity,
    filters,
    onChange,
    members,
    cities,
    wilayas,
    stages,
    filterFields = [],
}: SegmentRulesEditorProps) {
    const setField = (key: keyof SegmentFilters, value: string | boolean | undefined) => {
        onChange({ ...filters, [key]: value === '' ? undefined : value });
    };

    return (
        <div className="grid gap-3 md:grid-cols-2" data-segment="rules-editor">
            {entity === 'deal' ? (
                <div>
                    <Label htmlFor="segment-stage">{t('Stage')}</Label>
                    <NativeSelect
                        id="segment-stage"
                        className="mt-1"
                        value={filters.stage ?? ''}
                        onChange={(event) => setField('stage', event.target.value)}
                    >
                        <option value="">{t('Any stage')}</option>
                        {stages.map((stage) => (
                            <option key={stage.id} value={stage.slug}>
                                {stage.name}
                            </option>
                        ))}
                    </NativeSelect>
                </div>
            ) : null}
            <div>
                <Label htmlFor="segment-owner">{t('Owner')}</Label>
                <NativeSelect
                    id="segment-owner"
                    className="mt-1"
                    value={filters.owner ?? ''}
                    onChange={(event) => setField('owner', event.target.value)}
                >
                    <option value="">{t('Any owner')}</option>
                    <option value="unassigned">{t('Unassigned')}</option>
                    {members.map((member) => (
                        <option key={member.id} value={String(member.id)}>
                            {member.name}
                        </option>
                    ))}
                </NativeSelect>
            </div>
            <div>
                <Label htmlFor="segment-city">{t('City')}</Label>
                <NativeSelect
                    id="segment-city"
                    className="mt-1"
                    value={filters.city ?? ''}
                    onChange={(event) => setField('city', event.target.value)}
                >
                    <option value="">{t('Any city')}</option>
                    {cities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </NativeSelect>
            </div>
            <div>
                <Label htmlFor="segment-wilaya">{t('Wilaya')}</Label>
                <NativeSelect
                    id="segment-wilaya"
                    className="mt-1"
                    value={filters.wilaya ?? ''}
                    onChange={(event) => setField('wilaya', event.target.value)}
                >
                    <option value="">{t('Any wilaya')}</option>
                    {wilayas.map((wilaya) => (
                        <option key={wilaya} value={wilaya}>
                            {wilaya}
                        </option>
                    ))}
                </NativeSelect>
            </div>
            <div>
                <Label htmlFor="segment-last-activity">{t('Last activity')}</Label>
                <NativeSelect
                    id="segment-last-activity"
                    className="mt-1"
                    value={filters.last_activity ?? ''}
                    onChange={(event) => setField('last_activity', event.target.value)}
                >
                    <option value="">{t('Any time')}</option>
                    <option value="7d">{t('Last 7 days')}</option>
                    <option value="30d">{t('Last 30 days')}</option>
                    <option value="none">{t('No activity')}</option>
                </NativeSelect>
            </div>
            <div>
                <Label htmlFor="segment-created">{t('Created')}</Label>
                <NativeSelect
                    id="segment-created"
                    className="mt-1"
                    value={filters.created ?? ''}
                    onChange={(event) => setField('created', event.target.value)}
                >
                    <option value="">{t('Any time')}</option>
                    <option value="today">{t('Today')}</option>
                    <option value="7d">{t('Last 7 days')}</option>
                    <option value="30d">{t('Last 30 days')}</option>
                    <option value="90d">{t('Last 90 days')}</option>
                </NativeSelect>
            </div>
            <div>
                <Label htmlFor="segment-status">{t('Status')}</Label>
                <NativeSelect
                    id="segment-status"
                    className="mt-1"
                    value={filters.status ?? ''}
                    onChange={(event) => setField('status', event.target.value)}
                >
                    <option value="">{t('Any status')}</option>
                    <option value="open">{t('Open')}</option>
                    <option value="won">{t('Won')}</option>
                    <option value="lost">{t('Lost')}</option>
                </NativeSelect>
            </div>
            <div className="flex flex-col justify-end gap-2 text-[13px]">
                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={!!filters.unanswered}
                        onCheckedChange={(checked) => setField('unanswered', checked === true)}
                    />
                    {t('Unanswered only')}
                </label>
                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={!!filters.unassigned}
                        onCheckedChange={(checked) => setField('unassigned', checked === true)}
                    />
                    {t('Unassigned only')}
                </label>
                {entity === 'contact' ? (
                    <>
                        <label className="flex items-center gap-2">
                            <Checkbox
                                checked={!!filters.email_replied}
                                onCheckedChange={(checked) => setField('email_replied', checked === true)}
                            />
                            {t('Replied to email')}
                        </label>
                        <label className="flex items-center gap-2">
                            <Checkbox
                                checked={!!filters.email_opened}
                                onCheckedChange={(checked) => setField('email_opened', checked === true)}
                            />
                            {t('Opened email')}
                        </label>
                    </>
                ) : null}
            </div>
            {filterFields.length > 0 ? (
                <div className="md:col-span-2">
                    <Label>{t('Advanced filter groups')}</Label>
                    <p className="mb-2 text-[12px] text-[var(--evo-ink-muted)]">
                        {t('AND / OR groups reuse the CRM filter builder.')}
                    </p>
                    <FilterBuilder
                        fields={filterFields}
                        value={(filters.filter_groups as ListViewFilters | undefined) ?? defaultFilterGroups()}
                        onChange={(groups) => onChange({ ...filters, filter_groups: groups })}
                        allowGroups
                    />
                </div>
            ) : null}
        </div>
    );
}
