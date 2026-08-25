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
 * Home — data-first command center. KPI strip only; drill into CRM modules
 * via quick links. No decorative charts or operational preview tables.
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
            'owners' => $workspace->users()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'owner_id' => $ownerId,
            ],
            'dataAsOf' => now('Africa/Algiers')->format('Y-m-d H:i'),
        ]);
    }
}
