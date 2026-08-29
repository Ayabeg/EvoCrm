<?php

namespace App\Services\Ads;

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\Lead;
use App\Models\LeadCapture;
use App\Models\Workspace;
use App\Services\Crm\LeadCaptureDeduper;
use App\Support\LeadCaptureNormalizer;

class LeadFormIngestor
{
    public function __construct(private LeadCaptureDeduper $captures) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function ingest(Workspace $workspace, array $payload): AdLead
    {
        $fields = $payload['fields'] ?? $payload['field_data'] ?? [];
        $mapped = $this->mapFields(is_array($fields) ? $fields : []);

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

        $lead = $capture->matchedLead;
        $contact = $lead?->contact;

        $account = null;
        if (! empty($payload['ad_account_id']) || ! empty($payload['account_id'])) {
            $external = (string) ($payload['ad_account_id'] ?? $payload['account_id']);
            $account = AdAccount::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'external_id' => $external,
                ],
                [
                    'name' => $payload['ad_account_name'] ?? 'Meta ad account',
                    'status' => 'connected',
                ]
            );
        }

        $campaign = null;
        if (! empty($payload['campaign_id'])) {
            $campaign = AdCampaign::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'external_id' => (string) $payload['campaign_id'],
                ],
                [
                    'ad_account_id' => $account?->id ?? $this->fallbackAccount($workspace)->id,
                    'name' => $payload['campaign_name'] ?? 'Lead form campaign',
                    'lead_form' => true,
                    'status' => 'active',
                ]
            );
        }

        if ($lead && $campaign && ! $lead->ad_campaign_id) {
            $lead->forceFill(['ad_campaign_id' => $campaign->id])->save();
        }

        return AdLead::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account?->id,
            'ad_campaign_id' => $campaign?->id,
            'contact_id' => $contact?->id,
            'lead_id' => $lead?->id,
            'external_id' => $payload['leadgen_id'] ?? $payload['external_id'] ?? null,
            'form_id' => $payload['form_id'] ?? null,
            'fields' => $mapped,
        ]);
    }

    /**
     * Leadgen webhooks that carry a campaign but no ad account still need an
     * account row for the campaign FK.
     */
    protected function fallbackAccount(Workspace $workspace): AdAccount
    {
        return AdAccount::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => null],
            ['name' => 'Meta ad account', 'status' => 'connected'],
        );
    }

    /**
     * @param  array<int|string, mixed>  $fields
     * @return array<string, string>
     */
    protected function mapFields(array $fields): array
    {
        $mapped = [];

        foreach ($fields as $key => $value) {
            if (is_array($value) && isset($value['name'])) {
                $mapped[(string) $value['name']] = (string) ($value['values'][0] ?? $value['value'] ?? '');

                continue;
            }

            if (is_string($key)) {
                $mapped[$key] = is_scalar($value) ? (string) $value : (json_encode($value) ?: '');
            }
        }

        return $mapped;
    }
}
