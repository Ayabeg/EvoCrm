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
            'rules' => $workspace->leadScoreRules(),
            'canManage' => $request->user()->role->canManageSettings(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role->canManageSettings(), 403);

        $validationRules = [
            'hold' => ['required', 'integer', 'min:0', 'max:100'],
            'qualify' => ['required', 'integer', 'min:0', 'max:100'],
            'convert' => ['required', 'integer', 'min:0', 'max:100'],
            'rules' => ['sometimes', 'array'],
        ];

        foreach (config('evosales.lead_score.rules', []) as $pillar => $points) {
            $validationRules["rules.{$pillar}"] = ['sometimes', 'array'];

            foreach ($points as $key => $default) {
                $validationRules["rules.{$pillar}.{$key}"] = ['sometimes', 'integer', 'min:0', 'max:100'];
            }
        }

        $data = $request->validate($validationRules);

        abort_if(
            $data['hold'] > $data['qualify'] || $data['qualify'] > $data['convert'],
            422,
            'Hold must be at or below qualify, and qualify at or below convert.',
        );

        $workspace = $request->user()->workspace;
        $scoreRules = $workspace->leadScoreRules();

        foreach ($scoreRules as $pillar => $points) {
            foreach ($points as $key => $default) {
                if (array_key_exists($key, $data['rules'][$pillar] ?? [])) {
                    $scoreRules[$pillar][$key] = (int) $data['rules'][$pillar][$key];
                }
            }
        }

        $workspace->forceFill([
            'lead_score_settings' => [
                'hold' => (int) $data['hold'],
                'qualify' => (int) $data['qualify'],
                'convert' => (int) $data['convert'],
                'rules' => $scoreRules,
            ],
        ])->save();

        return back();
    }
}
