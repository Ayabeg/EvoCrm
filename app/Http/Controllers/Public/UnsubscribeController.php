<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Outbound\SuppressionService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class UnsubscribeController extends Controller
{
    public function __invoke(Request $request, SuppressionService $suppressions): View
    {
        $data = $request->validate([
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'workspace' => ['required', 'integer', 'exists:workspaces,id'],
        ]);

        $workspace = Workspace::query()->findOrFail($data['workspace']);

        if ($workspace) {
            if (! empty($data['email'])) {
                $suppressions->suppress($workspace, 'email', $data['email']);
            }
            if (! empty($data['phone'])) {
                $suppressions->suppress($workspace, 'phone', $data['phone']);
            }
        }

        return view('unsubscribe', [
            'ok' => (bool) $workspace && (! empty($data['email']) || ! empty($data['phone'])),
        ]);
    }
}
