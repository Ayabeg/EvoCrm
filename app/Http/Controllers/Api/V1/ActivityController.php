<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Services\Crm\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ActivityController extends Controller
{
    use AuthorizesApiWorkspace;

    public function index(Request $request): JsonResponse
    {
        $workspace = $this->workspace($request);
        $type = $request->string('type')->toString();
        $ownerId = $request->integer('owner_id') ?: null;
        $contactId = $request->integer('contact_id') ?: null;
        $dealId = $request->integer('deal_id') ?: null;
        $date = $request->string('date')->toString();
        $perPage = min(100, max(1, $request->integer('per_page', 25)));

        $query = Activity::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'deal', 'owner'])
            ->orderByRaw('due_at is null')
            ->orderBy('due_at')
            ->orderByDesc('created_at');

        if ($type !== '' && in_array($type, ['note', 'task', 'call', 'meeting', 'email'], true)) {
            $query->where('type', $type);
        }

        if ($ownerId) {
            $query->where('owner_id', $ownerId);
        }

        if ($contactId) {
            $query->where('contact_id', $contactId);
        }

        if ($dealId) {
            $query->where('deal_id', $dealId);
        }

        if ($date === 'today') {
            $query->whereNotNull('due_at')
                ->where('due_at', '<=', now('Africa/Algiers')->endOfDay());
        } elseif ($date === 'overdue') {
            $query->whereNotNull('due_at')
                ->where('due_at', '<', now('Africa/Algiers')->startOfDay())
                ->where('done', false);
        } elseif ($date !== '') {
            $query->whereDate('due_at', $date);
        }

        $activities = $query->paginate($perPage);

        return response()->json([
            'data' => collect($activities->items())->map(
                fn (Activity $activity) => ApiPayload::activity($activity)
            )->values()->all(),
            'meta' => ApiPayload::pagination($activities),
        ]);
    }

    public function store(Request $request, ActivityRecorder $recorder): JsonResponse
    {
        $this->authorize('create', Activity::class);

        $workspace = $this->workspace($request);

        $data = $request->validate([
            'type' => ['required', 'in:note,task,call,meeting,email'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
            'logged_at' => ['nullable', 'date'],
            'outcome' => ['nullable', 'string', 'max:80'],
            'direction' => ['nullable', 'in:inbound,outbound'],
            'owner_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('workspace_id', $request->user()->workspace_id),
            ],
            'contact_id' => ['nullable', 'integer'],
            'deal_id' => ['nullable', 'integer'],
            'company_id' => ['nullable', 'integer'],
        ]);

        abort_unless(! empty($data['contact_id']) || ! empty($data['deal_id']), 422, 'An activity must belong to a contact or a deal.');

        if (! empty($data['contact_id'])) {
            Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);
        }

        if (! empty($data['deal_id'])) {
            $deal = Deal::query()->forWorkspace($workspace)->findOrFail($data['deal_id']);
            $data['contact_id'] = $data['contact_id'] ?? $deal->contact_id;
            $data['company_id'] = $data['company_id'] ?? $deal->company_id;
        }

        if (! empty($data['company_id'])) {
            Company::query()->forWorkspace($workspace)->findOrFail($data['company_id']);
        }

        $meta = [];
        if (! empty($data['outcome'])) {
            $meta['outcome'] = $data['outcome'];
        }
        if (! empty($data['direction'])) {
            $meta['direction'] = $data['direction'];
        }
        if (! empty($data['logged_at'])) {
            $meta['logged_at'] = $data['logged_at'];
        }

        if ($data['type'] === 'call' && empty($data['subject'])) {
            $data['subject'] = trim(($data['direction'] ?? 'outbound').' call'.(! empty($data['outcome']) ? ' · '.$data['outcome'] : ''));
        }

        if ($meta !== []) {
            $data['meta'] = $meta;
        }

        unset($data['outcome'], $data['direction'], $data['logged_at']);

        $activity = $recorder->record($workspace, $data, $request->user());

        return response()->json([
            'data' => ApiPayload::activity($activity),
        ], 201);
    }
}
