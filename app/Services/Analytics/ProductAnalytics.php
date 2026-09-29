<?php

namespace App\Services\Analytics;

use App\Models\User;
use App\Models\Workspace;
use App\Support\PosthogPayload;
use PostHog\PostHog;
use Throwable;

class ProductAnalytics
{
    public const GROUP_TYPE = 'workspace';

    public const USER_SIGNED_UP = 'user signed up';

    public const USER_LOGGED_IN = 'user logged in';

    public const WORKSPACE_CREATED = 'workspace created';

    public const CONTACT_CREATED = 'contact created';

    public const COMPANY_CREATED = 'company created';

    public const DEAL_CREATED = 'deal created';

    public const DEAL_STAGE_CHANGED = 'deal stage changed';

    public const DEAL_WON = 'deal won';

    public const DEAL_LOST = 'deal lost';

    public const LEAD_CREATED = 'lead created';

    public const LEAD_QUALIFIED = 'lead qualified';

    public const LEAD_CONVERTED = 'lead converted';

    public const SEGMENT_ENTERED = 'segment entered';

    public const SEGMENT_EXITED = 'segment exited';

    public const WORKFLOW_EXECUTED = 'workflow executed';

    public const SEQUENCE_ENROLLED = 'sequence enrolled';

    public const CAMPAIGN_LAUNCHED = 'campaign launched';

    public const QUOTE_SENT = 'quote sent';

    public const USER_INVITED = 'user invited';

    public const EMAIL_SENT = 'email sent';

    public const EMAIL_REPLIED = 'email replied';

    public const EMAIL_BOUNCED = 'email bounced';

    public const WHATSAPP_MESSAGE_RECEIVED = 'whatsapp message received';

    public const WHATSAPP_MESSAGE_SENT = 'whatsapp message sent';

    public const META_LEAD_RECEIVED = 'meta lead received';

    public const INTEGRATION_CONNECTED = 'integration connected';

    /**
     * @var list<array{event: string, distinctId: string, properties: array<string, mixed>, groups: array<string, string>}>
     */
    private array $recorded = [];

    private ?string $requestDistinctId = null;

    private ?string $sessionId = null;

    private bool $initialized = false;

    public function enabled(): bool
    {
        return filled(config('services.posthog.api_key')) && ! app()->environment('testing');
    }

    public function boot(): void
    {
        if ($this->initialized || ! $this->enabled()) {
            return;
        }

        try {
            PostHog::init(
                (string) config('services.posthog.api_key'),
                [
                    'host' => (string) config('services.posthog.host', 'https://us.i.posthog.com'),
                    'error_tracking' => [
                        'enabled' => true,
                    ],
                ]
            );
        } catch (Throwable) {
            return;
        }

        $this->initialized = true;
    }

