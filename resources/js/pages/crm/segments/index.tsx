import { Form, Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import SegmentFilterForm from '@/components/crm/segment-filter-form';
import type {SegmentFilters} from '@/components/crm/segment-filter-form';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Segment = {
    id: number;
    name: string;
    entity: 'contact' | 'deal';
    filters: SegmentFilters;
    count: number;
};

type PreviewMember = {
    id: number;
    label: string;
    detail: string;
    owner?: string | null;
};

export default function SegmentsIndex({
    segments,
    tab = 'manage',
    members = [],
    cities = [],
    wilayas = [],
    stages = [],
}: {
    segments: Segment[];
    tab?: string;
    members?: Array<{ id: number; name: string }>;
    cities?: string[];
    wilayas?: string[];
    stages?: Array<{ id: number; name: string; slug: string }>;
}) {
    const [selectedId, setSelectedId] = useState<number | 'new' | null>(segments[0]?.id ?? null);
    const selected = useMemo(
        () => (typeof selectedId === 'number' ? segments.find((segment) => segment.id === selectedId) ?? null : null),
        [segments, selectedId],
    );

    const [draftName, setDraftName] = useState(selected?.name ?? '');
    const [draftEntity, setDraftEntity] = useState<'contact' | 'deal'>(selected?.entity ?? 'contact');
    const [draftFilters, setDraftFilters] = useState<SegmentFilters>(selected?.filters ?? {});
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const [previewMembers, setPreviewMembers] = useState<PreviewMember[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const selectSegment = (segment: Segment | null, mode: 'new' | 'existing') => {
        if (mode === 'new') {
            setSelectedId('new');
            setDraftName('');
            setDraftEntity('contact');
            setDraftFilters({});

            return;
        }

        if (!segment) {
            return;
        }

        setSelectedId(segment.id);
        setDraftName(segment.name);
        setDraftEntity(segment.entity);
        setDraftFilters(segment.filters ?? {});
    };

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setPreviewLoading(true);

            try {
                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
                const response = await fetch('/crm/segments/preview', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                    },
                    body: JSON.stringify({ entity: draftEntity, filters: draftFilters }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as { count: number; members: PreviewMember[] };
                setPreviewCount(payload.count);
                setPreviewMembers(payload.members ?? []);
            } finally {
                setPreviewLoading(false);
            }
        }, 300);

        return () => {
            controller.abort();
            window.clearTimeout(timeout);
        };
    }, [draftEntity, draftFilters]);

    const saveAction = selected && selectedId !== 'new' ? `/crm/segments/${selected.id}` : '/crm/segments';
    const saveMethod = selected && selectedId !== 'new' ? 'put' : 'post';

    return (
        <>
            <Head title="Segments" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Segments"
                    description="Named filters for contacts and deals with live size preview as criteria change."
                />
                <div className="flex gap-1">
                    <span className="rounded bg-ink px-2 py-1 text-[11px] text-canvas">Manage</span>
                </div>
                {tab === 'manage' ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                        <Card className="overflow-hidden">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <h2 className="text-sm font-semibold">Saved segments</h2>
                                <Button type="button" variant="secondary" className="h-7 text-[11px]" onClick={() => selectSegment(null, 'new')}>
                                    New segment
                                </Button>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Object</th>
                                        <th className="px-4 py-2">Count</th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map((segment) => (
                                        <tr
                                            key={segment.id}
                                            className={`cursor-pointer border-t ${selectedId === segment.id ? 'bg-canvas-soft' : ''}`}
                                            onClick={() => selectSegment(segment, 'existing')}
                                        >
                                            <td className="px-4 py-2 font-medium">{segment.name}</td>
                                            <td className="px-4 py-2 capitalize">{segment.entity}</td>
                                            <td className="px-4 py-2 tabular-nums">{segment.count}</td>
                                            <td className="px-4 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                                                <Form action={`/crm/segments/${segment.id}`} method="delete">
                                                    <Button variant="secondary" className="h-7 text-[11px]">
                                                        Delete
                                                    </Button>
                                                </Form>
                                            </td>
                                        </tr>
                                    ))}
                                    {segments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-mute">
                                                No segments yet.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </Card>

                        <Card className="space-y-4 p-4">
                            {selectedId ? (
                                <>
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            {selectedId === 'new' ? 'Create segment' : 'Edit segment'}
                                        </h2>
                                        <p className="text-[11px] text-muted-foreground">
                                            Adjust filters and watch the computed size update live.
                                        </p>
                                    </div>
                                    <Form action={saveAction} method={saveMethod} className="space-y-4">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    name="name"
                                                    value={draftName}
                                                    onChange={(event) => setDraftName(event.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>Object type</Label>
                                                <select
                                                    name="entity"
                                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                                    value={draftEntity}
                                                    onChange={(event) =>
                                                        setDraftEntity(event.target.value as 'contact' | 'deal')
                                                    }
                                                >
                                                    <option value="contact">Contact</option>
                                                    <option value="deal">Deal</option>
                                                </select>
                                            </div>
                                        </div>
                                        <SegmentFilterForm
                                            entity={draftEntity}
                                            filters={draftFilters}
                                            onChange={setDraftFilters}
                                            members={members}
                                            cities={cities}
                                            wilayas={wilayas}
                                            stages={stages}
                                        />
                                        {Object.entries(draftFilters).map(([key, value]) =>
                                            value === undefined || value === false || value === '' ? null : (
                                                <input
                                                    key={key}
                                                    type="hidden"
                                                    name={key}
                                                    value={typeof value === 'boolean' ? '1' : String(value)}
                                                />
                                            ),
                                        )}
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Card className="p-3">
                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Computed size
                                                </p>
                                                <p className="text-2xl font-semibold tabular-nums">
                                                    {previewLoading ? '…' : (previewCount ?? selected?.count ?? 0)}
                                                </p>
                                            </Card>
                                            <Card className="p-3">
                                                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Sample members
                                                </p>
                                                <ul className="space-y-1 text-sm">
                                                    {previewMembers.map((member) => (
                                                        <li key={member.id}>
                                                            <span className="font-medium">{member.label}</span>
                                                            <span className="text-muted-foreground"> · {member.detail}</span>
                                                        </li>
                                                    ))}
                                                    {!previewLoading && previewMembers.length === 0 ? (
                                                        <li className="text-muted-foreground">No matches yet.</li>
                                                    ) : null}
                                                </ul>
                                            </Card>
                                        </div>
                                        <Button>{selectedId === 'new' ? 'Save segment' : 'Update segment'}</Button>
                                    </Form>
                                </>
                            ) : (
                                <p className="text-muted-foreground">Select a segment to edit or create a new one.</p>
                            )}
                        </Card>
                    </div>
                ) : null}
            </div>
        </>
    );
}

SegmentsIndex.layout = {
    breadcrumbs: [{ title: 'Segments', href: '/crm/segments' }],
};
