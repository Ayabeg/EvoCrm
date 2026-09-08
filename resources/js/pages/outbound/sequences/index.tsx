import { Form, Link, router } from '@inertiajs/react';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

type SequenceRow = {
    id: number;
    name: string;
    channel: string;
    active: boolean;
    description?: string | null;
    steps: { id: number }[];
    enrollments_count: number;
    enrollments_active: number;
    enrollments_paused: number;
    enrollments_finished: number;
};

function channelLabel(channel: string): string {
    return channel === 'whatsapp_cloud' ? 'WhatsApp Cloud' : 'Email SMTP';
}

export default function SequencesIndex({
    sequences,
}: {
    sequences: SequenceRow[];
}) {
    return (
        <OutboundShell title="Sequences">
            <OutboundPage
                title="Sequences"
                description="Email steps with {{variables}}. Quiet hours (Africa/Algiers) defer sends; suppression cancels enrollment. WhatsApp steps use official Cloud templates only."
            >
                <HairlinePanel title="Create sequence">
                    <Form
                        action="/outbound/sequences"
                        method="post"
                        className="grid gap-3 md:grid-cols-3"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div className="space-y-1.5 md:col-span-3">
                                    <Label>Start from</Label>
                                    <div className="flex flex-wrap gap-3 text-[13px]">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="origin"
                                                value="scratch"
                                                defaultChecked
                                            />
                                            From scratch
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="origin"
                                                value="template"
                                            />
                                            From template
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="sequence-name">Name</Label>
                                    <Input
                                        id="sequence-name"
                                        name="name"
                                        required
                                        placeholder="Clinic email nurture"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="sequence-channel">
                                        Channel
                                    </Label>
                                    <NativeSelect
                                        id="sequence-channel"
                                        name="channel"
                                        defaultValue="email"
                                    >
                                        <option value="email">
                                            Email SMTP
                                        </option>
                                        <option value="whatsapp_cloud">
                                            WhatsApp Cloud template
                                        </option>
                                    </NativeSelect>
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>
                                        Create
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </HairlinePanel>

                <HairlineTable
                    minWidth={760}
                    empty="No sequences yet. Create one above."
                    columns={[
                        { key: 'sequence', header: 'Sequence' },
                        { key: 'channel', header: 'Channel' },
                        { key: 'steps', header: 'Steps' },
                        { key: 'enrolled', header: 'Enrolled' },
                        { key: 'active', header: 'Active' },
                        { key: 'paused', header: 'Paused' },
                        { key: 'finished', header: 'Finished' },
                        { key: 'state', header: 'State' },
                        { key: 'actions', header: '', align: 'right' },
                    ]}
                    rows={sequences.map((sequence) => ({
                        id: sequence.id,
                        mobileTitle: (
                            <Link
                                href={`/outbound/sequences/${sequence.id}`}
                                className="font-medium text-ink hover:underline"
                            >
                                {sequence.name}
                            </Link>
                        ),
                        mobileMeta: [
                            {
                                label: 'Channel',
                                value: channelLabel(sequence.channel),
                            },
                            {
                                label: 'Steps',
                                value: sequence.steps?.length ?? 0,
                            },
                            {
                                label: 'Enrolled',
                                value: `${sequence.enrollments_count} · ${sequence.enrollments_active} active`,
                            },
                            {
                                label: 'State',
                                value: sequence.active ? 'active' : 'draft',
                            },
                        ],
                        mobileFooter: (
                            <div className="mt-3 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            `/outbound/sequences/${sequence.id}/toggle`,
                                        )
                                    }
                                >
                                    {sequence.active ? 'Pause' : 'Activate'}
                                </Button>
                            </div>
                        ),
                        cells: {
                            sequence: (
                                <div>
                                    <Link
                                        href={`/outbound/sequences/${sequence.id}`}
                                        className="font-medium text-ink hover:underline"
                                    >
                                        {sequence.name}
                                    </Link>
                                    {sequence.description ? (
                                        <p className="aurora-text-caption mt-0.5 text-mute">
                                            {sequence.description}
                                        </p>
                                    ) : null}
                                </div>
                            ),
                            channel: (
                                <span className="text-ink">
                                    {channelLabel(sequence.channel)}
                                </span>
                            ),
                            steps: (
                                <span className="money tabular-nums">
                                    {sequence.steps?.length ?? 0}
                                </span>
                            ),
                            enrolled: (
                                <span className="money tabular-nums">
                                    {sequence.enrollments_count}
                                </span>
                            ),
                            active: (
                                <span className="money tabular-nums">
                                    {sequence.enrollments_active}
                                </span>
                            ),
                            paused: (
                                <span className="money tabular-nums">
                                    {sequence.enrollments_paused}
                                </span>
                            ),
                            finished: (
                                <span className="money tabular-nums">
                                    {sequence.enrollments_finished}
                                </span>
                            ),
                            state: (
                                <Badge
                                    variant={
                                        sequence.active ? 'default' : 'outline'
                                    }
                                >
                                    {sequence.active ? 'active' : 'draft'}
                                </Badge>
                            ),
                            actions: (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            `/outbound/sequences/${sequence.id}/toggle`,
                                        )
                                    }
                                >
                                    {sequence.active ? 'Pause' : 'Activate'}
                                </Button>
                            ),
                        },
                    }))}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

SequencesIndex.layout = {
    breadcrumbs: [{ title: 'Sequences', href: '/outbound/sequences' }],
};
