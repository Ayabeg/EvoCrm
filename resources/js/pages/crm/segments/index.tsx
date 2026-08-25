import { Form, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CrmShell } from '@/components/crm/crm-shell';
import SegmentFilterForm, { type SegmentFilters } from '@/components/crm/segment-filter-form';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ListFieldDef } from '@/lib/list-view-config';

type Segment = { id: number; name: string; entity: string; filters: SegmentFilters; count: number; campaigns: Array<{ id: number; name: string; status: string }> };

export default function SegmentsIndex({ segments, members, cities, wilayas, stages, contactFilterFields, dealFilterFields, canSyncMeta }: { segments: Segment[]; tab: string; members: { id: number; name: string }[]; cities: string[]; wilayas: string[]; stages: { id: number; name: string; slug: string }[]; contactFilterFields: ListFieldDef[]; dealFilterFields: ListFieldDef[]; canSyncMeta: boolean }) {
    const [entityFilter, setEntityFilter] = useState<'all'|'contact'|'deal'>('all');
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editSegment, setEditSegment] = useState<Segment | null>(null);
    const [createEntity, setCreateEntity] = useState<'contact'|'deal'>('contact');
    const [draftFilters, setDraftFilters] = useState<SegmentFilters>({});
    const filtered = useMemo(() => segments.filter(s => (entityFilter==='all'||s.entity===entityFilter) && (!search.trim()||s.name.toLowerCase().includes(search.trim().toLowerCase()))), [entityFilter, search, segments]);
    const fields = (e:'contact'|'deal') => e==='deal'?dealFilterFields:contactFilterFields;
    const href = (e:string,id:number)=> e==='deal'?`/crm/deals?filter_id=${id}`:`/crm/contacts?filter_id=${id}`;
    return (
        <CrmShell title="Segments"><div className="flex-1 space-y-6 p-6">
            <PageHeader title="Segments" description="Saved views for contacts and deals."><Button type="button" onClick={()=>setCreateOpen(true)}>New segment</Button></PageHeader>
            <div className="flex gap-2">{(['all','contact','deal'] as const).map(v=><button key={v} type="button" onClick={()=>setEntityFilter(v)} className={`rounded px-3 py-1 text-[12px] ${entityFilter===v?'bg-brand text-white':'border'}`}>{v}</button>)}<Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="h-8 max-w-xs"/></div>
            <Card className="overflow-hidden"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Entity</th><th className="px-4 py-2 text-right">Count</th><th className="px-4 py-2">Campaigns</th><th className="px-4 py-2">Actions</th></tr></thead><tbody>
                {filtered.map(s=><tr key={s.id} className="border-t border-hairline"><td className="px-4 py-3"><Link href={href(s.entity,s.id)} className="text-brand">{s.name}</Link></td><td className="px-4 py-3 capitalize">{s.entity}</td><td className="px-4 py-3 text-right">{s.count}</td><td className="px-4 py-3">{s.campaigns.map(c=><Link key={c.id} href={`/outbound/campaigns/${c.id}`} className="me-2 text-[12px] text-brand">{c.name}</Link>)}</td><td className="px-4 py-3"><button type="button" className="me-2 text-brand" onClick={()=>{setEditSegment(s);setDraftFilters(s.filters??{})}}>Edit</button>{s.entity==='contact'&&canSyncMeta?<Form action={`/crm/segments/${s.id}/sync-meta`} method="post" className="inline"><Input name="audience_id" placeholder="Audience ID" className="inline h-7 w-28"/><Button type="submit" size="sm">Meta</Button></Form>:null}<button type="button" className="text-muted-foreground" onClick={()=>confirm('Delete?')&&router.delete(`/crm/segments/${s.id}`)}>Delete</button></td></tr>)}
            </tbody></table></Card>
            {createOpen?<Card className="p-4"><Form action="/crm/segments" method="post" onSuccess={()=>setCreateOpen(false)}>{({processing})=><><Input name="name" required placeholder="Name"/><select name="entity" value={createEntity} onChange={e=>setCreateEntity(e.target.value as 'contact'|'deal')} className="h-9 w-full rounded border px-2"><option value="contact">Contact</option><option value="deal">Deal</option></select><input type="hidden" name="filters_json" value={JSON.stringify(draftFilters)}/><SegmentFilterForm entity={createEntity} filters={draftFilters} onChange={setDraftFilters} members={members} cities={cities} wilayas={wilayas} stages={stages} filterFields={fields(createEntity)}/><Button type="submit" disabled={processing}>Save</Button></>}</Form></Card>:null}
            {editSegment?<Card className="p-4"><Form action={`/crm/segments/${editSegment.id}`} method="put" onSuccess={()=>setEditSegment(null)}>{({processing})=><><Input name="name" defaultValue={editSegment.name} required/><input type="hidden" name="entity" value={editSegment.entity}/><input type="hidden" name="filters_json" value={JSON.stringify(draftFilters)}/><SegmentFilterForm entity={editSegment.entity as 'contact'|'deal'} filters={draftFilters} onChange={setDraftFilters} members={members} cities={cities} wilayas={wilayas} stages={stages} filterFields={fields(editSegment.entity as 'contact'|'deal')}/><Button type="submit" disabled={processing}>Update</Button></>}</Form></Card>:null}
        </div></CrmShell>
    );
}
SegmentsIndex.layout = { breadcrumbs: [{ title: 'Segments', href: '/crm/segments' }] };
