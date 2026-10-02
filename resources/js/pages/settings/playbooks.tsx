import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsPageHeader,
    SettingsSaveBar,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type Playbook = {
    id: number;
    entity: 'contact' | 'deal';
    name: string;
    body: string;
};

export default function PlaybookSettings({
    playbooks,
}: {
    playbooks: Playbook[];
}) {
    return (
        <>
            <Head title={t('Playbooks')} />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="Playbooks"
                    description="Short call and email scripts shown on contact and deal records."
                />
                <SettingsForm action="/settings/playbooks" method="post">
                    <SettingsCard
                        title="New playbook"
                        required
                        footer={<SettingsSaveBar saveLabel="Save playbook" />}
                    >
                        <div>
                            <Label htmlFor="playbook-name">Name</Label>
                            <Input
                                id="playbook-name"
                                name="name"
                                required
                                className="mt-1"
                                placeholder="First Alger call"
                            />
                        </div>
                        <div>
                            <Label htmlFor="playbook-entity">Record</Label>
                            <select
                                id="playbook-entity"
                                name="entity"
                                className="mt-1 h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm"
                                defaultValue="contact"
                            >
                                <option value="contact">Contact</option>
                                <option value="deal">Deal</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="playbook-body">Script</Label>
                            <textarea
                                id="playbook-body"
                                name="body"
                                required
                                rows={4}
                                className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                placeholder="Confirm wilaya, then book a site visit."
                            />
                        </div>
                    </SettingsCard>
                </SettingsForm>
                <div className="space-y-3">
                    {playbooks.length === 0 ? (
                        <SettingsEmptyState
                            title="No playbooks yet"
                            description="Save a short call or email script to show it on contact and deal records."
                        />
                    ) : (
                        playbooks.map((playbook) => (
                            <Card
                                key={playbook.id}
                                className="space-y-3 border-hairline p-4"
                            >
                                <SettingsForm
                                    action={`/settings/playbooks/${playbook.id}`}
                                    method="put"
                                    className="grid gap-3"
                                >
                                    <Input
                                        name="name"
                                        defaultValue={playbook.name}
                                        required
                                    />
                                    <input
                                        type="hidden"
                                        name="entity"
                                        value={playbook.entity}
                                    />
                                    <textarea
                                        name="body"
                                        defaultValue={playbook.body}
                                        required
                                        rows={3}
                                        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm">
                                            {t('Update')}
                                        </Button>
                                    </div>
                                </SettingsForm>
                                <SettingsForm
                                    action={`/settings/playbooks/${playbook.id}`}
                                    method="delete"
                                >
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground"
                                    >
                                        {t('Delete')}
                                    </Button>
                                </SettingsForm>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
