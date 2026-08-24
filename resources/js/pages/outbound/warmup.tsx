import { Form, router } from '@inertiajs/react';
import { OutboundShell } from '@/components/crm/outbound-shell';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Mailbox warmup"
                    description={`A conservative Africa/Algiers ramp (${ramp.join(' → ')}, then holds at your ceiling — default ${defaultCeiling}) raises each warming box's daily cap on the daily outbound:warmup schedule. No third-party warmup network: optional peer pings only ever run between this workspace's own enabled mailboxes, and quiet hours still apply to every send.`}
                />

                <div className="grid gap-3 md:grid-cols-4">
                    {[
                        ['Warming', String(summary.warming)],
                        ['Active', String(summary.active)],
                        [
                            'Sent today',
                            `${summary.sent_today}/${summary.cap_today}`,
                        ],
                        ['Ramp', `${ramp.length} days → ceiling`],
                    ].map(([label, value]) => (
                        <Card key={label} className="p-3">
                            <p className="text-[11px] text-muted-foreground uppercase">
                                {label}
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {value}
                            </p>
                        </Card>
                    ))}
                </div>

                <Card className="p-4">
                    <h2 className="mb-3 font-medium">The ramp</h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {ramp.map((cap, index) => (
                            <span key={cap} className="flex items-center gap-2">
                                <span className="rounded-md border border-hairline px-2 py-1">
                                    <span className="text-xs text-muted-foreground">
                                        Day {index + 1}
                                    </span>{' '}
                                    <span className="money font-medium">
                                        {Math.min(cap, defaultCeiling)}
                                    </span>
                                </span>
                                <span className="text-muted-foreground">→</span>
                            </span>
                        ))}
                        <span className="rounded-md border border-brand px-2 py-1 text-brand">
                            hold at your ceiling
                        </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Caps above your ceiling are clamped to it — with the
                        default ceiling of {defaultCeiling}, day 6 already
                        holds. Start warmup on a box and the scheduled{' '}
                        <code>outbound:warmup</code> command advances one plan
                        day per Africa/Algiers date, writing the new{' '}
                        <code>daily_limit</code> itself.
                    </p>
                </Card>

                <div className="space-y-3">
                    {mailboxes.length === 0 ? (
                        <Card className="p-6 text-sm text-muted-foreground">
                            No sendable mailbox yet — enable one under Outbound
                            → Mailboxes, then start warmup here. System roles
                            (abuse@, dmarc@, postmaster@, noreply@) stay hidden
                            unless you opt them in below.
                        </Card>
                    ) : null}
                    {mailboxes.map((box) => (
                        <Card key={box.id} className="space-y-3 p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{box.name}</span>
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
                                <span className="ms-auto text-xs text-muted-foreground">
                                    {box.sent_today}/{box.cap} sent today ·{' '}
                                    {box.remaining} left
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {box.from_name} &lt;{box.from_address}&gt;
                            </p>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase">
                                        Today's cap
                                    </p>
                                    <p className="money mt-0.5 font-semibold">
                                        {box.cap}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase">
                                        Sent today
                                    </p>
                                    <p className="money mt-0.5 font-semibold">
                                        {box.sent_today}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase">
                                        Remaining
                                    </p>
                                    <p className="money mt-0.5 font-semibold">
                                        {box.remaining}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase">
                                        Fail rate · 14d
                                    </p>
                                    <p className="money mt-0.5 font-semibold">
                                        {box.fail_rate}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground uppercase">
                                        Tomorrow's cap
                                    </p>
                                    <p className="money mt-0.5 font-semibold">
                                        {box.warming && box.next_cap !== null
                                            ? box.next_cap === box.cap
                                                ? `${box.cap} · holds`
                                                : box.next_cap
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            {box.chart ? (
                                <EvoVizChart payload={box.chart} />
                            ) : null}

                            <div className="flex flex-wrap items-center gap-2">
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
                                            <div>
                                                <Label className="text-xs">
                                                    Ceiling
                                                </Label>
                                                <Input
                                                    name="warmup_ceiling"
                                                    type="number"
                                                    min={1}
                                                    max={10000}
                                                    defaultValue={box.ceiling}
                                                    className="h-8 w-24"
                                                    required
                                                />
                                            </div>
                                            <input
                                                type="hidden"
                                                name="warmup_peers"
                                                value="0"
                                            />
                                            <label className="flex h-8 items-center gap-2 text-xs text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    name="warmup_peers"
                                                    value="1"
                                                    defaultChecked={box.peers}
                                                    className="size-4 accent-[var(--evosales-mark)]"
                                                />
                                                Peer pings inside this workspace
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
                        </Card>
                    ))}
                </div>

                {systemMailboxes.length > 0 ? (
                    <Card className="overflow-hidden">
                        <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                            System mailboxes{' '}
                            <span className="font-normal text-muted-foreground">
                                — abuse@, dmarc@, postmaster@ and noreply@ stay
                                out of warmup unless you opt them in
                            </span>
                        </h2>
                        <table className="w-full text-sm">
                            <tbody>
                                {systemMailboxes.map((box) => (
                                    <tr
                                        key={box.id}
                                        className="border-t border-hairline first:border-t-0"
                                    >
                                        <td className="px-4 py-2">
                                            <span className="font-medium">
                                                {box.name}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {box.from_address}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {box.enabled
                                                ? 'enabled'
                                                : 'disabled'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                ) : null}
            </div>
        </OutboundShell>
    );
}

WarmupIndex.layout = {
    breadcrumbs: [{ title: 'Warmup', href: '/outbound/warmup' }],
};
