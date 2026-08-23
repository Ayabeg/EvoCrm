<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\OutboundMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReplyController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('outbound/replies', [
            'replies' => OutboundMessage::query()
                ->forWorkspace($workspace)
                ->where('direction', 'in')
                ->with([
                    'contact:id,first_name,last_name,email',
                    'mailbox:id,name,from_address',
                    'parent:id,subject,sent_at',
                ])
                ->latest()
                ->limit(100)
                ->get(),
            'imapNote' => function_exists('imap_open')
                ? 'Replies arrive via the IMAP poller (outbound:poll-replies) for mailboxes with IMAP settings.'
                : 'PHP ext-imap is not installed on this server — reply polling is off. Sends are unaffected.',
        ]);
    }
}
