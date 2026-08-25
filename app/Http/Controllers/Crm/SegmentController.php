<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\OutboundCampaign;
use App\Models\SavedFilter;
use App\Models\Stage;
use App\Services\Ads\MetaAudienceSyncService;
use App\Services\Crm\CrmFilter;
use App\Support\CrmHub;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SegmentController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline();
        $stages = Stage::query()
            ->where('pipeline_id', $pipeline->id)
            ->orderBy('position')
            ->get(['id', 'name', 'slug']);

        $campaignsByFilter = OutboundCampaign::query()->forWorkspace($workspace)->whereNotNull('saved_filter_id')->get(['id', 'name', 'status', 'saved_filter_id'])->groupBy('saved_filter_id');

        $segments = SavedFilter::query()
            ->forWorkspace($workspace)
            ->whereIn('entity', ['contact', 'deal'])
            ->orderBy('name')
            ->get()
            ->map(fn (SavedFilter $saved) => [
                'id' => $saved->id,
                'name' => $saved->name,
                'entity' => $saved->entity,
                'filters' => $saved->filters ?? [],
                'count' => $filter->count($workspace, $saved->entity, $filter->fromSaved($saved)),
                'campaigns' => ($campaignsByFilter[$saved->id] ?? collect())->map(fn (OutboundCampaign $c) => ['id' => $c->id, 'name' => $c->name, 'status' => $c->status])->values()->all(),
            ]);

        return Inertia::render('crm/segments/index', [
            'segments' => $segments,
            'tab' => 'manage',
            'members' => $hub->members($workspace),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'stages' => $stages,
            'contactFilterFields' => $hub->listViewMeta('contact')['filterFields'],
            'dealFilterFields' => $hub->listViewMeta('deal')['filterFields'],
            'canSyncMeta' => $request->user()->role->canManageSettings(),
        ]);
    }

    public function preview(Request $request, CrmFilter $filter): JsonResponse
    {
        $data = $request->validate([
            'entity' => ['required', 'in:contact,deal'],
            'filters' => ['nullable', 'array'],
        ]);

        $workspace = $request->user()->workspace;
        $filters = is_array($data['filters'] ?? null) ? $data['filters'] : [];

        return response()->json($filter->preview($workspace, $data['entity'], $filters));
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $request->user()->workspace->savedFilters()->create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'entity' => $data['entity'],
            'filters' => $data['filters'],
        ]);

        return redirect()->route('crm.segments.index');
    }

    public function update(Request $request, SavedFilter $segment): RedirectResponse
    {
        abort_unless((int) $segment->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless(in_array($segment->entity, ['contact', 'deal'], true), 404);

        $data = $this->validated($request);

        $segment->update([
            'name' => $data['name'],
            'entity' => $data['entity'],
            'filters' => $data['filters'],
        ]);

        return redirect()->route('crm.segments.index');
    }

    public function destroy(Request $request, SavedFilter $segment): RedirectResponse
    {
        abort_unless((int) $segment->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless(in_array($segment->entity, ['contact', 'deal'], true), 404);

        $segment->delete();

        return redirect()->route('crm.segments.index');
    }

    public function syncMeta(Request $request, SavedFilter $segment, MetaAudienceSyncService $sync): RedirectResponse
    {
        abort_unless((int) $segment->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($segment->entity === 'contact', 422);
        abort_unless($request->user()->role->canManageSettings(), 403);

        $data = $request->validate([
            'audience_id' => ['required', 'string', 'max:80'],
        ]);

        $result = $sync->syncSegment($request->user()->workspace, $segment, $data['audience_id']);

        return back()->with('meta_sync', $result);
    }

    /**
     * @return array{name: string, entity: string, filters: array<string, mixed>}
     */
    protected function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'entity' => ['required', 'in:contact,deal'],
            'filters' => ['nullable', 'array'],
            'filters_json' => ['nullable', 'string'],
            'stage' => ['nullable', 'string', 'max:40'],
            'owner' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'last_activity' => ['nullable', 'in:7d,30d,none'],
            'created' => ['nullable', 'in:today,7d,30d,90d'],
            'status' => ['nullable', 'string', 'max:40'],
            'unanswered' => ['sometimes', 'boolean'],
            'unassigned' => ['sometimes', 'boolean'],
        ]);

        $filters = is_array($data['filters'] ?? null) ? $data['filters'] : [];

        if (filled($data['filters_json'] ?? null)) {
            $decoded = json_decode((string) $data['filters_json'], true);
            if (is_array($decoded)) {
                $filters = $decoded;
            }
        }

        if ($filters === []) {
            $filters = [
                'stage' => $data['stage'] ?? null,
                'owner' => $data['owner'] ?? null,
                'city' => $data['city'] ?? null,
                'wilaya' => $data['wilaya'] ?? null,
                'last_activity' => $data['last_activity'] ?? null,
                'created' => $data['created'] ?? null,
                'status' => $data['status'] ?? null,
                'unanswered' => $request->boolean('unanswered'),
                'unassigned' => $request->boolean('unassigned'),
            ];
        }

        return [
            'name' => $data['name'],
            'entity' => $data['entity'],
            'filters' => $filters,
        ];
    }
}
