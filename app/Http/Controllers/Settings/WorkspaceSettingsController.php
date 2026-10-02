<?php

namespace App\Http\Controllers\Settings;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Support\Locale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless($request->user()?->role === WorkspaceRole::Owner, 403);

        $workspace = $request->user()->workspace;

        return Inertia::render('settings/workspace', [
            'simple_mode' => (bool) $workspace?->simple_mode,
            'workspace_locale' => Locale::fromPreferences($workspace?->preferences),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === WorkspaceRole::Owner, 403);

        $request->validate([
            'simple_mode' => ['required', 'boolean'],
            'locale' => ['nullable', 'in:fr,en,ar'],
        ]);

        $workspace = $request->user()->workspace;
        $locale = Locale::normalize($request->input('locale'));
        $preferences = $workspace->preferences;

        if ($locale !== null) {
            $preferences = Locale::mergePreference($preferences, $locale);
        }

        $workspace->forceFill([
            'simple_mode' => $request->boolean('simple_mode'),
            'preferences' => $preferences,
        ])->save();

        return redirect()->route('settings.workspace');
    }
}
