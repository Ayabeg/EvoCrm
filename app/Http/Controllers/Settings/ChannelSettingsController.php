<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Services\Evolution\EvolutionCloudService;
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
        ]);
    }
}
