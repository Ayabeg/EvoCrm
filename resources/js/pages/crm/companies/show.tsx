import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import DeskThreadCard from '@/components/crm/desk-thread-card';
import { SkeletonRecord } from '@/components/crm/empty-room';
import EnrichmentPanel from '@/components/crm/enrichment-panel';
import type { EnrichmentRunRow } from '@/components/crm/enrichment-panel';
import type { RecordActivity } from '@/components/crm/record-activity';
import RecordActivityPanel from '@/components/crm/record-activity-panel';
import {
    AssociationCard,
    RecordActions,
    RecordBack,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordSection,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
import { RecordIdentity, RecordPageFrame, RecordShell } from '@/evo/crm/record';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';

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
    account_type?: string | null;
    parent_company_id?: number | null;
    parent_company?: { id: number; name: string } | null;
    subsidiaries?: { id: number; name: string; account_type?: string | null }[];
};

export default function CompanyShow({
    company,
    associations,
    timeline,
    attributes,
    members,
    cities,
    wilayas,
    parentCompanies,
    askEvo,
    enrichmentRuns = [],
    enrichAction,
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
    parentCompanies: { id: number; name: string }[];
    askEvo?: AskEvoPayload | null;
    enrichmentRuns?: EnrichmentRunRow[];
    enrichAction?: string;
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
                        <WorkspaceHeader
                            archetype="record"
                            leading={
                                <RecordBack
                                    href="/crm/companies"
                                    label="Back to Companies"
                                />
                            }
                            title={
                                <RecordIdentity
                                    title={company.name}
                                    kind="Company"
                                    subtitle={
                                        [
                                            company.domain,
                                            location,
                                            company.owner?.name,
                                        ]
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
                                                            setEditing(
                                                                (open) => !open,
                                                            )
                                                        }
                                                    >
                                                        {editing
                                                            ? 'Close edit'
                                                            : 'Edit'}
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
                            }
                        />
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-3">
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
                                            label="Account type"
                                            value={company.account_type}
                                        />
                                        <RecordFact
                                            label="Parent company"
                                            value={company.parent_company?.name}
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
                                {enrichAction ? (
                                    <EnrichmentPanel
                                        action={enrichAction}
                                        runs={enrichmentRuns}
                                    />
                                ) : null}
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
                                                className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
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
                                                className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
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
                                                className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
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
                                            <select
                                                name="account_type"
                                                defaultValue={
                                                    company.account_type ??
                                                    'prospect'
                                                }
                                                className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                            >
                                                <option value="prospect">
                                                    Prospect
                                                </option>
                                                <option value="customer">
                                                    Customer
                                                </option>
                                                <option value="partner">
                                                    Partner
                                                </option>
                                                <option value="subsidiary">
                                                    Subsidiary
                                                </option>
                                            </select>
                                            <select
                                                name="parent_company_id"
                                                defaultValue={
                                                    company.parent_company_id ??
                                                    ''
                                                }
                                                className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                            >
                                                <option value="">
                                                    No parent company
                                                </option>
                                                {parentCompanies.map(
                                                    (parent) => (
                                                        <option
                                                            key={parent.id}
                                                            value={parent.id}
                                                        >
                                                            {parent.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <Button className="h-8">
                                                Save company
                                            </Button>
                                        </Form>
                                    </RecordSection>
                                ) : null}
                                {company.subsidiaries?.length ? (
                                    <RecordSection title="Subsidiaries">
                                        <div className="space-y-1.5">
                                            {company.subsidiaries.map(
                                                (subsidiary) => (
                                                    <a
                                                        key={subsidiary.id}
                                                        href={`/crm/companies/${subsidiary.id}`}
                                                        className="flex items-center justify-between rounded-md border border-hairline px-2.5 py-2 text-[13px] text-ink hover:bg-canvas-soft"
                                                    >
                                                        <span>
                                                            {subsidiary.name}
                                                        </span>
                                                        <span className="text-[11px] text-mute">
                                                            {subsidiary.account_type ??
                                                                '—'}
                                                        </span>
                                                    </a>
                                                ),
                                            )}
                                        </div>
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
                        center={
                            <RecordActivityPanel
                                timeline={timeline}
                                insight={askEvo}
                                companyId={company.id}
                            />
                        }
                        right={
                            <div className="space-y-3">
                                <AskEvoPanel
                                    action={askAction}
                                    insight={askEvo}
                                />
                                <DeskThreadCard />
                                <AssociationCard
                                    title="Contacts"
                                    addHref="/crm/contacts?create=1"
                                >
                                    {contacts.length === 0 ? (
                                        <p className="text-mute">
                                            {t('No contacts')}
                                        </p>
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
                                        <p className="text-mute">
                                            {t('No deals')}
                                        </p>
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
