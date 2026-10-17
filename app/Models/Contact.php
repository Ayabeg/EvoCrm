<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Models\Concerns\HasRecordRelationships;
use App\Support\AlgerianPhone;
use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'company_id',
    'owner_id',
    'first_name',
    'last_name',
    'email',
    'phone',
    'phone_e164',
    'whatsapp_jid',
    'city',
    'wilaya',
    'source',
    'source_detail',
    'source_campaign',
    'source_medium',
    'lead_status',
    'external_id',
    'meta',
    'last_activity_at',
    'first_touch_at',
    'last_touch_at',
    'unanswered',
])]
class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use BelongsToWorkspace, HasFactory, HasRecordRelationships;

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'last_activity_at' => 'datetime',
            'first_touch_at' => 'datetime',
            'last_touch_at' => 'datetime',
            'unanswered' => 'boolean',
        ];
    }

    protected $appends = ['display_name'];

    public function getDisplayNameAttribute(): string
    {
        return $this->displayName();
    }

    protected static function booted(): void
    {
        static::saving(function (Contact $contact): void {
            $email = is_string($contact->email) ? strtolower(trim($contact->email)) : null;
            $contact->email = $email !== '' ? $email : null;

            $normalized = AlgerianPhone::normalize($contact->phone_e164 ?: $contact->phone);
            $contact->phone_e164 = $normalized;
            $contact->whatsapp_jid = AlgerianPhone::toWhatsAppJid($normalized);
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class)->latest();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function outboundMessages(): HasMany
    {
        return $this->hasMany(OutboundMessage::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->latest();
    }

    public function consents(): HasMany
    {
        return $this->hasMany(ContactConsent::class);
    }

    public function displayName(): string
    {
        $first = trim((string) $this->first_name);
        $last = trim((string) ($this->last_name ?? ''));

        if ($last === '' || strcasecmp($last, $first) === 0) {
            return $first;
        }

        if ($first !== '' && str_contains($first, $last)) {
            return $first;
        }

        return trim($first.' '.$last);
    }
}
