import { Head, Link } from '@inertiajs/react';
import { WhatsAppBusinessMark, WhatsAppMark } from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Channel = {
    available: boolean;
    connected: boolean;
    message: string;
    display_phone?: string | null;
};

export default function EvolutionSettings({
    whatsapp,
    whatsapp_business,
    facebook_url = '/auth/meta?popup=1',
    last_webhook_at,
    last_event,
}: {
    whatsapp: Channel;
    whatsapp_business: Channel;
    facebook_url?: string;
    last_webhook_at: string | null;
    last_event: string | null;
}) {
    return (
        <>
            <Head title="WhatsApp" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">WhatsApp</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Continue with Facebook. Evolution connects WhatsApp and
                        WhatsApp Business automatically.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Card className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                            <WhatsAppMark className="size-5" />
                            <h2 className="text-sm font-semibold">WhatsApp</h2>
                            <Badge
                                variant={whatsapp.connected ? 'default' : 'secondary'}
                            >
                                {whatsapp.connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {whatsapp.message}
                        </p>
                        {whatsapp.connected ? (
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/settings/whatsapp">Manage</Link>
                            </Button>
                        ) : (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        )}
                    </Card>
                    <Card className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                            <WhatsAppBusinessMark className="size-5" />
                            <h2 className="text-sm font-semibold">
                                WhatsApp Business
                            </h2>
                            <Badge
                                variant={
                                    whatsapp_business.connected
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {whatsapp_business.connected
                                    ? 'Connected'
                                    : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {whatsapp_business.message}
                        </p>
                        {whatsapp_business.connected ? (
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/settings/whatsapp-business">
                                    Manage
                                </Link>
                            </Button>
                        ) : (
                            <BrandConnectButtons facebookUrl={facebook_url} />
                        )}
                    </Card>
                </div>

                <p className="text-xs text-muted-foreground">
                    Last inbox event: {last_event ?? '—'}
                    {last_webhook_at
                        ? ` · ${new Date(last_webhook_at).toLocaleString()}`
                        : ''}
                </p>
            </div>
        </>
    );
}

EvolutionSettings.layout = {
    breadcrumbs: [{ title: 'WhatsApp', href: '/settings/evolution' }],
};
