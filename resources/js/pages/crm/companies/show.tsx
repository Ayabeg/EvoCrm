import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import type {AskEvoPayload} from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
} from '@/components/crm/record-chrome';
import RecordProperties from '@/components/crm/record-properties';
import type {AttributeBag} from '@/components/crm/record-properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';

type Company = {
    id: number;
    name: string;
    domain?: string | null;
    industry?: string | null;
    phone?: string | null;
    city?: string | null;
    wilaya?: string | null;
    country?: string | null;
    owner?: { id: number; name: string } | null;
    owner_id?: number | null;
};

type Activity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
};

export default function CompanyShow({
    company,
    associations,
    timeline,
    attributes,
    members,
    cities,
    wilayas,
    askEvo,
}: {
    company: Company;
    associations: {
        contacts?: { id: number; first_name: string; last_name?: string | null }[];
        deals?: { id: number; title: string; stage?: { name: string } }[];
    } | null;
    timeline: Activity[];
    attributes?: AttributeBag;
    members: { id: number; name: string }[];
    cities: string[];
    wilayas: string[];
    askEvo?: AskEvoPayload | null;
}) {
    const [tab, setTab] = useState('activities');
    const loading = useInertiaLoading();
    const items = useMemo(() => {
        if (tab === 'activities') {
            return timeline;
        }

        return timeline.filter((item) => item.type === tab.replace(/s$/, ''));
    }, [tab, timeline]);

    return (
        <>
            <Head title={company.name} />
            {loading ? (
                <SkeletonRecord />
            ) : (
            <div className="flex h-app-workspace flex-col bg-canvas-soft text-ui text-ink">
                <div className="shrink-0 border-b border-hairline bg-canvas px-5 py-4 sm:px-6 sm:py-5">
                    <RecordBack href="/crm/companies" label="Back to Companies" />
                    <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-record-title font-semibold">{company.name}</h1>
                            <p className="text-muted-foreground">
                                {[company.city, company.wilaya, company.country].filter(Boolean).join(' · ') ||
                                    'No location'}
                            </p>
                            <div className="mt-3">
                                <RecordActions entityId={company.id} companyId={company.id} />
                            </div>
                        </div>
                    </div>
                </div>

                <RecordShell
                    left={
                        <div className="space-y-4">
                            <AskEvoPanel action={`/crm/companies/${company.id}/ask`} insight={askEvo} />
                            <h2 className="text-[13px] font-semibold">About this company</h2>
                            <Field label="Domain" value={company.domain ?? '—'} />
                            <Field label="Phone" value={company.phone ?? '—'} />
                            <Field label="Industry" value={company.industry ?? '—'} />
                            <Field label="Owner" value={company.owner?.name ?? 'Unassigned'} />
                            <Form action={`/crm/companies/${company.id}`} method="put" className="space-y-2">
                                <Input name="name" defaultValue={company.name} required className="h-8" />
                                <Input name="domain" defaultValue={company.domain ?? ''} placeholder="Domain" className="h-8" />
                                <Input name="phone" defaultValue={company.phone ?? ''} placeholder="Phone" className="h-8" />
                                <select name="city" defaultValue={company.city ?? ''} className="h-8 w-full rounded border bg-background px-2 text-sm">
                                    <option value="">City</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                                <select name="wilaya" defaultValue={company.wilaya ?? ''} className="h-8 w-full rounded border bg-background px-2 text-sm">
                                    <option value="">Wilaya</option>
                                    {wilayas.map((wilaya) => (
                                        <option key={wilaya} value={wilaya}>
                                            {wilaya}
                                        </option>
                                    ))}
                                </select>
                                <select name="owner_id" defaultValue={company.owner_id ?? ''} className="h-8 w-full rounded border bg-background px-2 text-sm">
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                                <Button className="h-8 w-full">Save company</Button>
                            </Form>
                            {attributes ? (
                                <RecordProperties
                                    action={`/crm/companies/${company.id}/attributes`}
                                    attributes={attributes}
                                />
                            ) : null}
                        </div>
                    }
                    center={
                        <div>
                            <ActivityTabs
                                tabs={[
                                    { key: 'activities', label: 'Activities' },
                                    { key: 'notes', label: 'Notes' },
                                    { key: 'tasks', label: 'Tasks' },
                                ]}
                                active={tab}
                                onChange={setTab}
                            />
                            <div className="mt-4 space-y-3">
                                {items.length === 0 ? (
                                    <p className="text-muted-foreground">No activity yet.</p>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="border-l-2 border-brand pl-3">
                                            <p className="text-section-label text-muted-foreground">{item.type}</p>
                                            <p>{item.subject ?? item.body}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    }
                    right={
                        <div className="space-y-3">
                            <AssociationCard title="Contacts">
                                {(associations?.contacts ?? []).length === 0 ? (
                                    <p className="text-muted-foreground">No contacts</p>
                                ) : (
                                    (associations?.contacts ?? []).map((contact) => (
                                        <Link
                                            key={contact.id}
                                            href={`/crm/contacts/${contact.id}`}
                                            className="block text-brand"
                                        >
                                            {contact.first_name} {contact.last_name ?? ''}
                                        </Link>
                                    ))
                                )}
                            </AssociationCard>
                            <AssociationCard title="Deals">
                                {(associations?.deals ?? []).length === 0 ? (
                                    <p className="text-muted-foreground">No deals</p>
                                ) : (
                                    (associations?.deals ?? []).map((deal) => (
                                        <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="block text-brand">
                                            {deal.title}
                                            {deal.stage ? ` · ${deal.stage.name}` : ''}
                                        </Link>
                                    ))
                                )}
                            </AssociationCard>
                        </div>
                    }
                />
            </div>
            )}
        </>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    );
}

CompanyShow.layout = {
    breadcrumbs: [
        { title: 'Companies', href: '/crm/companies' },
        { title: 'Company', href: '#' },
    ],
};
