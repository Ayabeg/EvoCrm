<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CustomAttributes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    use AuthorizesApiWorkspace;

    public function index(Request $request): JsonResponse
    {
        $workspace = $this->workspace($request);
        $perPage = min(100, max(1, $request->integer('per_page', 25)));
        $search = trim((string) $request->query('q', ''));

        $query = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company:id,name', 'owner:id,name'])
            ->orderBy('first_name')
            ->orderBy('id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $like = '%'.$search.'%';
                $builder->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('phone', 'like', $like)
                    ->orWhere('phone_e164', 'like', $like);
            });
        }

        $contacts = $query->paginate($perPage);

        return response()->json([
            'data' => collect($contacts->items())->map(
                fn (Contact $contact) => ApiPayload::contact($contact)
            )->values()->all(),
            'meta' => ApiPayload::pagination($contacts),
        ]);
    }

    public function show(Request $request, Contact $contact): JsonResponse
    {
        $this->ensureInWorkspace($contact, $this->workspace($request));

        return response()->json([
            'data' => ApiPayload::contact($contact),
        ]);
    }

    public function store(Request $request, ContactIdentity $identity): JsonResponse
    {
        $this->authorize('create', Contact::class);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'lead_status' => ['nullable', 'string', 'max:40'],
        ]);

        $workspace = $this->workspace($request);

        if (! empty($data['company_id'])) {
            Company::query()->forWorkspace($workspace)->findOrFail($data['company_id']);
        }

        $contact = $identity->createUnique($workspace, $data);

        return response()->json([
            'data' => ApiPayload::contact($contact->fresh() ?? $contact),
        ], 201);
    }

    public function update(Request $request, Contact $contact, CustomAttributes $attributes): JsonResponse
    {
        $workspace = $this->workspace($request);
        $this->ensureInWorkspace($contact, $workspace);
        $this->authorize('update', $contact);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'lead_status' => ['nullable', 'string', 'max:40'],
            'unanswered' => ['sometimes', 'boolean'],
            'attributes' => ['nullable', 'array'],
        ]);

        if (! empty($data['company_id'])) {
            Company::query()->forWorkspace($workspace)->findOrFail($data['company_id']);
        }

        $contact->fill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? $contact->phone,
            'company_id' => $data['company_id'] ?? null,
            'owner_id' => $data['owner_id'] ?? null,
            'city' => $data['city'] ?? $contact->city,
            'wilaya' => $data['wilaya'] ?? $contact->wilaya,
            'lead_status' => array_key_exists('lead_status', $data) ? $data['lead_status'] : $contact->lead_status,
            'unanswered' => $request->has('unanswered') ? $request->boolean('unanswered') : $contact->unanswered,
        ])->save();

        if (isset($data['attributes'])) {
            $attributes->saveValues($workspace, 'contact', $contact->id, $data['attributes']);
        }

        return response()->json([
            'data' => ApiPayload::contact($contact->fresh() ?? $contact),
        ]);
    }
}
