<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use App\Support\ReportWidgets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Saved Reports dashboards. Additive on top of the default rooms —
 * create extra boards, pin existing EvoViz charts, keep owner + date
 * filters on the open board. Does not restyle Home or the rail.
 */
class DashboardController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'widgets' => ['nullable', 'array'],
            'widgets.*.key' => ['required', 'string', Rule::in(ReportWidgets::keys())],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'owner' => ['nullable', 'integer'],
            'visibility' => ['nullable', 'in:private,team,workspace'],
        ]);

        $dashboard = Dashboard::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'owner_id' => $request->user()->id,
            'name' => $data['name'],
            'visibility' => $data['visibility'] ?? 'private',
            'widgets' => $data['widgets'] ?? [],
        ]);

        return redirect()->route('reports', array_filter([
            'dashboard' => $dashboard->id,
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'owner' => $data['owner'] ?? null,
        ], fn ($value) => $value !== null && $value !== ''));
    }

    public function update(Request $request, Dashboard $dashboard): RedirectResponse
    {
        $this->authorizeWorkspace($request, $dashboard);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'widgets' => ['sometimes', 'array'],
            'widgets.*.key' => ['required', 'string', Rule::in(ReportWidgets::keys())],
        ]);

        if (isset($data['name'])) {
            $dashboard->name = $data['name'];
        }

        if (array_key_exists('widgets', $data)) {
            $dashboard->widgets = $data['widgets'];
        }

        $dashboard->save();

        return back();
    }

    public function addWidget(Request $request, Dashboard $dashboard): RedirectResponse
    {
        $this->authorizeWorkspace($request, $dashboard);

        $data = $request->validate([
            'key' => ['required', 'string', Rule::in(ReportWidgets::keys())],
        ]);

        $keys = $dashboard->widgetKeys();

        if (! in_array($data['key'], $keys, true)) {
            $keys[] = $data['key'];
            $dashboard->setWidgetKeys($keys);
            $dashboard->save();
        }

        return back();
    }

    public function removeWidget(Request $request, Dashboard $dashboard): RedirectResponse
    {
        $this->authorizeWorkspace($request, $dashboard);

        $data = $request->validate([
            'key' => ['required', 'string'],
        ]);

        $dashboard->setWidgetKeys(array_values(array_filter(
            $dashboard->widgetKeys(),
            fn (string $key) => $key !== $data['key'],
        )));
        $dashboard->save();

        return back();
    }

    public function destroy(Request $request, Dashboard $dashboard): RedirectResponse
    {
        $this->authorizeWorkspace($request, $dashboard);

        $dashboard->delete();

        return redirect()->route('reports', array_filter([
            'from' => $request->input('from'),
            'to' => $request->input('to'),
            'owner' => $request->input('owner'),
        ], fn ($value) => filled($value)));
    }

    private function authorizeWorkspace(Request $request, Dashboard $dashboard): void
    {
        abort_unless((int) $dashboard->workspace_id === (int) $request->user()->workspace_id, 404);

        $user = $request->user();

        if ($dashboard->visibility === 'workspace' || $dashboard->visibility === 'team') {
            return;
        }

        abort_unless((int) $dashboard->owner_id === (int) $user->id || $user->role->canManageSettings(), 403);
    }
}
