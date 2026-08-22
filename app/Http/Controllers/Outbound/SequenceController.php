<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Sequence;
use App\Services\Outbound\SequenceEnrollment;
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
            'contacts' => Contact::query()
                ->forWorkspace($request->user()->workspace)
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'email', 'phone_e164']),
        ]);
    }

    public function addStep(Request $request, Sequence $sequence): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'delay_hours' => ['required', 'integer', 'min:0'],
            'channel' => ['required', 'in:email,whatsapp_cloud'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'wa_template_name' => ['nullable', 'string', 'max:120'],
            'wa_template_language' => ['nullable', 'string', 'max:12'],
        ]);

        $sequence->steps()->create([
            ...$data,
            'position' => ($sequence->steps()->max('position') ?? 0) + 1,
        ]);

        return back();
    }

    public function enroll(Request $request, Sequence $sequence, SequenceEnrollment $enrollment): RedirectResponse
    {
        abort_unless((int) $sequence->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
        ]);

        $workspace = $request->user()->workspace;
        $contact = Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);

        $enrollment->enroll($workspace, $sequence, $contact);

        return back();
    }
}
