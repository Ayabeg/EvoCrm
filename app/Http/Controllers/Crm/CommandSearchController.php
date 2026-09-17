<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Services\Crm\CommandSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommandSearchController extends Controller
{
    public function __invoke(Request $request, CommandSearch $search): JsonResponse
    {
        $user = $request->user();
        abort_unless($user?->workspace_id, 403);

        return response()->json([
            'hits' => $search->search($user, (string) $request->query('q', '')),
        ]);
    }
}
