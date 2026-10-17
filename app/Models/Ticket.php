<?php

namespace App\Models;

use App\Enums\ChannelType;
use App\Models\Concerns\BelongsToWorkspace;
use App\Services\Crm\TicketSlaWhatsApp;
use App\Support\TicketSla;
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
    'queue_id',
    'first_response_at',
    'resolved_at',
    'satisfaction_rating',
    'satisfaction_feedback',
    'satisfaction_submitted_at',
    'sla_due_at',
    'sla_breached_at',
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
            'satisfaction_rating' => 'integer',
            'satisfaction_submitted_at' => 'datetime',
            'sla_due_at' => 'datetime',
            'sla_breached_at' => 'datetime',
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

            if (! $ticket->sla_due_at && $ticket->status !== self::STATUS_CLOSED) {
                $ticket->sla_due_at = TicketSla::dueAt($ticket->priority);
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

    public function queue(): BelongsTo
    {
        return $this->belongsTo(SupportQueue::class, 'queue_id');
    }

    public function isOpen(): bool
    {
        return $this->status !== self::STATUS_CLOSED;
    }

    /**
     * Open (or reopen) the Desk thread as a ticket. One row per thread_id.
     */
    public static function openFromThread(Thread $thread, User $user): self
    {
        if (! $thread->contact_id) {
            throw new InvalidArgumentException('A ticket requires a contact.');
        }

        $thread->loadMissing(['contact', 'channel']);

        $existing = self::query()
            ->forWorkspace($thread->workspace_id)
            ->where('thread_id', $thread->id)
            ->first();

        if ($existing) {
            if (! $existing->isOpen()) {
                $existing->reopenOnInbound($user);
            }

            return $existing;
        }

        $ticket = self::query()->create([
            'workspace_id' => $thread->workspace_id,
            'contact_id' => $thread->contact_id,
            'company_id' => $thread->contact?->company_id,
            'thread_id' => $thread->id,
            'owner_id' => $user->id,
            'subject' => self::subjectFromThread($thread),
            'channel' => self::channelFromThread($thread),
        ]);

        $ticket->recordActivity('ticket_opened', 'Opened '.$ticket->number, $user);

        return $ticket;
    }

    /**
     * Inbound on a closed ticket reopens in place — never a second row.
     */
    public static function receiveInbound(Thread $thread): void
    {
        $ticket = self::query()
            ->forWorkspace($thread->workspace_id)
            ->where('thread_id', $thread->id)
            ->first();

        $ticket?->reopenOnInbound();
    }

    public function reopenOnInbound(?User $actor = null): void
    {
        $this->forceFill(['last_activity_at' => now()]);

        if ($this->status === self::STATUS_CLOSED) {
            $this->moveTo(self::STATUS_WAITING_ON_US);
            $this->recordActivity(
                'ticket_status',
                $this->number.' → '.self::statusLabel(self::STATUS_WAITING_ON_US),
                $actor,
            );

            return;
        }

        $this->save();
    }

    public function markFirstResponse(): void
    {
        if ($this->first_response_at) {
            return;
        }

        $this->forceFill([
            'first_response_at' => now(),
            'last_activity_at' => now(),
        ])->save();

        $this->markSlaBreached();
    }

    public function recordActivity(string $type, string $subject, ?User $actor = null): void
    {
        Activity::query()->create([
            'workspace_id' => $this->workspace_id,
            'contact_id' => $this->contact_id,
            'deal_id' => $this->deal_id,
            'company_id' => $this->company_id,
            'type' => $type,
            'subject' => $subject,
            'owner_id' => $actor?->id ?? $this->owner_id,
            'actor_id' => $actor?->id,
            'meta' => ['ticket_id' => $this->id],
        ]);
    }

    public static function subjectFromThread(Thread $thread): string
    {
        $snippet = trim((string) $thread->messages()
            ->where('direction', 'inbound')
            ->latest('id')
            ->value('body'));
        $snippet = trim(preg_replace('/\s+/', ' ', $snippet) ?? $snippet);

        if ($snippet === '') {
            $snippet = trim((string) $thread->subject) ?: 'WhatsApp';
        }

        if (mb_strlen($snippet) > 180) {
            return rtrim(mb_substr($snippet, 0, 177)).'…';
        }

        return $snippet;
    }

    public static function channelFromThread(Thread $thread): string
    {
        $type = $thread->channel?->type;

        return match ($type) {
            ChannelType::Email => self::CHANNEL_EMAIL,
            default => self::CHANNEL_WHATSAPP_CLOUD,
        };
    }

    public function moveTo(string $status): void
    {
        if (! in_array($status, self::STATUSES, true)) {
            throw new InvalidArgumentException('Unknown ticket status.');
        }

        $from = (string) $this->status;
        $payload = [
            'status' => $status,
            'last_activity_at' => now(),
            'resolved_at' => $status === self::STATUS_CLOSED ? now() : null,
        ];

        if ($status !== self::STATUS_CLOSED && $from === self::STATUS_CLOSED) {
            $payload['sla_due_at'] = TicketSla::dueAt($this->priority);
            $payload['sla_breached_at'] = null;
        }

        $this->forceFill($payload)->save();
    }

    public function markSlaBreached(): bool
    {
        if ($this->sla_breached_at) {
            return false;
        }

        if (TicketSla::state($this) !== 'breached') {
            return false;
        }

        $this->forceFill(['sla_breached_at' => now()])->save();
        app(TicketSlaWhatsApp::class)->notify($this);

        return true;
    }

    public function refreshSla(): void
    {
        if (! $this->isOpen() || $this->first_response_at) {
            return;
        }

        $this->sla_due_at = TicketSla::dueAt($this->priority);
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
            'sla_label' => TicketSla::label($this),
            'sla_breached' => TicketSla::state($this) === 'breached',
            'contact' => $contact ? [
                'id' => $contact->id,
                'first_name' => $contact->first_name,
                'last_name' => $contact->last_name,
            ] : null,
            'company' => $this->company ? ['id' => $this->company->id, 'name' => $this->company->name] : null,
            'owner' => $this->owner ? ['id' => $this->owner->id, 'name' => $this->owner->name] : null,
            'queue' => $this->queue ? ['id' => $this->queue->id, 'name' => $this->queue->name] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentRelated(): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'subject' => $this->subject,
            'status' => $this->status,
            'status_label' => self::statusLabel((string) $this->status),
            'priority' => $this->priority,
            'priority_label' => ucfirst((string) $this->priority),
            'url' => '/crm/tickets/'.$this->id,
        ];
    }

    /**
     * Salesforce Cases card payload: open count + numbered rows.
     *
     * @param  iterable<int, Ticket>  $tickets
     * @return array{open_count: int, rows: array<int, array<string, mixed>>}
     */
    public static function presentRelatedList(iterable $tickets, int $limit = 8): array
    {
        $collection = collect($tickets)->sortByDesc('id')->values();

        return [
            'open_count' => $collection->filter(fn (self $ticket) => $ticket->isOpen())->count(),
            'rows' => $collection->take($limit)->map->presentRelated()->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentBoard(): array
    {
        $inactiveDays = $this->inactiveDays();

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
            'sla_due_at' => $this->sla_due_at?->timezone('Africa/Algiers')->toIso8601String(),
            'sla_label' => TicketSla::label($this),
            'sla_breached' => TicketSla::state($this) === 'breached',
            'url' => '/crm/tickets/'.$this->id,
        ];
    }

    public function inactiveDays(): ?int
    {
        if (! $this->last_activity_at) {
            return null;
        }

        $from = $this->last_activity_at->timezone('Africa/Algiers')->startOfDay();
        $to = now('Africa/Algiers')->startOfDay();

        return max(0, (int) $from->diffInDays($to, false));
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
            'satisfaction_rating' => $this->satisfaction_rating,
            'satisfaction_feedback' => $this->satisfaction_feedback,
            'satisfaction_submitted_at' => $this->satisfaction_submitted_at?->timezone('Africa/Algiers')->toIso8601String(),
        ]);
    }
}
