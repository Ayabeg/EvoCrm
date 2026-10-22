<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Mailbox;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\SavedFilter;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\CrmFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Broadcast campaigns — the newsletter path. A campaign targets a CRM
 * audience (all contacts with email, or a saved contact filter), renders
 * one OutboundMessage per recipient, and sends through the same guards as
 * sequences: suppression, quiet hours, and the mailbox daily cap.
 */
class CampaignService
{
    private const AUDIENCE_CHUNK_SIZE = 250;

    public function __construct(
        private SuppressionService $suppressions,
        private QuietHoursGuard $quietHours,
        private TemplateRenderer $templates,
        private MailerFactory $mailers,
        private OutboundEligibility $eligibility,
        private CrmFilter $crmFilter,
        private ProductAnalytics $analytics,
    ) {}

    /**
     * The CRM audience for a campaign: workspace contacts that have an email
     * address, narrowed by the saved contact filter when one is attached.
     *
     * @return Collection<int, Contact>
     */
    public function audience(Workspace $workspace, ?SavedFilter $filter): Collection
    {
        return $this->audienceQuery($workspace, $filter)->get();
    }

    /**
     * Build the reusable audience query without materializing the audience.
     * Large broadcasts use chunkById below so a 50k-lead list does not become
     * a single in-memory collection.
     *
     * @return Builder<Contact>
     */
    private function audienceQuery(Workspace $workspace, ?SavedFilter $filter): Builder
    {
        $query = Contact::query()
            ->forWorkspace($workspace)
            ->whereNotNull('email')
            ->with('company');

        if ($filter && (int) $filter->workspace_id === (int) $workspace->id && $filter->entity === 'contact') {
            $this->crmFilter->applyToContacts($query, $filter->filters ?? []);
        }

        return $query->orderBy('id');
    }

    /**
     * Preview a campaign without creating messages or sending anything.
     *
     * @return array{audience_count: int, eligible_count: int, ineligible_count: int, reasons: array<string, int>, sample: list<array<string, mixed>>}
     */
    public function preview(OutboundCampaign $campaign): array
    {
        $workspace = $campaign->workspace;
        $audienceQuery = $this->audienceQuery($workspace, $campaign->savedFilter);
        $audienceCount = (clone $audienceQuery)->count();
        $reasons = [];
        $eligible = 0;
        $sample = [];

        $audienceQuery->chunkById(self::AUDIENCE_CHUNK_SIZE, function (Collection $contacts) use ($campaign, $workspace, &$reasons, &$eligible, &$sample): void {
            foreach ($contacts as $contact) {
                $reason = $this->eligibility->reason($workspace, $contact, 'email');

                if ($reason === null) {
                    $eligible++;
                } else {
                    $reasons[$reason] = ($reasons[$reason] ?? 0) + 1;
                }

                if (count($sample) < 5) {
                    $sample[] = [
                        'contact_id' => $contact->id,
                        'email' => $contact->email,
                        'eligible' => $reason === null,
                        'reason' => $reason,
                        'subject' => $this->templates->render($campaign->subject, $contact, $workspace),
                        'body_preview' => Str::limit(strip_tags((string) $this->templates->render($campaign->body, $contact, $workspace)), 180),
                    ];
                }
            }
        });

        return [
            'audience_count' => $audienceCount,
            'eligible_count' => $eligible,
            'ineligible_count' => $audienceCount - $eligible,
            'reasons' => $reasons,
            'sample' => $sample,
        ];
    }

