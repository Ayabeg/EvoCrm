import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, ExternalLink, Facebook, Minus } from 'lucide-react';
import { useState } from 'react';
import { SetupStepper } from '@/components/setup/stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    callback_url: string;
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
}: {
    provider: string;
    currentStep: string;
    connectUrl: string | null;
    appsUrl: string;
    metaState: MetaState | null;
}) {
    if (provider === 'meta' && currentStep === 'select_app') {
        return (
            <div className="space-y-4">
                <Card className="flex items-start gap-4 p-4">
                    <div className="grid size-12 place-content-center rounded-xl border bg-background">
                        <Facebook className="size-6" />
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
                                Sign in with the Facebook account that manages
                                your Page, WhatsApp Business account, and ad
                                accounts.
                            </p>
                            {connectUrl ? (
                                <Button asChild className="w-full sm:w-auto">
                                    <a href={connectUrl}>
                                        Continue with Facebook
                                    </a>
                                </Button>
                            ) : (
                                <Button disabled className="w-full sm:w-auto">
                                    Continue with Facebook
                                </Button>
                            )}
                            {metaState?.callback_url ? (
                                <p className="text-xs text-muted-foreground">
                                    Redirect URI:{' '}
                                    <code className="break-all font-mono">
                                        {metaState.callback_url}
                                    </code>
                                </p>
                            ) : null}
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

    return (
        <Card className="p-4 text-sm text-muted-foreground">
            Step content for {provider} / {currentStep} is not configured yet.
        </Card>
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
        { title: 'Setup', href: '/settings/setup/meta' },
    ],
};
