<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutboundController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        $outbound = OutboundMessage::query()->forWorkspace($workspace)->where('direction', 'out');

        return Inertia::render('outbound/index', [
            'stats' => [
                'mailboxes' => Mailbox::query()->forWorkspace($workspace)->count(),
                'mailboxes_enabled' => Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->count(),
                'sequences_active' => Sequence::query()->forWorkspace($workspace)->where('active', true)->count(),
                'enrolled_active' => Enrollment::query()->forWorkspace($workspace)->where('status', 'active')->count(),
                'sent_30d' => (clone $outbound)->where('status', 'sent')->where('sent_at', '>=', now()->subDays(30))->count(),
                'replies_30d' => OutboundMessage::query()
                    ->forWorkspace($workspace)
                    ->where('direction', 'in')
                    ->where('created_at', '>=', now()->subDays(30))
                    ->count(),
                'failed_30d' => (clone $outbound)->where('status', 'failed')->where('created_at', '>=', now()->subDays(30))->count(),
            ],
            'recent' => OutboundMessage::query()
                ->forWorkspace($workspace)
                ->with(['contact:id,first_name,last_name,email', 'sequence:id,name'])
                ->latest()
                ->limit(12)
                ->get(),
        ]);
    }
}
