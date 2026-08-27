<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadScoreSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/qualify', [
            'thresholds' => $workspace->leadScoreThresholds(),
            'canManage' => $request->user()->role->canManageSettings(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role->canManageSettings(), 403);

        $data = $request->validate([
            'hold' => ['required', 'integer', 'min:0', 'max:100'],
            'qualify' => ['required', 'integer', 'min:0', 'max:100'],
            'convert' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        abort_if(
            $data['hold'] > $data['qualify'] || $data['qualify'] > $data['convert'],
            422,
            'Hold must be at or below qualify, and qualify at or below convert.',
        );

        $request->user()->workspace->forceFill([
            'lead_score_settings' => [
                'hold' => (int) $data['hold'],
                'qualify' => (int) $data['qualify'],
                'convert' => (int) $data['convert'],
            ],
        ])->save();

        return back();
    }
}
