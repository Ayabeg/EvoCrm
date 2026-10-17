<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Message;
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
        $since = now()->subDays(7);
        $messages = Message::query()
            ->forWorkspace($workspace)
            ->where('created_at', '>=', $since);

        return Inertia::render('settings/channels', [
            'channels' => Channel::query()->forWorkspace($workspace)->get(),
            'evolution' => $evolution->health($workspace),
            'deliveryHealth' => [
                'window_days' => 7,
                'inbound' => (clone $messages)->where('direction', 'inbound')->count(),
                'outbound' => (clone $messages)->where('direction', 'outbound')->count(),
                'failed' => (clone $messages)->where('direction', 'outbound')->where('status', 'failed')->count(),
                'last_inbound_at' => (clone $messages)->where('direction', 'inbound')->max('created_at'),
                'last_outbound_at' => (clone $messages)->where('direction', 'outbound')->max('created_at'),
            ],
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
