<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Stage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class DealController extends Controller
{
    use AuthorizesApiWorkspace;

    public function show(Request $request, Deal $deal): JsonResponse
    {
        $this->ensureInWorkspace($deal, $this->workspace($request));

        return response()->json([
            'data' => ApiPayload::deal($deal),
        ]);
    }

    public function move(Request $request, Deal $deal): JsonResponse
    {
        $this->ensureInWorkspace($deal, $this->workspace($request));
        $this->authorize('move', $deal);

        $data = $request->validate([
            'stage_id' => ['required', 'integer'],
            'lost_reason' => ['nullable', 'string', 'max:180'],
        ]);

        $stage = Stage::query()->where('pipeline_id', $deal->pipeline_id)->findOrFail($data['stage_id']);

        if ($stage->is_lost && filled($data['lost_reason'] ?? null)) {
            $deal->lost_reason = $data['lost_reason'];
        }

        try {
            $deal->moveTo($stage, $request->user());
        } catch (InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'data' => ApiPayload::deal($deal->fresh() ?? $deal),
        ]);
    }
}
