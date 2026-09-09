<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Ticket;
use App\Services\Crm\CrmFilter;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $query = Ticket::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'company', 'owner']);

        $this->constrain($query, $request);

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($inner) use ($q): void {
                $inner->where('subject', 'like', '%'.$q.'%')
                    ->orWhere('number', 'like', '%'.$q.'%');
            });
        }

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

        return Inertia::render('crm/tickets/index', [
            'tickets' => $rows->map->present()->values()->all(),
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'members' => $hub->members($workspace),
            'savedFilters' => [],
            'activeFilters' => [
                'view' => $request->input('view', 'all'),
                'status' => $request->input('status'),
                'owner' => $request->input('owner'),
                'priority' => $request->input('priority'),
                'channel' => $request->input('channel'),
                'unassigned' => $request->boolean('unassigned') ?: null,
                'unanswered' => $request->boolean('unanswered') ?: null,
                'q' => $request->input('q'),
            ],
            'listView' => $hub->listViewMeta('ticket', null, null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'stagePills' => $statusPills,
            'createOpen' => $request->boolean('create'),
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
            'priority' => ['nullable', 'in:low,medium,high'],
            'channel' => ['nullable', 'in:whatsapp_cloud,email,manual'],
        ]);

        $contact = Contact::query()->forWorkspace($request->user()->workspace)->findOrFail($data['contact_id']);

        Ticket::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'owner_id' => $request->user()->id,
            'subject' => $data['subject'],
            'priority' => $data['priority'] ?? Ticket::PRIORITY_MEDIUM,
            'channel' => $data['channel'] ?? Ticket::CHANNEL_MANUAL,
        ]);

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

        $ticket->moveTo($data['status']);

        return back();
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Ticket>  $query
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
}
