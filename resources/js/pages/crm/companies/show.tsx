import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordIdentity,
    RecordPageFrame,
    RecordSection,
    RecordTimelineItem,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
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
        contacts?: {
            id: number;
            first_name: string;
            last_name?: string | null;
        }[];
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

    const location =
        [company.city, company.wilaya, company.country]
            .filter(Boolean)
            .join(' · ') || 'No location';

    return (
        <>
            <Head title={company.name} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <>
                            <RecordBack
                                href="/crm/companies"
                                label="Back to Companies"
                            />
                            <RecordIdentity
                                title={company.name}
                                subtitle={location}
                                actions={
                                    <RecordActions
                                        entityId={company.id}
                                        companyId={company.id}
                                    />
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-4">
                                <AskEvoPanel
                                    action={`/crm/companies/${company.id}/ask`}
                                    insight={askEvo}
                                />
                                <RecordSection title="About this company">
                                    <RecordFact
                                        label="Domain"
                                        value={company.domain ?? '—'}
                                    />
                                    <RecordFact
                                        label="Phone"
                                        value={company.phone ?? '—'}
                                    />
                                    <RecordFact
                                        label="Industry"
                                        value={company.industry ?? '—'}
                                    />
                                    <RecordFact
                                        label="Owner"
                                        value={
                                            company.owner?.name ?? 'Unassigned'
                                        }
                                    />
                                </RecordSection>
                                <RecordSection title="Edit">
                                    <Form
                                        action={`/crm/companies/${company.id}`}
                                        method="put"
                                        className="space-y-2"
                                    >
                                        <Input
                                            name="name"
                                            defaultValue={company.name}
                                            required
                                            className="h-8"
                                        />
                                        <Input
                                            name="domain"
                                            defaultValue={company.domain ?? ''}
                                            placeholder="Domain"
                                            className="h-8"
                                        />
                                        <Input
                                            name="phone"
                                            defaultValue={company.phone ?? ''}
                                            placeholder="Phone"
                                            className="h-8"
                                        />
                                        <select
                                            name="city"
                                            defaultValue={company.city ?? ''}
                                            className="h-8 w-full rounded-xl border border-hairline bg-background px-2 text-sm"
                                        >
                                            <option value="">City</option>
                                            {cities.map((city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            name="wilaya"
                                            defaultValue={company.wilaya ?? ''}
                                            className="h-8 w-full rounded-xl border border-hairline bg-background px-2 text-sm"
                                        >
                                            <option value="">Wilaya</option>
                                            {wilayas.map((wilaya) => (
                                                <option
                                                    key={wilaya}
                                                    value={wilaya}
                                                >
                                                    {wilaya}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            name="owner_id"
                                            defaultValue={
                                                company.owner_id ?? ''
                                            }
                                            className="h-8 w-full rounded-xl border border-hairline bg-background px-2 text-sm"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map((member) => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button className="h-8 w-full">
                                            Save company
                                        </Button>
                                    </Form>
                                </RecordSection>
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
                                        {
                                            key: 'activities',
                                            label: 'Activities',
                                        },
                                        { key: 'notes', label: 'Notes' },
                                        { key: 'tasks', label: 'Tasks' },
                                    ]}
                                    active={tab}
                                    onChange={setTab}
                                />
                                <div className="mt-4 space-y-3">
                                    {items.length === 0 ? (
                                        <p className="text-mute">
                                            No activity yet.
                                        </p>
                                    ) : (
                                        items.map((item) => (
                                            <RecordTimelineItem
                                                key={item.id}
                                                type={item.type}
                                                title={
                                                    item.subject ?? item.body
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        }
                        right={
                            <div className="space-y-3">
                                <AssociationCard title="Contacts">
                                    {(associations?.contacts ?? []).length ===
                                    0 ? (
                                        <p className="text-mute">No contacts</p>
                                    ) : (
                                        (associations?.contacts ?? []).map(
                                            (contact) => (
                                                <Link
                                                    key={contact.id}
                                                    href={`/crm/contacts/${contact.id}`}
                                                    className="block text-brand"
                                                >
                                                    {contact.first_name}{' '}
                                                    {contact.last_name ?? ''}
                                                </Link>
                                            ),
                                        )
                                    )}
                                </AssociationCard>
                                <AssociationCard title="Deals">
                                    {(associations?.deals ?? []).length ===
                                    0 ? (
                                        <p className="text-mute">No deals</p>
                                    ) : (
                                        (associations?.deals ?? []).map(
                                            (deal) => (
                                                <Link
                                                    key={deal.id}
                                                    href={`/crm/deals/${deal.id}`}
                                                    className="block text-brand"
                                                >
                                                    {deal.title}
                                                    {deal.stage
                                                        ? ` · ${deal.stage.name}`
                                                        : ''}
                                                </Link>
                                            ),
                                        )
                                    )}
                                </AssociationCard>
                            </div>
                        }
                    />
                </RecordPageFrame>
            )}
        </>
    );
}

CompanyShow.layout = {
    breadcrumbs: [
        { title: 'Companies', href: '/crm/companies' },
        { title: 'Company', href: '#' },
    ],
};
