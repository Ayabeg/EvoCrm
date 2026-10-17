<?php

namespace App\Http\Controllers\Api\V1\Support;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\Deal;
use App\Models\Device;
use App\Models\Lead;
use App\Models\Message;
use App\Models\Quote;
use App\Models\RecordRelationship;
use App\Models\Thread;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ApiPayload
{
    /**
     * @return array<string, mixed>
     */
    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->value,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function workspace(Workspace $workspace): array
    {
        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'slug' => $workspace->slug,
            'timezone' => $workspace->timezone,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function contact(Contact $contact, bool $details = false): array
    {
        $contact->loadMissing(['company:id,name', 'owner:id,name']);

        $payload = [
            'id' => $contact->id,
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'display_name' => $contact->displayName(),
            'email' => $contact->email,
            'phone' => $contact->phone,
            'phone_e164' => $contact->phone_e164,
            'city' => $contact->city,
            'wilaya' => $contact->wilaya,
            'lead_status' => $contact->lead_status,
            'company_id' => $contact->company_id,
            'company_name' => $contact->company?->name,
            'owner_id' => $contact->owner_id,
            'owner_name' => $contact->owner?->name,
            'source' => $contact->source,
            'source_detail' => $contact->source_detail,
            'source_campaign' => $contact->source_campaign,
            'source_medium' => $contact->source_medium,
            'first_touch_at' => $contact->first_touch_at?->toIso8601String(),
            'last_touch_at' => $contact->last_touch_at?->toIso8601String(),
            'last_activity_at' => $contact->last_activity_at?->toIso8601String(),
            'created_at' => $contact->created_at?->toIso8601String(),
            'updated_at' => $contact->updated_at?->toIso8601String(),
        ];

        if (! $details) {
            return $payload;
        }

        $contact->loadMissing([
            'consents',
            'incomingRelationships.fromRecord',
            'outgoingRelationships.toRecord',
        ]);

        return array_merge($payload, [
            'consents' => $contact->consents
                ->map(fn (ContactConsent $consent): array => [
                    'id' => $consent->id,
                    'channel' => $consent->channel,
                    'purpose' => $consent->purpose,
                    'status' => $consent->status,
                    'source' => $consent->source,
                    'captured_at' => $consent->captured_at?->toIso8601String(),
                    'expires_at' => $consent->expires_at?->toIso8601String(),
                    'revoked_at' => $consent->revoked_at?->toIso8601String(),
                    'granted' => $consent->isGranted(),
                ])
                ->values()
                ->all(),
            'relationships' => $contact->outgoingRelationships
                ->map(fn (RecordRelationship $relationship): array => self::relationship($relationship, 'outgoing'))
                ->concat($contact->incomingRelationships->map(
                    fn (RecordRelationship $relationship): array => self::relationship($relationship, 'incoming')
                ))
                ->values()
                ->all(),
            'timeline' => self::contactTimeline($contact),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function contactTimeline(Contact $contact): array
    {
        $activities = Activity::query()
            ->forWorkspace($contact->workspace_id)
            ->with(['contact', 'deal', 'owner', 'actor'])
            ->where('contact_id', $contact->id)
            ->latest()
            ->limit(80)
            ->get()
            ->map(fn (Activity $activity): array => self::activity($activity));

        $messages = Message::query()
            ->forWorkspace($contact->workspace_id)
            ->with(['user', 'thread.channel'])
            ->where('contact_id', $contact->id)
            ->latest()
            ->limit(80)
            ->get()
            ->map(fn (Message $message): array => array_merge(self::message($message), [
                'timeline_type' => $message->direction === 'inbound' ? 'inbound_message' : 'outbound_message',
                'actor_name' => $message->user?->name,
                'channel' => $message->thread?->channel?->type?->value,
            ]));

        return $activities
            ->concat($messages)
            ->sortByDesc('created_at')
            ->take(80)
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private static function relationship(RecordRelationship $relationship, string $direction): array
    {
        $record = $direction === 'outgoing' ? $relationship->toRecord : $relationship->fromRecord;
        $label = match (true) {
            $record instanceof Contact => $record->displayName(),
            $record instanceof Company => $record->name,
            $record instanceof Deal => $record->title,
            $record instanceof Lead => $record->title,
            default => null,
        };

        return [
            'id' => $relationship->id,
            'direction' => $direction,
            'relationship_type' => $relationship->relationship_type,
            'record_type' => $record ? class_basename($record) : null,
            'record_id' => $record?->getKey(),
            'record_label' => $label,
            'meta' => $relationship->meta,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function deal(Deal $deal): array
    {
        $deal->loadMissing(['stage', 'contact', 'company', 'owner']);

        return [
            'id' => $deal->id,
            'title' => $deal->title,
            'amount_cents' => (int) $deal->amount_cents,
            'currency' => $deal->currency ?? 'DZD',
            'pipeline_id' => $deal->pipeline_id,
            'stage_id' => $deal->stage_id,
            'stage' => $deal->stage ? [
                'id' => $deal->stage->id,
                'name' => $deal->stage->name,
                'slug' => $deal->stage->slug,
                'is_won' => (bool) $deal->stage->is_won,
                'is_lost' => (bool) $deal->stage->is_lost,
            ] : null,
            'contact_id' => $deal->contact_id,
            'contact_name' => $deal->contact?->displayName(),
            'company_id' => $deal->company_id,
            'company_name' => $deal->company?->name,
            'owner_id' => $deal->owner_id,
            'owner_name' => $deal->owner?->name,
            'source' => $deal->source,
            'priority' => $deal->priority,
            'lost_reason' => $deal->lost_reason,
            'close_date' => $deal->close_date?->toDateString(),
            'next_step' => $deal->next_step,
            'last_activity_at' => $deal->last_activity_at?->toIso8601String(),
            'created_at' => $deal->created_at?->toIso8601String(),
            'updated_at' => $deal->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function lead(Lead $lead): array
    {
        $lead->loadMissing(['contact', 'company', 'deal.stage', 'latestScore']);

        return [
            'id' => $lead->id,
            'title' => $lead->title,
            'status' => $lead->status,
            'source' => $lead->source,
            'source_detail' => $lead->source_detail,
            'source_campaign' => $lead->source_campaign,
            'source_medium' => $lead->source_medium,
            'score' => $lead->score,
            'contact_id' => $lead->contact_id,
            'contact_name' => $lead->contact?->displayName(),
            'company_id' => $lead->company_id,
            'deal_id' => $lead->deal?->id,
            'qualified_at' => $lead->qualified_at?->toIso8601String(),
            'first_touch_at' => $lead->first_touch_at?->toIso8601String(),
            'last_touch_at' => $lead->last_touch_at?->toIso8601String(),
            'created_at' => $lead->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function activity(Activity $activity): array
    {
        $activity->loadMissing(['contact', 'deal', 'owner']);

        return [
            'id' => $activity->id,
            'type' => $activity->type,
            'subject' => $activity->subject,
            'body' => $activity->body,
            'due_at' => $activity->due_at?->toIso8601String(),
            'done' => (bool) $activity->done,
            'completed_at' => $activity->completed_at?->toIso8601String(),
            'contact_id' => $activity->contact_id,
            'deal_id' => $activity->deal_id,
            'company_id' => $activity->company_id,
            'owner_id' => $activity->owner_id,
            'owner_name' => $activity->owner?->name,
            'created_at' => $activity->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function quote(Quote $quote): array
    {
        $quote->loadMissing(['items', 'deal.contact']);

        return [
            'id' => $quote->id,
            'deal_id' => $quote->deal_id,
            'status' => $quote->status,
            'currency' => $quote->currency,
            'total_cents' => (int) $quote->total_cents,
            'notes' => $quote->notes,
            'expires_at' => $quote->expires_at?->toIso8601String(),
            'sent_at' => $quote->sent_at?->toIso8601String(),
            'accepted_at' => $quote->accepted_at?->toIso8601String(),
            'revoked_at' => $quote->revoked_at?->toIso8601String(),
            'public_url' => $quote->public_token ? url('/q/'.$quote->public_token) : null,
            'items' => $quote->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => (int) $item->quantity,
                'unit_cents' => (int) $item->unit_cents,
                'total_cents' => (int) $item->total_cents,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function thread(Thread $thread): array
    {
        $thread->loadMissing(['contact', 'channel']);

        return [
            'id' => $thread->id,
            'subject' => $thread->subject,
            'status' => $thread->status,
            'contact_id' => $thread->contact_id,
            'contact_name' => $thread->contact?->displayName(),
            'channel' => $thread->channel?->type?->value,
            'last_message_at' => $thread->last_message_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function message(Message $message): array
    {
        return [
            'id' => $message->id,
            'thread_id' => $message->thread_id,
            'direction' => $message->direction,
            'type' => $message->type,
            'body' => $message->body,
            'status' => $message->status,
            'provider' => $message->provider,
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function device(Device $device): array
    {
        return [
            'id' => $device->id,
            'platform' => $device->platform,
            'provider' => $device->provider,
            'last_seen_at' => $device->last_seen_at?->toIso8601String(),
        ];
    }

    /**
     * @param  LengthAwarePaginator<int, mixed>  $paginator
     * @return array{current_page: int, per_page: int, total: int, last_page: int}
     */
    public static function pagination(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
