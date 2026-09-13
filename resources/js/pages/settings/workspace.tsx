import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function WorkspaceSettings({
    simple_mode,
}: {
    simple_mode: boolean;
}) {
    return (
        <>
            <Head title="Workspace" />
            <div className="space-y-4">
                <Heading
                    title="Workspace"
                    description="Simple mode is the sellable launch surface. Turn it off to bring back tickets, ads, warmup, Ask Evo, and report builder."
                />
                <Form
                    action="/settings/workspace"
                    method="put"
                    className="space-y-3 border-t border-hairline pt-3"
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label htmlFor="simple_mode">Simple mode</Label>
                                <select
                                    id="simple_mode"
                                    name="simple_mode"
                                    defaultValue={simple_mode ? '1' : '0'}
                                    className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                >
                                    <option value="1">
                                        On — Home, Contacts, Deals, Inbox, Quotes
                                    </option>
                                    <option value="0">Off — full product</option>
                                </select>
                            </div>
                            <Button type="submit" size="sm" disabled={processing}>
                                Save
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

WorkspaceSettings.layout = {
    breadcrumbs: [{ title: 'Workspace', href: '/settings/workspace' }],
};
