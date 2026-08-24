import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Facebook } from 'lucide-react';
import { SetupStepper } from '@/components/setup/stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Step = {
    key: string;
    label: string;
    title: string;
};

type TroubleshootingLink = {
    label: string;
    href: string;
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
};

function stepHref(provider: string, step: string): string {
    return `/settings/setup/${provider}?step=${step}`;
}

function StepBody({
    provider,
    currentStep,
    connectUrl,
    appsUrl,
}: {
    provider: string;
    currentStep: string;
    connectUrl: string | null;
    appsUrl: string;
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
                            One OAuth unlocks Facebook Page messaging, Instagram,
                            WhatsApp Cloud API, and Ads insights for EvoSales.
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
                        <Link href={stepHref(provider, 'connect')}>Continue</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (provider === 'meta' && currentStep === 'connect') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    <p className="text-sm text-muted-foreground">
                        Sign in with the Facebook account that manages your Page,
                        WhatsApp Business account, and ad accounts.
                    </p>
                    {connectUrl ? (
                        <Button asChild className="w-full sm:w-auto">
                            <a href={connectUrl}>Continue with Facebook</a>
                        </Button>
                    ) : (
                        <Button disabled className="w-full sm:w-auto">
                            Continue with Facebook
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Requires <code className="font-mono">META_APP_ID</code> and{' '}
                        <code className="font-mono">META_APP_SECRET</code> in your
                        environment. Add the redirect URI from Settings → Apps.
                    </p>
                </Card>
                <div className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href={stepHref(provider, 'select_app')}>Back</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={stepHref(provider, 'finish')}>Skip to finish</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (provider === 'meta' && currentStep === 'finish') {
        return (
            <div className="space-y-4">
                <Card className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Finish setup</h3>
                        <Badge variant="secondary">Almost there</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        After OAuth completes you land here to confirm Pages,
                        WhatsApp, and Ads unlocks. Manage the connection anytime
                        from Apps.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href="/settings/apps/meta">Open Meta app</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={appsUrl}>Back to Apps</Link>
                        </Button>
                    </div>
                </Card>
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
                    />
                </section>

                {troubleshooting.length > 0 ? (
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold">Troubleshooting</h3>
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
