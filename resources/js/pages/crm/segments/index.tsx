import { Head, Link } from '@inertiajs/react';

type Segment = {
    id: number;
    name: string;
    entity: string;
};

export default function SegmentsIndex({ segments }: { segments: Segment[] }) {
    return (
        <>
            <Head title="Segments" />
            <div className="flex-1 bg-canvas p-6 text-[13px] text-ink">
                <h1 className="text-[22px] font-semibold">Segments</h1>
                <p className="mt-1 text-muted-foreground">
                    Saved contact and deal views. Not a marketing hub.
                </p>
                <div className="mt-4 divide-y divide-hairline rounded-md border border-hairline">
                    {segments.length === 0 ? (
                        <p className="px-4 py-6 text-muted-foreground">
                            No saved views yet. Save a filter from Contacts or Deals.
                        </p>
                    ) : (
                        segments.map((segment) => (
                            <Link
                                key={`${segment.entity}-${segment.id}`}
                                href={
                                    segment.entity === 'deal'
                                        ? `/crm/deals?filter_id=${segment.id}`
                                        : `/crm/contacts?filter_id=${segment.id}`
                                }
                                className="block px-4 py-3 hover:bg-canvas-soft"
                            >
                                <p className="font-medium">{segment.name}</p>
                                <p className="text-[12px] text-muted-foreground">
                                    {segment.entity}
                                </p>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

SegmentsIndex.layout = {
    breadcrumbs: [{ title: 'Segments', href: '/crm/segments' }],
};
