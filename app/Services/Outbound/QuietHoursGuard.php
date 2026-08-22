<?php

namespace App\Services\Outbound;

use App\Models\QuietHours;
use App\Models\Workspace;
use Illuminate\Support\Carbon;

class QuietHoursGuard
{
    public function blocks(Workspace $workspace, ?Carbon $at = null): bool
    {
        $hours = $workspace->activeQuietHours();

        if (! $hours instanceof QuietHours) {
            return false;
        }

        return $hours->blocks($at);
    }
}
