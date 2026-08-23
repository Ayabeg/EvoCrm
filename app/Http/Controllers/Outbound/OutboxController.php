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

        $messages = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out')
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->with(['contact:id,first_name,last_name,email', 'mailbox:id,name,from_address', 'sequence:id,name'])
            ->latest()
            ->limit(100)
            ->get();

        return Inertia::render('outbound/outbox', [
            'messages' => $messages,
            'status' => $status,
            'counts' => [
                'queued' => OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out')->where('status', 'queued')->count(),
                'sent' => OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out')->where('status', 'sent')->count(),
                'failed' => OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out')->where('status', 'failed')->count(),
            ],
        ]);
    }
}
