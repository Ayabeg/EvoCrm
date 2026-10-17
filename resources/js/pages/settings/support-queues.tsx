import { Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsForm,
    SettingsPageHeader,
} from '@/evo/patterns/settings';
import { Button } from '@/evo/ui/button';
import { Card } from '@/evo/ui/card';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { t } from '@/lib/i18n';

type SupportQueue = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    round_robin: boolean;
    open_tickets_count: number;
};

export default function SupportQueuesSettings({
    queues,
    canManage,
}: {
    queues: SupportQueue[];
    canManage: boolean;
}) {
    return (
        <>
            <Head title={t('Support queues')} />
            <div className="space-y-3">
                <SettingsPageHeader
                    title={t('Support queues')}
                    description={t(
                        'Route customer-service tickets to a named queue. Round-robin assignment uses workspace members in a predictable order.',
                    )}
                />

                {canManage ? (
                    <SettingsForm
                        action="/settings/support-queues"
                        method="post"
                    >
                        <SettingsCard title={t('New queue')} required>
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <div>
                                    <Label htmlFor="support-queue-name">
                                        {t('Name')}
                                    </Label>
                                    <Input
                                        id="support-queue-name"
                                        name="name"
                                        required
                                        className="mt-1"
                                        placeholder={t('Customer support')}
                                    />
                                </div>
                                <label className="flex min-h-9 items-center gap-2 text-[13px] text-ink">
                                    <input
                                        type="checkbox"
                                        name="round_robin"
                                        value="1"
                                    />
                                    {t('Round-robin assignment')}
                                </label>
                            </div>
                            <Button type="submit" className="mt-3">
                                {t('Create queue')}
                            </Button>
                        </SettingsCard>
                    </SettingsForm>
                ) : null}

                {queues.length === 0 ? (
                    <SettingsEmptyState
                        title={t('No support queues yet')}
                        description={t(
                            'Create a queue to separate support work from the general ticket list.',
                        )}
                    />
                ) : (
                    <div className="space-y-3">
                        {queues.map((queue) => (
                            <Card
                                key={queue.id}
                                className="border-hairline p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-[15px] font-medium text-ink">
                                            {queue.name}
                                        </h2>
                                        <p className="mt-1 text-[13px] text-mute">
                                            {queue.open_tickets_count}{' '}
                                            {t('open tickets')}
                                            {queue.round_robin
                                                ? ` · ${t('round-robin')}`
                                                : ''}
                                            {!queue.is_active
                                                ? ` · ${t('inactive')}`
                                                : ''}
                                        </p>
                                    </div>
                                    {canManage ? (
                                        <div className="flex gap-2">
                                            <SettingsForm
                                                action={`/settings/support-queues/${queue.id}`}
                                                method="post"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="_method"
                                                    value="patch"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="is_active"
                                                    value={
                                                        queue.is_active
                                                            ? '0'
                                                            : '1'
                                                    }
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    {queue.is_active
                                                        ? t('Deactivate')
                                                        : t('Activate')}
                                                </Button>
                                            </SettingsForm>
                                            <SettingsForm
                                                action={`/settings/support-queues/${queue.id}`}
                                                method="post"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="_method"
                                                    value="delete"
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    {t('Delete')}
                                                </Button>
                                            </SettingsForm>
                                        </div>
                                    ) : null}
                                </div>
                                {canManage ? (
                                    <SettingsForm
                                        action={`/settings/support-queues/${queue.id}`}
                                        method="post"
                                        className="mt-3 flex flex-wrap items-end gap-2 border-t border-hairline pt-3"
                                    >
                                        <input
                                            type="hidden"
                                            name="_method"
                                            value="patch"
                                        />
                                        <input
                                            type="hidden"
                                            name="round_robin_present"
                                            value="1"
                                        />
                                        <div className="min-w-56 flex-1">
                                            <Label htmlFor={`queue-name-${queue.id}`}>
                                                {t('Queue name')}
                                            </Label>
                                            <Input
                                                id={`queue-name-${queue.id}`}
                                                name="name"
                                                defaultValue={queue.name}
                                                required
                                                className="mt-1"
                                            />
                                        </div>
                                        <label className="flex min-h-9 items-center gap-2 text-[13px] text-ink">
                                            <input
                                                type="checkbox"
                                                name="round_robin"
                                                value="1"
                                                defaultChecked={
                                                    queue.round_robin
                                                }
                                            />
                                            {t('Round-robin')}
                                        </label>
                                        <Button type="submit" size="sm">
                                            {t('Save')}
                                        </Button>
                                    </SettingsForm>
                                ) : null}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
