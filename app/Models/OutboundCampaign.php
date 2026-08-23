<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\OutboundCampaignFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One-shot broadcast (the newsletter path): a template + mailbox sent to a
 * CRM audience — all contacts with email, or a saved contact filter. Every
 * recipient becomes an OutboundMessage so the outbox stays the single log.
 */
#[Fillable([
    'workspace_id',
    'name',
    'status',
    'saved_filter_id',
    'template_id',
    'mailbox_id',
    'subject',
    'body',
    'body_html',
    'scheduled_at',
    'started_at',
    'sent_at',
    'audience_count',
    'suppressed_count',
    'created_by',
])]
class OutboundCampaign extends Model
{
    /** @use HasFactory<OutboundCampaignFactory> */
    use BelongsToWorkspace, HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_SENDING = 'sending';

    public const STATUS_SENT = 'sent';

    public const STATUS_CANCELLED = 'cancelled';

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'sent_at' => 'datetime',
            'audience_count' => 'integer',
            'suppressed_count' => 'integer',
        ];
    }

    public function savedFilter(): BelongsTo
    {
        return $this->belongsTo(SavedFilter::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(OutboundTemplate::class);
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(OutboundMessage::class, 'campaign_id');
    }

    public function editable(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SCHEDULED], true);
    }

    public function cancellable(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SCHEDULED, self::STATUS_SENDING], true);
    }

    /**
     * Live per-status message counts for the list/detail pages.
     *
     * @return array{queued: int, deferred: int, sent: int, failed: int, opened: int, clicked: int, replied: int}
     */
    public function messageCounts(): array
    {
        $rows = $this->messages()
            ->where('direction', 'out')
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $queued = (int) ($rows['queued'] ?? 0);

        return [
            'queued' => $queued,
            'deferred' => $this->messages()
                ->where('direction', 'out')
                ->where('status', 'queued')
                ->whereNotNull('deferred_until')
                ->where('deferred_until', '>', now())
                ->count(),
            'sent' => (int) ($rows['sent'] ?? 0),
            'failed' => (int) ($rows['failed'] ?? 0),
            'opened' => $this->messages()->where('direction', 'out')->whereNotNull('opened_at')->count(),
            'clicked' => $this->messages()->where('direction', 'out')->whereNotNull('clicked_at')->count(),
            'replied' => $this->messages()->where('direction', 'out')->whereNotNull('replied_at')->count(),
        ];
    }
}
