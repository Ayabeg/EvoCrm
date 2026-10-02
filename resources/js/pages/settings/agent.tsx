import { Head } from '@inertiajs/react';
import { StarFour } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    SettingsCard,
    SettingsEmptyState,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type AgentStatus = 'disabled' | 'not_configured' | 'unhealthy' | 'ready';

type Onboarding = {
    status: AgentStatus;
    env_enabled: boolean;
    workspace_enabled: boolean;
    configured: boolean;
    url: string;
    token_set: boolean;
    health: { ok: boolean; status: string; message: string } | null;
    llm_note: string;
};

type Plugin = {
    id: string;
    name: string;
    description: string;
    permission: 'read' | 'prepare' | 'execute';
    requires: string[];
    enabled: boolean;
    available: boolean;
};

type Connector = {
    id: string;
    name: string;
    description: string;
    wired: boolean;
    enabled: boolean;
    connected: boolean;
    status: string;
    url: string | null;
    token_set: boolean;
};

const STATUS_LABEL: Record<AgentStatus, string> = {
    disabled: 'Disabled',
    not_configured: 'Not configured',
    unhealthy: 'Unhealthy',
    ready: 'Ready',
};

function statusVariant(status: AgentStatus): 'default' | 'secondary' | 'destructive' {
    if (status === 'ready') {
        return 'default';
    }

    if (status === 'unhealthy') {
        return 'destructive';
    }

    return 'secondary';
}

