<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\OutboundMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutboxController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $status = $request->string('status')->toString();

        $base = fn () => OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out');

        $messages = $base()
            ->when($status === 'deferred', fn ($q) => $q
                ->where('status', 'queued')
                ->whereNotNull('deferred_until')
                ->where('deferred_until', '>', now()))
            ->when($status !== '' && $status !== 'deferred', fn ($q) => $q->where('status', $status))
            ->with(['contact:id,first_name,last_name,email', 'mailbox:id,name,from_address', 'sequence:id,name', 'campaign:id,name'])
            ->latest()
            ->limit(100)
            ->get();

        return Inertia::render('outbound/outbox', [
            'messages' => $messages,
            'status' => $status,
            'counts' => [
                'queued' => $base()->where('status', 'queued')
                    ->where(fn ($q) => $q->whereNull('deferred_until')->orWhere('deferred_until', '<=', now()))
                    ->count(),
                'deferred' => $base()->where('status', 'queued')
                    ->whereNotNull('deferred_until')
                    ->where('deferred_until', '>', now())
                    ->count(),
                'sent' => $base()->where('status', 'sent')->count(),
                'failed' => $base()->where('status', 'failed')->count(),
            ],
        ]);
    }
}
