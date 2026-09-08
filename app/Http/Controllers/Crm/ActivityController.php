<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Services\Crm\ActivityRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $type = $request->string('type')->toString();
        $ownerId = $request->integer('owner_id') ?: null;
        $date = $request->string('date')->toString();

        $query = Activity::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'deal', 'company', 'owner'])
            ->orderByRaw('due_at is null')
            ->orderBy('due_at')
            ->orderByDesc('created_at');

        if ($type !== '' && in_array($type, ['note', 'task', 'call', 'meeting', 'email'], true)) {
            $query->where('type', $type);
        }

        if ($ownerId) {
            $query->where('owner_id', $ownerId);
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

        return Inertia::render('crm/activities/index', [
            'activities' => $query->limit(200)->get(),
            'members' => $workspace->users()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'type' => $type !== '' ? $type : null,
                'owner_id' => $ownerId,
                'date' => $date !== '' ? $date : null,
            ],
        ]);
    }

    public function store(Request $request, ActivityRecorder $recorder): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'type' => ['required', 'in:note,task,call,meeting,email'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
            'logged_at' => ['nullable', 'date'],
            'outcome' => ['nullable', 'string', 'max:80'],
            'direction' => ['nullable', 'in:inbound,outbound'],
            'owner_id' => ['nullable', 'integer'],
            'contact_id' => ['nullable', 'integer'],
            'deal_id' => ['nullable', 'integer'],
            'company_id' => ['nullable', 'integer'],
        ]);

        if (! empty($data['contact_id'])) {
            Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);
        }
        if (! empty($data['deal_id'])) {
            Deal::query()->forWorkspace($workspace)->findOrFail($data['deal_id']);
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

        $recorder->record($workspace, $data, $request->user());

        return back();
    }

    public function complete(Request $request, Activity $activity): RedirectResponse
    {
        abort_unless((int) $activity->workspace_id === (int) $request->user()->workspace_id, 404);

        $activity->markDone();

        return back();
    }
}
