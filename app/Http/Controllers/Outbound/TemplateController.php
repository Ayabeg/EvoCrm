<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\OutboundTemplate;
use App\Services\Outbound\OutboundDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('outbound/templates/index', [
            'templates' => OutboundTemplate::query()
                ->forWorkspace($workspace)
                ->latest()
                ->get(),
            'contacts' => Contact::query()
                ->forWorkspace($workspace)
                ->whereNotNull('phone_e164')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'phone_e164']),
            'note' => 'Official WhatsApp Cloud templates only. Sends go through Evolution Cloud — never Baileys.',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string'],
        ]);

        OutboundTemplate::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
        ]);

        return back();
    }

    public function destroy(Request $request, OutboundTemplate $template): RedirectResponse
    {
        abort_unless((int) $template->workspace_id === (int) $request->user()->workspace_id, 404);

        $template->delete();

        return back();
    }

    public function send(Request $request, OutboundDispatcher $dispatcher): RedirectResponse
    {
        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'wa_template_name' => ['required', 'string', 'max:120'],
            'wa_template_language' => ['nullable', 'string', 'max:12'],
        ]);

        $workspace = $request->user()->workspace;
        $contact = Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);

        $dispatcher->dispatch($workspace, $contact, [
            'channel' => 'whatsapp_cloud',
            'wa_template_name' => $data['wa_template_name'],
            'wa_template_language' => $data['wa_template_language'] ?? 'fr',
        ]);

        return back();
    }
}
