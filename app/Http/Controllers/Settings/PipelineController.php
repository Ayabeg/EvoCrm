<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\PipelineResource;
use App\Models\Pipeline;
use App\Models\Pipeline;
use App\Services\Crm\PipelineManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function index(Request $request, PipelineManager $pipelines): Response
    {
        Gate::authorize('viewAny', Pipeline::class);

        $workspace = $request->user()->workspace;

        return Inertia::render('settings/pipelines', [
            'pipelines' => $pipelines->adminIndex($workspace),
            'canManage' => $request->user()->role->canManageSettings(),
        ]);
    }

    public function store(Request $request, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('create', Pipeline::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $pipelines->create(
            $request->user()->workspace,
            $data['name'],
            $request->boolean('is_default'),
        );

        return back();
    }

    public function update(Request $request, Pipeline $pipeline, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('update', $pipeline);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('is_default')) {
            Pipeline::query()
                ->where('workspace_id', $pipeline->workspace_id)
                ->where('id', '!=', $pipeline->id)
                ->update(['is_default' => false]);
            $pipeline->is_default = true;
        }

        if (isset($data['name'])) {
            $pipeline->name = $data['name'];
        }

        $pipeline->save();

        return back();
    }

    public function destroy(Request $request, Pipeline $pipeline): RedirectResponse
    {
        Gate::authorize('delete', $pipeline);

        $pipeline->delete();

        return back();
    }
}
