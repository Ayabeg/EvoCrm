<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'workspace_id',
    'user_id',
    'slug',
    'enabled',
    'slot_minutes',
    'timezone',
    'work_start',
    'work_end',
    'weekdays',
    'location_note',
    'intro',
])]
class MeetingSchedule extends Model
{
    use BelongsToWorkspace;

    public const SLOT_MINUTES = [30, 45, 60];

    public const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

    public const TIMEZONE = 'Africa/Algiers';

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'weekdays' => 'array',
            'slot_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return list<int>
     */
    public function weekdayList(): array
    {
        $days = $this->weekdays ?: self::DEFAULT_WEEKDAYS;

        return array_values(array_map('intval', $days));
    }

    public function publicUrl(): string
    {
        return url('/book/'.$this->slug);
    }

    public static function forUser(User $user): self
    {
        $existing = self::query()->where('user_id', $user->id)->first();

        if ($existing) {
            return $existing;
        }

        return self::query()->create([
            'workspace_id' => $user->workspace_id,
            'user_id' => $user->id,
            'slug' => self::uniqueSlug($user),
            'enabled' => true,
            'slot_minutes' => 30,
            'timezone' => self::TIMEZONE,
            'work_start' => '09:00',
            'work_end' => '17:00',
            'weekdays' => self::DEFAULT_WEEKDAYS,
        ]);
    }

    public static function uniqueSlug(User $user, ?string $preferred = null): string
    {
        $base = Str::slug($preferred ?: $user->name) ?: 'book';
        $slug = $base;
        $i = 2;

        while (self::query()->where('slug', $slug)->where('user_id', '!=', $user->id)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
