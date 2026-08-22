<?php

namespace App\Services\Ads;

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\Lead;
use App\Models\Workspace;
use App\Services\Crm\ContactIdentity;

class LeadFormIngestor
{
    public function __construct(private ContactIdentity $contacts) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function ingest(Workspace $workspace, array $payload): AdLead
    {
        $fields = $payload['fields'] ?? $payload['field_data'] ?? [];
        $mapped = $this->mapFields(is_array($fields) ? $fields : []);

        $contact = $this->contacts->findOrCreate($workspace, [
            'first_name' => $mapped['first_name'] ?? ($mapped['full_name'] ?? 'Lead'),
            'last_name' => $mapped['last_name'] ?? null,
            'email' => $mapped['email'] ?? null,
            'phone' => $mapped['phone'] ?? $mapped['phone_number'] ?? null,
            'source' => 'meta_lead_form',
        ]);

        $lead = Lead::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'title' => $payload['title'] ?? ('Meta lead — '.$contact->displayName()),
            'status' => 'new',
            'source' => 'meta_lead_form',
            'payload' => $payload,
        ]);

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
        if ($account && ! empty($payload['campaign_id'])) {
            $campaign = AdCampaign::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'external_id' => (string) $payload['campaign_id'],
                ],
                [
                    'ad_account_id' => $account->id,
                    'name' => $payload['campaign_name'] ?? 'Lead form campaign',
                    'lead_form' => true,
                    'status' => 'active',
                ]
            );
        }

        return AdLead::query()->create([
            'workspace_id' => $workspace->id,
            'ad_account_id' => $account?->id,
            'ad_campaign_id' => $campaign?->id,
            'contact_id' => $contact->id,
            'lead_id' => $lead->id,
            'external_id' => $payload['leadgen_id'] ?? $payload['external_id'] ?? null,
            'form_id' => $payload['form_id'] ?? null,
            'fields' => $mapped,
        ]);
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
