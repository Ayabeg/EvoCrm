<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Outbound\SuppressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\View\View;

class UnsubscribeController extends Controller
{
    public function show(Request $request): View
    {
        $data = $request->validate([
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'workspace' => ['required', 'integer', 'exists:workspaces,id'],
        ]);

        return view('unsubscribe', [
            'ok' => false,
            'confirmUrl' => URL::signedRoute('unsubscribe.confirm', $data),
        ]);
    }

    public function store(Request $request, SuppressionService $suppressions): View
    {
        $data = $request->validate([
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'workspace' => ['required', 'integer', 'exists:workspaces,id'],
        ]);

        $workspace = Workspace::query()->findOrFail($data['workspace']);

        if (! empty($data['email'])) {
            $suppressions->suppress($workspace, 'email', $data['email']);
        }
        if (! empty($data['phone'])) {
            $suppressions->suppress($workspace, 'phone', $data['phone']);
        }

        return view('unsubscribe', [
            'ok' => ! empty($data['email']) || ! empty($data['phone']),
        ]);
    }
}
