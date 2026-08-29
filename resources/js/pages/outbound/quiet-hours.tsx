import { Form } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function QuietHoursEdit({
    quietHours,
}: {
    quietHours: { starts_at: string; ends_at: string; timezone: string; enabled: boolean };
}) {
    return (
        <OutboundShell title="Quiet hours">
            <OutboundPage
                title="Quiet hours"
                description="Automated outbound is blocked in this window. Default 21:00–08:00 Africa/Algiers."
            >
                <section className="border-t border-hairline pt-3">
                    <Form action="/outbound/quiet-hours" method="post" className="grid gap-3 md:grid-cols-2">
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Starts at</Label>
                                    <Input name="starts_at" defaultValue={quietHours.starts_at} required />
                                </div>
                                <div>
                                    <Label>Ends at</Label>
                                    <Input name="ends_at" defaultValue={quietHours.ends_at} required />
                                </div>
                                <div>
                                    <Label>Timezone</Label>
                                    <Input name="timezone" defaultValue={quietHours.timezone} required />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="hidden" name="enabled" value="0" />
                                    <input
                                        id="enabled"
                                        type="checkbox"
                                        name="enabled"
                                        value="1"
                                        defaultChecked={quietHours.enabled}
                                    />
                                    <Label htmlFor="enabled">Enabled</Label>
                                </div>
                                <div>
                                    <Button disabled={processing}>Save quiet hours</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}

QuietHoursEdit.layout = {
    breadcrumbs: [{ title: 'Quiet hours', href: '/outbound/quiet-hours' }],
};
