<?php

namespace App\Http\Controllers\Desk;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use App\Services\Desk\DeskComposer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'channel', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderByDesc('last_message_at')
            ->limit(100)
            ->get();

        $selected = null;
        if ($request->integer('thread')) {
            $selected = Thread::query()
                ->forWorkspace($workspace)
                ->with(['contact.company', 'contact.deals.stage', 'channel', 'messages.user'])
                ->find($request->integer('thread'));
        }

        $selected ??= $threads->first();
        if ($selected && $selected->relationLoaded('messages') === false) {
            $selected->load(['contact.company', 'contact.deals.stage', 'channel', 'messages.user']);
        }

        return Inertia::render('desk/inbox', [
            'threads' => $threads,
            'selected' => $selected,
        ]);
    }

    public function reply(Request $request, Thread $thread, DeskComposer $composer): RedirectResponse
    {
        abort_unless((int) $thread->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        $composer->reply($thread, $request->user(), $data['body']);

        return back();
    }
}