export default function AgentSettings({
    onboarding,
    plugins,
    connectors,
}: {
    onboarding: Onboarding;
    plugins: Plugin[];
    connectors: Connector[];
}) {
    return (
        <>
            <Head title={t('Agent')} />

            <SettingsPageHeader
                title="Agent"
                description="Optional workspace assistant. Ask Evo and Command OS keep working when this is off."
            />

            <div className="grid gap-3">
                {onboarding.status === 'disabled' ? (
                    <SettingsEmptyState
                        icon={<StarFour className="size-6" weight="regular" />}
                        title="Agent is off"
                        description={
                            onboarding.env_enabled
                                ? 'Turn it on below when you want this workspace to use the private agent runtime. CRM stays fully usable while it is off.'
                                : 'The host has OPENMANUS_ENABLED=false. The run API stays closed until an operator enables the service. CRM is unaffected.'
                        }
                    />
                ) : (
                    <SettingsCard title="Runtime status">
                        <div className="flex flex-wrap items-center gap-2 text-[13px]">
                            <Badge variant={statusVariant(onboarding.status)}>
                                {STATUS_LABEL[onboarding.status]}
                            </Badge>
                            <span className="text-mute">
                                {onboarding.health?.message ??
                                    'Save the runtime URL and shared token, then run a health check.'}
                            </span>
                        </div>
                    </SettingsCard>
                )}

                <SettingsForm action="/settings/agent" method="put">
                    {({ processing }) => (
                        <SettingsCard
                            title="Onboarding"
                            description="Workspace admins enable the runtime and point EvoCRM at a private service URL."
                            required
                            footer={
                                <SettingsSaveBar
                                    processing={processing}
                                    saveLabel="Save agent settings"
                                    saveTestId="save-agent-settings"
                                />
                            }
                        >
                            <SettingsFormRow
                                label="Enable"
                                htmlFor="workspace_enabled"
                                hint="Workspace-admin only. The host flag OPENMANUS_ENABLED must also be true for the run API."
                            >
                                <select
                                    id="workspace_enabled"
                                    name="workspace_enabled"
                                    defaultValue={onboarding.workspace_enabled ? '1' : '0'}
                                    className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px] text-ink"
                                >
                                    <option value="0">Off</option>
                                    <option value="1">On</option>
                                </select>
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Service URL"
                                htmlFor="agent-url"
                                hint="Private-network URL only. Do not expose the runtime to the public internet."
                            >
                                <Input
                                    id="agent-url"
                                    name="url"
                                    type="url"
                                    defaultValue={onboarding.url}
                                    placeholder="http://127.0.0.1:8001"
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Shared token"
                                htmlFor="agent-token"
                                hint={
                                    onboarding.token_set
                                        ? 'Leave blank to keep the stored token.'
                                        : 'Write-only. Stored encrypted and never shown again.'
                                }
                            >
                                <Input
                                    id="agent-token"
                                    name="token"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={onboarding.token_set ? '••••••••' : 'Shared bearer token'}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <p className="text-[12px] leading-4 text-mute">
                                {onboarding.llm_note}
                            </p>
                        </SettingsCard>
                    )}
                </SettingsForm>

                <SettingsCard
                    title="Health check"
                    description="Laravel probes the private runtime. A failed check never takes CRM down."
                    footer={
                        <div className="flex justify-end border-t border-hairline bg-white px-4 py-2">
                            <SettingsForm action="/settings/agent/health" method="post">
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={processing}
                                        data-test="agent-health-check"
                                    >
                                        Check health
                                    </Button>
                                )}
                            </SettingsForm>
                        </div>
                    }
                >
                    <p className="text-[13px] text-ink">
                        Last check:{' '}
                        <span className="text-mute">
                            {onboarding.health?.message ?? 'Not checked yet.'}
                        </span>
                    </p>
                </SettingsCard>

                <SettingsCard
                    title="Plugins"
                    description="Live tool packs this workspace may call. The runtime only receives enabled packs whose connectors are connected."
                >
                    <ul className="grid gap-3">
                        {plugins.map((plugin) => (
                            <li
                                key={plugin.id}
                                className="grid gap-2 border-b border-hairline pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[13px] font-medium text-ink">
                                            {plugin.name}
                                        </p>
                                        <Badge variant="secondary">{plugin.permission}</Badge>
                                        {!plugin.available ? (
                                            <Badge variant="secondary">Needs connector</Badge>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 text-[12px] leading-4 text-mute">
                                        {plugin.description}
                                    </p>
                                </div>
                                <SettingsForm
                                    action={`/settings/agent/plugins/${plugin.id}`}
                                    method="put"
                                >
                                    {({ processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="enabled"
                                                value={plugin.enabled ? '0' : '1'}
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="ghost"
                                                disabled={processing}
                                                data-test={`agent-plugin-${plugin.id}`}
                                            >
                                                {plugin.enabled ? 'Disable' : 'Enable'}
                                            </Button>
                                        </>
                                    )}
                                </SettingsForm>
                            </li>
                        ))}
                    </ul>
                </SettingsCard>

                <SettingsCard
                    title="Connectors"
                    description="Encrypted credentials for the Agent runtime, Browser Use MCP, custom MCP, and optional run webhooks. Tokens are write-only and never sent to the browser."
                >
                    <ul className="grid gap-4">
                        {connectors.map((connector) => (
                            <li key={connector.id} className="grid gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[13px] font-medium text-ink">
                                        {connector.name}
                                    </p>
                                    <Badge variant={connector.connected ? 'default' : 'secondary'}>
                                        {connector.status}
                                    </Badge>
                                    {!connector.wired ? (
                                        <Badge variant="secondary">Stub</Badge>
                                    ) : null}
                                </div>
                                <p className="text-[12px] leading-4 text-mute">
                                    {connector.description}
                                </p>
                                <SettingsForm
                                    action={`/settings/agent/connectors/${connector.id}`}
                                    method="put"
                                >
                                    {({ processing }) => (
                                        <div className="grid gap-2">
                                            <input type="hidden" name="enabled" value="1" />
                                            <SettingsFormRow
                                                label="URL"
                                                htmlFor={`${connector.id}-url`}
                                            >
                                                <Input
                                                    id={`${connector.id}-url`}
                                                    name="url"
                                                    type="url"
                                                    defaultValue={connector.url ?? ''}
                                                    placeholder="https://example.internal"
                                                    className="h-8"
                                                />
                                            </SettingsFormRow>
                                            <SettingsFormRow
                                                label="Token"
                                                htmlFor={`${connector.id}-token`}
                                                hint={
                                                    connector.token_set
                                                        ? 'Leave blank to keep the stored token.'
                                                        : 'Write-only.'
                                                }
                                            >
                                                <Input
                                                    id={`${connector.id}-token`}
                                                    name="token"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    placeholder={
                                                        connector.token_set ? '••••••••' : 'Optional token'
                                                    }
                                                    className="h-8"
                                                />
                                            </SettingsFormRow>
                                            <div className="flex justify-end">
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    disabled={processing}
                                                    data-test={`agent-connector-save-${connector.id}`}
                                                >
                                                    {connector.connected ? 'Update' : 'Connect'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </SettingsForm>
                                {connector.enabled || connector.token_set ? (
                                    <SettingsForm
                                        action={`/settings/agent/connectors/${connector.id}`}
                                        method="delete"
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="ghost"
                                                disabled={processing}
                                                data-test={`agent-connector-disconnect-${connector.id}`}
                                            >
                                                Disconnect
                                            </Button>
                                        )}
                                    </SettingsForm>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </SettingsCard>
            </div>
        </>
    );
}

AgentSettings.layout = {
    breadcrumbs: [{ title: 'Agent', href: '/settings/agent' }],
};
