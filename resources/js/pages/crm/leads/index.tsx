import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import {
    CrmObjectHeader,
    CrmObjectSecondaryLink,
} from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import LeadScorePill from '@/components/crm/lead-score-pill';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Lead = {
    id: number;
    title: string;
    status?: string | null;
    score?: number | null;
    contact?: { first_name?: string; last_name?: string | null } | null;
    latest_score?: { score: number; reason?: string | null } | null;
};

type ContactOption = {
    id: number;
    first_name: string;
    last_name?: string | null;
};

export default function LeadsIndex({
    leads,
    contacts,
}: {
    leads: Lead[];
    contacts: ContactOption[];
}) {
    const [drawer, setDrawer] = useState(false);

    return (
        <CrmShell title="Leads" chrome="workspace">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink"
                data-crm="list-workspace"
            >
                <CrmObjectHeader
                    title="Leads"
                    description={`${leads.length.toLocaleString()} leads`}
                    primaryLabel="Create lead"
                    onPrimary={() => setDrawer(true)}
                    secondary={
                        <CrmObjectSecondaryLink href="/crm/leads/captures">
                            Capture inbox
                        </CrmObjectSecondaryLink>
                    }
                />
                <div className="flex min-h-0 flex-1 flex-col bg-canvas">
                    {leads.length === 0 ? (
                        <CrmEmptyState
                            title="No leads yet"
                            line="Create a lead from an existing contact to work inbound records here."
                            actionLabel="Create lead"
                            onAction={() => setDrawer(true)}
                        />
                    ) : (
                        <div className="min-h-0 flex-1 overflow-auto">
                            <table className="w-full min-w-[480px] border-collapse text-[13px]">
                                <thead>
                                    <tr className="border-b border-hairline bg-canvas-soft text-left">
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:px-6">
                                            Title
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                            Contact
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                            Status
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:pr-6">
                                            Score
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            className="cursor-pointer border-b border-hairline hover:bg-canvas-soft"
                                            onClick={(event) => {
                                                if ((event.target as HTMLElement).closest('a,button,input')) {
                                                    return;
                                                }
                                                router.visit(`/crm/leads/${lead.id}`);
                                            }}
                                        >
                                            <td className="px-4 py-1.5 sm:px-6">
                                                <Link
                                                    href={`/crm/leads/${lead.id}`}
                                                    className="font-medium text-ink hover:underline"
                                                >
                                                    {lead.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-1.5 text-mute">
                                                {[
                                                    lead.contact?.first_name,
                                                    lead.contact?.last_name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') || '—'}
                                            </td>
                                            <td className="px-4 py-1.5 text-mute capitalize">
                                                {lead.status ?? '—'}
                                            </td>
                                            <td className="px-4 py-1.5 sm:pr-6">
                                                <LeadScorePill
                                                    compact
                                                    score={
                                                        lead.latest_score
                                                            ? {
                                                                  score:
                                                                      lead.score ??
                                                                      lead.latest_score.score,
                                                                  reason: lead.latest_score.reason,
                                                              }
                                                            : null
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <CrmListFooter count={leads.length} noun="leads" />
                </div>
            </div>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create lead"
            >
                <Form
                    action="/crm/leads"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Title <span className="text-brand">*</span>
                                </Label>
                                <Input name="title" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Contact <span className="text-brand">*</span>
                                </Label>
                                <select
                                    name="contact_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    required
                                >
                                    <option value="">Select</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Source</Label>
                                <Input name="source" placeholder="manual" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>
                                    Cancel
                                </Button>
                                <Button disabled={processing}>Create</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </CrmShell>
    );
}

LeadsIndex.layout = {
    breadcrumbs: [{ title: 'Leads', href: '/crm/leads' }],
};
