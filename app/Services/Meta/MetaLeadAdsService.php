<?php

namespace App\Services\Meta;

use App\Models\Integration;
use App\Models\MetaLeadForm;
use App\Models\Workspace;
use App\Services\Ads\LeadFormIngestor;
use RuntimeException;
use Throwable;

/**
 * Lead form catalog + lead retrieval from Graph.
 *
 * @see https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving
 */
class MetaLeadAdsService
{
    public function __construct(
        private WorkspaceMetaCredentials $credentials,
        private MetaGraphClient $graph,
        private LeadFormIngestor $ingestor,
    ) {}

    /**
     * @return array{ok: bool, reason: string|null, forms: int}
     */
    public function syncForms(Workspace $workspace): array
    {
        $token = $this->userToken($workspace);

        if ($token === null) {
            return ['ok' => false, 'reason' => 'Meta is not connected for this workspace.', 'forms' => 0];
        }

        $pages = $this->pages($workspace);
        $synced = 0;

        foreach ($pages as $page) {
            $pageToken = $page['access_token'] ?? $token;

            try {
                $rows = $this->graph->paginate((string) $pageToken, '/'.$page['id'].'/leadgen_forms', [
                    'fields' => 'id,name,status,locale,questions',
                    'limit' => 50,
                ]);
            } catch (Throwable) {
                continue;
            }

            foreach ($rows as $row) {
                MetaLeadForm::query()->updateOrCreate(
                    ['workspace_id' => $workspace->id, 'external_id' => (string) $row['id']],
                    [
                        'page_id' => $page['id'],
                        'name' => (string) ($row['name'] ?? 'Lead form'),
                        'status' => strtolower((string) ($row['status'] ?? 'active')),
                        'locale' => $row['locale'] ?? null,
                        'questions' => $row['questions'] ?? [],
                        'last_synced_at' => now(),
                    ],
                );
                $synced++;
            }
        }

        return ['ok' => true, 'reason' => null, 'forms' => $synced];
    }

    /**
     * @return array<string, mixed>
     */
    public function retrieveLead(Workspace $workspace, string $leadgenId): array
    {
        $token = $this->pageOrUserToken($workspace);

        if ($token === null) {
            throw new RuntimeException('Meta is not connected for this workspace.');
        }

        return $this->graph->get($token, '/'.$leadgenId, [
            'fields' => 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data,custom_disclaimer_responses',
        ]);
    }

    /**
     * @return array{ok: bool, reason: string|null, imported: int}
     */
    public function importHistoricalLeads(Workspace $workspace, ?string $formId = null): array
    {
        $token = $this->pageOrUserToken($workspace);

        if ($token === null) {
            return ['ok' => false, 'reason' => 'Meta is not connected for this workspace.', 'imported' => 0];
        }

        $forms = MetaLeadForm::query()
            ->forWorkspace($workspace)
            ->when($formId, fn ($query) => $query->where('external_id', $formId))
            ->get();

        if ($forms->isEmpty()) {
            $this->syncForms($workspace);
            $forms = MetaLeadForm::query()
                ->forWorkspace($workspace)
                ->when($formId, fn ($query) => $query->where('external_id', $formId))
                ->get();
        }

        $imported = 0;

        foreach ($forms as $form) {
            try {
                $rows = $this->graph->paginate($token, '/'.$form->external_id.'/leads', [
                    'fields' => 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data',
                    'limit' => 50,
                ]);
            } catch (Throwable) {
                continue;
            }

            foreach ($rows as $row) {
                $this->ingestor->ingest($workspace, $this->normalizeLeadRow($row, $form));
                $imported++;
            }
        }

        return ['ok' => true, 'reason' => null, 'imported' => $imported];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public function normalizeLeadRow(array $row, ?MetaLeadForm $form = null): array
    {
        return [
            'leadgen_id' => $row['id'] ?? $row['leadgen_id'] ?? null,
            'form_id' => $row['form_id'] ?? $form?->external_id,
            'form_name' => $form?->name,
            'page_id' => $form?->page_id,
            'ad_id' => $row['ad_id'] ?? null,
            'ad_name' => $row['ad_name'] ?? null,
            'adset_id' => $row['adset_id'] ?? $row['adgroup_id'] ?? null,
            'adset_name' => $row['adset_name'] ?? null,
            'campaign_id' => $row['campaign_id'] ?? null,
            'campaign_name' => $row['campaign_name'] ?? null,
            'created_time' => $row['created_time'] ?? null,
            'field_data' => $row['field_data'] ?? $row['fields'] ?? [],
        ];
    }

    protected function userToken(Workspace $workspace): ?string
    {
        $integration = $workspace->integration(Integration::PROVIDER_META);

        if (! $integration?->isConnected()) {
            return null;
        }

        if ($integration->expires_at?->isPast()) {
            return null;
        }

        return (string) $integration->access_token;
    }

    protected function pageOrUserToken(Workspace $workspace): ?string
    {
        $pages = $this->pages($workspace);

        foreach ($pages as $page) {
            if (filled($page['access_token'] ?? null)) {
                return (string) $page['access_token'];
            }
        }

        return $this->userToken($workspace);
    }

    /**
     * @return list<array{id: string, name: string, access_token?: string}>
     */
    protected function pages(Workspace $workspace): array
    {
        $integration = $workspace->integration(Integration::PROVIDER_META);
        $pages = $integration?->meta['pages'] ?? [];
        $secrets = json_decode((string) ($integration?->refresh_token ?? ''), true);
        $pageTokens = is_array($secrets) && is_array($secrets['page_tokens'] ?? null)
            ? $secrets['page_tokens']
            : [];

        if (! is_array($pages)) {
            return [];
        }

        $normalized = [];

        foreach ($pages as $page) {
            if (! is_array($page) || ! filled($page['id'] ?? null)) {
                continue;
            }

            $pageId = (string) $page['id'];

            $normalized[] = [
                'id' => $pageId,
                'name' => (string) ($page['name'] ?? $pageId),
                'access_token' => isset($pageTokens[$pageId]) ? (string) $pageTokens[$pageId] : null,
            ];
        }

        return $normalized;
    }
}