    public function setRequestContext(?string $distinctId, ?string $sessionId): void
    {
        $this->requestDistinctId = filled($distinctId) ? (string) $distinctId : null;
        $this->sessionId = filled($sessionId) ? (string) $sessionId : null;
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    public function identify(?User $user, ?Workspace $workspace = null, array $properties = []): void
    {
        if (! $user instanceof User) {
            return;
        }

        $workspace ??= $user->workspace;

        $payload = [
            'event' => '$identify',
            'distinctId' => (string) $user->id,
            'properties' => PosthogPayload::redact(array_merge([
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role->value,
            ], $properties)),
            'groups' => $this->groups($workspace),
        ];

        $this->record($payload);

        if (! $this->enabled()) {
            return;
        }

        $this->boot();

        PostHog::identify([
            'distinctId' => $payload['distinctId'],
            'properties' => $payload['properties'],
        ]);

        $this->groupIdentify($workspace, $user);
    }

    public function groupIdentify(?Workspace $workspace, ?User $user = null): void
    {
        if (! $workspace instanceof Workspace) {
            return;
        }

        $payload = [
            'event' => '$groupidentify',
            'distinctId' => $this->distinctId($user, $workspace),
            'properties' => [
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'timezone' => $workspace->timezone,
            ],
            'groups' => $this->groups($workspace),
        ];

        $this->record($payload);

        if (! $this->enabled()) {
            return;
        }

        $this->boot();

        PostHog::groupIdentify([
            'groupType' => self::GROUP_TYPE,
            'groupKey' => (string) $workspace->id,
            'properties' => $payload['properties'],
            'distinctId' => $payload['distinctId'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    public function capture(string $event, array $properties = [], ?User $user = null, ?Workspace $workspace = null): void
    {
        $resolvedUser = $user instanceof User
            ? $user
            : (auth()->user() instanceof User ? auth()->user() : null);
        $resolvedWorkspace = $workspace instanceof Workspace
            ? $workspace
            : $resolvedUser?->workspace;

        $payload = [
            'event' => $event,
            'distinctId' => $this->distinctId($resolvedUser, $resolvedWorkspace),
            'properties' => $this->properties($properties),
            'groups' => $this->groups($resolvedWorkspace),
        ];

        $this->record($payload);

        if (! $this->enabled()) {
            return;
        }

        $this->boot();

        PostHog::capture([
            'distinctId' => $payload['distinctId'],
            'event' => $event,
            'properties' => $payload['properties'],
            'groups' => $payload['groups'],
        ]);
    }

    public function captureException(Throwable $exception, ?User $user = null): void
    {
        $resolvedUser = $user instanceof User
            ? $user
            : (auth()->user() instanceof User ? auth()->user() : null);

        $this->record([
            'event' => '$exception',
            'distinctId' => $this->distinctId($resolvedUser, $resolvedUser?->workspace),
            'properties' => PosthogPayload::redact([
                'message' => PosthogPayload::redactString($exception->getMessage()),
            ]),
            'groups' => $this->groups($resolvedUser?->workspace),
        ]);

        if (! $this->enabled()) {
            return;
        }

        $this->boot();

        try {
            PostHog::captureException(
                $exception,
                $resolvedUser instanceof User ? (string) $resolvedUser->id : null,
            );
        } catch (Throwable) {
            // Fail quiet: error tracking must never break the request.
        }
    }

    /**
     * @return list<array{event: string, distinctId: string, properties: array<string, mixed>, groups: array<string, string>}>
     */
    public function recorded(): array
    {
        return $this->recorded;
    }

    /**
     * @return list<string>
     */
    public function eventNames(): array
    {
        return array_values(array_map(
            fn (array $row): string => $row['event'],
            $this->recorded,
        ));
    }

    /**
     * @return array{event: string, distinctId: string, properties: array<string, mixed>, groups: array<string, string>}|null
     */
    public function last(string $event): ?array
    {
        foreach (array_reverse($this->recorded) as $row) {
            if ($row['event'] === $event) {
                return $row;
            }
        }

        return null;
    }

    public function flushRecorded(): void
    {
        $this->recorded = [];
    }

    public function flush(): void
    {
        if ($this->initialized) {
            PostHog::flush();
        }
    }

    private function distinctId(?User $user, ?Workspace $workspace): string
    {
        if (filled($this->requestDistinctId)) {
            return (string) $this->requestDistinctId;
        }

        if ($user instanceof User) {
            return (string) $user->id;
        }

        if ($workspace instanceof Workspace) {
            return 'workspace:'.$workspace->id;
        }

        return 'anonymous';
    }

    /**
     * @return array<string, string>
     */
    private function groups(?Workspace $workspace): array
    {
        if (! $workspace instanceof Workspace) {
            return [];
        }

        return [self::GROUP_TYPE => (string) $workspace->id];
    }

    /**
     * @param  array<string, mixed>  $properties
     * @return array<string, mixed>
     */
    private function properties(array $properties): array
    {
        if (filled($this->sessionId)) {
            $properties['$session_id'] = $this->sessionId;
        }

        return PosthogPayload::redact($properties);
    }

    /**
     * @param  array{event: string, distinctId: string, properties: array<string, mixed>, groups: array<string, string>}  $payload
     */
    private function record(array $payload): void
    {
        if (app()->environment('testing')) {
            $this->recorded[] = $payload;
        }
    }
}
