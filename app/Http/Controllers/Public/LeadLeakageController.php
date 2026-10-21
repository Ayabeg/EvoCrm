<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Jobs\DeliverLeadMagnetSubmission;
use App\Models\Activity;
use App\Models\ContactConsent;
use App\Models\FunnelEvent;
use App\Models\LeadCapture;
use App\Models\LeadMagnetOffer;
use App\Models\LeadMagnetSubmission;
use App\Models\Workspace;
use App\Services\Crm\LeadCaptureDeduper;
use App\Services\Funnels\FunnelEventRecorder;
use App\Services\LeadMagnet\LeadLeakageCalculator;
use App\Support\LeadCaptureNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeadLeakageController extends Controller
{
    public function show(Workspace $workspace): Response
    {
        return Inertia::render('public/lead-leakage-calculator', $this->pageProps($workspace));
    }

    public function store(
        Request $request,
        Workspace $workspace,
        LeadLeakageCalculator $calculator,
        LeadCaptureDeduper $deduper,
        FunnelEventRecorder $funnelEvents,
    ): Response {
        $data = $request->validate([
            'submission_key' => ['required', 'uuid'],
            'monthly_inquiries' => ['required', 'integer', 'min:0', 'max:1000000'],
            'average_customer_value' => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'inquiry_to_customer_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'missed_inquiry_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'delayed_response_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'follow_up_dropoff_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'name' => ['nullable', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:180'],
            'company' => ['nullable', 'string', 'max:180'],
            'marketing_consent' => ['sometimes', 'boolean'],
            'utm_source' => ['nullable', 'string', 'max:100'],
            'utm_medium' => ['nullable', 'string', 'max:100'],
            'utm_campaign' => ['nullable', 'string', 'max:100'],
        ]);

        if (($data['marketing_consent'] ?? false) && ! filled($data['email'] ?? null)) {
            throw ValidationException::withMessages([
                'email' => 'An email address is required for optional marketing consent.',
            ]);
        }

        $offer = $this->offer($workspace);
        $calculation = $calculator->calculate($data);
        $attribution = array_filter([
            'utm_source' => $data['utm_source'] ?? null,
            'utm_medium' => $data['utm_medium'] ?? null,
            'utm_campaign' => $data['utm_campaign'] ?? null,
        ]);

        $submission = DB::transaction(function () use ($data, $workspace, $offer, $calculation, $attribution, $deduper): LeadMagnetSubmission {
            $existing = LeadMagnetSubmission::query()
                ->where('workspace_id', $workspace->id)
                ->where('lead_magnet_offer_id', $offer->id)
                ->where('idempotency_key', $data['submission_key'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $contact = null;
            $lead = null;

            if (filled($data['email'] ?? null)) {
                $normalized = LeadCaptureNormalizer::normalize([
                    'name' => $data['name'] ?? null,
                    'email' => $data['email'],
                    'company' => $data['company'] ?? null,
                ]);
                $capture = $deduper->record(
                    (int) $workspace->id,
                    LeadCapture::SOURCE_LEAD_MAGNET,
                    $normalized,
                    ['source' => LeadCapture::SOURCE_LEAD_MAGNET, 'offer' => $offer->slug],
                );
                $capture = $deduper->process($capture);
                $lead = $capture->matchedLead;
                $contact = $lead?->contact;
            }

            $submission = LeadMagnetSubmission::query()->create([
                'workspace_id' => $workspace->id,
                'lead_magnet_offer_id' => $offer->id,
                'contact_id' => $contact?->id,
                'lead_id' => $lead?->id,
                'idempotency_key' => $data['submission_key'],
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'company' => $data['company'] ?? null,
                'assumptions' => $calculation['assumptions'],
                'result' => $calculation,
                'attribution' => $attribution ?: null,
                'delivery_status' => filled($data['email'] ?? null) ? 'queued' : 'inline',
                'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
            ]);

            if ($contact && ($data['marketing_consent'] ?? false)) {
                ContactConsent::query()->updateOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'contact_id' => $contact->id,
                        'channel' => 'email',
                        'purpose' => 'marketing',
                    ],
                    [
                        'status' => ContactConsent::STATUS_GRANTED,
                        'source' => 'lead_magnet',
                        'captured_at' => now(),
                        'revoked_at' => null,
                    ],
                );
            }

            if ($contact) {
                Activity::query()->create([
                    'workspace_id' => $workspace->id,
                    'type' => 'lead_magnet_submission',
                    'subject' => $offer->name,
                    'contact_id' => $contact->id,
                    'company_id' => $contact->company_id,
                    'meta' => [
                        'submission_id' => $submission->id,
                        'offer' => $offer->slug,
                        'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
                    ],
                ]);
            }

            return $submission;
        });

        if ($submission->delivery_status === 'queued') {
            DeliverLeadMagnetSubmission::dispatch($submission->id);
        }

        $funnelEvents->record($workspace, FunnelEvent::TYPE_LEAD_MAGNET_SUBMITTED, [
            'subject_type' => LeadMagnetSubmission::class,
            'subject_id' => $submission->id,
            'contact_id' => $submission->contact_id,
            'lead_id' => $submission->lead_id,
            'source' => LeadCapture::SOURCE_LEAD_MAGNET,
            'utm_source' => $attribution['utm_source'] ?? null,
            'utm_medium' => $attribution['utm_medium'] ?? null,
            'utm_campaign' => $attribution['utm_campaign'] ?? null,
            'meta' => ['offer' => $offer->slug],
        ]);

        return Inertia::render('public/lead-leakage-calculator', [
            ...$this->pageProps($workspace),
            'result' => $submission->result,
            'submission' => [
                'id' => $submission->id,
                'contact_created' => $submission->contact_id !== null,
                'marketing_consent_recorded' => $submission->marketing_consent && $submission->contact_id !== null,
                'delivery_status' => $submission->delivery_status,
                'delivery_error' => $submission->delivery_error,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function pageProps(Workspace $workspace): array
    {
        $offer = $this->offer($workspace);

        return [
            'workspace' => ['name' => $workspace->name, 'slug' => $workspace->slug],
            'offer' => [
                'slug' => $offer->slug,
                'name' => $offer->name,
                'version' => $offer->version,
                'description' => $offer->description,
            ],
            'result' => null,
            'submission' => null,
        ];
    }

    private function offer(Workspace $workspace): LeadMagnetOffer
    {
        return LeadMagnetOffer::query()
            ->where('workspace_id', $workspace->id)
            ->where('slug', 'lead-leakage-calculator')
            ->where('status', LeadMagnetOffer::STATUS_ACTIVE)
            ->firstOrFail();
    }
}
