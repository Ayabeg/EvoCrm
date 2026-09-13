<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    use AuthorizesApiWorkspace;

    public function store(Request $request): JsonResponse
    {
        $workspace = $this->workspace($request);
        $user = $request->user();

        $data = $request->validate([
            'platform' => ['required', 'in:ios,android'],
            'token' => ['required', 'string', 'max:512'],
            'provider' => ['nullable', 'in:apns,fcm'],
        ]);

        $device = Device::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $data['token'],
            ],
            [
                'workspace_id' => $workspace->id,
                'platform' => $data['platform'],
                'provider' => $data['provider'] ?? ($data['platform'] === 'ios' ? 'apns' : 'fcm'),
                'last_seen_at' => now(),
            ]
        );

        return response()->json([
            'data' => ApiPayload::device($device),
        ], $device->wasRecentlyCreated ? 201 : 200);
    }
}
