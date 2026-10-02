import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import {
    SettingsForm,
    SettingsFormRow,
    SettingsSaveBar,
    SettingsSection,
} from '@/evo/patterns/settings';
import { Input } from '@/evo/ui/input';
import { TimePicker } from '@/evo/ui/time-picker';
import { t } from '@/lib/i18n';

export default function QuietHoursEdit({
    quietHours,
}: {
    quietHours: { starts_at: string; ends_at: string; timezone: string; enabled: boolean };
}) {
    const [startsAt, setStartsAt] = useState(quietHours.starts_at);
    const [endsAt, setEndsAt] = useState(quietHours.ends_at);

    return (
        <OutboundShell title="Heures calmes">
            <Head title={t('Heures calmes')} />
            <OutboundPage
                title="Heures calmes"
                description="L’outbound automatique est bloqué dans cette fenêtre. Défaut 21:00–08:00 Africa/Algiers."
            >
                <SettingsForm action="/outbound/quiet-hours" method="post">
                    {({ processing }) => (
                        <SettingsSection
                            title="Fenêtre"
                            required
                            footer={<SettingsSaveBar processing={processing} />}
                        >
                            <SettingsFormRow label="Début" htmlFor="starts_at" required>
                                <TimePicker
                                    id="starts_at"
                                    name="starts_at"
                                    value={startsAt}
                                    onValueChange={(value) => setStartsAt(value ?? '')}
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Fin" htmlFor="ends_at" required>
                                <TimePicker
                                    id="ends_at"
                                    name="ends_at"
                                    value={endsAt}
                                    onValueChange={(value) => setEndsAt(value ?? '')}
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Fuseau" htmlFor="timezone" required>
                                <Input
                                    id="timezone"
                                    name="timezone"
                                    size="sm"
                                    defaultValue={quietHours.timezone}
                                    required
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Actif" htmlFor="enabled">
                                <label className="flex h-8 items-center gap-2 text-[13px] text-[var(--evo-ink)]">
                                    <input type="hidden" name="enabled" value="0" />
                                    <input
                                        id="enabled"
                                        type="checkbox"
                                        name="enabled"
                                        value="1"
                                        defaultChecked={quietHours.enabled}
                                    />
                                    Activé
                                </label>
                            </SettingsFormRow>
                        </SettingsSection>
                    )}
                </SettingsForm>
            </OutboundPage>
        </OutboundShell>
    );
}

QuietHoursEdit.layout = {
    breadcrumbs: [{ title: 'Heures calmes', href: '/outbound/quiet-hours' }],
};
