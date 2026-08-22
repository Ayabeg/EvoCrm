<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuietHoursController extends Controller
{
    public function edit(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $hours = $workspace->activeQuietHours() ?? $workspace->quietHours()->first();

        return Inertia::render('outbound/quiet-hours', [
            'quietHours' => [
                'starts_at' => substr((string) ($hours?->starts_at ?? config('evosales.quiet_hours.starts_at')), 0, 5),
                'ends_at' => substr((string) ($hours?->ends_at ?? config('evosales.quiet_hours.ends_at')), 0, 5),
                'timezone' => $hours?->timezone ?? 'Africa/Algiers',
                'enabled' => (bool) ($hours?->enabled ?? true),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'starts_at' => ['required', 'date_format:H:i'],
            'ends_at' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'timezone'],
            'enabled' => ['sometimes', 'boolean'],
        ]);

        $workspace->quietHours()->updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'timezone' => $data['timezone'],
                'enabled' => $request->boolean('enabled', true),
            ]
        );

        return back();
    }
}
