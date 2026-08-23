<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with([
                'contact:id,first_name,last_name,phone_e164,email,company_id',
                'contact.company:id,name',
                'channel:id,name,type',
                'messages' => fn ($q) => $q->latest()->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->limit(80)
            ->get();

        $selected = null;
        if ($threadId = $request->integer('thread')) {
            $selected = Thread::query()
                ->forWorkspace($workspace)
                ->with([
                    'contact.company',
                    'contact.deals.stage',
                    'channel',
                    'messages.user',
                ])
                ->find($threadId);
        }

        return Inertia::render('crm/conversations', [
            'threads' => $threads,
            'selected' => $selected,
        ]);
    }
}
