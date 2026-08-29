<?php

namespace App\Jobs\LeadOs;

use App\Models\Activity;
use App\Services\LeadOs\AfterTouchDraft;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DraftAfterTouch implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public int $activityId) {}

    public function handle(AfterTouchDraft $drafts): void
    {
        $activity = Activity::query()->find($this->activityId);

        if ($activity instanceof Activity) {
            $drafts->draft($activity);
        }
    }
}
