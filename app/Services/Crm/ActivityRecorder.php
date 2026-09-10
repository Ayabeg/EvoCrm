<?php

namespace App\Services\Crm;

use App\Jobs\LeadOs\DraftAfterTouch;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Models\Workspace;

class ActivityRecorder
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function record(Workspace $workspace, array $attributes, ?User $actor = null): Activity
    {
        $type = $attributes['type'] ?? 'note';

        $activity = Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => $type,
            'provider' => $attributes['provider'] ?? null,
            'provider_event_id' => $attributes['provider_event_id'] ?? null,
            'subject' => $attributes['subject'] ?? null,
            'body' => $attributes['body'] ?? null,
            'due_at' => $attributes['due_at'] ?? null,
            'done' => (bool) ($attributes['done'] ?? false),
            'completed_at' => ! empty($attributes['done']) ? now() : null,
            'owner_id' => $attributes['owner_id'] ?? $actor?->id,
            'actor_id' => $actor?->id,
            'contact_id' => $attributes['contact_id'] ?? null,
            'deal_id' => $attributes['deal_id'] ?? null,
            'company_id' => $attributes['company_id'] ?? null,
            'meta' => $attributes['meta'] ?? null,
        ]);

        $this->touch($activity);

        if ($activity->deal_id && in_array($activity->type, ['note', 'call', 'email', 'whatsapp'], true)) {
            DraftAfterTouch::dispatch($activity->id);
        }

        return $activity;
    }

    public function touch(Activity $activity): void
    {
        $stamp = now();

        if ($activity->contact_id) {
            Contact::query()->whereKey($activity->contact_id)->update(['last_activity_at' => $stamp]);
        }

        if ($activity->deal_id) {
            Deal::query()->whereKey($activity->deal_id)->update(['last_activity_at' => $stamp]);
        }

        if ($activity->company_id) {
            Company::query()->whereKey($activity->company_id)->update(['updated_at' => $stamp]);
        }
    }
}
