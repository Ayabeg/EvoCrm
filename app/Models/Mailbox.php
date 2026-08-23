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
    'last_tested_at',
])]
#[Hidden(['password', 'imap_password'])]
class Mailbox extends Model
{
    /** @use HasFactory<MailboxFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'imap_password' => 'encrypted',
            'is_default' => 'boolean',
            'enabled' => 'boolean',
            'daily_limit' => 'integer',
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
}
