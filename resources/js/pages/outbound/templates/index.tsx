import { Form, Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TemplatesIndex({
    contacts,
    note,
}: {
    contacts: any[];
    note: string;
}) {
    return (
        <>
            <Head title="WhatsApp templates" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title="Official WhatsApp Cloud templates" description={note} />
                <Card className="p-4">
                    <Form action="/outbound/templates/send" method="post" className="grid gap-3 md:grid-cols-4">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Contact</Label>
                                    <select name="contact_id" className="h-9 w-full rounded-md border bg-background px-2 text-sm" required>
                                        <option value="">Select</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.first_name} {contact.phone_e164}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Template name</Label>
                                    <Input name="wa_template_name" placeholder="hello_world" required />
                                </div>
                                <div>
                                    <Label>Language</Label>
                                    <Input name="wa_template_language" defaultValue="fr" />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Send via Evolution Cloud</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
            </div>
        </>
    );
}

TemplatesIndex.layout = {
    breadcrumbs: [{ title: 'Templates', href: '/outbound/templates' }],
};
