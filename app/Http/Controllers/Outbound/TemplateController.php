<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\OutboundMessage;
use App\Models\OutboundTemplate;
use App\Services\Outbound\EmailHtml;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\TemplateRenderer;
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

    /**
     * Edit page with an honest preview: variables rendered against a real
     * workspace contact, through the same HTML builder the mailer uses
     * (unsubscribe footer included; tracking disabled in preview).
     */
    public function show(Request $request, OutboundTemplate $template, TemplateRenderer $renderer, EmailHtml $html): Response
    {
        abort_unless((int) $template->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;

        $sample = Contact::query()
            ->forWorkspace($workspace)
            ->whereNotNull('email')
            ->with('company')
            ->first()
            ?? new Contact([
                'first_name' => 'Amine',
                'last_name' => 'Benali',
                'email' => 'amine@example.dz',
                'city' => 'Alger',
                'wilaya' => 'Alger',
            ]);

        $message = new OutboundMessage([
            'workspace_id' => $workspace->id,
            'channel' => 'email',
            'direction' => 'out',
            'to_address' => $sample->email ?? 'amine@example.dz',
            'subject' => $renderer->render($template->subject, $sample, $workspace),
            'body' => $renderer->render($template->body, $sample, $workspace),
            'body_html' => $renderer->render($template->body_html, $sample, $workspace),
        ]);
        $message->setRelation('contact', $sample);
        $message->setRelation('workspace', $workspace);

        return Inertia::render('outbound/templates/show', [
            'template' => $template,
            'preview' => [
                'contact' => $sample->displayName().' <'.($sample->email ?? 'no-email').'>',
                'subject' => $message->subject,
                'html' => $html->build($message, preview: true),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string'],
            'body_html' => ['nullable', 'string'],
        ]);

        OutboundTemplate::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
        ]);

        return back();
    }

    public function update(Request $request, OutboundTemplate $template): RedirectResponse
    {
        abort_unless((int) $template->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string'],
            'body_html' => ['nullable', 'string'],
        ]);

        $template->forceFill($data)->save();

        return back();
    }

    public function destroy(Request $request, OutboundTemplate $template): RedirectResponse
    {
        abort_unless((int) $template->workspace_id === (int) $request->user()->workspace_id, 404);

        $template->delete();

        return redirect()->route('outbound.templates.index');
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
