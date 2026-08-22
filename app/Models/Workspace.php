<?php

namespace App\Models;

use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $timezone
 * @property Carbon|null $evolution_last_webhook_at
 * @property string|null $evolution_last_event
 */
#[Fillable([
    'name',
    'slug',
    'timezone',
    'country_code',
    'default_dial_code',
    'inbox_url',
    'evolution_last_webhook_at',
    'evolution_last_event',
])]
class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'evolution_last_webhook_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function pipelines(): HasMany
    {
        return $this->hasMany(Pipeline::class);
    }

    public function defaultPipeline(): Pipeline
    {
        return $this->pipelines()->where('is_default', true)->firstOrFail();
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    public function quietHours(): HasMany
    {
        return $this->hasMany(QuietHours::class);
    }

    public function activeQuietHours(): ?QuietHours
    {
        return $this->quietHours()->where('enabled', true)->first();
    }

    public function inboxUrl(): string
    {
        return filled($this->inbox_url)
            ? (string) $this->inbox_url
            : (string) config('evosales.inbox_url');
    }

    public function savedFilters(): HasMany
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function customAttributeDefinitions(): HasMany
    {
        return $this->hasMany(CustomAttributeDefinition::class);
    }
}
