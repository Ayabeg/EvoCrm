import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LeadShow({ lead, associations, deskUrl }: { lead: any; associations?: any; deskUrl?: string }) {
    return (
        <>
            <Head title={lead.title} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={lead.title} description={`Status: ${lead.status}`}>
                    {deskUrl ? (
                        <a href={deskUrl} className="rounded bg-teal-700 px-3 py-1 text-sm text-white">Open in Desk</a>
                    ) : null}
                    {lead.status !== 'qualified' ? (
                        <Form action={`/crm/leads/${lead.id}/qualify`} method="post">
                            {({ processing }) => (
                                <Button disabled={processing}>Qualify</Button>
                            )}
                        </Form>
                    ) : null}
                </PageHeader>
                <Card className="space-y-2 p-4 text-sm">
                    <p>
                        Contact:{' '}
                        <Link href={`/crm/contacts/${lead.contact_id}`} className="text-teal-700 dark:text-teal-300">
                            {lead.contact?.first_name} {lead.contact?.last_name}
                        </Link>
                    </p>
                    <p>Source: {lead.source ?? '—'}</p>
                    <p>Qualified at: {lead.qualified_at ?? '—'}</p>
                </Card>
                <Card className="p-4">
                    <Form action={`/crm/leads/${lead.id}`} method="put" className="grid gap-3 md:grid-cols-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <input
                                        name="title"
                                        defaultValue={lead.title}
                                        required
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Source</label>
                                    <input
                                        name="source"
                                        defaultValue={lead.source ?? ''}
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save lead</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="space-y-2 p-4 text-sm">
                    <h2 className="font-medium">Associations</h2>
                    {associations?.contact ? (
                        <Link href={`/crm/contacts/${associations.contact.id}`} className="block text-teal-700">
                            Contact · {associations.contact.first_name} {associations.contact.last_name}
                        </Link>
                    ) : null}
                    {associations?.company ? (
                        <Link href={`/crm/companies/${associations.company.id}`} className="block text-teal-700">
                            Company · {associations.company.name}
                        </Link>
                    ) : null}
                    {associations?.deal ? (
                        <Link href={`/crm/deals/${associations.deal.id}`} className="block text-teal-700">
                            Deal · {associations.deal.title}
                        </Link>
                    ) : null}
                    {(associations?.threads ?? []).map((thread: any) => (
                        <Link key={thread.id} href={`/conversations?thread=${thread.id}`} className="block text-teal-700">
                            Desk history · {thread.subject ?? thread.id}
                        </Link>
                    ))}
                    {(associations?.enrollments ?? []).map((enrollment: any) => (
                        <p key={enrollment.id}>Enrollment · {enrollment.sequence?.name ?? enrollment.id}</p>
                    ))}
                </Card>
            </div>
        </>
    );
}

LeadShow.layout = {
    breadcrumbs: [
        { title: 'Leads', href: '/crm/leads' },
        { title: 'Lead', href: '#' },
    ],
};
