<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\CrmFilter;
use App\Support\CrmHub;
use App\Support\TicketPath;
use App\Support\TicketSla;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'ticket');

        $query = Ticket::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'company', 'owner']);

        $filter->apply('ticket', $query, $filters);
        $query->latest('id');
        [$rows, $paginator] = $filter->paginate($query, $request);

        $statusPills = collect(Ticket::STATUSES)->values()->map(function (string $status, int $index) use ($workspace) {
            return [
                'id' => $index + 1,
                'name' => Ticket::statusLabel($status),
                'slug' => $status,
                'count' => Ticket::query()->forWorkspace($workspace)->where('status', $status)->count(),
            ];
        })->all();

        $openTickets = Ticket::query()
            ->forWorkspace($workspace)
            ->where('status', '!=', Ticket::STATUS_CLOSED);

        $serviceMetrics = [
            'open' => (clone $openTickets)->count(),
            'needs_response' => (clone $openTickets)->whereNull('first_response_at')->count(),
            'sla_breached' => (clone $openTickets)
                ->whereNull('first_response_at')
                ->whereNotNull('sla_due_at')
                ->where('sla_due_at', '<', now())
                ->count(),
            'waiting_on_us' => (clone $openTickets)->where('status', Ticket::STATUS_WAITING_ON_US)->count(),
        ];

        return Inertia::render('crm/tickets/index', [
            'tickets' => $rows->map->present()->values()->all(),
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'ticket', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('ticket', null, null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'stagePills' => $statusPills,
            'serviceMetrics' => $serviceMetrics,
            'createOpen' => $request->boolean('create'),
            'createDefaults' => [
                'contact_id' => $request->integer('contact_id') ?: null,
                'deal_id' => $request->integer('deal_id') ?: null,
            ],
        ]);
    }

    public function board(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $query = Ticket::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'company', 'owner'])
            ->latest('id');

        $view = (string) $request->input('view', 'all');
        if ($view === 'my') {
            $query->where('owner_id', $request->user()->id);
        }

        $tickets = $query->get();

        $columns = collect(Ticket::STATUSES)->values()->map(function (string $status, int $index) use ($tickets) {
            $inColumn = $tickets->where('status', $status);

            return [
                'id' => $index + 1,
                'slug' => $status,
                'name' => Ticket::statusLabel($status),
                'count' => $inColumn->count(),
            ];
        })->values()->all();

        return Inertia::render('crm/tickets/board', [
            'columns' => $columns,
            'tickets' => $tickets->map->presentBoard()->values()->all(),
            'view' => $view === 'my' ? 'my' : 'all',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:180'],
            'contact_id' => ['required', 'integer'],
            'deal_id' => ['nullable', 'integer'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'channel' => ['nullable', 'in:whatsapp_cloud,email,manual'],
        ]);

        $contact = Contact::query()->forWorkspace($request->user()->workspace)->findOrFail($data['contact_id']);

        $dealId = null;
        if (! empty($data['deal_id'])) {
            $deal = Deal::query()->forWorkspace($request->user()->workspace)->findOrFail($data['deal_id']);
            abort_unless((int) $deal->contact_id === (int) $contact->id, 422);
            $dealId = $deal->id;
        }

        $ticket = Ticket::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'deal_id' => $dealId,
            'owner_id' => $request->user()->id,
            'subject' => $data['subject'],
            'priority' => $data['priority'] ?? Ticket::PRIORITY_MEDIUM,
            'channel' => $data['channel'] ?? Ticket::CHANNEL_MANUAL,
        ]);

        $this->logActivity($ticket, $request, 'ticket_opened', 'Opened '.$ticket->number);

        return $request->boolean('from_board')
            ? redirect()->route('crm.tickets.board')
            : redirect()->route('crm.tickets.index');
    }

    public function move(Request $request, Ticket $ticket): RedirectResponse
    {
        abort_unless((int) $ticket->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', Ticket::STATUSES)],
        ]);

        $from = (string) $ticket->status;
        $ticket->moveTo($data['status']);
        $this->logStatus($ticket, $request, $from);

        return back();
    }

    public function show(Request $request, Ticket $ticket, CrmHub $hub, RecordInsight $insight): Response
    {
        abort_unless((int) $ticket->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $ticket->load(['contact', 'company', 'deal.quotes', 'owner', 'thread.channel']);

        $messages = $ticket->thread
            ? $ticket->thread->messages()->orderBy('id')->limit(80)->get()->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'direction' => $message->direction,
                'type' => $message->type,
                'created_at' => $message->created_at?->timezone('Africa/Algiers')->toIso8601String(),
            ])->all()
            : [];

        $takenThreadIds = Ticket::query()
            ->forWorkspace($workspace)
            ->whereNotNull('thread_id')
            ->whereKeyNot($ticket->id)
            ->pluck('thread_id');

        $attachable = Thread::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $ticket->contact_id)
            ->when($takenThreadIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $takenThreadIds))
            ->with('channel')
            ->latest('last_message_at')
            ->limit(20)
            ->get()
            ->map(fn (Thread $thread) => [
                'id' => $thread->id,
                'subject' => $thread->subject,
                'channel' => $thread->channel?->name,
            ])
            ->all();

        $quotes = $ticket->deal?->quotes?->map(fn ($quote) => [
            'id' => $quote->id,
            'status' => $quote->status,
            'total_cents' => $quote->total_cents,
        ])->values()->all() ?? [];

        return Inertia::render('crm/tickets/show', [
            'ticket' => $ticket->presentRecord(),
            'path' => TicketPath::present($ticket),
            'askEvo' => $insight->forTicket($ticket),
            'thread' => $ticket->thread ? [
                'id' => $ticket->thread->id,
                'subject' => $ticket->thread->subject,
                'channel' => $ticket->thread->channel?->name,
            ] : null,
            'messages' => $messages,
            'attachableThreads' => $attachable,
            'members' => $hub->members($workspace),
            'associations' => [
                'contact' => $ticket->contact ? [
                    'id' => $ticket->contact->id,
                    'first_name' => $ticket->contact->first_name,
                    'last_name' => $ticket->contact->last_name,
                    'email' => $ticket->contact->email,
                    'phone_e164' => $ticket->contact->phone_e164,
                ] : null,
                'company' => $ticket->company ? ['id' => $ticket->company->id, 'name' => $ticket->company->name] : null,
                'deal' => $ticket->deal ? ['id' => $ticket->deal->id, 'title' => $ticket->deal->title] : null,
                'quotes' => $quotes,
            ],
        ]);
    }

    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        abort_unless((int) $ticket->workspace_id === (int) $request->user()->workspace_id, 404);

        if ($request->exists('owner_id') && $request->input('owner_id') === '') {
            $request->merge(['owner_id' => null]);
        }

        if ($request->exists('deal_id') && $request->input('deal_id') === '') {
            $request->merge(['deal_id' => null]);
        }

        $data = $request->validate([
            'subject' => ['sometimes', 'required', 'string', 'max:180'],
            'priority' => ['sometimes', 'nullable', 'in:low,medium,high'],
            'status' => ['sometimes', 'nullable', 'in:'.implode(',', Ticket::STATUSES)],
            'owner_id' => ['sometimes', 'nullable', 'integer'],
            'deal_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        if (isset($data['priority'])
            && (string) $data['priority'] !== (string) $ticket->priority
            && $ticket->isOpen()
            && ! $ticket->first_response_at) {
            $data['sla_due_at'] = TicketSla::dueAt($data['priority']);
        }

        if (isset($data['status'])) {
            $from = (string) $ticket->status;
            $ticket->moveTo($data['status']);
            $this->logStatus($ticket, $request, $from);
            unset($data['status']);
        }

        if (array_key_exists('owner_id', $data)) {
            $ownerId = $data['owner_id'];
            unset($data['owner_id']);
            if ($ownerId) {
                $owner = User::query()->where('workspace_id', $ticket->workspace_id)->findOrFail($ownerId);
                $data['owner_id'] = $owner->id;
            } else {
                $data['owner_id'] = null;
            }
        }

        if (array_key_exists('deal_id', $data)) {
            $dealId = $data['deal_id'];
            if ($dealId) {
                $deal = Deal::query()->forWorkspace($request->user()->workspace)->findOrFail($dealId);
                $data['deal_id'] = $deal->id;
            }
        }

        if ($data !== []) {
            $ticket->forceFill($data + ['last_activity_at' => now()])->save();
        }

        return back();
    }

    public function attachThread(Request $request, Ticket $ticket): RedirectResponse
    {
        abort_unless((int) $ticket->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'thread_id' => ['required', 'integer'],
        ]);

        $thread = Thread::query()
            ->forWorkspace($request->user()->workspace)
            ->where('contact_id', $ticket->contact_id)
            ->findOrFail($data['thread_id']);

        $taken = Ticket::query()
            ->forWorkspace($request->user()->workspace)
            ->where('thread_id', $thread->id)
            ->whereKeyNot($ticket->id)
            ->exists();

        abort_if($taken, 422, 'That Desk thread already has a ticket.');

        $ticket->forceFill([
            'thread_id' => $thread->id,
            'channel' => $ticket->channel === Ticket::CHANNEL_MANUAL
                ? Ticket::CHANNEL_WHATSAPP_CLOUD
                : $ticket->channel,
            'last_activity_at' => now(),
        ])->save();

        return back();
    }

    /**
     * @param  Builder<Ticket>  $query
     */
    protected function constrain($query, Request $request): void
    {
        $view = (string) $request->input('view', 'all');
        $status = $request->string('status')->toString();
        $owner = $request->input('owner');

        if ($status !== '' && in_array($status, Ticket::STATUSES, true)) {
            $query->where('status', $status);
        } elseif ($view === 'closed') {
            $query->where('status', Ticket::STATUS_CLOSED);
        } else {
            $query->where('status', '!=', Ticket::STATUS_CLOSED);
        }

        if ($view === 'my') {
            $query->where('owner_id', $request->user()->id);
        }

        if ($view === 'unassigned' || $request->boolean('unassigned') || $owner === 'unassigned') {
            $query->whereNull('owner_id');
        } elseif (is_numeric($owner) && (int) $owner > 0) {
            $query->where('owner_id', (int) $owner);
        }

        if ($request->filled('priority')) {
            $priority = $request->string('priority')->toString();
            if (in_array($priority, [Ticket::PRIORITY_LOW, Ticket::PRIORITY_MEDIUM, Ticket::PRIORITY_HIGH], true)) {
                $query->where('priority', $priority);
            }
        }

        if ($request->filled('channel')) {
            $channel = $request->string('channel')->toString();
            if (in_array($channel, [Ticket::CHANNEL_WHATSAPP_CLOUD, Ticket::CHANNEL_EMAIL, Ticket::CHANNEL_MANUAL], true)) {
                $query->where('channel', $channel);
            }
        }

        if ($request->boolean('unanswered')) {
            $query->whereNull('first_response_at');
        }
    }

    protected function logStatus(Ticket $ticket, Request $request, string $from): void
    {
        if ($from === (string) $ticket->status) {
            return;
        }

        $this->logActivity(
            $ticket,
            $request,
            'ticket_status',
            $ticket->number.' → '.Ticket::statusLabel((string) $ticket->status),
        );
    }

    protected function logActivity(Ticket $ticket, Request $request, string $type, string $subject): void
    {
        Activity::query()->create([
            'workspace_id' => $ticket->workspace_id,
            'contact_id' => $ticket->contact_id,
            'deal_id' => $ticket->deal_id,
            'company_id' => $ticket->company_id,
            'type' => $type,
            'subject' => $subject,
            'owner_id' => $request->user()->id,
            'actor_id' => $request->user()->id,
            'meta' => ['ticket_id' => $ticket->id],
        ]);
    }
}
