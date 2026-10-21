<?php

namespace App\Services\Funnels;

use App\Models\Activity;
use App\Models\ConversionFunnel;
use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\LeadMagnetSubmission;
use App\Models\Workspace;
use Illuminate\Support\Arr;

/**
 * Writes funnel_events rows for the workspace default conversion funnel.
 * Idempotent per subject + event_type within a funnel (dedupe keys).
 */
class FunnelEventRecorder
{
    public function __construct(private ConversionFunnelProvisioner $provisioner) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function record(Workspace $workspace, string $eventType, array $attributes = []): ?FunnelEvent
    {
        $funnel = $this->defaultFunnel($workspace);

        if ($funnel === null) {
            return null;
        }

        $subjectType = Arr::get($attributes, 'subject_type');
        $subjectId = Arr::get($attributes, 'subject_id');

        if ($subjectType !== null && $subjectId !== null) {
            $exists = FunnelEvent::query()
                ->forWorkspace($workspace)
                ->where('conversion_funnel_id', $funnel->id)
                ->where('event_type', $eventType)
                ->where('subject_type', $subjectType)
                ->where('subject_id', $subjectId)
                ->exists();

            if ($exists) {
                return null;
            }
        }

        return FunnelEvent::query()->create([
            'workspace_id' => $workspace->id,
            'conversion_funnel_id' => $funnel->id,
            'event_type' => $eventType,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'contact_id' => Arr::get($attributes, 'contact_id'),
            'lead_id' => Arr::get($attributes, 'lead_id'),
            'deal_id' => Arr::get($attributes, 'deal_id'),
            'ad_campaign_id' => Arr::get($attributes, 'ad_campaign_id'),
            'source' => $this->normalizeSource($attributes),
            'utm_source' => Arr::get($attributes, 'utm_source'),
            'utm_medium' => Arr::get($attributes, 'utm_medium'),
            'utm_campaign' => Arr::get($attributes, 'utm_campaign'),
            'occurred_at' => Arr::get($attributes, 'occurred_at', now()),
            'meta' => Arr::get($attributes, 'meta'),
        ]);
    }

    public function recordVisit(Workspace $workspace, array $attributes = []): ?FunnelEvent
    {
        return $this->record($workspace, FunnelEvent::TYPE_VISIT, $attributes);
    }

    public function recordDealCreated(Deal $deal): ?FunnelEvent
    {
        $deal->loadMissing(['lead', 'contact']);

        return $this->record($deal->workspace, FunnelEvent::TYPE_ORDER_PLACED, [
            'subject_type' => Deal::class,
            'subject_id' => $deal->id,
            'contact_id' => $deal->contact_id,
            'lead_id' => $deal->lead_id,
            'deal_id' => $deal->id,
            'ad_campaign_id' => $deal->lead?->ad_campaign_id,
            'source' => $deal->source ?? $deal->lead?->source ?? $deal->contact?->source,
            'occurred_at' => $deal->created_at ?? now(),
        ]);
    }

    public function recordDealStage(Deal $deal, string $eventType): ?FunnelEvent
    {
        $deal->loadMissing(['lead', 'contact', 'stage']);

        return $this->record($deal->workspace, $eventType, [
            'subject_type' => Deal::class,
            'subject_id' => $deal->id,
            'contact_id' => $deal->contact_id,
            'lead_id' => $deal->lead_id,
            'deal_id' => $deal->id,
            'ad_campaign_id' => $deal->lead?->ad_campaign_id,
            'source' => $deal->source ?? $deal->lead?->source ?? $deal->contact?->source,
            'occurred_at' => now(),
            'meta' => ['stage_slug' => $deal->stage?->slug],
        ]);
    }

    public function recordLeadCreated(Lead $lead): ?FunnelEvent
    {
        $lead->loadMissing('contact');

        if (! filled($lead->ad_campaign_id) && ! $this->isMetaSource($lead->source)) {
            return null;
        }

        return $this->record($lead->workspace, FunnelEvent::TYPE_VISIT, [
            'subject_type' => Lead::class,
            'subject_id' => $lead->id,
            'contact_id' => $lead->contact_id,
            'lead_id' => $lead->id,
            'ad_campaign_id' => $lead->ad_campaign_id,
            'source' => $lead->source ?? 'facebook',
            'occurred_at' => $lead->created_at ?? now(),
            'meta' => ['via' => 'ad_lead', 'event' => 'lead.created'],
        ]);
    }

    public function recordLeadQualified(Lead $lead): ?FunnelEvent
    {
        $lead->loadMissing('contact');

        return $this->record($lead->workspace, FunnelEvent::TYPE_LEAD_QUALIFIED, [
            'subject_type' => Lead::class,
            'subject_id' => $lead->id,
            'contact_id' => $lead->contact_id,
            'lead_id' => $lead->id,
            'ad_campaign_id' => $lead->ad_campaign_id,
            'source' => $lead->source ?? $lead->contact?->source,
            'occurred_at' => $lead->qualified_at ?? now(),
            'meta' => ['event' => 'lead.qualified'],
        ]);
    }

    public function recordMeetingBooked(Activity $activity, ?int $leadMagnetSubmissionId = null): ?FunnelEvent
    {
        $activity->loadMissing(['contact', 'deal.lead']);
        $submission = $leadMagnetSubmissionId
            ? LeadMagnetSubmission::query()
                ->where('workspace_id', $activity->workspace_id)
                ->find($leadMagnetSubmissionId)
            : null;

        return $this->record($activity->workspace, FunnelEvent::TYPE_MEETING_BOOKED, [
            'subject_type' => Activity::class,
            'subject_id' => $activity->id,
            'contact_id' => $activity->contact_id ?: $submission?->contact_id,
            'lead_id' => $activity->deal?->lead_id ?: $submission?->lead_id,
            'deal_id' => $activity->deal_id,
            'source' => $submission
                ? 'lead_magnet'
                : ($activity->contact?->source ?: 'booking'),
            'occurred_at' => $activity->created_at ?? now(),
            'meta' => array_filter([
                'event' => 'meeting.booked',
                'schedule_id' => data_get($activity->meta, 'schedule_id'),
                'lead_magnet_submission_id' => $submission?->id,
            ], static fn (mixed $value): bool => $value !== null),
        ]);
    }

    public function isMetaSource(?string $source): bool
    {
        $value = strtolower((string) $source);

        return $value !== '' && (str_contains($value, 'meta') || str_contains($value, 'facebook') || str_contains($value, 'instagram'));
    }

    private function defaultFunnel(Workspace $workspace): ?ConversionFunnel
    {
        $funnel = ConversionFunnel::query()
            ->forWorkspace($workspace)
            ->where('is_default', true)
            ->first();

        return $funnel ?? $this->provisioner->provision($workspace);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function normalizeSource(array $attributes): ?string
    {
        if (filled($attributes['source'] ?? null)) {
            return (string) $attributes['source'];
        }

        $utm = strtolower((string) ($attributes['utm_source'] ?? ''));

        if ($utm === '') {
            return filled($attributes['ad_campaign_id'] ?? null) ? 'facebook' : 'direct';
        }

        if (str_contains($utm, 'facebook') || str_contains($utm, 'fb') || str_contains($utm, 'meta')) {
            return 'facebook';
        }

        if (str_contains($utm, 'instagram') || str_contains($utm, 'ig')) {
            return 'instagram';
        }

        if (str_contains($utm, 'google')) {
            return 'google';
        }

        return $utm;
    }
}
