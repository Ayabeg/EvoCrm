<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\MailboxFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'source',
    'name',
    'from_name',
    'from_address',
    'host',
    'port',
    'encryption',
    'username',
    'password',
    'imap_host',
    'imap_port',
    'imap_encryption',
    'imap_username',
    'imap_password',
    'is_default',
    'enabled',
    'status',
    'daily_limit',
    'warmup_day',
    'warmup_ceiling',
    'warmup_previous_limit',
    'warmup_started_at',
    'warmup_last_advanced_on',
    'warmup_peers',
    'warmup_opted_in',
    'last_tested_at',
])]
#[Hidden(['password', 'imap_password'])]
class Mailbox extends Model
{
    /** @use HasFactory<MailboxFactory> */
    use BelongsToWorkspace, HasFactory;

    public const SOURCE_MANUAL = 'manual';

    public const SOURCE_MAIL_STACK = 'mail_stack';

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'imap_password' => 'encrypted',
            'is_default' => 'boolean',
            'enabled' => 'boolean',
            'daily_limit' => 'integer',
            'warmup_day' => 'integer',
            'warmup_ceiling' => 'integer',
            'warmup_previous_limit' => 'integer',
            'warmup_started_at' => 'datetime',
            'warmup_last_advanced_on' => 'date',
            'warmup_peers' => 'boolean',
            'warmup_opted_in' => 'boolean',
            'last_tested_at' => 'datetime',
        ];
    }

    /**
     * Lifecycle shown in the UI: disabled → warming → active. A disabled
     * mailbox never sends; the dispatcher falls through to DisabledMailer.
     */
    public function effectiveStatus(): string
    {
        if (! $this->enabled) {
            return 'disabled';
        }

        return $this->status === 'disabled' ? 'active' : $this->status;
    }

    public function imapConfigured(): bool
    {
        return filled($this->imap_host) && filled($this->imap_username);
    }

    /**
     * Synced from the live mail stack. Operators edit warmup/limits here but
     * cannot delete the record — remove the mailbox on the stack instead,
     * otherwise the next sync brings it back.
     */
    public function isMailStack(): bool
    {
        return $this->source === self::SOURCE_MAIL_STACK;
    }

    public function sentToday(): int
    {
        return OutboundMessage::query()
            ->where('mailbox_id', $this->id)
            ->where('direction', 'out')
            ->where('status', 'sent')
            ->whereDate('sent_at', now()->toDateString())
            ->count();
    }

    public function overDailyLimit(): bool
    {
        return $this->daily_limit > 0 && $this->sentToday() >= $this->daily_limit;
    }

    public function warming(): bool
    {
        return $this->enabled && $this->effectiveStatus() === 'warming';
    }

    public function remainingToday(): int
    {
        return max(0, $this->daily_limit - $this->sentToday());
    }

    /**
     * Bounce/fail rate over a trailing window, from this workspace's own
     * OutboundMessage log — failures divided by dispatch attempts.
     */
    public function failRate(int $days = 14): float
    {
        $attempts = OutboundMessage::query()
            ->where('mailbox_id', $this->id)
            ->where('direction', 'out')
            ->whereIn('status', ['sent', 'failed'])
            ->where('created_at', '>=', now()->subDays($days));

        $total = (clone $attempts)->count();

        if ($total === 0) {
            return 0.0;
        }

        $failed = (clone $attempts)->where('status', 'failed')->count();

        return round($failed / $total * 100, 1);
    }
}
