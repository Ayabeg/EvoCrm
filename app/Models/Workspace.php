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

    public function mailboxes(): HasMany
    {
        return $this->hasMany(Mailbox::class);
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

    /**
     * Embed source for the in-app desk at /inbox. Null when no desk URL is
     * configured — the /inbox page then renders the native CRM desk instead
     * of an iframe, so operators never leave the CRM hostname.
     */
    public function inboxEmbedUrl(): ?string
    {
        $base = $this->inboxUrl();

        if (! filled($base)) {
            return null;
        }

        $path = '/'.ltrim((string) config('evosales.inbox_embed_path', '/'), '/');

        return rtrim($base, '/').($path === '/' ? '/' : $path);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function integration(string $provider): ?Integration
    {
        return $this->integrations()->where('provider', $provider)->first();
    }

    public function connectors(): HasMany
    {
        return $this->hasMany(Connector::class);
    }

    public function savedFilters(): HasMany
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class);
    }

    public function dashboards(): HasMany
    {
        return $this->hasMany(Dashboard::class);
    }

    public function customAttributeDefinitions(): HasMany
    {
        return $this->hasMany(CustomAttributeDefinition::class);
    }

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
