<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Agent\AgentToolExecutor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentToolController extends Controller
{
    public function invoke(Request $request, string $tool, AgentToolExecutor $executor): JsonResponse
    {
        /** @var Workspace $workspace */
        $workspace = $request->attributes->get('agent_workspace');

        $arguments = $request->input('arguments', []);
        if (! is_array($arguments)) {
            $arguments = [];
        }

        return response()->json($executor->execute($workspace, $tool, $arguments));
    }
}
