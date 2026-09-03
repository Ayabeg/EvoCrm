<?php

namespace App\Services\Ads;

use App\Models\Ad;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\AdSet;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\LeadCapture;
use App\Models\Workspace;
use App\Services\Crm\LeadCaptureDeduper;
use App\Services\Meta\MetaFieldMapper;
use App\Support\LeadCaptureNormalizer;

class LeadFormIngestor
{
    public function __construct(
        private LeadCaptureDeduper $captures,
        private MetaFieldMapper $mapper,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function ingest(Workspace $workspace, array $payload): AdLead
    {
        $externalId = $this->string($payload['leadgen_id'] ?? $payload['external_id'] ?? null);

        if ($externalId !== null) {
            $existing = AdLead::query()
                ->forWorkspace($workspace)
                ->where('external_id', $externalId)
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        $fields = $payload['fields'] ?? $payload['field_data'] ?? [];
        $mappedBag = $this->mapper->map($workspace, is_array($fields) ? $fields : []);
        $mapped = $mappedBag['mapped'];

        $name = trim((string) ($mapped['full_name'] ?? ''));
        if ($name === '') {
            $name = trim(($mapped['first_name'] ?? '').' '.($mapped['last_name'] ?? ''));
        }

        $capture = $this->captures->record(
            $workspace->id,
            LeadCapture::SOURCE_META_FORM,
            LeadCaptureNormalizer::normalize([
                'name' => $name !== '' ? $name : ($payload['title'] ?? null),
                'phone' => $mapped['phone'] ?? $mapped['phone_number'] ?? null,
                'email' => $mapped['email'] ?? null,
                'company' => $mapped['company'] ?? $mapped['company_name'] ?? null,
                'wilaya' => $mapped['wilaya'] ?? $mapped['city'] ?? null,
            ]),
            $payload,
        );
        $capture = $this->captures->process($capture);
        $capture->loadMissing('matchedLead.contact');

        $lead = $capture->matchedLead instanceof Lead ? $capture->matchedLead : null;
        $contact = $lead?->contact instanceof Contact ? $lead->contact : null;
        $account = $this->resolveAccount($workspace, $payload);
        $campaign = $this->resolveCampaign($workspace, $payload, $account);
        $adSet = $this->resolveAdSet($workspace, $payload, $campaign);
        $ad = $this->resolveAd($workspace, $payload, $adSet, $campaign);
        $attribution = $this->attribution($payload, $campaign, $adSet, $ad);

        if ($lead) {
            $lead->forceFill(array_filter([
                'ad_campaign_id' => $lead->ad_campaign_id ?: $campaign?->id,
                'ad_set_id' => $lead->ad_set_id ?: $adSet?->id,
                'ad_id' => $lead->ad_id ?: $ad?->id,
                'payload' => array_merge($lead->payload ?? [], [
                    'attribution' => $attribution,
                    'custom_fields' => $mappedBag['custom'],
                    'job_title' => $mapped['job_title'] ?? null,
                ]),
            ], fn ($value) => $value !== null))->save();
        }

        if ($contact && filled($mapped['job_title'] ?? null)) {
            $contact->forceFill([
                'meta' => array_merge($contact->meta ?? [], [
                    'job_title' => $mapped['job_title'],
                    'attribution' => $attribution,
                ]),
            ])->save();
        }

        $attributes = [
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account?->id,
            'ad_campaign_id' => $campaign?->id,
            'ad_set_id' => $adSet?->id,
            'ad_id' => $ad?->id,
            'contact_id' => $contact?->id,
            'lead_id' => $lead?->id,
            'form_id' => $this->string($payload['form_id'] ?? null),
            'page_id' => $this->string($payload['page_id'] ?? null),
            'page_name' => $this->string($payload['page_name'] ?? null),
            'fields' => array_merge($mapped, $mappedBag['custom']),
            'attribution' => $attribution,
        ];

        if ($externalId !== null) {
            return AdLead::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'external_id' => $externalId],
                $attributes,
            );
        }

        return AdLead::query()->create($attributes);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function resolveAccount(Workspace $workspace, array $payload): ?AdAccount
    {
        $external = $this->string($payload['ad_account_id'] ?? $payload['account_id'] ?? null);

        if ($external === null) {
            return null;
        }

        return AdAccount::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $external],
            [
                'name' => $payload['ad_account_name'] ?? 'Meta ad account',
                'status' => 'connected',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function resolveCampaign(Workspace $workspace, array $payload, ?AdAccount $account): ?AdCampaign
    {
        $external = $this->string($payload['campaign_id'] ?? null);

        if ($external === null) {
            return null;
        }

        return AdCampaign::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $external],
            [
                'ad_account_id' => $account?->id ?? $this->fallbackAccount($workspace)->id,
                'name' => $payload['campaign_name'] ?? 'Lead form campaign',
                'lead_form' => true,
                'status' => 'active',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function resolveAdSet(Workspace $workspace, array $payload, ?AdCampaign $campaign): ?AdSet
    {
        $external = $this->string($payload['adset_id'] ?? $payload['adgroup_id'] ?? null);

        if ($external === null || $campaign === null) {
            return null;
        }

        return AdSet::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $external],
            [
                'ad_campaign_id' => $campaign->id,
                'name' => $payload['adset_name'] ?? $payload['adgroup_name'] ?? 'Lead form ad set',
                'status' => 'active',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function resolveAd(Workspace $workspace, array $payload, ?AdSet $adSet, ?AdCampaign $campaign): ?Ad
    {
        $external = $this->string($payload['ad_id'] ?? null);

        if ($external === null || $adSet === null) {
            return null;
        }

        return Ad::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $external],
            [
                'ad_set_id' => $adSet->id,
                'ad_campaign_id' => $campaign?->id,
                'name' => $payload['ad_name'] ?? 'Lead form ad',
                'status' => 'active',
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function attribution(array $payload, ?AdCampaign $campaign, ?AdSet $adSet, ?Ad $ad): array
    {
        return [
            'source' => 'facebook',
            'medium' => 'paid',
            'campaign' => $campaign?->name ?? $this->string($payload['campaign_name'] ?? null),
            'campaign_id' => $campaign?->external_id ?? $this->string($payload['campaign_id'] ?? null),
            'ad_set' => $adSet?->name ?? $this->string($payload['adset_name'] ?? $payload['adgroup_name'] ?? null),
            'ad_set_id' => $adSet?->external_id ?? $this->string($payload['adset_id'] ?? $payload['adgroup_id'] ?? null),
            'ad' => $ad?->name ?? $this->string($payload['ad_name'] ?? null),
            'ad_id' => $ad?->external_id ?? $this->string($payload['ad_id'] ?? null),
            'form' => $this->string($payload['form_name'] ?? null),
            'form_id' => $this->string($payload['form_id'] ?? null),
            'page' => $this->string($payload['page_name'] ?? null),
            'page_id' => $this->string($payload['page_id'] ?? null),
            'created_at' => $this->string($payload['created_time'] ?? $payload['created_at'] ?? now()->toIso8601String()),
        ];
    }

    protected function fallbackAccount(Workspace $workspace): AdAccount
    {
        return AdAccount::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => null],
            ['name' => 'Meta ad account', 'status' => 'connected'],
        );
    }

    protected function string(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
