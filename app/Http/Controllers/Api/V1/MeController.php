<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    use AuthorizesApiWorkspace;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $workspace = $this->workspace($request);

        $permissions = collect(array_keys(config('permissions.capabilities', [])))
            ->filter(fn (string $permission): bool => $user->canPermission($permission))
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'user' => ApiPayload::user($user),
                'workspace' => ApiPayload::workspace($workspace),
                'permissions' => $permissions,
            ],
        ]);
    }
}
