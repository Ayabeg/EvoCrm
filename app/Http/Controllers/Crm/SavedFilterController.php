<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\SavedFilter;
use App\Support\ListViewConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SavedFilterController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', SavedFilter::class);

        $data = $this->validated($request);
        $workspace = $request->user()->workspace;

        if (! empty($data['is_default'])) {
            $this->clearDefault($workspace->id, $data['entity'], $request->user()->id);
        }

        $saved = $workspace->savedFilters()->create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'entity' => $data['entity'],
            'filters' => $data['filters'],
            'columns' => $data['columns'] ?? null,
            'sort' => $data['sort'] ?? null,
            'is_default' => (bool) ($data['is_default'] ?? false),
        ]);

        return back()->with('saved_filter_id', $saved->id);
    }

    public function update(Request $request, SavedFilter $savedFilter): RedirectResponse
    {
        Gate::authorize('update', $savedFilter);

        $data = $this->validated($request, updating: true);

        if (! empty($data['is_default'])) {
            $this->clearDefault($savedFilter->workspace_id, $savedFilter->entity, $request->user()->id, $savedFilter->id);
        }

        $savedFilter->update([
            'name' => $data['name'] ?? $savedFilter->name,
            'filters' => $data['filters'] ?? $savedFilter->filters,
            'columns' => $data['columns'] ?? $savedFilter->columns,
            'sort' => $data['sort'] ?? $savedFilter->sort,
            'is_default' => $data['is_default'] ?? $savedFilter->is_default,
        ]);

        return back();
    }

    public function destroy(Request $request, SavedFilter $savedFilter): RedirectResponse
    {
        Gate::authorize('delete', $savedFilter);

        $savedFilter->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request, bool $updating = false): array
    {
        $rules = [
            'name' => [$updating ? 'sometimes' : 'required', 'string', 'max:120'],
            'entity' => [$updating ? 'sometimes' : 'required', 'in:contact,deal,company'],
            'filters' => ['nullable', 'array'],
            'filter_groups' => ['nullable'],
            'columns' => ['nullable'],
            'sort' => ['nullable'],
            'is_default' => ['sometimes', 'boolean'],
            'stage' => ['nullable', 'string', 'max:40'],
            'owner' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'last_activity' => ['nullable', 'in:7d,30d,none'],
            'created' => ['nullable', 'in:today,7d,30d,90d'],
            'status' => ['nullable', 'string', 'max:40'],
            'view' => ['nullable', 'in:all,my'],
            'unanswered' => ['sometimes', 'boolean'],
            'unassigned' => ['sometimes', 'boolean'],
        ];

        $data = $request->validate($rules);

        foreach (['columns', 'sort', 'filter_groups'] as $jsonField) {
            if (isset($data[$jsonField]) && is_string($data[$jsonField])) {
                $decoded = json_decode($data[$jsonField], true);
                $data[$jsonField] = is_array($decoded) ? $decoded : null;
            }
        }

        if (! isset($data['filters'])) {
            $data['filters'] = [
                'stage' => $data['stage'] ?? null,
                'owner' => $data['owner'] ?? null,
                'city' => $data['city'] ?? null,
                'wilaya' => $data['wilaya'] ?? null,
                'last_activity' => $data['last_activity'] ?? null,
                'created' => $data['created'] ?? null,
                'status' => $data['status'] ?? null,
                'view' => $data['view'] ?? null,
                'unanswered' => $request->boolean('unanswered'),
                'unassigned' => $request->boolean('unassigned'),
            ];

            if (! empty($data['filter_groups'])) {
                $data['filters']['filter_groups'] = $data['filter_groups'];
            }
        }

        if (isset($data['columns'])) {
            $entity = $data['entity'] ?? $request->route('savedFilter')?->entity ?? 'contact';
            $data['columns'] = ListViewConfig::normalizeColumns($entity, $data['columns']);
        }

        return $data;
    }

    protected function clearDefault(int $workspaceId, string $entity, int $userId, ?int $exceptId = null): void
    {
        SavedFilter::query()
            ->where('workspace_id', $workspaceId)
            ->where('entity', $entity)
            ->where('user_id', $userId)
            ->when($exceptId, fn ($query) => $query->where('id', '!=', $exceptId))
            ->update(['is_default' => false]);
    }
}
