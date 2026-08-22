<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MetaSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/meta', [
            'connected' => filled(config('meta.access_token')) && filled(config('meta.app_id')),
            'app_id_set' => filled(config('meta.app_id')),
            'ad_account_id_set' => filled(config('meta.ad_account_id')),
            'graph_version' => config('meta.graph_version'),
            'reason' => filled(config('meta.access_token'))
                ? null
                : 'Meta Marketing API is not connected. Credentials are env-driven. Embedded Signup / Tech Provider is later work.',
        ]);
    }
}
