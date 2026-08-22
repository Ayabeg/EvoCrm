<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Thread;
use App\Services\Evolution\EvolutionCloudService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request, EvolutionCloudService $evolution): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('home', [
            'stats' => [
                'contacts' => Contact::query()->forWorkspace($workspace)->count(),
                'leads' => Lead::query()->forWorkspace($workspace)->count(),
                'deals' => Deal::query()->forWorkspace($workspace)->count(),
                'open_threads' => Thread::query()->forWorkspace($workspace)->where('status', 'open')->count(),
            ],
            'evolution' => $evolution->health($workspace),
            'meta_connected' => filled(config('meta.access_token')) && filled(config('meta.ad_account_id')),
        ]);
    }
}
