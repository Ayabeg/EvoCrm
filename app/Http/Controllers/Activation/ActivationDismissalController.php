<?php

namespace App\Http\Controllers\Activation;

use App\Http\Controllers\Controller;
use App\Services\Activation\WorkspaceActivationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ActivationDismissalController extends Controller
{
    public function store(Request $request, WorkspaceActivationService $activation): RedirectResponse
    {
        $activation->dismiss($request->user());

        return back();
    }
}
