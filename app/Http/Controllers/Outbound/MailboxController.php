<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Mailbox;
use App\Services\Outbound\OutboundDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MailboxController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('outbound/mailboxes/index', [
            'mailboxes' => Mailbox::query()
                ->forWorkspace($request->user()->workspace)
                ->latest()
                ->get()
                ->map(fn (Mailbox $box) => [
                    ...$box->toArray(),
                    'password_set' => filled($box->password),
                    'imap_password_set' => filled($box->imap_password),
                    'imap_configured' => $box->imapConfigured(),
                    'effective_status' => $box->effectiveStatus(),
                    'sent_today' => $box->sentToday(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'from_name' => ['required', 'string', 'max:120'],
            'from_address' => ['required', 'email'],
            'host' => ['required', 'string', 'max:180'],
            'port' => ['required', 'integer', 'min:1'],
            'encryption' => ['required', 'in:tls,ssl,none'],
            'username' => ['required', 'string', 'max:180'],
            'password' => ['required', 'string', 'max:255'],
            'imap_host' => ['nullable', 'string', 'max:180'],
            'imap_port' => ['nullable', 'integer', 'min:1'],
            'imap_encryption' => ['nullable', 'in:tls,ssl,none'],
            'imap_username' => ['nullable', 'string', 'max:180'],
            'imap_password' => ['nullable', 'string', 'max:255'],
            'daily_limit' => ['nullable', 'integer', 'min:0', 'max:10000'],
        ]);

        $workspace = $request->user()->workspace;

        Mailbox::query()->create([
            ...$data,
            'workspace_id' => $workspace->id,
            'is_default' => ! Mailbox::query()->forWorkspace($workspace)->where('is_default', true)->exists(),
            'enabled' => false,
            'status' => 'disabled',
            'daily_limit' => $data['daily_limit'] ?? 50,
        ]);

        return back();
    }

    public function toggle(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        $enable = ! $mailbox->enabled;

        $mailbox->forceFill([
            'enabled' => $enable,
            'status' => $enable ? 'warming' : 'disabled',
        ])->save();

        return back();
    }

    public function setDefault(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        Mailbox::query()
            ->forWorkspace($request->user()->workspace)
            ->where('id', '!=', $mailbox->id)
            ->update(['is_default' => false]);

        $mailbox->forceFill(['is_default' => true])->save();

        return back();
    }

    /**
     * Send a real SMTP test through this mailbox. The result lands in the
     * outbox either way — sent, or failed with the SMTP error.
     */
    public function sendTest(Request $request, Mailbox $mailbox, OutboundDispatcher $dispatcher): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'to' => ['required', 'email'],
        ]);

        $workspace = $request->user()->workspace;

        $contact = Contact::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'email' => strtolower($data['to'])],
            ['first_name' => 'Test', 'source' => 'mailbox_test'],
        );

        $message = $dispatcher->dispatch($workspace, $contact, [
            'channel' => 'email',
            'mailbox_id' => $mailbox->id,
            'to_address' => $data['to'],
            'subject' => 'EvoSales mailbox test — '.$mailbox->name,
            'body' => "This is a test send from the EvoSales mailbox {$mailbox->name}. If you see it, SMTP works.",
        ]);

        $mailbox->forceFill(['last_tested_at' => now()])->save();

        Inertia::flash('toast', [
            'type' => $message->status === 'sent' ? 'success' : 'error',
            'message' => $message->status === 'sent'
                ? "Test sent to {$data['to']}."
                : 'Test failed: '.($message->failure_reason ?? 'unknown error'),
        ]);

        return back();
    }

    public function destroy(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        $mailbox->delete();

        return back();
    }
}
