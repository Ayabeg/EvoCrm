import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, ExternalLink, Minus } from 'lucide-react';
import { useState } from 'react';
import { GoogleMark, MetaMark } from '@/components/brand/marks';
import { BrandConnectButtons } from '@/components/connectors/brand-connect';
import { SetupStepper } from '@/components/setup/stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AppUnlock } from '@/types';

type Step = {
    key: string;
    label: string;
    title: string;
};

type TroubleshootingLink = {
    label: string;
    href: string;
};

type MetaPage = { id: string; name: string };

type MetaState = {
    configured: boolean;
    connected: boolean;
    connected_at: string | null;
    account_name: string | null;
    pages: MetaPage[];
    selected_page_id: string | null;
    selected_page_name: string | null;
    unlocks: AppUnlock[];
};

type StartState = {
    google: {
        connected: boolean;
        configured: boolean;
        connect_url: string | null;
    };
    whatsapp: { connected: boolean; connect_url: string };
    sms: {
        connected: boolean;
        key_set: boolean;
        url: string | null;
        sender: string;
    };
};

type Props = {
    provider: string;
    providerName: string;
    tagline: string;
    steps: Step[];
    currentStep: string;
    stepIndex: number;
    troubleshooting: TroubleshootingLink[];
    connectUrl: string | null;
    appsUrl: string;
    metaState: MetaState | null;
    startState: StartState | null;
};

function stepHref(provider: string, step: string): string {
    return `/settings/setup/${provider}?step=${step}`;
}

