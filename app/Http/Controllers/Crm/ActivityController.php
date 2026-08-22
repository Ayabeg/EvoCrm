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

class ActivityController extends Controller
{
    public function store(Request $request, ActivityRecorder $recorder): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'type' => ['required', 'in:note,task,call,meeting'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
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
