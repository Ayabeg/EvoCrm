<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Services\Evolution\EvolutionCloudService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChannelSettingsController extends Controller
{
    public function edit(Request $request, EvolutionCloudService $evolution): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/channels', [
            'channels' => Channel::query()->forWorkspace($workspace)->get(),
            'evolution' => $evolution->health($workspace),
            'inboxUrl' => $workspace?->inboxUrl() ?? config('evosales.inbox_url'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'inbox_url' => ['nullable', 'url', 'max:255'],
        ]);

        $workspace->update(['inbox_url' => $data['inbox_url'] ?? null]);

        return back();
    }
}
