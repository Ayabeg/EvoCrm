<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Suppression;
use App\Services\Outbound\SuppressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuppressionController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('outbound/suppressions', [
            'items' => Suppression::query()
                ->forWorkspace($request->user()->workspace)
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function store(Request $request, SuppressionService $suppressions): RedirectResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:email,phone'],
            'value' => ['required', 'string', 'max:190'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $suppressions->suppress(
            $request->user()->workspace,
            $data['type'],
            $data['value'],
            $data['reason'] ?? 'manual',
            'settings',
        );

        return back();
    }
}
