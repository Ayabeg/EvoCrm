import { Form, Link } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TemplateRow = {
    id: number;
    name: string;
    subject?: string | null;
    body: string;
    body_html?: string | null;
    created_at: string;
};

export default function TemplatesIndex({
    templates,
    contacts,
    note,
}: {
    templates: TemplateRow[];
    contacts: any[];
    note: string;
}) {
    return (
        <OutboundShell title="Templates">
            <OutboundPage
                title="Email templates"
                description="Reusable subject + text/HTML body with {{first_name}}, {{last_name}}, {{name}}, {{email}}, {{phone}}, {{company}}, {{city}}, {{wilaya}}, {{unsub}}. Sequence steps and campaigns prefill from these. The unsubscribe link always points at this CRM host."
            >
                <section className="border-t border-hairline pt-3">
                    <h2 className="mb-3 font-medium">New template</h2>
                    <Form
                        action="/outbound/templates"
                        method="post"
                        className="grid gap-3"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            name="name"
                                            required
                                            placeholder="Clinic intro — FR"
                                        />
                                    </div>
                                    <div>
                                        <Label>Subject</Label>
                                        <Input
                                            name="subject"
                                            placeholder="EvoSales pour {{company}}"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Body (text)</Label>
                                    <textarea
                                        name="body"
                                        rows={5}
                                        required
                                        placeholder={
                                            'Bonjour {{first_name}},\n\n…\n\nSe désabonner : {{unsub}}'
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label>Body (HTML, optional)</Label>
                                    <textarea
                                        name="body_html"
                                        rows={4}
                                        placeholder={
                                            '<p>Bonjour {{first_name}},</p><p>…</p>'
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                                    />
                                </div>
                                <div>
                                    <Button disabled={processing}>
                                        Save template
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                <div className="grid gap-3 border-t border-hairline pt-3 lg:grid-cols-2">
                    {templates.length === 0 ? (
                        <p className="py-4 text-[13px] text-muted-foreground">
                            No templates yet.
                        </p>
                    ) : null}
                    {templates.map((template) => (
                        <article
                            key={template.id}
                            className="space-y-2 border-t border-hairline pt-3 text-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="font-medium">
                                    {template.name}
                                    {template.body_html ? (
                                        <Badge
                                            variant="secondary"
                                            className="ms-2"
                                        >
                                            HTML
                                        </Badge>
                                    ) : null}
                                </p>
                                <Link
                                    href={`/outbound/templates/${template.id}`}
                                >
                                    <Button variant="outline" size="sm">
                                        Edit & preview
                                    </Button>
                                </Link>
                            </div>
                            <p className="text-muted-foreground">
                                Subject: {template.subject ?? '—'}
                            </p>
                            <p className="rounded-md bg-canvas-soft p-3 whitespace-pre-wrap text-muted-foreground">
                                {template.body}
                            </p>
                        </article>
                    ))}
                </div>

                <section className="border-t border-hairline pt-3">
                    <h2 className="mb-1 font-medium">
                        Official WhatsApp Cloud template send
                    </h2>
                    <p className="mb-3 text-sm text-muted-foreground">{note}</p>
                    <Form
                        action="/outbound/templates/send"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                    >
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Contact</Label>
                                    <select
                                        name="contact_id"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        required
                                    >
                                        <option value="">Select</option>
                                        {contacts.map((contact) => (
                                            <option
                                                key={contact.id}
                                                value={contact.id}
                                            >
                                                {contact.first_name}{' '}
                                                {contact.phone_e164}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Template name</Label>
                                    <Input
                                        name="wa_template_name"
                                        placeholder="hello_world"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Language</Label>
                                    <Input
                                        name="wa_template_language"
                                        defaultValue="fr"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>
                                        Send via Evolution Cloud
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}

TemplatesIndex.layout = {
    breadcrumbs: [{ title: 'Templates', href: '/outbound/templates' }],
};
