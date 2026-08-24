import { Form, Head, Link, router } from '@inertiajs/react';
import AssociationsCard from '@/components/crm/associations-card';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import { formatDzd, HubListRow, HubShell } from '@/components/crm/hub-chrome';
import ListToolbar from '@/components/crm/list-toolbar';
import RecordActionRow from '@/components/crm/record-action-row';
import TimelineFilter from '@/components/crm/timeline-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DealHub({
    deals,
    selected,
    associations,
    timeline,
    attributes,
    stages,
    contacts,
    members,
    savedFilters,
    activeFilters,
    cities,
    wilayas,
    openPipelineCents,
    stagePills,
}: any) {

    return (
        <>
            <Head title={selected ? selected.title : 'Deals'} />
            <HubShell
                list={
                    <>
                        <ListToolbar
                            entity="deal"
                            basePath="/crm/deals"
                            activeFilters={activeFilters}
                            savedFilters={savedFilters}
                            members={members}
                            cities={cities}
                            wilayas={wilayas}
                            contacts={contacts}
                            stages={stages}
                            stagePills={stagePills}
                        />
                        <div className="border-b px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <h1 className="text-sm font-semibold">Deals</h1>
                                <div className="flex items-center gap-2">
                                    <DealLayoutToggle current="list" />
                                    <span className="money text-[11px] text-ink">{formatDzd(openPipelineCents)}</span>
                                </div>
                            </div>
                            <Form action="/crm/deals" method="get" className="mt-2 grid grid-cols-2 gap-1">
                                <select name="stage" defaultValue={activeFilters.stage ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Stage</option>
                                    {stages.map((stage: any) => (
                                        <option key={stage.id} value={stage.slug}>{stage.name}</option>
                                    ))}
                                </select>
                                <select name="owner" defaultValue={activeFilters.owner ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Owner</option>
                                    <option value="unassigned">Unassigned</option>
                                    {members.map((user: any) => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                <select name="city" defaultValue={activeFilters.city ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">City</option>
                                    {cities.map((city: string) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <select name="wilaya" defaultValue={activeFilters.wilaya ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Wilaya</option>
                                    {wilayas.map((wilaya: string) => (
                                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                                    ))}
                                </select>
                                <select name="last_activity" defaultValue={activeFilters.last_activity ?? ''} className="col-span-2 h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Last activity</option>
                                    <option value="7d">7 days</option>
                                    <option value="30d">30 days</option>
                                    <option value="none">None</option>
                                </select>
                                <label className="col-span-2 flex items-center gap-1 text-[11px]">
                                    <input type="checkbox" name="unanswered" value="1" defaultChecked={!!activeFilters.unanswered} />
                                    Unanswered desk
                                </label>
                                {activeFilters.unassigned ? <input type="hidden" name="unassigned" value="1" /> : null}
                                <Button className="col-span-2 h-7 text-[11px]">Apply list</Button>
                            </Form>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {savedFilters.map((filter: any) => (
                                    <Link key={filter.id} href={`/crm/deals?filter_id=${filter.id}`} className="rounded bg-canvas-soft px-1.5 py-0.5 text-[10px] text-ink">
                                        {filter.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {deals.map((deal: any) => (
                                <HubListRow
                                    key={deal.id}
                                    active={selected?.id === deal.id}
                                    onClick={() => router.get(`/crm/deals/${deal.id}`, {}, { preserveState: true })}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate font-medium">{deal.title}</span>
                                        <span className="text-[10px]">{deal.stage?.name}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        <span className="money">{formatDzd(deal.amount_cents)}</span> · {deal.owner?.name ?? 'Unassigned'}
                                    </p>
                                </HubListRow>
                            ))}
                        </div>
                        <Form action="/crm/deals" method="post" className="space-y-1 border-t p-2" resetOnSuccess>
                            <Input name="title" placeholder="Deal title" required className="h-7" />
                            <select name="contact_id" className="h-7 w-full rounded border bg-background px-1" required>
                                <option value="">Contact</option>
                                {contacts.map((contact: any) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.first_name} {contact.last_name}
                                    </option>
                                ))}
                            </select>
                            <Input name="amount_dzd" type="number" min={0} step="0.01" placeholder="Amount DZD" className="h-7" />
                            <Button className="h-7 w-full text-[11px]">Create deal</Button>
                        </Form>
                    </>
                }
                main={
                    selected ? (
                        <>
                            <header className="flex items-center justify-between border-b px-4 py-2">
                                <div>
                                    <h2 className="text-base font-semibold">{selected.title}</h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        <span className="money">{formatDzd(selected.amount_cents)}</span> · {selected.stage?.name} · {selected.next_step ?? 'No next step'}
                                    </p>
                                </div>
                                <Link href="/inbox" className="rounded bg-brand px-3 py-1 text-[12px] text-canvas">
                                    Open in Inbox
                                </Link>
                            </header>
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                <RecordActionRow
                                    dealId={selected.id}
                                    contactId={selected.contact_id}
                                    companyId={selected.company_id}
                                    ownerId={selected.owner_id}
                                />
                                <AssociationsCard associations={associations} />
                                <div className="grid grid-cols-6 gap-1">
                                    {stages.map((stage: any) => {
                                        const column = deals.filter((deal: any) => deal.stage_id === stage.id);
                                        const sum = column.reduce((acc: number, deal: any) => acc + (deal.amount_cents ?? 0), 0);

                                        return (
                                            <div key={stage.id} className="rounded border border-hairline bg-canvas-soft p-1">
                                                <p className="text-[10px] font-semibold">{stage.name}</p>
                                                <p className="money text-[10px] text-ink">{formatDzd(sum)}</p>
                                                <p className="text-[10px] text-muted-foreground">{column.length}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Form action={`/crm/deals/${selected.id}`} method="put" className="grid grid-cols-2 gap-2 border-b pb-3">
                                    <Input name="title" defaultValue={selected.title} required className="h-8" />
                                    <Input name="amount_dzd" type="number" min={0} step="0.01" defaultValue={(selected.amount_cents ?? 0) / 100} className="h-8" />
                                    <Input name="close_date" type="date" defaultValue={selected.close_date ? String(selected.close_date).slice(0, 10) : ''} className="h-8" />
                                    <Input name="next_step" defaultValue={selected.next_step ?? ''} placeholder="Next step" className="h-8" />
                                    <select name="owner_id" defaultValue={selected.owner_id ?? ''} className="h-8 rounded border bg-background px-2">
                                        <option value="">Unassigned</option>
                                        {members.map((user: any) => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    <Input name="source" defaultValue={selected.source ?? ''} placeholder="Source" className="h-8" />
                                    <Input name="lost_reason" defaultValue={selected.lost_reason ?? ''} placeholder="Lost reason" className="col-span-2 h-8" />
                                    {(attributes.definitions ?? []).map((definition: any) => (
                                        <Input
                                            key={definition.id}
                                            name={`attributes[${definition.key}]`}
                                            defaultValue={attributes.values?.[definition.key] ?? ''}
                                            placeholder={definition.label}
                                            className="h-8"
                                        />
                                    ))}
                                    <Button className="col-span-2 h-8">Save deal</Button>
                                </Form>
                                <Form action={`/crm/deals/${selected.id}/move`} method="post" className="flex flex-wrap gap-1">
                                    {stages.map((stage: any) => (
                                        <Button key={stage.id} name="stage_id" value={stage.id} variant={stage.id === selected.stage_id ? 'default' : 'secondary'} className="h-7 text-[11px]">
                                            {stage.name}
                                        </Button>
                                    ))}
                                </Form>
                                <div>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
                                    <TimelineFilter timeline={timeline}>
                                        {(items) => (
                                    <div className="space-y-2">
                                        {items.map((item: any) => (
                                            <div key={item.id} className="border-l-2 border-brand pl-3">
                                                <p className="text-[11px] uppercase text-muted-foreground">{item.type}</p>
                                                <p className="font-medium">{item.subject ?? item.body}</p>
                                                {item.body && item.subject ? <p className="text-muted-foreground">{item.body}</p> : null}
                                                {item.type === 'task' && !item.done ? (
                                                    <Form action={`/crm/activities/${item.id}/complete`} method="post">
                                                        <Button variant="secondary" className="mt-1 h-6 text-[11px]">Done</Button>
                                                    </Form>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                        )}
                                    </TimelineFilter>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid flex-1 place-items-center text-muted-foreground">Select a deal</div>
                    )
                }
                side={
                    selected ? (
                        <div className="space-y-4 p-3">
                            <section>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide">Log activity</h3>
                                <Form action="/crm/activities" method="post" className="space-y-1" resetOnSuccess>
                                    <input type="hidden" name="deal_id" value={selected.id} />
                                    <input type="hidden" name="contact_id" value={selected.contact_id ?? ''} />
                                    <input type="hidden" name="company_id" value={selected.company_id ?? ''} />
                                    <select name="type" className="h-7 w-full rounded border bg-background px-1">
                                        <option value="note">Note</option>
                                        <option value="task">Task</option>
                                        <option value="call">Call</option>
                                        <option value="meeting">Meeting</option>
                                    </select>
                                    <Input name="subject" placeholder="Subject" className="h-7" />
                                    <Input name="body" placeholder="Details" className="h-7" />
                                    <Input name="due_at" type="datetime-local" className="h-7" />
                                    <select name="owner_id" defaultValue={selected.owner_id ?? ''} className="h-7 w-full rounded border bg-background px-1">
                                        {members.map((user: any) => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    <Button className="h-7 w-full">Add to timeline</Button>
                                </Form>
                            </section>
                            <section>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide">Associations</h3>
                                {associations?.contact ? (
                                    <Link href={`/crm/contacts/${associations.contact.id}`} className="block text-brand">
                                        {associations.contact.first_name} {associations.contact.last_name}
                                    </Link>
                                ) : null}
                                {associations?.company ? (
                                    <Link href={`/crm/companies/${associations.company.id}`} className="block text-brand">
                                        {associations.company.name}
                                    </Link>
                                ) : null}
                                <p className="mt-2 text-[11px] text-muted-foreground">Desk history</p>
                                {(associations?.threads ?? []).map((thread: any) => (
                                    <Link key={thread.id} href={`/conversations?thread=${thread.id}`} className="block text-brand">
                                        {thread.subject ?? 'Thread'}
                                    </Link>
                                ))}
                                <p className="mt-2 text-[11px] text-muted-foreground">Enrollments</p>
                                {(associations?.enrollments ?? []).map((enrollment: any) => (
                                    <p key={enrollment.id}>{enrollment.sequence?.name}</p>
                                ))}
                            </section>
                            <section>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide">Quote</h3>
                                {(associations?.quotes ?? []).map((quote: any) => (
                                    <p key={quote.id}>
                                        {quote.status} · <span className="money">{formatDzd(quote.total_cents)}</span>
                                    </p>
                                ))}
                                <Form action={`/crm/deals/${selected.id}/quotes`} method="post" className="mt-2 space-y-1">
                                    <Input name="items[0][name]" placeholder="Line item" required className="h-7" />
                                    <Input name="items[0][quantity]" type="number" min={1} defaultValue={1} className="h-7" />
                                    <Input name="items[0][unit_dzd]" type="number" min={0} step="0.01" placeholder="Unit DZD" className="h-7" />
                                    <select name="status" className="h-7 w-full rounded border bg-background px-1">
                                        <option value="draft">draft</option>
                                        <option value="sent">sent</option>
                                        <option value="accepted">accepted</option>
                                    </select>
                                    <Button className="h-7 w-full">Add quote</Button>
                                </Form>
                            </section>
                            <Form action="/crm/filters" method="post" className="space-y-1 border-t pt-2">
                                <input type="hidden" name="entity" value="deal" />
                                <input type="hidden" name="stage" value={activeFilters.stage ?? ''} />
                                <input type="hidden" name="owner" value={activeFilters.owner ?? ''} />
                                <input type="hidden" name="city" value={activeFilters.city ?? ''} />
                                <input type="hidden" name="wilaya" value={activeFilters.wilaya ?? ''} />
                                <Input name="name" placeholder="Save this list" className="h-7" required />
                                <Button variant="secondary" className="h-7 w-full">Save filter</Button>
                            </Form>
                        </div>
                    ) : null
                }
            />
        </>
    );
}

DealHub.layout = {
    breadcrumbs: [{ title: 'Deals', href: '/crm/deals' }],
};