    /**
     * Materialize the campaign into queued OutboundMessages. Suppressed
     * contacts are skipped up front (counted honestly on the campaign) and
     * re-checked at send time in case the list changed.
     */
    public function expand(OutboundCampaign $campaign): OutboundCampaign
    {
        if (! $campaign->editable()) {
            return $campaign;
        }

        $workspace = $campaign->workspace;
        $audienceQuery = $this->audienceQuery($workspace, $campaign->savedFilter);
        $audienceCount = (clone $audienceQuery)->count();

        $suppressed = 0;
        $queued = 0;

        $audienceQuery->chunkById(self::AUDIENCE_CHUNK_SIZE, function (Collection $contacts) use ($campaign, $workspace, &$suppressed, &$queued): void {
            foreach ($contacts as $contact) {
                if ($this->suppressions->isSuppressed($workspace, $contact->email, $contact->phone_e164)) {
                    $suppressed++;

                    continue;
                }

                $eligibilityReason = $this->eligibility->reason($workspace, $contact, 'email');

                if ($eligibilityReason !== null) {
                    OutboundMessage::query()->firstOrCreate(
                        [
                            'workspace_id' => $workspace->id,
                            'idempotency_key' => $this->idempotencyKey($campaign, $contact),
                        ],
                        $this->messageAttributes($campaign, $contact, 'failed', $eligibilityReason),
                    );

                    continue;
                }

                OutboundMessage::query()->firstOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'idempotency_key' => $this->idempotencyKey($campaign, $contact),
                    ],
                    $this->messageAttributes($campaign, $contact),
                );
                $queued++;
            }
        });

        $campaign->forceFill([
            'status' => OutboundCampaign::STATUS_SENDING,
            'started_at' => $campaign->started_at ?? now(),
            'scheduled_at' => $campaign->scheduled_at ?? now(),
            'audience_count' => $audienceCount,
            'suppressed_count' => $suppressed,
        ])->save();

        $this->analytics->capture(ProductAnalytics::CAMPAIGN_LAUNCHED, [
            'campaign_id' => $campaign->id,
            'audience_count' => $audienceCount,
            'queued' => $queued,
            'suppressed' => $suppressed,
        ], null, $workspace);

        return $campaign;
    }

    /**
     * Expand campaigns whose schedule is due.
     */
    public function expandDue(): int
    {
        $due = OutboundCampaign::query()
            ->where('status', OutboundCampaign::STATUS_SCHEDULED)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->with(['workspace', 'savedFilter'])
            ->get();

        foreach ($due as $campaign) {
            $this->expand($campaign);
        }

        return $due->count();
    }

    /**
     * Send due campaign messages. Quiet hours and the mailbox daily cap
     * defer (never fail); suppression fails the single message honestly.
     *
     * @return array{sent: int, deferred: int, failed: int}
     */
    public function sendDueMessages(int $limit = 100): array
    {
        $messages = OutboundMessage::query()
            ->where('direction', 'out')
            ->where('status', 'queued')
            ->whereNotNull('campaign_id')
            ->where(fn ($query) => $query->whereNull('deferred_until')->orWhere('deferred_until', '<=', now()))
            ->with(['contact.company', 'workspace', 'campaign'])
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $totals = ['sent' => 0, 'deferred' => 0, 'failed' => 0];

        foreach ($messages as $message) {
            $campaign = $message->campaign;
            $workspace = $message->workspace;
            $contact = $message->contact;

            if (! $campaign || ! $workspace || ! $contact || $campaign->status !== OutboundCampaign::STATUS_SENDING) {
                continue;
            }

            $eligibilityReason = $this->eligibility->reason($workspace, $contact, 'email');

            if ($eligibilityReason !== null) {
                $message->forceFill([
                    'status' => 'failed',
                    'failure_reason' => $eligibilityReason,
                    'deferred_until' => null,
                    'defer_reason' => null,
                ])->save();
                $totals['failed']++;

                continue;
            }

            if ($this->quietHours->blocks($workspace)) {
                $hours = $workspace->activeQuietHours();
                $message->forceFill([
                    'deferred_until' => $hours ? $hours->nextAllowedAt() : now()->addHour(),
                    'defer_reason' => 'quiet_hours',
                ])->save();
                $totals['deferred']++;

                continue;
            }

            $mailbox = $message->mailbox_id
                ? Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->find($message->mailbox_id)
                : null;
            $mailbox ??= Mailbox::query()
                ->forWorkspace($workspace)
                ->where('enabled', true)
                ->orderByDesc('is_default')
                ->first();

            if ($mailbox && $mailbox->overDailyLimit()) {
                $message->forceFill([
                    'deferred_until' => now()->addHour(),
                    'defer_reason' => 'daily_cap',
                ])->save();
                $totals['deferred']++;

                continue;
            }

            if ($mailbox && (int) $message->mailbox_id !== (int) $mailbox->id) {
                $message->forceFill(['mailbox_id' => $mailbox->id])->save();
            }

            $message->forceFill(['deferred_until' => null, 'defer_reason' => null])->save();

            $sent = $this->mailers->for($workspace, $mailbox)->send($message);
            $totals[$sent->status === 'sent' ? 'sent' : 'failed']++;

            if ($sent->status === 'sent') {
                $this->analytics->capture(ProductAnalytics::EMAIL_SENT, [
                    'message_id' => $sent->id,
                    'channel' => $sent->channel,
                    'contact_id' => $sent->contact_id,
                    'campaign_id' => $sent->campaign_id,
                ], null, $workspace);
            }
        }

        $this->completeFinishedCampaigns();

        return $totals;
    }

    private function idempotencyKey(OutboundCampaign $campaign, Contact $contact): string
    {
        return "campaign:{$campaign->id}:contact:{$contact->id}";
    }

    /**
     * @return array<string, mixed>
     */
    private function messageAttributes(
        OutboundCampaign $campaign,
        Contact $contact,
        string $status = 'queued',
        ?string $failureReason = null,
    ): array {
        $workspace = $campaign->workspace;

        return [
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'mailbox_id' => $campaign->mailbox_id,
            'campaign_id' => $campaign->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $contact->email,
            'subject' => $this->templates->render($campaign->subject, $contact, $workspace),
            'body' => $this->templates->render($campaign->body, $contact, $workspace),
            'body_html' => $this->templates->render($campaign->body_html, $contact, $workspace),
            'status' => $status,
            'failure_reason' => $failureReason,
            'idempotency_key' => $this->idempotencyKey($campaign, $contact),
        ];
    }

    /**
     * A sending campaign with nothing left queued is done.
     */
    protected function completeFinishedCampaigns(): void
    {
        OutboundCampaign::query()
            ->where('status', OutboundCampaign::STATUS_SENDING)
            ->whereDoesntHave('messages', fn ($query) => $query->where('direction', 'out')->where('status', 'queued'))
            ->update(['status' => OutboundCampaign::STATUS_SENT, 'sent_at' => now()]);
    }
}
