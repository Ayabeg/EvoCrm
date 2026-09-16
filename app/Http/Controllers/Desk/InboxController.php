<?php

namespace App\Http\Controllers\Desk;

use App\Enums\ChannelType;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Desk\DeskComposer;
use App\Services\Desk\DeskEmbedProbe;
use App\Services\Desk\InboxCrmContextComposer;
use App\Support\Integrations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

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

        $folder = $this->normalizedFolder($request->query('folder'));
        $search = trim((string) $request->query('q', ''));
        $contextOpen = $request->query('context', '1') !== '0';

        $folderCounts = $this->folderCounts($workspace, $request->user());

        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with([
                'contact:id,first_name,last_name,phone_e164,email,company_id,owner_id',
                'contact.company:id,name',
                'contact.owner:id,name',
                'channel:id,name,type',
                'ticket:id,thread_id,number,status,subject',
                'messages' => fn ($q) => $q->latest()->limit(1),
            ])
            ->tap(fn (Builder $query) => $this->applyFolder($query, $folder, $request->user()))
            ->tap(fn (Builder $query) => $this->applySearch($query, $search))
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get();

        $selected = null;
        $crmContext = null;
        $crmContextError = null;
        if ($threadId = $request->integer('thread')) {
            $selected = Thread::query()
                ->forWorkspace($workspace)
                ->with(['contact.company', 'contact.owner', 'channel', 'messages.user', 'ticket'])
                ->find($threadId);

            if ($selected instanceof Thread) {
                try {
                    $crmContext = app(InboxCrmContextComposer::class)->present($request->user(), $selected);
                } catch (\Throwable $exception) {
                    $crmContext = app(InboxCrmContextComposer::class)->failed((int) $selected->id, $exception);
                    $crmContextError = 'context_failed';
                }
            }
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
            'crmContext' => $crmContext,
            'crmContextError' => $crmContextError,
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
            'folder' => $folder,
            'q' => $search,
            'contextOpen' => $contextOpen,
            'folderCounts' => $folderCounts,
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

    public function openTicket(Request $request, Thread $thread): RedirectResponse
    {
        abort_unless((int) $thread->workspace_id === (int) $request->user()->workspace_id, 404);

        if (! $thread->contact_id) {
            abort(422, 'A ticket requires a contact.');
        }

        try {
            $ticket = Ticket::openFromThread($thread, $request->user());
        } catch (InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return redirect()->route('crm.tickets.show', $ticket);
    }

    /**
     * @return array<string, int>
     */
    private function folderCounts(Workspace $workspace, User $user): array
    {
        $base = Thread::query()->forWorkspace($workspace);

        $counts = [
            'all' => (clone $base)->count(),
            'unassigned' => (clone $base)->whereHas('contact', fn (Builder $query) => $query->whereNull('owner_id'))->count(),
            'mine' => (clone $base)->whereHas('contact', fn (Builder $query) => $query->where('owner_id', $user->id))->count(),
            'open' => (clone $base)->whereNotIn('status', ['resolved', 'closed'])->count(),
            'closed' => (clone $base)->whereIn('status', ['resolved', 'closed'])->count(),
        ];

        $channelCounts = Channel::query()
            ->forWorkspace($workspace)
            ->withCount('threads')
            ->get();

        foreach ($channelCounts as $channel) {
            $type = $channel->type instanceof ChannelType
                ? $channel->type->value
                : (string) $channel->type;

            $counts[$type] = ($counts[$type] ?? 0) + (int) $channel->threads_count;
        }

        return $counts;
    }

    private function normalizedFolder(mixed $folder): string
    {
        $value = is_string($folder) ? $folder : 'all';

        return match ($value) {
            'unassigned', 'mine', 'open', 'closed', 'whatsapp', 'whatsapp_cloud', 'email', 'telegram', 'sms' => $value,
            default => 'all',
        };
    }

    private function applyFolder(Builder $query, string $folder, User $user): void
    {
        if ($folder === 'unassigned') {
            $query->whereHas('contact', fn (Builder $contact) => $contact->whereNull('owner_id'));

            return;
        }

        if ($folder === 'mine') {
            $query->whereHas('contact', fn (Builder $contact) => $contact->where('owner_id', $user->id));

            return;
        }

        if ($folder === 'open') {
            $query->whereNotIn('status', ['resolved', 'closed']);

            return;
        }

        if ($folder === 'closed') {
            $query->whereIn('status', ['resolved', 'closed']);

            return;
        }

        if (in_array($folder, ['whatsapp', 'whatsapp_cloud', 'email', 'telegram', 'sms'], true)) {
            $query->whereHas('channel', fn (Builder $channel) => $channel->where('type', $folder));
        }
    }

    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $like = '%'.addcslashes($search, '%_\\').'%';

        $query->where(function (Builder $inner) use ($like) {
            $inner->where('subject', 'like', $like)
                ->orWhereHas('contact', function (Builder $contact) use ($like) {
                    $contact->where('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                });
        });
    }
}
