<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\TicketFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use InvalidArgumentException;

#[Fillable([
    'workspace_id',
    'number',
    'subject',
    'status',
    'priority',
    'channel',
    'contact_id',
    'company_id',
    'deal_id',
    'thread_id',
    'owner_id',
    'first_response_at',
    'resolved_at',
    'sla_due_at',
    'last_activity_at',
])]
class Ticket extends Model
{
    /** @use HasFactory<TicketFactory> */
    use BelongsToWorkspace, HasFactory;

    public const STATUS_NEW = 'new';

    public const STATUS_WAITING_ON_CONTACT = 'waiting_on_contact';

    public const STATUS_WAITING_ON_US = 'waiting_on_us';

    public const STATUS_CLOSED = 'closed';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_WAITING_ON_CONTACT,
        self::STATUS_WAITING_ON_US,
        self::STATUS_CLOSED,
    ];

    public const PRIORITY_LOW = 'low';

    public const PRIORITY_MEDIUM = 'medium';

    public const PRIORITY_HIGH = 'high';

    public const CHANNEL_WHATSAPP_CLOUD = 'whatsapp_cloud';

    public const CHANNEL_EMAIL = 'email';

    public const CHANNEL_MANUAL = 'manual';

    protected function casts(): array
    {
        return [
            'first_response_at' => 'datetime',
            'resolved_at' => 'datetime',
            'sla_due_at' => 'datetime',
            'last_activity_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket): void {
            if (! $ticket->contact_id) {
                throw new InvalidArgumentException('A ticket requires a contact.');
            }

            if (! in_array($ticket->status ?: self::STATUS_NEW, self::STATUSES, true)) {
                throw new InvalidArgumentException('Unknown ticket status.');
            }

            $ticket->status = $ticket->status ?: self::STATUS_NEW;
            $ticket->priority = $ticket->priority ?: self::PRIORITY_MEDIUM;
            $ticket->channel = $ticket->channel ?: self::CHANNEL_MANUAL;
            $ticket->last_activity_at = $ticket->last_activity_at ?: now();
            $ticket->subject = trim((string) $ticket->subject);

            if ($ticket->subject === '') {
                throw new InvalidArgumentException('A ticket requires a subject.');
            }

            if (! $ticket->company_id) {
                $ticket->company_id = Contact::query()->whereKey($ticket->contact_id)->value('company_id');
            }

            if (! $ticket->number) {
                $ticket->number = self::nextNumber((int) $ticket->workspace_id);
            }
        });
    }

    public static function nextNumber(Workspace|int $workspace): string
    {
        $id = $workspace instanceof Workspace ? $workspace->id : $workspace;

        $last = self::query()
            ->forWorkspace($id)
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('number');

        $seq = 0;
        if (is_string($last) && preg_match('/^EVO-(\d+)$/', $last, $match) === 1) {
            $seq = (int) $match[1];
        }

        return 'EVO-'.str_pad((string) ($seq + 1), 6, '0', STR_PAD_LEFT);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function isOpen(): bool
    {
        return $this->status !== self::STATUS_CLOSED;
    }
}
