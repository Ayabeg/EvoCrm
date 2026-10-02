import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Field } from '@/evo/outbound/section';
import type { WarmupMailbox } from '@/evo/outbound/types';
import { WarmupStatus } from '@/evo/outbound/WarmupStatus';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { t } from '@/lib/i18n';

type SystemMailbox = {
    id: number;
    name: string;
    from_address: string;
    enabled: boolean;
    opted_in: boolean;
};

type Summary = {
    warming: number;
    active: number;
    sent_today: number;
    cap_today: number;
};

export default function WarmupIndex({
    mailboxes,
    systemMailboxes,
    ramp,
    defaultCeiling,
    summary,
}: {
    mailboxes: WarmupMailbox[];
    systemMailboxes: SystemMailbox[];
    ramp: number[];
    defaultCeiling: number;
    summary: Summary;
}) {
    return (
        <OutboundShell title={t('Warmup')}>
            <OutboundPage
                title={t('Mailbox warmup')}
                description={t(
                    "A conservative Africa/Algiers ramp (:ramp, then holds at your ceiling - default :ceiling) raises each warming box's daily cap on the daily outbound:warmup schedule. No third-party warmup network: optional peer pings only ever run between this workspace's own enabled mailboxes, and quiet hours still apply to every send.",
                    { ramp: ramp.join(' → '), ceiling: defaultCeiling },
                )}
            >
                {/* CrmKpiStrip is composed inside WarmupStatus */}
                <WarmupStatus
                    mailboxes={mailboxes}
                    systemMailboxes={systemMailboxes}
                    ramp={ramp}
                    defaultCeiling={defaultCeiling}
                    summary={summary}
                    renderActions={(box) => (
                        <div className="mt-4 flex flex-wrap items-end gap-2">
                            <Button
                                variant={box.warming ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => router.post(`/outbound/warmup/${box.id}/toggle`)}
                            >
                                {box.warming ? t('Stop warmup') : t('Start warmup')}
                            </Button>
                            <Form
                                action={`/outbound/warmup/${box.id}`}
                                method="put"
                                className="flex flex-wrap items-end gap-2"
                            >
                                {({ processing }) => (
                                    <>
                                        <Field label={t('Ceiling')}>
                                            <Input
                                                name="warmup_ceiling"
                                                type="number"
                                                min={1}
                                                max={10000}
                                                defaultValue={box.ceiling}
                                                className="h-8 w-24"
                                                required
                                            />
                                        </Field>
                                        <input type="hidden" name="warmup_peers" value="0" />
                                        <label className="flex h-8 items-center gap-2 text-[12px] text-[var(--evo-ink-muted)]">
                                            <input
                                                type="checkbox"
                                                name="warmup_peers"
                                                value="1"
                                                defaultChecked={box.peers}
                                                className="size-4 accent-[var(--evo-teal)]"
                                            />
                                            {t('Peer pings inside this workspace')}
                                        </label>
                                        <Button variant="outline" size="sm" disabled={processing}>
                                            {t('Save')}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>
                    )}
                    renderSystemActions={(box) => (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.post(`/outbound/warmup/${box.id}/include`)}
                        >
                            {box.opted_in ? t('Remove from warmup') : t('Include in warmup')}
                        </Button>
                    )}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

WarmupIndex.layout = {
    breadcrumbs: [{ title: t('Warmup'), href: '/outbound/warmup' }],
};
