import { Form, router } from '@inertiajs/react';
import { CrmKpiStrip } from '@/components/crm/crm-kpi-strip';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EvoVizChart } from '@/evoviz';
import type { EvoVizPayload } from '@/evoviz';

type WarmupMailbox = {
    id: number;
    name: string;
    from_name: string;
    from_address: string;
    effective_status: string;
    is_system: boolean;
    warming: boolean;
    day: number | null;
    cap: number;
    sent_today: number;
    remaining: number;
    ceiling: number;
    peers: boolean;
    fail_rate: number;
    next_cap: number | null;
    chart?: EvoVizPayload | null;
};

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

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
    if (status === 'active') {
        return 'default';
    }

    if (status === 'warming') {
        return 'secondary';
    }

    return 'outline';
}

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
        <OutboundShell title="Warmup">
            <OutboundPage
                title="Mailbox warmup"
                description={`A conservative Africa/Algiers ramp (${ramp.join(' → ')}, then holds at your ceiling - default ${defaultCeiling}) raises each warming box's daily cap on the daily outbound:warmup schedule. No third-party warmup network: optional peer pings only ever run between this workspace's own enabled mailboxes, and quiet hours still apply to every send.`}
            >
                <CrmKpiStrip
                    columns={4}
                    kpis={[
                        { key: 'warming', label: 'Warming', value: summary.warming },
                        { key: 'active', label: 'Active', value: summary.active },
                        {
                            key: 'sent',
                            label: 'Sent today',
                            value: `${summary.sent_today}/${summary.cap_today}`,
                        },
                        {
                            key: 'ramp',
                            label: 'Ramp',
                            value: `${ramp.length} days`,
                            hint: 'then hold at ceiling',
                        },
                    ]}
                />

                <HairlinePanel
                    title="The ramp"
                    description={`Caps above your ceiling are clamped to it. With the default ceiling of ${defaultCeiling}, day 6 already holds. Start warmup on a box and the scheduled outbound:warmup command advances one plan day per Africa/Algiers date, writing the new daily_limit itself.`}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {ramp.map((cap, index) => (
                            <span
                                key={`${cap}-${index}`}
                                className="flex items-center gap-2"
                            >
                                <span className="rounded-lg border border-hairline bg-canvas-soft px-2.5 py-1">
                                    <span className="aurora-text-caption text-mute">
                                        Day {index + 1}
                                    </span>{' '}
                                    <span className="money font-medium tabular-nums">
                                        {Math.min(cap, defaultCeiling)}
                                    </span>
                                </span>
                                <span className="text-mute" aria-hidden>
                                    →
                                </span>
                            </span>
                        ))}
                        <span className="rounded-md border border-hairline px-2.5 py-1 text-ink">
                            hold at your ceiling
                        </span>
                    </div>
                </HairlinePanel>

                {mailboxes.length === 0 ? (
                    <HairlinePanel>
                        <p className="aurora-text-body-sm text-mute">
                            No sendable mailbox yet - enable one under Outbound
                            → Mailboxes, then start warmup here. System roles
                            (abuse@, dmarc@, postmaster@, noreply@) stay hidden
                            unless you opt them in below.
                        </p>
                    </HairlinePanel>
                ) : (
                    <div className="space-y-3">
                        {mailboxes.map((box) => (
                            <HairlinePanel
                                key={box.id}
                                title={box.name}
                                description={`${box.from_name} <${box.from_address}>`}
                                action={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={statusVariant(
                                                box.effective_status,
                                            )}
                                        >
                                            {box.effective_status}
                                        </Badge>
                                        {box.warming && box.day !== null ? (
                                            <Badge variant="secondary">
                                                Day {box.day}
                                            </Badge>
                                        ) : null}
                                        {box.is_system ? (
                                            <Badge variant="outline">
                                                system role · opted in
                                            </Badge>
                                        ) : null}
                                        {box.peers ? (
                                            <Badge variant="secondary">
                                                peer pings on
                                            </Badge>
                                        ) : null}
                                    </div>
                                }
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    {[
                                        ["Today's cap", box.cap],
                                        ['Sent today', box.sent_today],
                                        ['Remaining', box.remaining],
                                        [
                                            'Fail rate · 14d',
                                            `${box.fail_rate}%`,
                                        ],
                                        [
                                            "Tomorrow's cap",
                                            box.warming && box.next_cap !== null
                                                ? box.next_cap === box.cap
                                                    ? `${box.cap} · holds`
                                                    : box.next_cap
                                                : '-',
                                        ],
                                    ].map(([label, value]) => (
                                        <div key={String(label)}>
                                            <p className="aurora-text-caption text-mute">
                                                {label}
                                            </p>
                                            <p className="money mt-0.5 font-semibold tabular-nums">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {box.chart ? (
                                    <div className="mt-4">
                                        <EvoVizChart payload={box.chart} />
                                    </div>
                                ) : null}

                                <div className="mt-4 flex flex-wrap items-end gap-2">
                                    <Button
                                        variant={
                                            box.warming ? 'outline' : 'default'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            router.post(
                                                `/outbound/warmup/${box.id}/toggle`,
                                            )
                                        }
                                    >
                                        {box.warming
                                            ? 'Stop warmup'
                                            : 'Start warmup'}
                                    </Button>
                                    <Form
                                        action={`/outbound/warmup/${box.id}`}
                                        method="put"
                                        className="flex flex-wrap items-end gap-2"
                                    >
                                        {({ processing }) => (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Ceiling
                                                    </Label>
                                                    <Input
                                                        name="warmup_ceiling"
                                                        type="number"
                                                        min={1}
                                                        max={10000}
                                                        defaultValue={
                                                            box.ceiling
                                                        }
                                                        className="h-8 w-24"
                                                        required
                                                    />
                                                </div>
                                                <input
                                                    type="hidden"
                                                    name="warmup_peers"
                                                    value="0"
                                                />
                                                <label className="flex h-8 items-center gap-2 text-xs text-mute">
                                                    <input
                                                        type="checkbox"
                                                        name="warmup_peers"
                                                        value="1"
                                                        defaultChecked={
                                                            box.peers
                                                        }
                                                        className="size-4 accent-[var(--evosales-mark)]"
                                                    />
                                                    Peer pings inside this
                                                    workspace
                                                </label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={processing}
                                                >
                                                    Save
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </div>
                            </HairlinePanel>
                        ))}
                    </div>
                )}

                {systemMailboxes.length > 0 ? (
                    <div className="space-y-3">
                        <div>
                            <h3 className="aurora-text-section text-ink">
                                System mailboxes
                            </h3>
                            <p className="aurora-text-body-sm mt-0.5 text-mute">
                                abuse@, dmarc@, postmaster@ and noreply@ stay
                                out of warmup unless you opt them in.
                            </p>
                        </div>
                        <HairlineTable
                            minWidth={520}
                            empty="No system mailboxes."
                            columns={[
                                { key: 'mailbox', header: 'System mailbox' },
                                { key: 'state', header: 'State' },
                                { key: 'actions', header: '', align: 'right' },
                            ]}
                            rows={systemMailboxes.map((box) => ({
                                id: box.id,
                                mobileTitle: box.name,
                                mobileMeta: [
                                    {
                                        label: 'Address',
                                        value: box.from_address,
                                    },
                                    {
                                        label: 'State',
                                        value: box.enabled
                                            ? 'enabled'
                                            : 'disabled',
                                    },
                                ],
                                mobileFooter: (
                                    <div className="mt-3 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    `/outbound/warmup/${box.id}/include`,
                                                )
                                            }
                                        >
                                            {box.opted_in
                                                ? 'Remove from warmup'
                                                : 'Include in warmup'}
                                        </Button>
                                    </div>
                                ),
                                cells: {
                                    mailbox: (
                                        <div>
                                            <span className="font-medium text-ink">
                                                {box.name}
                                            </span>
                                            <span className="aurora-text-caption block text-mute">
                                                {box.from_address}
                                            </span>
                                        </div>
                                    ),
                                    state: (
                                        <span className="aurora-text-caption text-mute">
                                            {box.enabled
                                                ? 'enabled'
                                                : 'disabled'}
                                        </span>
                                    ),
                                    actions: (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    `/outbound/warmup/${box.id}/include`,
                                                )
                                            }
                                        >
                                            {box.opted_in
                                                ? 'Remove from warmup'
                                                : 'Include in warmup'}
                                        </Button>
                                    ),
                                },
                            }))}
                        />
                    </div>
                ) : null}
            </OutboundPage>
        </OutboundShell>
    );
}

WarmupIndex.layout = {
    breadcrumbs: [{ title: 'Warmup', href: '/outbound/warmup' }],
};
