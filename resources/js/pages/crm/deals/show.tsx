import { Form, Head } from '@inertiajs/react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import DealLineItems from '@/components/crm/deal-line-items';
import type {
    CatalogProduct,
    DealLineItemRow,
} from '@/components/crm/deal-line-items';
import DealQuotes from '@/components/crm/deal-quotes';
import DealSplits from '@/components/crm/deal-splits';
import { SkeletonRecord } from '@/components/crm/empty-room';
import PlaybookCard from '@/components/crm/playbook-card';
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
    RecordStatusBadge,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { formatDzd } from '@/lib/money';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    close_date?: string | null;
    type?: string | null;
    priority?: string | null;
    last_activity_at?: string | null;
    owner?: { id: number; name: string } | null;
    owner_id?: number | null;
    contact_id?: number | null;
    company_id?: number | null;
    stage?: { id: number; name: string; slug: string } | null;
    pipeline?: { name: string; stages?: { id: number; name: string }[] } | null;
};

export default function DealShow({
    deal,
    associations,
    timeline,
    stages,
    attributes,
    askEvo,
    dealHealth,
    catchUp,
    products,
    members,
    splits,
    canManageSplits,
    playbooks,
}: {
    deal: Deal & {
        line_items?: DealLineItemRow[];
        quotes?: Array<{
            id: number;
            status: string;
            total_cents: number;
            notes?: string | null;
            sent_at?: string | null;
            accepted_at?: string | null;
            expires_at?: string | null;
            items?: Array<{
                id: number;
                name: string;
                quantity: number;
                unit_cents: number;
                total_cents: number;
            }>;
        }>;
    };
    associations: {
        contact?: {
            id: number;
            first_name: string;
            last_name?: string | null;
        } | null;
        company?: { id: number; name: string } | null;
        quotes?: unknown[];
        line_items?: DealLineItemRow[];
    } | null;
    timeline: RecordActivity[];
    stages: { id: number; name: string }[];
    attributes?: AttributeBag;
    askEvo?: AskEvoPayload | null;
    dealHealth?: {
        score: number;
        label: string;
        reason: string;
        factors?: { key: string; label: string; detail: string }[];
        next_action?: string;
    } | null;
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    products?: CatalogProduct[];
    members?: { id: number; name: string }[];
    splits?: {
        user_id: number;
        percent: number;
        user?: { name: string } | null;
    }[];
    canManageSplits?: boolean;
    playbooks?: Array<{ id: number; name: string; body: string }>;
}) {
    const loading = useInertiaLoading();
    const askAction = `/crm/deals/${deal.id}/ask`;
    const contact = associations?.contact ?? null;
    const company = associations?.company ?? null;

    return (
        <>
            <Head title={deal.title} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <>
                            <RecordBack
                                href="/crm/deals"
                                label="Back to Deals"
                            />
                            <RecordIdentity
                                title={deal.title}
                                kind="Deal"
                                subtitle={
                                    <>
                                        <span className="money font-medium text-ink">
                                            {formatDzd(deal.amount_cents)}
                                        </span>
                                        {deal.pipeline?.name
                                            ? ` · ${deal.pipeline.name}`
                                            : ''}
                                        {deal.owner?.name
                                            ? ` · ${deal.owner.name}`
                                            : ''}
                                    </>
                                }
                                badge={
                                    deal.stage?.name ? (
                                        <RecordStatusBadge>
                                            {deal.stage.name}
                                        </RecordStatusBadge>
                                    ) : null
                                }
                                meta={
                                    dealHealth ? (
                                        <p className="text-[11px] leading-snug text-mute">
                                            <span className="font-medium text-ink">
                                                {dealHealth.label}
                                            </span>{' '}
                                            ({dealHealth.score}/100)
                                            <span className="hidden sm:inline">
                                                {' '}
                                                · {dealHealth.reason}
                                            </span>
                                        </p>
                                    ) : null
                                }
                                actions={
                                    <RecordActions
                                        entityId={deal.id}
                                        dealId={deal.id}
                                        contactId={deal.contact_id}
                                        companyId={deal.company_id}
                                        secondary={
                                            <div className="md:hidden">
                                                <AskEvoTrigger
                                                    action={askAction}
                                                    insight={askEvo}
                                                />
                                            </div>
                                        }
                                    />
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-3">
                                <RecordSection title="Deal information">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Amount"
                                            value={formatDzd(deal.amount_cents)}
                                            money
                                            hideEmpty={false}
                                        />
                                        <RecordFact
                                            label="Owner"
                                            value={deal.owner?.name}
                                        />
                                        <RecordFact
                                            label="Close date"
                                            value={
                                                deal.close_date
                                                    ? String(
                                                          deal.close_date,
                                                      ).slice(0, 10)
                                                    : null
                                            }
                                        />
                                        <RecordFact
                                            label="Last activity"
                                            value={
                                                deal.last_activity_at
                                                    ? String(
                                                          deal.last_activity_at,
                                                      ).slice(0, 10)
                                                    : null
                                            }
                                        />
                                        <RecordFact
                                            label="Type"
                                            value={deal.type}
                                        />
                                        <RecordFact
                                            label="Priority"
                                            value={deal.priority}
                                        />
                                    </RecordFactList>
                                </RecordSection>
                                {dealHealth?.factors?.length ? (
                                    <RecordSection title="Health">
                                        {dealHealth.factors.map((factor) => (
                                            <p
                                                key={factor.key}
                                                className="text-[12px]"
                                            >
                                                <span className="text-mute">
                                                    {factor.label}:{' '}
                                                </span>
                                                {factor.detail}
                                            </p>
                                        ))}
                                    </RecordSection>
                                ) : null}
                                <DealLineItems
                                    dealId={deal.id}
                                    items={
                                        deal.line_items ??
                                        associations?.line_items
                                    }
                                    products={products}
                                />
                                <DealQuotes
                                    dealId={deal.id}
                                    quotes={deal.quotes ?? []}
                                    products={products}
                                />
                                <DealSplits
                                    dealId={deal.id}
                                    members={members ?? []}
                                    splits={splits ?? []}
                                    canManage={Boolean(canManageSplits)}
                                />
                                <RecordSection title="Stage">
                                    <Form
                                        action={`/crm/deals/${deal.id}/move`}
                                        method="post"
                                        className="flex flex-wrap items-center gap-2"
                                    >
                                        <select
                                            name="stage_id"
                                            defaultValue={deal.stage?.id ?? ''}
                                            className="h-8 min-w-0 flex-1 rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                        >
                                            {stages.map((stage) => (
                                                <option
                                                    key={stage.id}
                                                    value={stage.id}
                                                >
                                                    {stage.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="outline"
                                            className="h-8 text-[12px]"
                                        >
                                            Move
                                        </Button>
                                    </Form>
                                </RecordSection>
                                <PlaybookCard playbooks={playbooks} />
                                {attributes ? (
                                    <RecordProperties
                                        action={`/crm/deals/${deal.id}/attributes`}
                                        attributes={attributes}
                                    />
                                ) : null}
                            </div>
                        }
                        center={
                            <RecordActivityPanel
                                timeline={timeline}
                                catchUp={catchUp}
                                dealNext={dealHealth?.next_action}
                            />
                        }
                        right={
                            <div className="space-y-3">
                                <AssociationCard
                                    title="Contact"
                                    addHref={
                                        contact
                                            ? `/crm/contacts/${contact.id}`
                                            : '/crm/contacts?create=1'
                                    }
                                    addLabel={contact ? 'View' : 'Add'}
                                >
                                    {contact ? (
                                        <RelatedRecordLink
                                            href={`/crm/contacts/${contact.id}`}
                                        >
                                            {contact.first_name}{' '}
                                            {contact.last_name}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">No contact</p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="Company"
                                    addHref={
                                        company
                                            ? `/crm/companies/${company.id}`
                                            : '/crm/companies?create=1'
                                    }
                                    addLabel={company ? 'View' : 'Add'}
                                >
                                    {company ? (
                                        <RelatedRecordLink
                                            href={`/crm/companies/${company.id}`}
                                        >
                                            {company.name}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">No company</p>
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

DealShow.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Deal', href: '#' },
    ],
};
