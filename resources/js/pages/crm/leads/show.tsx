import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LeadShow({ lead }: { lead: any }) {
    return (
        <>
            <Head title={lead.title} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={lead.title} description={`Status: ${lead.status}`}>
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
