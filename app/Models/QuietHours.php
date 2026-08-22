<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
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

    public function blocks(?Carbon $at = null): bool
    {
        if (! $this->enabled) {
            return false;
        }

        $moment = ($at ?? now())->copy()->timezone($this->timezone);
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
}
