<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Pipeline;
use App\Models\Stage;
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
            'pipelines' => collect($pipelines->adminIndex($workspace))
                ->map(function (array $row) use ($pipelines) {
                    $pipeline = Pipeline::query()->find($row['id']);
                    if (! $pipeline) {
                        return $row;
                    }

                    return [
                        ...$row,
                        'stages' => $pipelines->stagesAdmin($pipeline),
                    ];
                })
                ->values()
                ->all(),
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

    public function storeStage(Request $request, Pipeline $pipeline, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('update', $pipeline);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $pipelines->createStage($pipeline, $data['name'], $data['probability'] ?? null);

        return back();
    }

    public function updateStage(Request $request, Pipeline $pipeline, Stage $stage, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('update', $pipeline);
        abort_unless((int) $stage->pipeline_id === (int) $pipeline->id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_won' => ['sometimes', 'boolean'],
            'is_lost' => ['sometimes', 'boolean'],
        ]);

        $pipelines->updateStage($stage, $data);

        return back();
    }

    public function destroyStage(Request $request, Pipeline $pipeline, Stage $stage, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('update', $pipeline);
        abort_unless((int) $stage->pipeline_id === (int) $pipeline->id, 404);

        $data = $request->validate([
            'migrate_to_stage_id' => ['nullable', 'integer'],
        ]);

        $pipelines->deleteStage($stage, $data['migrate_to_stage_id'] ?? null);

        return back();
    }

    public function reorderStages(Request $request, Pipeline $pipeline, PipelineManager $pipelines): RedirectResponse
    {
        Gate::authorize('update', $pipeline);

        $data = $request->validate([
            'stage_ids' => ['required', 'array'],
            'stage_ids.*' => ['integer'],
        ]);

        $pipelines->reorderStages($pipeline, array_map('intval', $data['stage_ids']));

        return back();
    }
}