function MetaFinishStep({
    metaState,
    appsUrl,
    provider,
}: {
    metaState: MetaState;
    appsUrl: string;
    provider: string;
}) {
    const [pageId, setPageId] = useState(
        metaState.selected_page_id ?? metaState.pages[0]?.id ?? '',
    );

    if (!metaState.connected) {
        return (
            <Card className="space-y-3 p-4">
                <p className="text-sm text-muted-foreground">
                    Meta is not connected yet. Go back to the Connect step and
                    use Continue with Facebook.
                </p>
                <Button asChild>
                    <Link href={stepHref(provider, 'connect')}>
                        Connect Facebook
                    </Link>
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">Installed</h3>
                    <Badge>Connected</Badge>
                    {metaState.account_name ? (
                        <span className="text-sm text-muted-foreground">
                            as {metaState.account_name}
                        </span>
                    ) : null}
                </div>

                <div className="grid gap-2">
                    {metaState.unlocks.map((unlock) => (
                        <div
                            key={unlock.key}
                            className="flex items-center gap-2 text-sm"
                        >
                            {unlock.granted ? (
                                <Check className="size-4 text-brand" />
                            ) : (
                                <Minus className="size-4 text-muted-foreground" />
                            )}
                            <span
                                className={
                                    unlock.granted
                                        ? ''
                                        : 'text-muted-foreground'
                                }
                            >
                                {unlock.label}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {metaState.pages.length > 0 ? (
                <Card className="space-y-3 p-4">
                    <h3 className="text-sm font-semibold">
                        Default Facebook Page
                    </h3>
                    <Form
                        action="/settings/setup/meta/page"
                        method="post"
                        className="flex flex-wrap items-end gap-2"
                    >
                        <label className="grid flex-1 gap-1 text-xs text-muted-foreground">
                            Page
                            <select
                                name="page_id"
                                value={pageId}
                                onChange={(event) =>
                                    setPageId(event.target.value)
                                }
                                className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
                            >
                                {metaState.pages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        {page.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button type="submit" size="sm">
                            Save page
                        </Button>
                    </Form>
                    {metaState.selected_page_name ? (
                        <p className="text-xs text-muted-foreground">
                            Current: {metaState.selected_page_name}
                        </p>
                    ) : null}
                </Card>
            ) : (
                <Card className="p-4 text-sm text-muted-foreground">
                    No Facebook Pages discovered on this grant. Reconnect with{' '}
                    <code className="font-mono">pages_show_list</code> scope.
                </Card>
            )}

            <div className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link href="/settings/apps/meta">Manage connection</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href={appsUrl}>Back to Apps</Link>
                </Button>
            </div>

            <Card className="p-4">
                <h3 className="text-sm font-semibold text-destructive">
                    Uninstall
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Disconnect Meta from this workspace. Tokens are deleted
                    locally; revoke the app in Meta if needed.
                </p>
                <Form
                    action="/settings/apps/meta"
                    method="delete"
                    className="mt-3"
                    onBefore={() =>
                        window.confirm(
                            'Disconnect Meta from this workspace?',
                        )
                    }
                >
                    {({ processing }) => (
                        <Button
                            variant="outline"
                            className="text-destructive"
                            disabled={processing}
                        >
                            Disconnect Meta
                        </Button>
                    )}
                </Form>
            </Card>
        </div>
    );
}

function StepBody({
    provider,
    currentStep,
    connectUrl,
    appsUrl,
    metaState,
    startState,
}: {
    provider: string;
    currentStep: string;
    connectUrl: string | null;
    appsUrl: string;
    metaState: MetaState | null;
    startState: StartState | null;
}) {
    if (provider === 'meta' && currentStep === 'select_app') {
        return (
            <div className="space-y-4">
                <Card className="flex items-start gap-4 p-4">
                    <div className="grid size-12 place-content-center rounded-xl border bg-background">
                        <MetaMark className="size-7" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Meta</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            One OAuth unlocks Facebook Page messaging,
                            Instagram, WhatsApp Cloud API, and Ads insights for
                            EvoSales.
                        </p>
                        <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                            <li>Official Facebook Login — no unofficial paths</li>
                            <li>Tokens stored encrypted on your workspace</li>
                            <li>Scopes granted individually during consent</li>
                        </ul>
                    </div>
                </Card>
                <div className="flex justify-end">
                    <Button asChild>
                        <Link href={stepHref(provider, 'connect')}>
                            Continue
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (provider === 'meta' && currentStep === 'connect') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    {metaState?.connected ? (
                        <>
                            <div className="flex items-center gap-2">
                                <Badge>Already connected</Badge>
                                {metaState.account_name ? (
                                    <span className="text-sm text-muted-foreground">
                                        {metaState.account_name}
                                    </span>
                                ) : null}
                            </div>
                            <Button asChild>
                                <Link href={stepHref(provider, 'finish')}>
                                    Continue to finish
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Log in with Facebook. You do not need an App ID
                                or token.
                            </p>
                            <BrandConnectButtons facebookUrl={connectUrl} />
                        </>
                    )}
                </Card>
                <div className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href={stepHref(provider, 'select_app')}>Back</Link>
                    </Button>
                    {!metaState?.connected ? (
                        <Button variant="outline" asChild>
                            <Link href={stepHref(provider, 'finish')}>
                                Skip to finish
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    if (provider === 'meta' && currentStep === 'finish' && metaState) {
        return (
            <div className="space-y-4">
                <MetaFinishStep
                    metaState={metaState}
                    appsUrl={appsUrl}
                    provider={provider}
                />
                <div className="flex justify-start">
                    <Button variant="outline" asChild>
                        <Link href={stepHref(provider, 'connect')}>Back</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (provider === 'start' && startState) {
        return (
            <StartStepBody
                currentStep={currentStep}
                startState={startState}
                appsUrl={appsUrl}
            />
        );
    }

    return (
        <Card className="p-4 text-sm text-muted-foreground">
            Step content for {provider} / {currentStep} is not configured yet.
        </Card>
    );
}

function StatusRow({
    ok,
    label,
}: {
    ok: boolean;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {ok ? (
                <Check className="size-4 text-brand" />
            ) : (
                <Minus className="size-4 text-muted-foreground" />
            )}
            <span className={ok ? '' : 'text-muted-foreground'}>{label}</span>
        </div>
    );
}

function StartStepBody({
    currentStep,
    startState,
    appsUrl,
}: {
    currentStep: string;
    startState: StartState;
    appsUrl: string;
}) {
    if (currentStep === 'google') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    <div className="flex items-start gap-4">
                        <div className="grid size-12 place-content-center rounded-xl border bg-background">
                            <GoogleMark className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">
                                Google Calendar
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Public booking writes the slot onto the host
                                calendar. Same Google OAuth client as sign-in —
                                extra Calendar scopes only.
                            </p>
                        </div>
                    </div>
                    {startState.google.connected ? (
                        <Badge>Already connected</Badge>
                    ) : startState.google.connect_url ? (
                        <Button asChild>
                            <a href={startState.google.connect_url}>
                                Continue with Google
                            </a>
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Google is not configured on this install yet. Skip
                            and connect later from Connectors.
                        </p>
                    )}
                </Card>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                        <Link href={stepHref('start', 'whatsapp')}>Skip</Link>
                    </Button>
                    {startState.google.connected ? (
                        <Button asChild>
                            <Link href={stepHref('start', 'whatsapp')}>
                                Continue
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    if (currentStep === 'whatsapp') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    <p className="text-sm text-muted-foreground">
                        Continue with Facebook. WhatsApp Business connects on
                        the same grant — no App ID or phone-number ID to type.
                    </p>
                    {startState.whatsapp.connected ? (
                        <Badge>Already connected</Badge>
                    ) : (
                        <BrandConnectButtons
                            facebookUrl={startState.whatsapp.connect_url}
                        />
                    )}
                </Card>
                <div className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href={stepHref('start', 'google')}>Back</Link>
                    </Button>
                    <Button
                        variant={
                            startState.whatsapp.connected ? 'default' : 'outline'
                        }
                        asChild
                    >
                        <Link href={stepHref('start', 'sms')}>
                            {startState.whatsapp.connected
                                ? 'Continue'
                                : 'Skip'}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (currentStep === 'sms') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    <p className="text-sm text-muted-foreground">
                        Local HTTP aggregator. Sends only to Algerian mobiles
                        (+213 05 / 06 / 07). The key is stored encrypted and
                        never shown again.
                    </p>
                    {startState.sms.connected ? (
                        <Badge>Gateway saved</Badge>
                    ) : null}
                    <Form
                        action="/settings/sms"
                        method="post"
                        className="grid gap-3"
                    >
                        {({ processing }) => (
                            <>
                                <input type="hidden" name="return" value="start" />
                                <input type="hidden" name="driver" value="http" />
                                <input type="hidden" name="method" value="POST" />
                                <input type="hidden" name="auth" value="form" />
                                <div>
                                    <Label htmlFor="sms-url">Gateway URL</Label>
                                    <Input
                                        id="sms-url"
                                        name="url"
                                        defaultValue={startState.sms.url ?? ''}
                                        placeholder="https://sms.example.dz/api/send"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sms-key">API key</Label>
                                    <Input
                                        id="sms-key"
                                        name="api_key"
                                        type="password"
                                        autoComplete="off"
                                        placeholder={
                                            startState.sms.key_set
                                                ? 'Saved — paste to replace'
                                                : 'Aggregator token'
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sms-sender">Sender</Label>
                                    <Input
                                        id="sms-sender"
                                        name="sender"
                                        defaultValue={startState.sms.sender}
                                        maxLength={11}
                                    />
                                </div>
                                <Button type="submit" disabled={processing}>
                                    Save SMS key
                                </Button>
                            </>
                        )}
                    </Form>
                </Card>
                <div className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href={stepHref('start', 'whatsapp')}>Back</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={stepHref('start', 'finish')}>Skip</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="space-y-3 p-4">
                <StatusRow
                    ok={startState.google.connected}
                    label="Google Calendar"
                />
                <StatusRow
                    ok={startState.whatsapp.connected}
                    label="WhatsApp"
                />
                <StatusRow ok={startState.sms.connected} label="Algeria SMS" />
            </Card>
            <div className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link href="/dashboard">Go to Home</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href={appsUrl}>Apps</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href={stepHref('start', 'sms')}>Back</Link>
                </Button>
            </div>
        </div>
    );
}

export default function OAuthSetupWizard({
    provider,
    providerName,
    tagline,
    steps,
    currentStep,
    stepIndex,
    troubleshooting,
    connectUrl,
    appsUrl,
    metaState,
    startState,
}: Props) {
    const active = steps[stepIndex] ?? steps[0];

    return (
        <>
            <Head title={`Setup ${providerName}`} />
            <div className="space-y-6">
                <div>
                    <Link
                        href={appsUrl}
                        className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-3" />
                        Apps
                    </Link>
                    <h1 className="text-xl font-semibold">
                        Connect {providerName}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {tagline}
                    </p>
                </div>

                <SetupStepper steps={steps} currentIndex={stepIndex} />

                <section aria-labelledby="setup-step-title">
                    <h2
                        id="setup-step-title"
                        className="mb-3 text-sm font-medium text-ink"
                    >
                        {active?.title}
                    </h2>
                    <StepBody
                        provider={provider}
                        currentStep={currentStep}
                        connectUrl={connectUrl}
                        appsUrl={appsUrl}
                        metaState={metaState}
                        startState={startState}
                    />
                </section>

                {troubleshooting.length > 0 ? (
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold">
                            Troubleshooting
                        </h3>
                        <ul className="mt-2 space-y-2">
                            {troubleshooting.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                                    >
                                        {link.label}
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Card>
                ) : null}
            </div>
        </>
    );
}

OAuthSetupWizard.layout = {
    breadcrumbs: [
        { title: 'Apps', href: '/settings/apps' },
        { title: 'Setup', href: '/settings/setup' },
    ],
};
