<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\ConversionFunnel;
use App\Services\Funnels\ConversionFunnelQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FunnelController extends Controller
{
    private const TZ = 'Africa/Algiers';

    public function index(Request $request, ConversionFunnelQuery $query): Response
    {
        $workspace = $request->user()->workspace;
        [$from, $to] = $this->parseWindow($request);
        $funnel = $this->resolveFunnel($request, $workspace);

        $funnels = ConversionFunnel::query()
            ->forWorkspace($workspace)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'is_default']);

        return Inertia::render('reports/funnels/index', [
            'funnels' => $funnels,
            'report' => $query->forFunnel($workspace, $funnel, $from, $to),
            'custom' => $request->filled('from') || $request->filled('to'),
        ]);
    }

    public function show(Request $request, ConversionFunnel $funnel, ConversionFunnelQuery $query): JsonResponse
    {
        abort_unless($funnel->workspace_id === $request->user()->workspace_id, 404);

        [$from, $to] = $this->parseWindow($request);

        return response()->json(
            $query->forFunnel($request->user()->workspace, $funnel, $from, $to),
        );
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function parseWindow(Request $request): array
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'], self::TZ)->endOfDay()
            : now(self::TZ)->endOfDay();
        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'], self::TZ)->startOfDay()
            : $to->copy()->subDays(29)->startOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    private function resolveFunnel(Request $request, $workspace): ConversionFunnel
    {
        $validated = $request->validate([
            'funnel' => ['nullable', 'integer', Rule::exists('conversion_funnels', 'id')->where('workspace_id', $workspace->id)],
        ]);

        return ConversionFunnel::query()
            ->forWorkspace($workspace)
            ->when(
                isset($validated['funnel']),
                fn ($q) => $q->where('id', $validated['funnel']),
                fn ($q) => $q->where('is_default', true),
            )
            ->firstOrFail();
    }
}
