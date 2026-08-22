import { Form, Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SequenceShow({
    sequence,
    contacts,
}: {
    sequence: any;
    contacts: { id: number; first_name: string; last_name?: string | null }[];
}) {
    return (
        <>
            <Head title={sequence.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={sequence.name} description={`Channel: ${sequence.channel}`} />
                <Card className="space-y-2 p-4 text-sm">
                    {(sequence.steps ?? []).map((step: any) => (
                        <p key={step.id}>
                            Step {step.position} · +{step.delay_hours}h · {step.channel}
                            {step.wa_template_name ? ` · template ${step.wa_template_name}` : ''}
                            {step.subject ? ` · ${step.subject}` : ''}
                        </p>
                    ))}
                </Card>
                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Add step</h2>
                    <Form action={`/outbound/sequences/${sequence.id}/steps`} method="post" className="grid gap-3 md:grid-cols-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Delay (hours)</Label>
                                    <Input name="delay_hours" type="number" min={0} defaultValue={24} required />
                                </div>
                                <div>
                                    <Label>Channel</Label>
                                    <select name="channel" defaultValue={sequence.channel} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="email">Email</option>
                                        <option value="whatsapp_cloud">WhatsApp Cloud template</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Subject / template</Label>
                                    <Input name="subject" placeholder="Email subject" />
                                </div>
                                <div>
                                    <Label>Body</Label>
                                    <Input name="body" placeholder="Email body" />
                                </div>
                                <div>
                                    <Label>WA template name</Label>
                                    <Input name="wa_template_name" placeholder="hello_world" />
                                </div>
                                <div>
                                    <Label>WA language</Label>
                                    <Input name="wa_template_language" defaultValue="fr" />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Add step</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="p-4">
                    <h2 className="mb-3 font-medium">Enroll contact</h2>
                    <Form action={`/outbound/sequences/${sequence.id}/enroll`} method="post" className="flex flex-wrap gap-3">
                        {({ processing }) => (
                            <>
                                <select name="contact_id" className="h-9 min-w-56 rounded-md border bg-background px-2 text-sm" required>
                                    <option value="">Select contact</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name}
                                        </option>
                                    ))}
                                </select>
                                <Button disabled={processing}>Enroll</Button>
                            </>
                        )}
                    </Form>
                    <div className="mt-4 space-y-1 text-sm">
                        {(sequence.enrollments ?? []).map((enrollment: any) => (
                            <p key={enrollment.id}>
                                {enrollment.contact?.first_name} {enrollment.contact?.last_name} · {enrollment.status} ·
                                next step {enrollment.next_step}
                            </p>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    );
}

SequenceShow.layout = {
    breadcrumbs: [
        { title: 'Sequences', href: '/outbound/sequences' },
        { title: 'Sequence', href: '#' },
    ],
};
