<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Support\Integrations;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home — the calm command center. Answers two questions: what needs me
 * (today strip + next steps) and where do I go (department tiles). Every
 * number comes from an existing model; nothing is invented, and connection
 * warnings stay on Settings → Apps instead of this page.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $today = now('Africa/Algiers')->toDateString();

        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

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

        $integrations = Integrations::forWorkspace($workspace);
        $connectedApps = collect($integrations)->where('connected', true)->count();

        // Ads is wired when either the env-driven Marketing API sync or the
        // workspace Meta OAuth connection exists — same truth as /ads.
        $metaConnected = (filled(config('meta.access_token')) && filled(config('meta.app_id')))
            || ($workspace->integration(Integration::PROVIDER_META)?->isConnected() ?? false);

        return Inertia::render('home', [
            'today' => [
                ['key' => 'open_deals', 'label' => 'Open deals', 'value' => (clone $openDeals)->count()],
                ['key' => 'tasks_due', 'label' => 'Tasks due', 'value' => Activity::query()
                    ->forWorkspace($workspace)
                    ->where('type', 'task')
                    ->where('done', false)
                    ->whereNotNull('due_at')
                    ->where('due_at', '<=', now('Africa/Algiers')->endOfDay())
                    ->count()],
                ['key' => 'inbox_unread', 'label' => 'Unread in desk', 'value' => $unread],
                ['key' => 'outbound_sent', 'label' => 'Sent today', 'value' => $sentToday],
                ['key' => 'outbound_deferred', 'label' => 'Deferred', 'value' => (clone $outbound)
                    ->where('status', 'queued')
                    ->whereNotNull('deferred_until')
                    ->where('deferred_until', '>', now())
                    ->count()],
                ['key' => 'leads_new', 'label' => 'New leads today', 'value' => $leadsNewToday],
            ],
            'nextSteps' => Activity::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'deal.stage', 'owner'])
                ->where('type', 'task')
                ->where('done', false)
                ->orderByRaw('due_at is null')
                ->orderBy('due_at')
                ->limit(5)
                ->get(),
            'departments' => [
                ['key' => 'inbox', 'name' => 'Inbox', 'href' => '/inbox', 'value' => $unread, 'value_label' => 'unread'],
                ['key' => 'leads', 'name' => 'Leads', 'href' => '/leads', 'value' => $leadsNewToday, 'value_label' => 'new today'],
                ['key' => 'contacts', 'name' => 'Contacts', 'href' => '/crm/contacts', 'value' => Contact::query()->forWorkspace($workspace)->count(), 'value_label' => 'total'],
                ['key' => 'ads', 'name' => 'Ads', 'href' => '/ads', 'connected' => $metaConnected],
                ['key' => 'outbound', 'name' => 'Outbound', 'href' => '/outbound', 'value' => $sentToday, 'value_label' => 'sent today'],
                ['key' => 'integrations', 'name' => 'Integrations', 'href' => '/settings/apps', 'value' => $connectedApps, 'value_label' => 'of '.count($integrations).' connected'],
            ],
        ]);
    }
}
