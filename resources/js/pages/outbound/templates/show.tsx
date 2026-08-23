import { Form, Head, router } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Template = {
    id: number;
    name: string;
    subject?: string | null;
    body: string;
    body_html?: string | null;
};

export default function TemplateShow({
    template,
    preview,
}: {
    template: Template;
    preview: { contact: string; subject?: string | null; html: string };
}) {
    return (
        <>
            <Head title={template.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={template.name}
                    description="Edit the template and check the rendered preview. Variables: {{first_name}} {{last_name}} {{name}} {{email}} {{phone}} {{company}} {{city}} {{wilaya}} {{unsub}}."
                >
                    <Button
                        variant="ghost"
                        className="text-brand"
                        onClick={() => {
                            if (
                                window.confirm(
                                    `Delete template ${template.name}?`,
                                )
                            ) {
                                router.delete(
                                    `/outbound/templates/${template.id}`,
                                );
                            }
                        }}
                    >
                        Delete
                    </Button>
                </PageHeader>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="p-4">
                        <h2 className="mb-3 font-medium">Edit template</h2>
                        <Form
                            action={`/outbound/templates/${template.id}`}
                            method="put"
                            className="grid gap-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            name="name"
                                            required
                                            defaultValue={template.name}
                                        />
                                    </div>
                                    <div>
                                        <Label>Subject</Label>
                                        <Input
                                            name="subject"
                                            defaultValue={
                                                template.subject ?? ''
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Body (text)</Label>
                                        <textarea
                                            name="body"
                                            rows={8}
                                            required
                                            defaultValue={template.body}
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label>
                                            Body (HTML, optional — sent as the
                                            HTML part)
                                        </Label>
                                        <textarea
                                            name="body_html"
                                            rows={6}
                                            defaultValue={
                                                template.body_html ?? ''
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
                    </Card>

                    <Card className="p-4">
                        <h2 className="mb-1 font-medium">Preview</h2>
                        <p className="mb-3 text-xs text-muted-foreground">
                            Rendered for {preview.contact}. The unsubscribe link
                            points at this CRM host; tracking is off in preview.
                        </p>
                        <p className="mb-2 text-sm">
                            <span className="text-muted-foreground">
                                Subject:
                            </span>{' '}
                            {preview.subject ?? '—'}
                        </p>
                        <div
                            className="rounded-md border border-hairline bg-canvas p-4 text-sm [&_a]:text-brand"
                            dangerouslySetInnerHTML={{ __html: preview.html }}
                        />
                    </Card>
                </div>
            </div>
        </>
    );
}

TemplateShow.layout = {
    breadcrumbs: [
        { title: 'Templates', href: '/outbound/templates' },
        { title: 'Template', href: '#' },
    ],
};
