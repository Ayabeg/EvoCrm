<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\SavedReport;
use App\Services\Crm\ReportBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SavedReportController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('crm/report-builder', [
            'reports' => SavedReport::query()
                ->forWorkspace($workspace)
                ->latest()
                ->get()
                ->map(fn (SavedReport $report) => [
                    'id' => $report->id,
                    'name' => $report->name,
                    'entity' => $report->entity,
                    'metric' => $report->metric,
                    'group_by' => $report->group_by,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'entity' => ['required', 'in:contact,deal'],
            'metric' => ['required', 'in:count,sum_amount'],
            'group_by' => ['nullable', 'in:stage,owner'],
            'filters' => ['nullable', 'array'],
        ]);

        $request->user()->workspace->savedReports()->create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return back();
    }

    public function run(Request $request, SavedReport $savedReport, ReportBuilder $builder): Response
    {
        abort_unless((int) $savedReport->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('crm/report-builder', [
            'reports' => SavedReport::query()->forWorkspace($request->user()->workspace)->latest()->get(),
            'result' => $builder->run($savedReport),
            'activeReport' => $savedReport->only(['id', 'name', 'entity', 'metric', 'group_by']),
        ]);
    }

    public function crossObject(Request $request, ReportBuilder $builder): Response
    {
        return Inertia::render('crm/report-builder', [
            'reports' => SavedReport::query()->forWorkspace($request->user()->workspace)->latest()->get(),
            'crossObject' => $builder->replyRateByWilaya($request->user()->workspace),
        ]);
    }
}
