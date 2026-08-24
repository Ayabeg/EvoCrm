<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\RecordLayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecordLayoutController extends Controller
{
    public function show(Request $request, string $entity): JsonResponse
    {
        abort_unless(in_array($entity, ['contact', 'company', 'deal'], true), 404);

        $layout = RecordLayout::query()
            ->where('workspace_id', $request->user()->workspace_id)
            ->where('user_id', $request->user()->id)
            ->where('entity', $entity)
            ->first();

        return response()->json([
            'layout' => $layout?->layout,
        ]);
    }

    public function update(Request $request, string $entity): JsonResponse
    {
        abort_unless(in_array($entity, ['contact', 'company', 'deal'], true), 404);

        $data = $request->validate([
            'layout' => ['required', 'array'],
            'layout.cards' => ['required', 'array'],
        ]);

        $layout = RecordLayout::query()->updateOrCreate(
            [
                'workspace_id' => $request->user()->workspace_id,
                'user_id' => $request->user()->id,
                'entity' => $entity,
            ],
            ['layout' => $data['layout']],
        );

        return response()->json(['layout' => $layout->layout]);
    }
}
