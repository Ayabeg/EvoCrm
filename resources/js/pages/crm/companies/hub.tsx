import { Form, Head, Link, router } from '@inertiajs/react';
import AssociationsCard from '@/components/crm/associations-card';
import { HubListRow, HubShell } from '@/components/crm/hub-chrome';
import ListToolbar from '@/components/crm/list-toolbar';
import RecordProperties from '@/components/crm/record-properties';
import { RecordFact, RecordFacts } from '@/components/crm/record-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CompanyHub({
    companies,
    selected,
    associations,
    timeline,
    attributes,
    members,
    cities,
    wilayas,
    savedFilters = [],
    activeFilters = {},
}: any) {
    return (
        <>
            <Head title={selected ? selected.name : 'Companies'} />
            <HubShell
                list={
                    <>
                        <ListToolbar
                            entity="company"
                            basePath="/crm/companies"
                            activeFilters={activeFilters}
                            savedFilters={savedFilters}
                            members={members}
                            cities={cities}
                            wilayas={wilayas}
                        />
                        <div className="border-b px-3 py-2">
                            <h1 className="text-sm font-semibold">Companies</h1>
                            <p className="text-[11px] text-muted-foreground">{companies.length} accounts</p>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {companies.map((company: any) => (
                                <HubListRow
                                    key={company.id}
                                    active={selected?.id === company.id}
                                    onClick={() => router.get(`/crm/companies/${company.id}`, {}, { preserveState: true })}
                                >
                                    <p className="font-medium">{company.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {company.city ?? '—'} · {company.contacts_count ?? 0} contacts
                                    </p>
                                </HubListRow>
                            ))}
                        </div>
                        <Form action="/crm/companies" method="post" className="space-y-1 border-t p-2" resetOnSuccess>
                            <Input name="name" placeholder="Company" required className="h-7" />
                            <select name="city" className="h-7 w-full rounded border bg-background px-1">
                                <option value="">City</option>
                                {cities.map((city: string) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <Button className="h-7 w-full text-[11px]">Create company</Button>
                        </Form>
                    </>
                }
                main={
                    selected ? (
                        <div className="space-y-3 overflow-y-auto p-4">
                            <h2 className="text-base font-semibold">{selected.name}</h2>
                            <RecordFacts>
                                <RecordFact label="Domain">{selected.domain ?? '—'}</RecordFact>
                                <RecordFact label="Phone">{selected.phone ?? '—'}</RecordFact>
                                <RecordFact label="Owner">{selected.owner?.name ?? 'Unassigned'}</RecordFact>
                                <RecordFact label="City">{selected.city ?? '—'}</RecordFact>
                                <RecordFact label="Wilaya">{selected.wilaya ?? '—'}</RecordFact>
                                <RecordFact label="Contacts">{selected.contacts_count ?? 0}</RecordFact>
                            </RecordFacts>
                            <AssociationsCard associations={associations} />
                            <Form action={`/crm/companies/${selected.id}`} method="put" className="grid grid-cols-2 gap-2">
                                <Input name="name" defaultValue={selected.name} required className="h-8" />
                                <Input name="domain" defaultValue={selected.domain ?? ''} className="h-8" />
                                <Input name="phone" defaultValue={selected.phone ?? ''} className="h-8" />
                                <select name="city" defaultValue={selected.city ?? ''} className="h-8 rounded border bg-background px-2">
                                    <option value="">City</option>
                                    {cities.map((city: string) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <select name="wilaya" defaultValue={selected.wilaya ?? ''} className="h-8 rounded border bg-background px-2">
                                    <option value="">Wilaya</option>
                                    {wilayas.map((wilaya: string) => (
                                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                                    ))}
                                </select>
                                <select name="owner_id" defaultValue={selected.owner_id ?? ''} className="h-8 rounded border bg-background px-2">
                                    <option value="">Unassigned</option>
                                    {members.map((user: any) => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                <Button className="col-span-2 h-8">Save company</Button>
                            </Form>
                            <RecordProperties
                                action={`/crm/companies/${selected.id}/attributes`}
                                attributes={attributes}
                            />
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
                                {timeline.map((item: any) => (
                                    <div key={item.id} className="border-l-2 border-brand pl-3">
                                        <p className="text-[11px] uppercase text-muted-foreground">{item.type}</p>
                                        <p>{item.subject ?? item.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid flex-1 place-items-center text-muted-foreground">Select a company</div>
                    )
                }
                side={
                    selected ? (
                        <div className="space-y-3 p-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Associations</h3>
                            <p className="text-[11px] text-muted-foreground">Contacts</p>
                            {(associations?.contacts ?? []).map((contact: any) => (
                                <Link key={contact.id} href={`/crm/contacts/${contact.id}`} className="block text-brand">
                                    {contact.first_name} {contact.last_name}
                                </Link>
                            ))}
                            <p className="mt-2 text-[11px] text-muted-foreground">Deals</p>
                            {(associations?.deals ?? []).map((deal: any) => (
                                <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-brand">
                                    {deal.title} · {deal.stage?.name}
                                </Link>
                            ))}
                            <Form action="/crm/activities" method="post" className="space-y-1 border-t pt-2" resetOnSuccess>
                                <input type="hidden" name="company_id" value={selected.id} />
                                <input type="hidden" name="type" value="note" />
                                <Input name="body" placeholder="Company note" required className="h-7" />
                                <Button className="h-7 w-full">Add note</Button>
                            </Form>
                        </div>
                    ) : null
                }
            />
        </>
    );
}

CompanyHub.layout = {
    breadcrumbs: [{ title: 'Companies', href: '/crm/companies' }],
};
