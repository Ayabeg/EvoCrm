import { Form, Head, Link, router } from '@inertiajs/react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import AssociationsCard from '@/components/crm/associations-card';
import CatchUpBlock from '@/components/crm/catch-up-block';
import { HubListRow, HubShell } from '@/components/crm/hub-chrome';
import RecordProperties from '@/components/crm/record-properties';
import ListToolbar from '@/components/crm/list-toolbar';
import RecordActionRow from '@/components/crm/record-action-row';
import { RecordFact, RecordFacts, RecordTimeline } from '@/components/crm/record-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactHub({
    contacts,
    selected,
    associations,
    timeline,
    attributes,
    companies,
    members,
    savedFilters,
    activeFilters,
    cities,
    wilayas,
    catchUp,
    askEvo,
}: any) {

    return (
        <>
            <Head title={selected ? `${selected.first_name} ${selected.last_name ?? ''}` : 'Contacts'} />
            <HubShell
                list={
                    <>
                        <ListToolbar
                            entity="contact"
                            basePath="/crm/contacts"
                            activeFilters={activeFilters}
                            savedFilters={savedFilters}
                            members={members}
                            cities={cities}
                            wilayas={wilayas}
                            companies={companies}
                            exportHref="/crm/contacts/export"
                        />
                        <div className="border-b px-3 py-2">
                            <div className="flex items-center justify-between">
                                <h1 className="text-sm font-semibold">Contacts</h1>
                                <span className="text-[11px] text-muted-foreground">{contacts.length}</span>
                            </div>
                            <Form action="/crm/contacts" method="get" className="mt-2 grid grid-cols-2 gap-1">
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
                                <select name="owner" defaultValue={activeFilters.owner ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Owner</option>
                                    <option value="unassigned">Unassigned</option>
                                    {members.map((user: any) => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                <select name="last_activity" defaultValue={activeFilters.last_activity ?? ''} className="h-7 rounded border bg-background px-1 text-[11px]">
                                    <option value="">Last activity</option>
                                    <option value="7d">7 days</option>
                                    <option value="30d">30 days</option>
                                    <option value="none">None</option>
                                </select>
                                <label className="col-span-2 flex items-center gap-1 text-[11px]">
                                    <input type="checkbox" name="unanswered" value="1" defaultChecked={!!activeFilters.unanswered} />
                                    Unanswered
                                </label>
                                <Button className="col-span-2 h-7 text-[11px]">Apply list</Button>
                            </Form>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {savedFilters.map((filter: any) => (
                                    <Link key={filter.id} href={`/crm/contacts?filter_id=${filter.id}`} className="rounded bg-canvas-soft px-1.5 py-0.5 text-[10px] text-ink">
                                        {filter.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {contacts.map((contact: any) => (
                                <HubListRow
                                    key={contact.id}
                                    active={selected?.id === contact.id}
                                    onClick={() => router.get(`/crm/contacts/${contact.id}`, {}, { preserveState: true })}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate font-medium">
                                            {contact.first_name} {contact.last_name}
                                        </span>
                                        {contact.unanswered ? <span className="text-[10px] text-brand">Unanswered</span> : null}
                                    </div>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {contact.company?.name ?? 'No company'} · {contact.owner?.name ?? 'Unassigned'}
                                    </p>
                                </HubListRow>
                            ))}
                        </div>
                        <Form action="/crm/contacts" method="post" className="space-y-1 border-t p-2" resetOnSuccess>
                            <Input name="first_name" placeholder="First name" required className="h-7" />
                            <Input name="phone" placeholder="0550…" className="h-7" />
                            <Button className="h-7 w-full text-[11px]">Create contact</Button>
                        </Form>
                    </>
                }
                main={
                    selected ? (
                        <>
                            <header className="flex items-center justify-between border-b px-4 py-2">
                                <div>
                                    <h2 className="text-base font-semibold">
                                        {selected.first_name} {selected.last_name}
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground">
                                        {selected.phone_e164 ?? 'No phone'} · {selected.email ?? 'No email'} · {selected.city ?? selected.company?.city ?? '—'}
                                    </p>
                                </div>
                                <Link href="/inbox" className="rounded bg-brand px-3 py-1 text-[12px] text-canvas">
                                    Open in Inbox
                                </Link>
                            </header>
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                <RecordFacts>
                                    <RecordFact label="Phone">{selected.phone_e164 ?? selected.phone ?? '—'}</RecordFact>
                                    <RecordFact label="Email">{selected.email ?? '—'}</RecordFact>
                                    <RecordFact label="Owner">{selected.owner?.name ?? 'Unassigned'}</RecordFact>
                                    <RecordFact label="City">{selected.city ?? selected.company?.city ?? '—'}</RecordFact>
                                    <RecordFact label="Wilaya">{selected.wilaya ?? selected.company?.wilaya ?? '—'}</RecordFact>
                                    <RecordFact label="Inbox">{selected.unanswered ? 'Unanswered' : 'Caught up'}</RecordFact>
                                </RecordFacts>
                                <RecordActionRow
                                    contactId={selected.id}
                                    companyId={selected.company_id}
                                    ownerId={selected.owner_id}
                                />
                                <AskEvoPanel action={`/crm/contacts/${selected.id}/ask`} insight={askEvo} />
                                <CatchUpBlock inbound={catchUp?.inbound} outbound={catchUp?.outbound} />
                                <AssociationsCard associations={associations} />
                                <Form action={`/crm/contacts/${selected.id}`} method="put" className="grid grid-cols-2 gap-2 border-b pb-3">
                                    <Input name="first_name" defaultValue={selected.first_name} required className="h-8" />
                                    <Input name="last_name" defaultValue={selected.last_name ?? ''} className="h-8" />
                                    <Input name="phone" defaultValue={selected.phone ?? selected.phone_e164 ?? ''} className="h-8" />
                                    <Input name="email" defaultValue={selected.email ?? ''} className="h-8" />
                                    <select name="company_id" defaultValue={selected.company_id ?? ''} className="h-8 rounded border bg-background px-2">
                                        <option value="">Company</option>
                                        {companies.map((company: any) => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                    <select name="owner_id" defaultValue={selected.owner_id ?? ''} className="h-8 rounded border bg-background px-2">
                                        <option value="">Unassigned</option>
                                        {members.map((user: any) => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                    <select name="city" defaultValue={selected.city ?? ''} className="h-8 rounded border bg-background px-2">
                                        <option value="">City</option>
                                        {cities.map((city: string) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <select name="wilaya" defaultValue={selected.wilaya ?? selected.company?.wilaya ?? ''} className="h-8 rounded border bg-background px-2">
                                        <option value="">Wilaya</option>
                                        {wilayas.map((wilaya: string) => (
                                            <option key={wilaya} value={wilaya}>{wilaya}</option>
                                        ))}
                                    </select>
                                    <Button className="col-span-2 h-8">Save contact</Button>
                                </Form>
                                <RecordProperties
                                    action={`/crm/contacts/${selected.id}/attributes`}
                                    attributes={attributes}
                                />
                                <RecordTimeline timeline={timeline} />
                            </div>
                        </>
                    ) : (
                        <div className="grid flex-1 place-items-center text-muted-foreground">Select a contact</div>
                    )
                }
                side={
                    selected ? (
                        <div className="space-y-4 p-3">
                            <section>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide">Log activity</h3>
                                <Form action="/crm/activities" method="post" className="space-y-1" resetOnSuccess>
                                    <input type="hidden" name="contact_id" value={selected.id} />
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
                                <p className="text-[11px] text-muted-foreground">Company</p>
                                {associations?.company ? (
                                    <Link href={`/crm/companies/${associations.company.id}`} className="block text-brand">
                                        {associations.company.name}
                                    </Link>
                                ) : (
                                    <p>—</p>
                                )}
                                <p className="mt-2 text-[11px] text-muted-foreground">Deals</p>
                                {(associations?.deals ?? []).map((deal: any) => (
                                    <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-brand">
                                        {deal.title} · {deal.stage?.name}
                                    </Link>
                                ))}
                                <p className="mt-2 text-[11px] text-muted-foreground">Desk history</p>
                                {(associations?.threads ?? []).map((thread: any) => (
                                    <Link key={thread.id} href={`/conversations?thread=${thread.id}`} className="block text-brand">
                                        {thread.subject ?? 'Thread'} · {thread.status}
                                    </Link>
                                ))}
                                <p className="mt-2 text-[11px] text-muted-foreground">Enrollments</p>
                                {(associations?.enrollments ?? []).map((enrollment: any) => (
                                    <p key={enrollment.id}>{enrollment.sequence?.name} · {enrollment.status}</p>
                                ))}
                            </section>
                            <Form action="/crm/filters" method="post" className="space-y-1 border-t pt-2">
                                <input type="hidden" name="entity" value="contact" />
                                <input type="hidden" name="city" value={activeFilters.city ?? ''} />
                                <input type="hidden" name="wilaya" value={activeFilters.wilaya ?? ''} />
                                <input type="hidden" name="owner" value={activeFilters.owner ?? ''} />
                                <input type="hidden" name="last_activity" value={activeFilters.last_activity ?? ''} />
                                {activeFilters.unanswered ? <input type="hidden" name="unanswered" value="1" /> : null}
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

ContactHub.layout = {
    breadcrumbs: [{ title: 'Contacts', href: '/crm/contacts' }],
};
