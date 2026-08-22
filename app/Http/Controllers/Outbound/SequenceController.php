<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Sequence;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SequenceController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('outbound/sequences/index', [
            'sequences' => Sequence::query()
                ->forWorkspace($request->user()->workspace)
                ->with('steps')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'channel' => ['required', 'in:email,whatsapp_cloud'],
            'description' => ['nullable', 'string'],
        ]);

        $sequence = Sequence::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
            'active' => false,
        ]);

        $sequence->steps()->create([
            'position' => 1,
            'delay_hours' => 0,
            'channel' => $data['channel'],
            'subject' => $data['channel'] === 'email' ? 'Hello from Evotechly' : null,
            'body' => $data['channel'] === 'email' ? 'Thanks for your interest.' : null,
            'wa_template_name' => $data['channel'] === 'whatsapp_cloud' ? 'hello_world' : null,
            'wa_template_language' => $data['channel'] === 'whatsapp_cloud' ? 'fr' : null,
        ]);

        return back();
    }

    public function show(Request $request, Sequence $sequence): Response
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('outbound/sequences/show', [
            'sequence' => $sequence->load(['steps', 'enrollments.contact']),
        ]);
    }
}
