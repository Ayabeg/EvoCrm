<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\LeadCapture;
use App\Support\LeadCaptureNormalizer;
use Illuminate\Support\Facades\DB;
use Throwable;

class LeadCaptureDeduper
{
    public function __construct(private ContactIdentity $contacts) {}

    public function process(LeadCapture $capture): LeadCapture
    {
        $capture->refresh();

        if (! $capture->isPending()) {
            return $capture;
        }

        try {
            return DB::transaction(function () use ($capture): LeadCapture {
                $capture = LeadCapture::query()
                    ->whereKey($capture->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $capture->isPending()) {
                    return $capture;
                }

                $lead = $this->mergeOrCreate($capture);

                $capture->forceFill([
                    'status' => LeadCapture::STATUS_MERGED,
                    'matched_lead_id' => $lead->id,
                    'error' => null,
                ])->save();

                return $capture->fresh() ?? $capture;
            });
        } catch (Throwable $exception) {
            $capture->forceFill([
                'status' => LeadCapture::STATUS_ERROR,
                'error' => mb_substr($exception->getMessage(), 0, 500),
            ])->save();

            return $capture->fresh() ?? $capture;
        }
    }

    public function reject(LeadCapture $capture): LeadCapture
    {
        if (! $capture->isPending()) {
            return $capture;
        }

        $capture->forceFill([
            'status' => LeadCapture::STATUS_REJECTED,
            'matched_lead_id' => null,
            'error' => null,
        ])->save();

        return $capture->fresh() ?? $capture;
    }

    /**
     * @param  array<string, mixed>  $normalized
     */
    public function record(
        int $workspaceId,
        string $source,
        array $normalized,
        array $rawPayload,
        ?int $createdById = null,
        string $status = LeadCapture::STATUS_NEW,
    ): LeadCapture {
        return LeadCapture::query()->create([
            'workspace_id' => $workspaceId,
            'created_by_id' => $createdById,
            'source' => $source,
            'status' => $status,
            'raw_payload' => $rawPayload,
            'name' => $normalized['name'] ?? null,
            'phone' => $normalized['phone'] ?? null,
            'email' => $normalized['email'] ?? null,
            'company' => $normalized['company'] ?? null,
            'wilaya' => $normalized['wilaya'] ?? null,
        ]);
    }

    private function mergeOrCreate(LeadCapture $capture): Lead
    {
        $workspace = $capture->workspace;
        $name = LeadCaptureNormalizer::splitName($capture->name);
        $source = $this->leadSource($capture->source);

        $company = $this->resolveCompany($capture);

        $contact = $this->contacts->findOrCreate($workspace, [
            'first_name' => $name['first_name'],
            'last_name' => $name['last_name'],
            'email' => $capture->email,
            'phone' => $capture->phone,
            'company_id' => $company?->id,
            'wilaya' => $capture->wilaya,
            'source' => $source,
        ]);

        $contact->forceFill(array_filter([
            'phone' => $capture->phone,
            'phone_e164' => $capture->phone,
            'email' => $capture->email,
            'company_id' => $company?->id ?? $contact->company_id,
            'wilaya' => $capture->wilaya ?? $contact->wilaya,
        ], fn ($value) => $value !== null && $value !== ''))->save();

        $lead = $this->findExistingLead($capture, $contact);

        if ($lead) {
            if ($company && ! $lead->company_id) {
                $lead->forceFill(['company_id' => $company->id])->save();
            }

            return $lead;
        }

        return Lead::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id ?? $company?->id,
            'title' => LeadCaptureNormalizer::leadTitle((string) $capture->name, $capture->company, $capture->source),
            'status' => 'new',
            'source' => $source,
            'payload' => [
                'capture_id' => $capture->id,
                'source' => $capture->source,
            ],
        ]);
    }

    private function findExistingLead(LeadCapture $capture, Contact $contact): ?Lead
    {
        $workspaceId = (int) $capture->workspace_id;

        $lead = Lead::query()
            ->forWorkspace($workspaceId)
            ->where('contact_id', $contact->id)
            ->latest('id')
            ->lockForUpdate()
            ->first();

        if ($lead) {
            return $lead;
        }

        $contactIds = Contact::query()
            ->forWorkspace($workspaceId)
            ->where(function ($query) use ($capture, $contact): void {
                $query->whereKey($contact->id);

                if (filled($capture->phone)) {
                    $query->orWhere('phone_e164', $capture->phone);
                }

                if (filled($capture->email)) {
                    $query->orWhere('email', $capture->email);
                }
            })
            ->pluck('id');

        if ($contactIds->isEmpty()) {
            return null;
        }

        return Lead::query()
            ->forWorkspace($workspaceId)
            ->whereIn('contact_id', $contactIds)
            ->latest('id')
            ->lockForUpdate()
            ->first();
    }

    private function resolveCompany(LeadCapture $capture): ?Company
    {
        $name = trim((string) $capture->company);

        if ($name === '') {
            return null;
        }

        $existing = Company::query()
            ->forWorkspace($capture->workspace_id)
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->first();

        return $existing ?? Company::query()->create([
            'workspace_id' => $capture->workspace_id,
            'name' => $name,
            'wilaya' => $capture->wilaya,
            'country' => 'DZ',
        ]);
    }

    private function leadSource(string $captureSource): string
    {
        return match ($captureSource) {
            LeadCapture::SOURCE_META_FORM => 'meta_lead_form',
            default => $captureSource,
        };
    }
}
