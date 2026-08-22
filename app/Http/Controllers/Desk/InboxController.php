<?php

namespace App\Http\Controllers\Desk;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Crm\ConversationHistoryController;
use App\Models\Thread;
use App\Services\Desk\DeskComposer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request, ConversationHistoryController $history): Response
    {
        return $history->index($request);
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
