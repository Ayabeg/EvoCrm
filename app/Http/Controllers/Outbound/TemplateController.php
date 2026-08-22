<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\Outbound\OutboundDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('outbound/templates/index', [
            'contacts' => Contact::query()
                ->forWorkspace($request->user()->workspace)
                ->whereNotNull('phone_e164')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'phone_e164']),
            'note' => 'Official WhatsApp Cloud templates only. Sends go through Evolution Cloud — never Baileys.',
        ]);
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
