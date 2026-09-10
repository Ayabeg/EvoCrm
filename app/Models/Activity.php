<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'type',
    'provider',
    'provider_event_id',
    'subject',
    'body',
    'due_at',
    'completed_at',
    'done',
    'owner_id',
    'actor_id',
    'contact_id',
    'deal_id',
    'company_id',
    'meta',
])]
class Activity extends Model
{
    use BelongsToWorkspace;

    public const ATTENDANCE_SHOW = 'show';

    public const ATTENDANCE_NO_SHOW = 'no_show';

    /**
     * @var list<string>
     */
    public const ATTENDANCES = [
        self::ATTENDANCE_SHOW,
        self::ATTENDANCE_NO_SHOW,
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'done' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function markDone(): void
    {
        $this->forceFill([
            'done' => true,
            'completed_at' => now(),
        ])->save();
    }

    public function attendance(): ?string
    {
        $value = $this->meta['attendance'] ?? null;

        return in_array($value, self::ATTENDANCES, true) ? $value : null;
    }

    public function wasReminded(): bool
    {
        return filled($this->meta['reminded_at'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public function mergeMeta(array $values): void
    {
        $this->forceFill(['meta' => array_merge($this->meta ?? [], $values)])->save();
    }

    public function markAttendance(string $attendance): bool
    {
        if (! in_array($attendance, self::ATTENDANCES, true)) {
            return false;
        }

        if ($this->attendance() === $attendance) {
            return false;
        }

        $meta = $this->meta ?? [];
        $meta['attendance'] = $attendance;

        $this->forceFill([
            'meta' => $meta,
            'done' => true,
            'completed_at' => $this->completed_at ?? now(),
        ])->save();

        return true;
    }
}
