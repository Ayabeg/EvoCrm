<?php

namespace App\Services\Ads;

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\Workspace;
use App\Services\Crm\CrmFilter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaAudienceSyncService
{
    public function __construct(private CrmFilter $filter) {}

    /**
     * @return array{synced: int, audience_id: string|null, error: string|null}
     */
    public function syncSegment(Workspace $workspace, SavedFilter $segment, string $audienceId): array
    {
        if ((int) $segment->workspace_id !== (int) $workspace->id) {
            return ['synced' => 0, 'audience_id' => null, 'error' => 'Segment not in workspace.'];
        }

        $token = config('meta.access_token') ?: config('services.meta.access_token');
        $accountId = config('meta.ad_account_id') ?: config('services.meta.ad_account_id');

        if (! filled($token) || ! filled($accountId)) {
            return ['synced' => 0, 'audience_id' => null, 'error' => 'Meta credentials not configured.'];
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

        $response = Http::withToken($token)
            ->post("https://graph.facebook.com/v21.0/{$audienceId}/users", $payload);

        if (! $response->successful()) {
            Log::warning('Meta audience sync failed', ['body' => $response->body()]);

            return ['synced' => 0, 'audience_id' => $audienceId, 'error' => 'Meta API error.'];
        }

        return ['synced' => count($contacts), 'audience_id' => $audienceId, 'error' => null];
    }
}
