<?php

namespace App\Http\Controllers\Settings;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless($request->user()?->role === WorkspaceRole::Owner, 403);

        return Inertia::render('settings/workspace', [
            'simple_mode' => (bool) $request->user()->workspace?->simple_mode,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === WorkspaceRole::Owner, 403);

        $request->validate([
            'simple_mode' => ['required', 'boolean'],
        ]);

        $request->user()->workspace->forceFill([
            'simple_mode' => $request->boolean('simple_mode'),
        ])->save();

        return redirect()->route('settings.workspace');
    }
}
