<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Mailbox;
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
        ]);

        Mailbox::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
            'is_default' => true,
            'enabled' => true,
        ]);

        return back();
    }
}
