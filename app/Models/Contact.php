<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
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
    'first_name',
    'last_name',
    'email',
    'phone',
    'phone_e164',
    'whatsapp_jid',
    'source',
    'meta',
])]
class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
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

    public function displayName(): string
    {
        return trim($this->first_name.' '.($this->last_name ?? ''));
    }
}
