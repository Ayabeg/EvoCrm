import { Head } from '@inertiajs/react';
import { Input } from '@/evo/ui/input';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type Thresholds = {
    hold: number;
    qualify: number;
    convert: number;
};

type ScoreRules = Record<string, Record<string, number>>;

const ruleLabels: Record<string, string> = {
    company: 'Company attached',
    email: 'Usable business email / email on file',
    phone: 'Usable telephone / phone on file',
    phone_dz: '+213 phone',
    location: 'Geographic location',
    domain: 'Company domain',
    industry: 'Industry identified',
    source: 'Traceable lead source',
    wilaya: 'Priority wilaya',
    inbound: 'Inbound source',
    form: 'Form answers',
    activity: 'Recent activity',
    today: 'Created today',
    '3d': 'Last 3 days',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    stale: 'Older than 30 days',
};

export default function QualifySettings({
    thresholds,
    rules,
    canManage,
}: {
    thresholds: Thresholds;
    rules: ScoreRules;
    canManage: boolean;
}) {
    return (
        <>
            <Head title={t('Qualification')} />

            <SettingsPageHeader
                title="Qualification"
                description="Formula lead score thresholds. Crossing qualify marks the lead. Crossing convert uses the existing convert path."
            />

            <SettingsForm action="/settings/qualify" method="put">
                {({ processing }) => (
                    <div className="grid gap-4">
                        <SettingsCard
                            title="Score thresholds"
                            required
                            footer={
                                canManage ? (
                                    <SettingsSaveBar
                                        processing={processing}
                                        saveLabel="Save scoring settings"
                                    />
                                ) : undefined
                            }
                        >
                            <SettingsFormRow label="Hold" htmlFor="hold" required>
                                <Input
                                    id="hold"
                                    name="hold"
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={thresholds.hold}
                                    className="h-8"
                                    disabled={!canManage}
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Qualify" htmlFor="qualify" required>
                                <Input
                                    id="qualify"
                                    name="qualify"
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={thresholds.qualify}
                                    className="h-8"
                                    disabled={!canManage}
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Convert" htmlFor="convert" required>
                                <Input
                                    id="convert"
                                    name="convert"
                                    type="number"
                                    min={0}
                                    max={100}
                                    defaultValue={thresholds.convert}
                                    className="h-8"
                                    disabled={!canManage}
                                />
                            </SettingsFormRow>
                            <p className="text-[12px] text-mute">
                                Hold moves new leads to working. Qualify sets qualified. Convert creates or links the unique deal.
                            </p>
                        </SettingsCard>

                        <SettingsCard
                            title="Scoring rule points"
                            description="Adjust the explainable points used by each fit, intent, timing, and data-quality rule. Each value is bounded from 0 to 100."
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                {Object.entries(rules).map(([pillar, points]) => (
                                    <div key={pillar} className="grid gap-2">
                                        <h3 className="text-[12px] font-medium capitalize text-[var(--evo-ink)]">
                                            {pillar.replace('_', ' ')}
                                        </h3>
                                        {Object.entries(points).map(([key, value]) => {
                                            const id = `rules-${pillar}-${key}`;

                                            return (
                                                <SettingsFormRow
                                                    key={key}
                                                    label={ruleLabels[key] ?? key}
                                                    htmlFor={id}
                                                >
                                                    <Input
                                                        id={id}
                                                        name={`rules[${pillar}][${key}]`}
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        defaultValue={value}
                                                        className="h-8"
                                                        disabled={!canManage}
                                                    />
                                                </SettingsFormRow>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </SettingsCard>
                    </div>
                )}
            </SettingsForm>
        </>
    );
}
