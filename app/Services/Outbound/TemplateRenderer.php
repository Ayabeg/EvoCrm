<?php

namespace App\Services\Outbound;

use App\Models\Contact;

/**
 * Renders {{variable}} placeholders in email subjects and bodies against a
 * CRM contact. Unknown variables are left untouched so operators notice them.
 */
class TemplateRenderer
{
    public function render(?string $template, Contact $contact): ?string
    {
        if ($template === null) {
            return null;
        }

        return (string) preg_replace_callback(
            '/\{\{\s*([a-z_]+)\s*\}\}/',
            fn (array $m) => $this->value($m[1], $contact) ?? $m[0],
            $template,
        );
    }

    protected function value(string $key, Contact $contact): ?string
    {
        return match ($key) {
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'name' => $contact->displayName(),
            'email' => $contact->email,
            'phone' => $contact->phone_e164 ?? $contact->phone,
            'company' => $contact->company?->name,
            'city' => $contact->city,
            'wilaya' => $contact->wilaya,
            default => null,
        };
    }
}
