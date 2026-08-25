<?php

namespace App\Services\Ads;

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\Workspace;
use App\Services\Crm\CrmFilter;
use App\Services\Meta\WorkspaceMetaCredentials;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaAudienceSyncService
{
    public function __construct(
        private CrmFilter $filter,
        private WorkspaceMetaCredentials $credentials,
    ) {}

    /**
     * @return array{synced: int, audience_id: string|null, error: string|null}
     */
    public function syncSegment(Workspace $workspace, SavedFilter $segment, string $audienceId): array
    {
        if ((int) $segment->workspace_id !== (int) $workspace->id) {
            return ['synced' => 0, 'audience_id' => null, 'error' => 'Segment not in workspace.'];
        }

        $credentials = $this->credentials->resolve($workspace);

        if (! $credentials['ok']) {
            return ['synced' => 0, 'audience_id' => null, 'error' => $credentials['reason']];
        }

        $filters = app(CrmFilter::class)->fromSaved($segment);
        $contacts = Contact::query()
            ->forWorkspace($workspace)
            ->whereNotNull('email')
            ->tap(fn ($query) => $this->filter->apply('contact', $query, $filters))
            ->limit(500)
            ->pluck('email')
            ->filter()
            ->values()
            ->all();

        if ($contacts === []) {
            return ['synced' => 0, 'audience_id' => $audienceId, 'error' => null];
        }

        $payload = [
            'payload' => [
                'schema' => ['EMAIL'],
                'data' => array_map(fn (string $email) => [$email], $contacts),
            ],
        ];

        $response = Http::withToken((string) $credentials['token'])
            ->post("https://graph.facebook.com/v21.0/{$audienceId}/users", $payload);

        if (! $response->successful()) {
            Log::warning('Meta audience sync failed', [
                'event' => 'meta_audience_sync_failed',
                'workspace_id' => $workspace->id,
                'status' => $response->status(),
            ]);

            return ['synced' => 0, 'audience_id' => $audienceId, 'error' => 'Meta API error.'];
        }

        return ['synced' => count($contacts), 'audience_id' => $audienceId, 'error' => null];
    }
}
