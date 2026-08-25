<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\Thread;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home — table-first command center. KPI strip plus operational previews:
 * tasks, unread inbox, and recent pipeline movement. Every number ties to
 * a live record; no decorative charts or department tiles here.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $today = now('Africa/Algiers')->toDateString();
        $ownerId = $request->integer('owner_id') ?: null;

        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

        if ($ownerId) {
            $openDeals->where('owner_id', $ownerId);
        }

        $outbound = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out');

        $unread = (int) Thread::query()->forWorkspace($workspace)->sum('unread_count');
        $leadsNewToday = Lead::query()
            ->forWorkspace($workspace)
            ->whereDate('created_at', $today)
            ->count();
        $sentToday = (clone $outbound)
            ->where('status', 'sent')
            ->whereDate('sent_at', $today)
            ->count();

        $openDealsCount = (clone $openDeals)->count();
        $tasksDue = Activity::query()
            ->forWorkspace($workspace)
            ->where('type', 'task')
            ->where('done', false)
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now('Africa/Algiers')->endOfDay())
            ->count();
        $deferredCount = (clone $outbound)
            ->where('status', 'queued')
            ->whereNotNull('deferred_until')
            ->where('deferred_until', '>', now())
            ->count();

        $taskQuery = Activity::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'deal.stage', 'owner'])
            ->where('type', 'task')
            ->where('done', false)
            ->orderByRaw('due_at is null')
            ->orderBy('due_at');

        if ($ownerId) {
            $taskQuery->where('owner_id', $ownerId);
        }

        return Inertia::render('home', [
            'today' => [
                [
                    'key' => 'open_deals',
                    'label' => 'Open deals',
                    'value' => $openDealsCount,
                    'hint' => 'Active pipeline — not won or lost',
                    'href' => '/crm/deals',
                ],
                [
                    'key' => 'tasks_due',
                    'label' => 'Tasks due today',
                    'value' => $tasksDue,
                    'hint' => $tasksDue > 0 ? 'Needs attention today' : 'Nothing due today',
                    'href' => '/crm/activities?date=today',
                ],
                [
                    'key' => 'inbox_unread',
                    'label' => 'Unread in desk',
                    'value' => $unread,
                    'hint' => $unread > 0 ? 'Conversations waiting' : 'Inbox clear',
                    'href' => '/inbox',
                ],
                [
                    'key' => 'leads_new',
                    'label' => 'New leads today',
                    'value' => $leadsNewToday,
                    'hint' => 'Captured since midnight Algiers',
                    'href' => '/crm/leads',
                ],
                [
                    'key' => 'outbound_sent',
                    'label' => 'Sent today',
                    'value' => $sentToday,
                    'hint' => 'Outbound messages delivered',
                    'href' => '/outbound',
                ],
                [
                    'key' => 'outbound_deferred',
                    'label' => 'Deferred sends',
                    'value' => $deferredCount,
                    'hint' => 'Queued for later delivery',
                    'href' => '/outbound',
                ],
            ],
            'nextSteps' => (clone $taskQuery)->limit(10)->get()->map(fn (Activity $a) => [
                'id' => $a->id,
                'subject' => $a->subject,
                'body' => $a->body,
                'due_at' => $a->due_at?->timezone('Africa/Algiers')->format('Y-m-d H:i'),
                'contact' => $a->contact ? [
                    'id' => $a->contact->id,
                    'first_name' => $a->contact->first_name,
                    'last_name' => $a->contact->last_name,
                ] : null,
                'deal' => $a->deal ? ['id' => $a->deal->id, 'title' => $a->deal->title] : null,
            ])->values(),
            'inboxPreview' => Thread::query()
                ->forWorkspace($workspace)
                ->where('unread_count', '>', 0)
                ->with(['contact', 'channel'])
                ->orderByDesc('last_message_at')
                ->limit(8)
                ->get()
                ->map(fn (Thread $t) => [
                    'id' => $t->id,
                    'subject' => $t->subject,
                    'unread_count' => $t->unread_count,
                    'last_message_at' => $t->last_message_at?->timezone('Africa/Algiers')->format('Y-m-d H:i'),
                    'contact' => $t->contact ? [
                        'id' => $t->contact->id,
                        'first_name' => $t->contact->first_name,
                        'last_name' => $t->contact->last_name,
                    ] : null,
                    'channel' => $t->channel ? ['name' => $t->channel->name] : null,
                ])->values(),
            'recentDeals' => Deal::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'stage', 'owner'])
                ->orderByDesc('last_activity_at')
                ->orderByDesc('updated_at')
                ->limit(8)
                ->get()
                ->map(fn (Deal $d) => [
                    'id' => $d->id,
                    'title' => $d->title,
                    'amount_cents' => (int) $d->amount_cents,
                    'last_activity_at' => $d->last_activity_at?->timezone('Africa/Algiers')->format('Y-m-d H:i'),
                    'stage' => $d->stage ? ['name' => $d->stage->name] : null,
                    'contact' => $d->contact ? [
                        'first_name' => $d->contact->first_name,
                        'last_name' => $d->contact->last_name,
                    ] : null,
                    'owner' => $d->owner ? ['name' => $d->owner->name] : null,
                ])->values(),
            'owners' => $workspace->users()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'owner_id' => $ownerId,
            ],
            'dataAsOf' => now('Africa/Algiers')->format('Y-m-d H:i'),
        ]);
    }
}
