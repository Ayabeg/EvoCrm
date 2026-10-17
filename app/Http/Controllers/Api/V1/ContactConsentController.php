<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Services\Operations\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactConsentController extends Controller
{
    use AuthorizesApiWorkspace;

    public function store(Request $request, Contact $contact, AuditLogger $audit): JsonResponse
    {
        $workspace = $this->workspace($request);
        $this->ensureInWorkspace($contact, $workspace);
        $this->authorize('update', $contact);

        $data = $request->validate([
            'channel' => ['required', 'string', 'max:32', 'in:email,whatsapp,sms,phone'],
            'purpose' => ['nullable', 'string', 'max:64'],
            'status' => ['required', 'string', 'max:24', 'in:granted,denied,unknown'],
            'source' => ['nullable', 'string', 'max:64'],
            'captured_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'revoked_at' => ['nullable', 'date'],
            'meta' => ['nullable', 'array'],
        ]);

        $status = (string) $data['status'];
        $consent = ContactConsent::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'contact_id' => $contact->id,
                'channel' => $data['channel'],
                'purpose' => $data['purpose'] ?? 'marketing',
            ],
            [
                'status' => $status,
                'source' => $data['source'] ?? null,
                'captured_at' => $data['captured_at'] ?? now(),
                'expires_at' => $data['expires_at'] ?? null,
                'revoked_at' => $status === ContactConsent::STATUS_DENIED
                    ? ($data['revoked_at'] ?? now())
                    : null,
                'meta' => $data['meta'] ?? null,
            ],
        );

        $audit->record(
            $workspace,
            'contact.consent_updated',
            'Updated communication consent',
            $request->user(),
            $contact,
            [
                'channel' => $consent->channel,
                'purpose' => $consent->purpose,
                'status' => $consent->status,
                'source' => $consent->source,
            ],
            $request->ip(),
        );

        return response()->json([
            'data' => [
                'id' => $consent->id,
                'contact_id' => $consent->contact_id,
                'channel' => $consent->channel,
                'purpose' => $consent->purpose,
                'status' => $consent->status,
                'source' => $consent->source,
                'captured_at' => $consent->captured_at?->toIso8601String(),
                'expires_at' => $consent->expires_at?->toIso8601String(),
                'revoked_at' => $consent->revoked_at?->toIso8601String(),
                'granted' => $consent->isGranted(),
            ],
        ], $consent->wasRecentlyCreated ? 201 : 200);
    }
}
