<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Workspace;
use Illuminate\Support\Facades\URL;

/**
 * Renders {{variable}} placeholders in email subjects and bodies against a
 * CRM contact. Unknown variables are left untouched so operators notice them.
 *
 * {{unsub}} / {{unsubscribe_url}} render to the public unsubscribe endpoint
 * on the CRM hostname (route('unsubscribe')) — never a third-party domain.
 */
class TemplateRenderer
{
    public function render(?string $template, Contact $contact, ?Workspace $workspace = null): ?string
    {
        if ($template === null) {
            return null;
        }

        return (string) preg_replace_callback(
            '/\{\{\s*([a-z_]+)\s*\}\}/',
            fn (array $m) => $this->value($m[1], $contact, $workspace) ?? $m[0],
            $template,
        );
    }

    /**
     * Absolute unsubscribe URL on the app host (crm.evotechly.com in
     * production). Public by design; the signed URL is the capability.
     */
    public function unsubscribeUrl(Workspace $workspace, Contact $contact): string
    {
        return URL::signedRoute('unsubscribe', array_filter([
            'email' => $contact->email,
            'phone' => $contact->email ? null : $contact->phone_e164,
            'workspace' => $workspace->id,
        ]));
    }

    protected function value(string $key, Contact $contact, ?Workspace $workspace): ?string
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
            'unsub', 'unsubscribe_url' => $workspace && $contact->email
                ? $this->unsubscribeUrl($workspace, $contact)
                : null,
            default => null,
        };
    }
}
