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
 * @property bool $simple_mode
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
    'simple_mode',
    'evolution_last_webhook_at',
    'evolution_last_event',
    'lead_score_settings',
    'monthly_quota_cents',
    'meeting_wa_templates',
])]
class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'evolution_last_webhook_at' => 'datetime',
            'simple_mode' => 'boolean',
            'lead_score_settings' => 'array',
            'monthly_quota_cents' => 'integer',
            'meeting_wa_templates' => 'array',
        ];
    }

    /**
     * Qualify thresholds. Crossing convert uses LeadConverter — never a second path.
     *
     * @return array{hold: int, qualify: int, convert: int}
     */
    public function leadScoreThresholds(): array
    {
        $defaults = config('evosales.lead_score', [
            'hold' => 40,
            'qualify' => 60,
            'convert' => 80,
        ]);
        $stored = is_array($this->lead_score_settings) ? $this->lead_score_settings : [];

        return [
            'hold' => $this->thresholdValue($stored['hold'] ?? $defaults['hold'] ?? 40),
            'qualify' => $this->thresholdValue($stored['qualify'] ?? $defaults['qualify'] ?? 60),
            'convert' => $this->thresholdValue($stored['convert'] ?? $defaults['convert'] ?? 80),
        ];
    }

    private function thresholdValue(mixed $value): int
    {
        return max(0, min(100, (int) $value));
    }

    /**
     * Meta-approved Cloud template names for meeting confirm + reminder.
     *
     * @return array{booked: string, reminder: string, quote: string, sla: string, language: string}
     */
    public function meetingWhatsAppConfig(): array
    {
        $stored = is_array($this->meeting_wa_templates) ? $this->meeting_wa_templates : [];
        $booked = array_key_exists('booked', $stored) ? $stored['booked'] : 'meeting_booked';
        $reminder = array_key_exists('reminder', $stored) ? $stored['reminder'] : 'meeting_reminder';
        $quote = array_key_exists('quote', $stored) ? $stored['quote'] : 'quote_accepted';
        $sla = array_key_exists('sla', $stored) ? $stored['sla'] : 'ticket_sla';
        $language = array_key_exists('language', $stored) ? $stored['language'] : (string) config('evolution.meta.language', 'fr');

        return [
            'booked' => $this->sanitizeMeetingTemplateName($booked),
            'reminder' => $this->sanitizeMeetingTemplateName($reminder),
            'quote' => $this->sanitizeMeetingTemplateName($quote),
            'sla' => $this->sanitizeMeetingTemplateName($sla),
            'language' => $this->sanitizeMeetingTemplateLanguage($language),
        ];
    }

    public function meetingTemplateName(string $kind): string
    {
        $config = $this->meetingWhatsAppConfig();

        return match ($kind) {
            'meeting_reminder', 'reminder' => $config['reminder'],
            'quote_accepted', 'quote' => $config['quote'],
            'ticket_sla', 'sla' => $config['sla'],
            default => $config['booked'],
        };
    }

    public function meetingTemplateLanguage(): string
    {
        return $this->meetingWhatsAppConfig()['language'];
    }

    private function sanitizeMeetingTemplateName(mixed $name): string
    {
        $value = strtolower(trim((string) $name));

        if ($value === '' || ! preg_match('/^[a-z0-9_]{1,512}$/', $value)) {
            return '';
        }

        return $value;
    }

    private function sanitizeMeetingTemplateLanguage(mixed $language): string
    {
        $value = strtolower(trim((string) $language));

        return in_array($value, ['fr', 'ar', 'en'], true) ? $value : 'fr';
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

    public function webhookEndpoints(): HasMany
    {
        return $this->hasMany(WebhookEndpoint::class);
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

    public function savedReports(): HasMany
    {
        return $this->hasMany(SavedReport::class);
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

    /** @return HasMany<ConversionFunnel, $this> */
    public function conversionFunnels(): HasMany
    {
        return $this->hasMany(ConversionFunnel::class);
    }
}
