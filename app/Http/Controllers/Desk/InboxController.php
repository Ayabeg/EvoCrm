<?php

namespace App\Http\Controllers\Desk;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use App\Services\Desk\DeskComposer;
use App\Services\Desk\DeskEmbedProbe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    /**
     * Legacy /desk path — the desk now lives inside the CRM at /inbox.
     */
    public function index(): RedirectResponse
    {
        return redirect()->route('desk.inbox');
    }

    /**
     * My Inbox: the EvoDesk (Chatwoot Community) UI embedded in the CRM
     * chrome. Operators stay on the CRM hostname; the iframe src is the
     * workspace desk URL + EVOSALES_INBOX_EMBED_PATH. When no desk URL is
     * configured, the page falls back to the native CRM conversation desk
     * (same threads as /conversations) instead of ejecting to another host.
     */
    public function inbox(Request $request, DeskEmbedProbe $probe): Response
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
            ->limit(50)
            ->get();

        $selected = null;
        if ($threadId = $request->integer('thread')) {
            $selected = Thread::query()
                ->forWorkspace($workspace)
                ->with(['contact.company', 'channel', 'messages.user'])
                ->find($threadId);
        }

        $embedUrl = $workspace->inboxEmbedUrl();

        // Probe the desk's framing headers: if EvoDesk refuses embedding
        // (Chatwoot's default X-Frame-Options: SAMEORIGIN), serve the native
        // CRM desk with a fix-it banner instead of a broken frame.
        $embed = $embedUrl
            ? $probe->check($embedUrl, (string) config('app.url'))
            : ['state' => 'no-url', 'reason' => null];

        return Inertia::render('desk/inbox', [
            'embedUrl' => $embed['state'] === 'ok' ? $embedUrl : null,
            'embedState' => $embed['state'],
            'embedReason' => $embed['reason'],
            'configuredUrl' => $embedUrl,
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
