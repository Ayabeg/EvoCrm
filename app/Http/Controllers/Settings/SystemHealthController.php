<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Operations\IntegrationHealth;
use App\Services\Operations\ScheduledCommandHealth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    public function __invoke(
        Request $request,
        ScheduledCommandHealth $commands,
        IntegrationHealth $integrations,
    ): Response {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/system-health', [
            'commands' => $commands->summary($workspace),
            'integrations' => $integrations->summary($workspace),
        ]);
    }
}
