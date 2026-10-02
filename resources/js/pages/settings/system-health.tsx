import { Head } from '@inertiajs/react';
import {
    CheckCircle,
    Clock,
    Pulse,
    WarningCircle,
    XCircle,
} from '@phosphor-icons/react';
import { Badge } from '@/evo/ui/badge';
import { Card } from '@/evo/ui/card';
import { SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type CommandHealth = {
    command: string;
    label: string;
    cadence: string;
    state: 'never' | 'running' | 'success' | 'failed' | 'stale';
    last_started_at: string | null;
    last_success_at: string | null;
    last_failure_at: string | null;
    duration_ms: number | null;
    error_type: string | null;
};

type IntegrationHealth = {
    key: string;
    label: string;
    state: string;
    detail: string;
    last_activity_at: string | null;
};

const stateLabels: Record<CommandHealth['state'], string> = {
    never: 'Never run',
    running: 'Running',
    success: 'Healthy',
    failed: 'Failed',
    stale: 'Stale',
};

function timestamp(value: string | null): string {
    if (!value) {
        return 'Not recorded';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function StateBadge({ state }: { state: CommandHealth['state'] }) {
    const Icon =
        state === 'success'
            ? CheckCircle
            : state === 'failed'
              ? XCircle
              : state === 'running'
                ? Pulse
                : state === 'stale'
                  ? WarningCircle
                  : Clock;

    return (
        <Badge
            variant={
                state === 'failed' || state === 'stale'
                    ? 'destructive'
                    : 'secondary'
            }
        >
            <Icon aria-hidden="true" className="me-1 size-3" />
            {stateLabels[state]}
        </Badge>
    );
}

export default function SystemHealthSettings({
    commands,
    integrations,
}: {
    commands: CommandHealth[];
    integrations: IntegrationHealth[];
}) {
    return (
        <>
            <Head title={t('System health')} />
            <div className="space-y-4">
                <SettingsPageHeader
                    title="System health"
                    description="Scheduler freshness and workspace integration state. Credentials are never shown."
                />

                <section
                    aria-labelledby="scheduled-commands-heading"
                    className="space-y-3"
                >
                    <div>
                        <h2
                            id="scheduled-commands-heading"
                            className="text-sm font-semibold"
                        >
                            Scheduled commands
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Stale means the expected execution window passed
                            without a newer run.
                        </p>
                    </div>

                    <Card className="overflow-x-auto border-hairline p-0 shadow-none">
                        <table className="w-full min-w-[760px] text-start text-[13px]">
                            <thead className="bg-canvas-soft text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Process
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        State
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Last success
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Last failure
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {commands.map((command) => (
                                    <tr
                                        key={command.command}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium">
                                                {command.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {command.cadence}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StateBadge state={command.state} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {timestamp(command.last_success_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p>
                                                {timestamp(
                                                    command.last_failure_at,
                                                )}
                                            </p>
                                            {command.error_type ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {command.error_type}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3">
                                            {command.duration_ms === null
                                                ? 'Not recorded'
                                                : `${command.duration_ms} ms`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </section>

                <section
                    aria-labelledby="integrations-heading"
                    className="space-y-3"
                >
                    <div>
                        <h2
                            id="integrations-heading"
                            className="text-sm font-semibold"
                        >
                            Integrations
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Configuration and last known workspace activity
                            only.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {integrations.map((integration) => (
                            <Card
                                key={integration.key}
                                className="space-y-2 p-4 shadow-none"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold">
                                        {integration.label}
                                    </h3>
                                    <Badge variant="secondary">
                                        {integration.state.replaceAll('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {integration.detail}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Last activity:{' '}
                                    {timestamp(integration.last_activity_at)}
                                </p>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

SystemHealthSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings/profile' },
        { title: 'System health', href: '/settings/system-health' },
    ],
};
