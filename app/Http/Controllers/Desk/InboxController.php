<?php

namespace App\Http\Controllers\Desk;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Thread;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Desk\DeskComposer;
use App\Services\Desk\DeskEmbedProbe;
use App\Support\Integrations;
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
    public function inbox(Request $request, DeskEmbedProbe $probe, ConnectorRegistrar $connectors): Response
    {
        $workspace = $request->user()->workspace;

        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with([
                'contact:id,first_name,last_name,phone_e164,email,company_id,owner_id',
                'contact.company:id,name',
                'contact.owner:id,name',
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
                ->with(['contact.company', 'contact.owner', 'channel', 'messages.user'])
                ->find($threadId);
        }

        $embedUrl = $workspace->inboxEmbedUrl();

        // Probe the desk's framing headers: if EvoDesk refuses embedding
        // (Chatwoot's default X-Frame-Options: SAMEORIGIN), serve the native
        // CRM desk with a fix-it banner instead of a broken frame.
        $embed = $embedUrl
            ? $probe->check($embedUrl, (string) config('app.url'))
            : ['state' => 'no-url', 'reason' => null];

        $integrations = Integrations::forWorkspace($workspace);
        $scopes = $integrations['meta']['scopes'] ?? [];
        $whatsapp = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $whatsappBusiness = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);

        return Inertia::render('desk/inbox', [
            'embedUrl' => $embed['state'] === 'ok' ? $embedUrl : null,
            'embedState' => $embed['state'],
            'embedReason' => $embed['reason'],
            'configuredUrl' => $embedUrl,
            'threads' => $threads,
            'selected' => $selected,
            'channels' => [
                [
                    'key' => 'whatsapp',
                    'label' => 'WhatsApp',
                    'href' => '/settings/whatsapp',
                    'connected' => $whatsapp?->isConnected() ?? false,
                ],
                [
                    'key' => 'whatsapp_cloud',
                    'label' => 'WhatsApp Business',
                    'href' => '/settings/whatsapp-business',
                    'connected' => ($whatsappBusiness?->isConnected() ?? false)
                        || in_array('whatsapp_business_messaging', $scopes, true)
                        || in_array('whatsapp_business_management', $scopes, true),
                ],
                [
                    'key' => 'instagram',
                    'label' => 'Instagram',
                    'href' => '/settings/apps',
                    'connected' => in_array('instagram_basic', $scopes, true),
                ],
                [
                    'key' => 'facebook',
                    'label' => 'Facebook',
                    'href' => '/settings/apps',
                    'connected' => in_array('pages_show_list', $scopes, true),
                ],
            ],
            'officialConnectors' => $connectors->deskCatalog($workspace),
        ]);
    }

    public function reply(Request $request, Thread $thread, DeskComposer $composer): RedirectResponse
    {
        abort_unless((int) $thread->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
            'as_note' => ['sometimes', 'boolean'],
            'resolve' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('as_note')) {
            Message::query()->create([
                'workspace_id' => $thread->workspace_id,
                'thread_id' => $thread->id,
                'contact_id' => $thread->contact_id,
                'user_id' => $request->user()->id,
                'direction' => 'internal',
                'type' => 'note',
                'body' => $data['body'],
                'status' => 'logged',
                'provider' => 'desk',
            ]);
        } else {
            $composer->reply($thread, $request->user(), $data['body']);
        }

        if ($request->boolean('resolve')) {
            $thread->forceFill(['status' => 'resolved'])->save();
        }

        return back();
    }
}
