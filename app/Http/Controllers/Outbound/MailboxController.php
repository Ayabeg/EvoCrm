<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Mailbox;
use App\Services\Outbound\MailboxSync;
use App\Services\Outbound\OutboundDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class MailboxController extends Controller
{
    public function index(Request $request, MailboxSync $sync): Response
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
            'mail_stack' => [
                'configured' => $sync->configured(),
                'roundcube_url' => config('evosales.mail_stack.roundcube_url'),
            ],
        ]);
    }

    /**
     * Pull the mailbox list from the live mail stack right now. The same
     * sync also runs on the scheduler every 15 minutes.
     */
    public function sync(Request $request, MailboxSync $sync): RedirectResponse
    {
        $result = $sync->sync($request->user()->workspace);

        if (! $result['ok']) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $result['reason'] ?? 'Mail stack sync failed.']);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Mail stack sync: {$result['total']} mailbox(es) — {$result['created']} added, {$result['updated']} updated.",
        ]);

        return back();
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

    /**
     * Full edit. Passwords are write-only: leave blank to keep the stored
     * one. Warmup status is operator-managed (warming → active).
     */
    public function update(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'from_name' => ['required', 'string', 'max:120'],
            'from_address' => ['required', 'email'],
            'host' => ['required', 'string', 'max:180'],
            'port' => ['required', 'integer', 'min:1'],
            'encryption' => ['required', 'in:tls,ssl,none'],
            'username' => ['required', 'string', 'max:180'],
            'password' => ['nullable', 'string', 'max:255'],
            'imap_host' => ['nullable', 'string', 'max:180'],
            'imap_port' => ['nullable', 'integer', 'min:1'],
            'imap_encryption' => ['nullable', 'in:tls,ssl,none'],
            'imap_username' => ['nullable', 'string', 'max:180'],
            'imap_password' => ['nullable', 'string', 'max:255'],
            'daily_limit' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'status' => ['nullable', 'in:warming,active'],
        ]);

        $mailbox->forceFill([
            ...Arr::except($data, ['password', 'imap_password', 'status']),
            'daily_limit' => $data['daily_limit'] ?? $mailbox->daily_limit,
        ]);

        if (filled($data['password'] ?? null)) {
            $mailbox->password = $data['password'];
        }

        if (filled($data['imap_password'] ?? null)) {
            $mailbox->imap_password = $data['imap_password'];
        }

        if ($mailbox->enabled && filled($data['status'] ?? null)) {
            $mailbox->status = $data['status'];
        }

        $mailbox->save();

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

        if ($mailbox->isMailStack()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This mailbox is synced from the mail stack — remove it on the stack and it disappears here on the next sync.',
            ]);

            return back();
        }

        $mailbox->delete();

        return back();
    }
}
