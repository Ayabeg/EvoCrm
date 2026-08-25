<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use App\Models\SavedReport;
use App\Models\ScheduledReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ScheduledReportController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $data = $this->validated($request, $workspace);

        ScheduledReport::query()->create([
            'workspace_id' => $workspace->id,
            'saved_report_id' => $data['saved_report_id'] ?? null,
            'dashboard_id' => $data['dashboard_id'] ?? null,
            'name' => $data['name'] ?? null,
            'cron' => $data['cron'],
            'recipients' => $data['recipients'],
            'active' => $data['active'] ?? true,
        ]);

        return back();
    }

    public function update(Request $request, ScheduledReport $scheduledReport): RedirectResponse
    {
        abort_unless((int) $scheduledReport->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $this->validated($request, $request->user()->workspace, updating: true);
        $scheduledReport->fill($data)->save();

        return back();
    }

    public function destroy(Request $request, ScheduledReport $scheduledReport): RedirectResponse
    {
        abort_unless((int) $scheduledReport->workspace_id === (int) $request->user()->workspace_id, 404);
        $scheduledReport->delete();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, $workspace, bool $updating = false): array
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:160'],
            'saved_report_id' => ['nullable', 'integer'],
            'dashboard_id' => ['nullable', 'integer'],
            'cron' => [$updating ? 'nullable' : 'required', 'string', 'max:40'],
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*' => ['required', 'email'],
            'active' => ['nullable', 'boolean'],
        ]);

        if (isset($data['saved_report_id'])) {
            SavedReport::query()->forWorkspace($workspace)->whereKey($data['saved_report_id'])->firstOrFail();
        }

        if (isset($data['dashboard_id'])) {
            Dashboard::query()->forWorkspace($workspace)->whereKey($data['dashboard_id'])->firstOrFail();
        }

        return $data;
    }
}
