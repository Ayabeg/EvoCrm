<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\Workspace;
use App\Support\AlgerianPhone;
use Illuminate\Validation\ValidationException;

class ContactIdentity
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function findOrCreate(Workspace $workspace, array $attributes): Contact
    {
        $phone = AlgerianPhone::normalize($attributes['phone_e164'] ?? $attributes['phone'] ?? null);
        $email = isset($attributes['email']) ? strtolower(trim((string) $attributes['email'])) : null;
        $email = $email !== '' ? $email : null;

        $contact = null;

        if ($phone) {
            $contact = Contact::query()->forWorkspace($workspace)->where('phone_e164', $phone)->first();
        }

        if (! $contact && $email) {
            $contact = Contact::query()->forWorkspace($workspace)->where('email', $email)->first();
        }

        if ($contact) {
            $contact->fill(array_filter([
                'first_name' => $attributes['first_name'] ?? $contact->first_name,
                'last_name' => $attributes['last_name'] ?? $contact->last_name,
                'company_id' => $attributes['company_id'] ?? $contact->company_id,
                'phone' => $attributes['phone'] ?? $contact->phone,
                'email' => $email ?? $contact->email,
                'source' => $contact->source ?? ($attributes['source'] ?? null),
                'source_detail' => $contact->source_detail ?? ($attributes['source_detail'] ?? null),
                'source_campaign' => $contact->source_campaign ?? ($attributes['source_campaign'] ?? null),
                'source_medium' => $contact->source_medium ?? ($attributes['source_medium'] ?? null),
            ], fn ($value) => $value !== null && $value !== ''));
            $contact->save();

            return $contact;
        }

        return Contact::query()->create([
            'workspace_id' => $workspace->id,
            'company_id' => $attributes['company_id'] ?? null,
            'owner_id' => $attributes['owner_id'] ?? null,
            'first_name' => $attributes['first_name'] ?? 'Contact',
            'last_name' => $attributes['last_name'] ?? null,
            'email' => $email,
            'phone' => $attributes['phone'] ?? $phone,
            'phone_e164' => $phone,
            'city' => $attributes['city'] ?? null,
            'wilaya' => $attributes['wilaya'] ?? null,
            'source' => $attributes['source'] ?? null,
            'source_detail' => $attributes['source_detail'] ?? null,
            'source_campaign' => $attributes['source_campaign'] ?? null,
            'source_medium' => $attributes['source_medium'] ?? null,
            'lead_status' => $attributes['lead_status'] ?? null,
            'meta' => $attributes['meta'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createUnique(Workspace $workspace, array $attributes): Contact
    {
        $phone = AlgerianPhone::normalize($attributes['phone'] ?? $attributes['phone_e164'] ?? null);
        $email = isset($attributes['email']) ? strtolower(trim((string) $attributes['email'])) : null;
        $email = $email !== '' ? $email : null;

        if ($phone && Contact::query()->forWorkspace($workspace)->where('phone_e164', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => 'A contact with this phone already exists in the workspace.',
            ]);
        }

        if ($email && Contact::query()->forWorkspace($workspace)->where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'A contact with this email already exists in the workspace.',
            ]);
        }

        return $this->findOrCreate($workspace, $attributes);
    }
}
