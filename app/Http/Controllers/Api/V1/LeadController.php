<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\Crm\DealBoardOptions;
use App\Services\Crm\LeadConverter;
use App\Services\Crm\PipelineManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class LeadController extends Controller
{
    use AuthorizesApiWorkspace;

    public function board(Request $request, PipelineManager $pipelines, DealBoardOptions $boardOptions): JsonResponse
    {
        $workspace = $this->workspace($request);
        $pipeline = $pipelines->resolve($workspace, $request->integer('pipeline') ?: null);
        $board = $pipelines->boardData($workspace, $pipeline, $boardOptions->forUser($request->user()));

        return response()->json([
            'data' => [
                'pipeline' => $pipeline->only(['id', 'name']),
                'stages' => $board['stages'],
                'deals' => $board['deals'],
                'forecast' => $board['forecast'],
            ],
        ]);
    }

    public function show(Request $request, Lead $lead): JsonResponse
    {
        $this->ensureInWorkspace($lead, $this->workspace($request));

        return response()->json([
            'data' => ApiPayload::lead($lead),
        ]);
    }

    public function qualify(Request $request, Lead $lead, LeadConverter $converter): JsonResponse
    {
        $this->ensureInWorkspace($lead, $this->workspace($request));
        $this->authorize('qualify', $lead);

        $data = $request->validate([
            'mode' => ['nullable', 'in:create,link'],
            'pipeline_id' => ['nullable', 'integer'],
            'stage_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'deal_id' => ['nullable', 'integer'],
        ]);

        try {
            $deal = $converter->convert($lead, $request->user(), $data);
        } catch (InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'data' => [
                'lead' => ApiPayload::lead($lead->fresh() ?? $lead),
                'deal' => ApiPayload::deal($deal),
            ],
        ]);
    }
}
