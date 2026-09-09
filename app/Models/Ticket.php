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

    public const STATUS_LABELS = [
        self::STATUS_NEW => 'New',
        self::STATUS_WAITING_ON_CONTACT => 'Waiting on contact',
        self::STATUS_WAITING_ON_US => 'Waiting on us',
        self::STATUS_CLOSED => 'Closed',
    ];

    public const CHANNEL_LABELS = [
        self::CHANNEL_WHATSAPP_CLOUD => 'WhatsApp',
        self::CHANNEL_EMAIL => 'Email',
        self::CHANNEL_MANUAL => 'Manual',
    ];

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

    public function moveTo(string $status): void
    {
        if (! in_array($status, self::STATUSES, true)) {
            throw new InvalidArgumentException('Unknown ticket status.');
        }

        $this->forceFill([
            'status' => $status,
            'last_activity_at' => now(),
            'resolved_at' => $status === self::STATUS_CLOSED ? now() : null,
        ])->save();
    }

    public static function statusLabel(string $status): string
    {
        return self::STATUS_LABELS[$status] ?? $status;
    }

    /**
     * @return array<string, mixed>
     */
    public function present(): array
    {
        $contact = $this->contact;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'subject' => $this->subject,
            'status' => $this->status,
            'status_label' => self::statusLabel((string) $this->status),
            'priority' => $this->priority,
            'channel' => $this->channel,
            'channel_label' => self::CHANNEL_LABELS[$this->channel] ?? $this->channel,
            'created_at' => $this->created_at?->timezone('Africa/Algiers')->toIso8601String(),
            'last_activity_at' => $this->last_activity_at?->timezone('Africa/Algiers')->toIso8601String(),
            'sla_due_at' => $this->sla_due_at?->timezone('Africa/Algiers')->toIso8601String(),
            'contact' => $contact ? [
                'id' => $contact->id,
                'first_name' => $contact->first_name,
                'last_name' => $contact->last_name,
            ] : null,
            'company' => $this->company ? ['id' => $this->company->id, 'name' => $this->company->name] : null,
            'owner' => $this->owner ? ['id' => $this->owner->id, 'name' => $this->owner->name] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentBoard(): array
    {
        $inactiveDays = $this->last_activity_at
            ? (int) $this->last_activity_at->diffInDays(now())
            : null;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'subject' => $this->subject,
            'status' => $this->status,
            'priority' => $this->priority,
            'company_name' => $this->company?->name,
            'contact_name' => $this->contact
                ? trim($this->contact->first_name.' '.($this->contact->last_name ?? ''))
                : null,
            'owner_name' => $this->owner?->name,
            'inactive_days' => $inactiveDays,
            'is_inactive' => $inactiveDays !== null && $inactiveDays >= 2,
            'url' => '/crm/tickets/'.$this->id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentRecord(): array
    {
        return array_merge($this->present(), [
            'thread_id' => $this->thread_id,
            'deal' => $this->deal ? ['id' => $this->deal->id, 'title' => $this->deal->title] : null,
            'resolved_at' => $this->resolved_at?->timezone('Africa/Algiers')->toIso8601String(),
        ]);
    }
}
