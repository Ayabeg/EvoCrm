<?php

namespace App\Http\Controllers;

use App\Services\Operations\SchedulerHeartbeat;
use Illuminate\Http\JsonResponse;

class SchedulerHeartbeatController extends Controller
{
    public function __invoke(SchedulerHeartbeat $heartbeat): JsonResponse
    {
        $status = $heartbeat->status();

        return response()->json([
            'scheduler' => $status,
        ], $status['ok'] ? 200 : 503);
    }
}
