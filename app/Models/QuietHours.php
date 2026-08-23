<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Carbon\CarbonImmutable;
use Database\Factories\QuietHoursFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

#[Fillable(['workspace_id', 'timezone', 'starts_at', 'ends_at', 'enabled'])]
class QuietHours extends Model
{
    /** @use HasFactory<QuietHoursFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public function blocks(Carbon|CarbonImmutable|null $at = null): bool
    {
        if (! $this->enabled) {
            return false;
        }

        $moment = $this->moment($at);
        $current = $moment->format('H:i');
        $start = substr((string) $this->starts_at, 0, 5);
        $end = substr((string) $this->ends_at, 0, 5);

        if ($start === $end) {
            return false;
        }

        if ($start < $end) {
            return $current >= $start && $current < $end;
        }

        return $current >= $start || $current < $end;
    }

    /**
     * When the window blocks $at, the moment sending becomes allowed again
     * (the window's end, in the quiet-hours timezone). Used by the sequence
     * runner to defer instead of fail.
     */
    public function nextAllowedAt(Carbon|CarbonImmutable|null $at = null): Carbon
    {
        $moment = $this->moment($at);

        if (! $this->blocks($moment)) {
            return $moment;
        }

        $end = substr((string) $this->ends_at, 0, 5);
        [$hour, $minute] = array_map('intval', explode(':', $end));
        $start = substr((string) $this->starts_at, 0, 5);

        $allowed = $moment->copy()->setTime($hour, $minute);

        // Overnight window (e.g. 21:00–08:00) and we are past the start:
        // the window ends tomorrow morning.
        if ($start > $end && $moment->format('H:i') >= $start) {
            $allowed->addDay();
        }

        return $allowed;
    }

    /**
     * now() is CarbonImmutable under travelTo — normalize to mutable Carbon
     * in the quiet-hours timezone either way.
     */
    protected function moment(Carbon|CarbonImmutable|null $at): Carbon
    {
        return Carbon::instance(\DateTime::createFromInterface($at ?? now()))->timezone($this->timezone);
    }
}
