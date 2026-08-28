import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import type { RecordActivity } from '@/components/crm/record-activity';
import RecordActivityPanel from '@/components/crm/record-activity-panel';
import {
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordIdentity,
    RecordPageFrame,
    RecordSection,
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
    timeline: RecordActivity[];
    attributes?: AttributeBag;
    members: { id: number; name: string }[];
    cities: string[];
    wilayas: string[];
    askEvo?: AskEvoPayload | null;
}) {
    const loading = useInertiaLoading();
    const [editing, setEditing] = useState(false);
    const askAction = `/crm/companies/${company.id}/ask`;
    const contacts = associations?.contacts ?? [];
    const deals = associations?.deals ?? [];
    const location = [company.city, company.wilaya, company.country]
        .filter(Boolean)
        .join(' · ');

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
                                kind="Company"
                                subtitle={
                                    [company.domain, location, company.owner?.name]
                                        .filter(Boolean)
                                        .join(' · ') || undefined
                                }
                                actions={
                                    <RecordActions
                                        entityId={company.id}
                                        companyId={company.id}
                                        secondary={
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    aria-expanded={editing}
                                                    onClick={() =>
                                                        setEditing((open) => !open)
                                                    }
                                                >
                                                    {editing ? 'Close edit' : 'Edit'}
                                                </Button>
                                                <div className="md:hidden">
                                                    <AskEvoTrigger
                                                        action={askAction}
                                                        insight={askEvo}
                                                    />
                                                </div>
                                            </>
                                        }
                                    />
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-5">
                                <RecordSection title="Company information">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Domain"
                                            value={company.domain}
                                        />
                                        <RecordFact
                                            label="Phone"
                                            value={company.phone}
                                        />
                                        <RecordFact
                                            label="Industry"
                                            value={company.industry}
                                        />
                                        <RecordFact
                                            label="Owner"
                                            value={company.owner?.name}
                                        />
                                        <RecordFact
                                            label="Location"
                                            value={location || null}
                                        />
                                    </RecordFactList>
                                </RecordSection>
                                {editing ? (
                                    <RecordSection title="Edit company">
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
                                                defaultValue={
                                                    company.domain ?? ''
                                                }
                                                placeholder="Domain"
                                                className="h-8"
                                            />
                                            <Input
                                                name="phone"
                                                defaultValue={
                                                    company.phone ?? ''
                                                }
                                                placeholder="Phone"
                                                className="h-8"
                                            />
                                            <select
                                                name="city"
                                                defaultValue={
                                                    company.city ?? ''
                                                }
                                                className="h-8 w-full rounded-xl border border-hairline bg-background px-2 text-sm"
                                            >
                                                <option value="">City</option>
                                                {cities.map((city) => (
                                                    <option
                                                        key={city}
                                                        value={city}
                                                    >
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                name="wilaya"
                                                defaultValue={
                                                    company.wilaya ?? ''
                                                }
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
                                                <option value="">
                                                    Unassigned
                                                </option>
                                                {members.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button className="h-8">
                                                Save company
                                            </Button>
                                        </Form>
                                    </RecordSection>
                                ) : null}
                                {attributes ? (
                                    <RecordProperties
                                        action={`/crm/companies/${company.id}/attributes`}
                                        attributes={attributes}
                                    />
                                ) : null}
                            </div>
                        }
                        center={<RecordActivityPanel timeline={timeline} />}
                        right={
                            <div className="space-y-5">
                                <AssociationCard
                                    title="Contacts"
                                    addHref="/crm/contacts?create=1"
                                >
                                    {contacts.length === 0 ? (
                                        <p className="text-mute">No contacts</p>
                                    ) : (
                                        contacts.map((contact) => (
                                            <RelatedRecordLink
                                                key={contact.id}
                                                href={`/crm/contacts/${contact.id}`}
                                            >
                                                {contact.first_name}{' '}
                                                {contact.last_name ?? ''}
                                            </RelatedRecordLink>
                                        ))
                                    )}
                                </AssociationCard>
                                <AssociationCard title="Deals">
                                    {deals.length === 0 ? (
                                        <p className="text-mute">No deals</p>
                                    ) : (
                                        deals.map((deal) => (
                                            <RelatedRecordLink
                                                key={deal.id}
                                                href={`/crm/deals/${deal.id}`}
                                                meta={deal.stage?.name}
                                            >
                                                {deal.title}
                                            </RelatedRecordLink>
                                        ))
                                    )}
                                </AssociationCard>
                                <AskEvoPanel
                                    action={askAction}
                                    insight={askEvo}
                                />
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
