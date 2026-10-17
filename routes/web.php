<?php

use App\Http\Controllers\Activation\ActivationDismissalController;
use App\Http\Controllers\Ads\AdsCenterController;
use App\Http\Controllers\Api\AgentOsController;
use App\Http\Controllers\Api\OpenManusController;
use App\Http\Controllers\Auth\AppleController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\InstagramController;
use App\Http\Controllers\Auth\MetaController;
use App\Http\Controllers\Crm\ActivityController;
use App\Http\Controllers\Crm\AskEvoController;
use App\Http\Controllers\Crm\BulkActionController;
use App\Http\Controllers\Crm\CommandSearchController;
use App\Http\Controllers\Crm\CompanyController;
use App\Http\Controllers\Crm\ContactController;
use App\Http\Controllers\Crm\ContactImportController;
use App\Http\Controllers\Crm\ContactMergeController;
use App\Http\Controllers\Crm\ConversationHistoryController;
use App\Http\Controllers\Crm\DashboardController;
use App\Http\Controllers\Crm\DealController;
use App\Http\Controllers\Crm\DealImportController;
use App\Http\Controllers\Crm\DealLineItemController;
use App\Http\Controllers\Crm\DealSplitController;
use App\Http\Controllers\Crm\EnrichmentController;
use App\Http\Controllers\Crm\FunnelController;
use App\Http\Controllers\Crm\LeadCaptureController;
use App\Http\Controllers\Crm\LeadController;
use App\Http\Controllers\Crm\LeadOsController;
use App\Http\Controllers\Crm\QuickRecordController;
use App\Http\Controllers\Crm\QuickRecordHarnessController;
use App\Http\Controllers\Crm\QuoteController;
use App\Http\Controllers\Crm\RecordLayoutController;
use App\Http\Controllers\Crm\ReportController;
use App\Http\Controllers\Crm\SavedFilterController;
use App\Http\Controllers\Crm\SavedReportController;
use App\Http\Controllers\Crm\ScheduledReportController;
use App\Http\Controllers\Crm\SegmentController;
use App\Http\Controllers\Crm\TicketController;
use App\Http\Controllers\Crm\WorkflowController;
use App\Http\Controllers\Desk\AgentsController;
use App\Http\Controllers\Desk\DeskConnectorController;
use App\Http\Controllers\Desk\InboxController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\Outbound\CampaignController;
use App\Http\Controllers\Outbound\DomainController;
use App\Http\Controllers\Outbound\EnrollmentController;
use App\Http\Controllers\Outbound\ListsController;
use App\Http\Controllers\Outbound\MailboxController;
use App\Http\Controllers\Outbound\OutboundController;
use App\Http\Controllers\Outbound\OutboxController;
use App\Http\Controllers\Outbound\QuietHoursController;
use App\Http\Controllers\Outbound\ReplyController;
use App\Http\Controllers\Outbound\SequenceController;
use App\Http\Controllers\Outbound\SuppressionController;
use App\Http\Controllers\Outbound\TemplateController;
use App\Http\Controllers\Outbound\WarmupController;
use App\Http\Controllers\Public\FunnelTrackingController;
use App\Http\Controllers\Public\LegalController;
use App\Http\Controllers\Public\MeetingBookController;
use App\Http\Controllers\Public\QuoteAcceptanceController;
use App\Http\Controllers\Public\TrackingController;
use App\Http\Controllers\Public\UnsubscribeController;
use App\Http\Controllers\SchedulerHeartbeatController;
use App\Http\Controllers\Settings\AppsController;
use App\Http\Controllers\Settings\ChannelSettingsController;
use App\Http\Controllers\Settings\ConnectorController;
use App\Http\Controllers\Settings\CustomAttributeController;
use App\Http\Controllers\Settings\EvolutionSettingsController;
use App\Http\Controllers\Settings\MetaSettingsController;
use App\Http\Controllers\Settings\OAuthSetupController;
use App\Http\Controllers\Settings\PermissionsController;
use App\Http\Controllers\Settings\PipelineController;
use App\Http\Controllers\Settings\RecordLayoutSettingsController;
use App\Http\Controllers\Settings\WhatsAppController;
use App\Http\Controllers\Webhooks\EvolutionWebhookController;
use App\Http\Controllers\Webhooks\MetaLeadWebhookController;
use App\Http\Controllers\Webhooks\OutboundBounceWebhookController;
use App\Http\Middleware\EnforceProductPermissions;
use App\Http\Middleware\EnforceSimpleMode;
use App\Support\DesignLabAccess;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/apple', [AppleController::class, 'redirect'])->name('auth.apple');
});

// Shared Google callback: guests sign in; authenticated users complete a
// Gmail / Calendar reconnect on the same OAuth client. Extra scopes are
// never requested from the login button.
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');

// Apple posts the identity token as a cross-site form_post. GET stays for
// local/manual probes. CSRF is excepted for this path in bootstrap/app.php.
Route::match(['get', 'post'], '/auth/apple/callback', [AppleController::class, 'callback'])
    ->name('auth.apple.callback');

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');

Route::get('/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');

Route::get('/unsubscribe', UnsubscribeController::class)->name('unsubscribe');

Route::get('/up/scheduler', SchedulerHeartbeatController::class)->name('up.scheduler');

Route::get('/design-lab/{path?}', function () {
    abort_unless(DesignLabAccess::allowed(auth()->user()), 404);

    return view('design-lab');
})->where('path', '.*')->name('design-lab');
Route::get('/q/{token}', [QuoteAcceptanceController::class, 'show'])->name('quotes.public.show');
Route::post('/q/{token}/accept', [QuoteAcceptanceController::class, 'accept'])->name('quotes.public.accept');
Route::get('/book/{slug}', [MeetingBookController::class, 'show'])->name('meetings.public.show');
Route::post('/book/{slug}', [MeetingBookController::class, 'store'])->middleware('throttle:20,1')->name('meetings.public.store');
Route::get('/book/{slug}/done', [MeetingBookController::class, 'done'])->name('meetings.public.done');
Route::get('/outbound/t/{token}.gif', [TrackingController::class, 'open'])->name('outbound.track.open');
Route::get('/outbound/c/{token}', [TrackingController::class, 'click'])->name('outbound.track.click');
Route::get('/track/{slug}/visit.gif', [FunnelTrackingController::class, 'pixel'])->name('funnel.track.visit');

Route::get('/webhooks/evolution/{webhookKey}', [EvolutionWebhookController::class, 'verify'])
    ->whereAlphaNumeric('webhookKey')
    ->name('webhooks.evolution.verify');
Route::post('/webhooks/evolution/{webhookKey}', [EvolutionWebhookController::class, 'handle'])
    ->whereAlphaNumeric('webhookKey')
    ->middleware('throttle:120,1')
    ->name('webhooks.evolution');
Route::post('/webhooks/outbound/bounces/{webhookKey}', [OutboundBounceWebhookController::class, 'handle'])
    ->whereAlphaNumeric('webhookKey')
    ->middleware('throttle:120,1')
    ->name('webhooks.outbound.bounces');
Route::get('/webhooks/meta/leads/{webhookKey}', [MetaLeadWebhookController::class, 'verify'])
    ->whereAlphaNumeric('webhookKey')
    ->name('webhooks.meta.leads.verify');
Route::post('/webhooks/meta/leads/{webhookKey}', [MetaLeadWebhookController::class, 'handle'])
    ->whereAlphaNumeric('webhookKey')
    ->middleware('throttle:60,1')
    ->name('webhooks.meta.leads');

Route::middleware(['auth', 'verified', EnforceProductPermissions::class, EnforceSimpleMode::class])->group(function () {
    Route::get('/dashboard', HomeController::class)->name('dashboard');
    Route::post('/api/agent/run', [OpenManusController::class, 'run'])->middleware('throttle:10,1')->name('api.agent.run');
    Route::get('/api/agent/health', [OpenManusController::class, 'health'])->name('api.agent.health');
    Route::middleware('can-manage-settings')->group(function () {
        Route::get('/api/agent/status', [OpenManusController::class, 'status'])->name('api.agent.status');
        Route::get('/api/agent/plugins', [AgentOsController::class, 'plugins'])->name('api.agent.plugins');
        Route::put('/api/agent/plugins/{plugin}', [AgentOsController::class, 'updatePlugin'])
            ->where('plugin', '[A-Za-z0-9._-]+')
            ->name('api.agent.plugins.update');
        Route::get('/api/agent/connectors', [AgentOsController::class, 'connectors'])->name('api.agent.connectors');
        Route::put('/api/agent/connectors/{connector}', [AgentOsController::class, 'updateConnector'])
            ->where('connector', '[A-Za-z0-9._-]+')
            ->name('api.agent.connectors.update');
        Route::delete('/api/agent/connectors/{connector}', [AgentOsController::class, 'destroyConnector'])
            ->where('connector', '[A-Za-z0-9._-]+')
            ->name('api.agent.connectors.destroy');
    });
    Route::redirect('/shell', '/dashboard')->name('shell');
    Route::get('/agents', [AgentsController::class, 'index'])->name('agents.index');
    Route::get('/agents/chats', [AgentsController::class, 'chats'])->name('agents.chats.index');
    Route::get('/agents/chats/{chat}', [AgentsController::class, 'chat'])->name('agents.chats.show');
    Route::get('/agents/bots', [AgentsController::class, 'bots'])->name('agents.bots.index');
    Route::get('/agents/bots/new', [AgentsController::class, 'newBot'])->name('agents.bots.create');
    Route::get('/agents/bots/{bot}', [AgentsController::class, 'bot'])->name('agents.bots.show');
    Route::post('/dashboard/activation/dismiss', [ActivationDismissalController::class, 'store'])
        ->name('dashboard.activation.dismiss');
    Route::post('/lead-os/graph', [LeadOsController::class, 'runGraph'])->name('lead-os.graph');
    Route::post('/crm/lost-reviews/{suggestion}/confirm', [LeadOsController::class, 'confirmLost'])->name('crm.lost-reviews.confirm');

    // Meta workspace OAuth. 404 unless META_* env is set.
    Route::get('/auth/meta', [MetaController::class, 'redirect'])->name('auth.meta');
    Route::get('/auth/meta/callback', [MetaController::class, 'callback'])->name('auth.meta.callback');
    Route::get('/auth/instagram', [InstagramController::class, 'redirect'])->name('auth.instagram');
    Route::get('/auth/instagram/callback', [InstagramController::class, 'callback'])->name('auth.instagram.callback');

    Route::redirect('/leads', '/crm/deals/board')->name('leads.index');

    Route::get('/inbox', [InboxController::class, 'inbox'])->name('desk.inbox');
    Route::get('/desk', [InboxController::class, 'index'])->name('desk.index');
    Route::post('/desk/threads/{thread}/reply', [InboxController::class, 'reply'])->name('desk.reply');
    Route::post('/desk/threads/{thread}/ticket', [InboxController::class, 'openTicket'])->name('desk.ticket.open');
    Route::post('/desk/connectors', [DeskConnectorController::class, 'store'])->name('desk.connectors.store');
    Route::get('/conversations', [ConversationHistoryController::class, 'index'])->name('crm.conversations');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/reports/funnels', [FunnelController::class, 'index'])->name('reports.funnels');
    Route::get('/reports/{category}', [ReportController::class, 'index'])->whereIn('category', ['sales', 'pipeline', 'outbound', 'ads'])->name('reports.category');
    Route::get('/api/funnels/{funnel}', [FunnelController::class, 'show'])->name('api.funnels.show');
    Route::get('/crm/reports', [ReportController::class, 'index'])->name('crm.reports');
    Route::get('/crm/report-builder', [SavedReportController::class, 'index'])->name('crm.report-builder.index');
    Route::get('/crm/report-builder/cross-object', [SavedReportController::class, 'crossObject'])->name('crm.report-builder.cross-object');
    Route::post('/crm/report-builder', [SavedReportController::class, 'store'])->name('crm.report-builder.store');
    Route::get('/crm/report-builder/{savedReport}/run', [SavedReportController::class, 'run'])->name('crm.report-builder.run');
    Route::post('/reports/schedules', [ScheduledReportController::class, 'store'])->name('reports.schedules.store');
    Route::put('/reports/schedules/{scheduledReport}', [ScheduledReportController::class, 'update'])->name('reports.schedules.update');
    Route::delete('/reports/schedules/{scheduledReport}', [ScheduledReportController::class, 'destroy'])->name('reports.schedules.destroy');
    Route::post('/reports/dashboards', [DashboardController::class, 'store'])->name('reports.dashboards.store');
    Route::put('/reports/dashboards/{dashboard}', [DashboardController::class, 'update'])->name('reports.dashboards.update');
    Route::delete('/reports/dashboards/{dashboard}', [DashboardController::class, 'destroy'])->name('reports.dashboards.destroy');
    Route::post('/reports/dashboards/{dashboard}/widgets', [DashboardController::class, 'addWidget'])->name('reports.dashboards.widgets.store');
    Route::delete('/reports/dashboards/{dashboard}/widgets', [DashboardController::class, 'removeWidget'])->name('reports.dashboards.widgets.destroy');
    Route::get('/crm/activities', [ActivityController::class, 'index'])->name('crm.activities.index');
    Route::post('/crm/activities', [ActivityController::class, 'store'])->name('crm.activities.store');
    Route::post('/crm/activities/{activity}/complete', [ActivityController::class, 'complete'])->name('crm.activities.complete');
    Route::post('/crm/activities/{activity}/attendance', [ActivityController::class, 'attendance'])->name('crm.activities.attendance');
    Route::post('/crm/filters', [SavedFilterController::class, 'store'])->name('crm.filters.store');
    Route::patch('/crm/filters/{savedFilter}', [SavedFilterController::class, 'update'])->name('crm.filters.update');
    Route::delete('/crm/filters/{savedFilter}', [SavedFilterController::class, 'destroy'])->name('crm.filters.destroy');
    Route::get('/crm/command/search', CommandSearchController::class)
        ->name('crm.command.search');
    Route::get('/ask-evo/context', [AskEvoController::class, 'context'])->name('ask-evo.context');
    Route::post('/ask-evo', [AskEvoController::class, 'ask'])->name('ask-evo');
    Route::get('/crm/records/{type}/{id}/peek', [QuickRecordController::class, 'peek'])
        ->whereIn('type', ['contact', 'company', 'lead', 'deal', 'quote', 'ticket'])
        ->whereNumber('id')
        ->name('crm.records.peek');

    if (app()->environment(['local', 'testing'])) {
        Route::get('/crm/quick-record-drawer/harness', [QuickRecordHarnessController::class, 'show'])
            ->name('crm.quick-record-drawer.harness');
    }

    Route::get('/crm/record-layouts/{entity}', [RecordLayoutController::class, 'show'])->name('crm.record-layouts.show');
    Route::put('/crm/record-layouts/{entity}', [RecordLayoutController::class, 'update'])->name('crm.record-layouts.update');
    Route::put('/crm/record-layouts/{entity}/workspace-default', [RecordLayoutController::class, 'updateWorkspaceDefault'])->name('crm.record-layouts.workspace-default');
    Route::get('/crm/segments', [SegmentController::class, 'index'])->name('crm.segments.index');
    Route::post('/crm/segments/preview', [SegmentController::class, 'preview'])->name('crm.segments.preview');
    Route::get('/crm/segments/{segment}', [SegmentController::class, 'show'])->name('crm.segments.show');
    Route::post('/crm/segments', [SegmentController::class, 'store'])->name('crm.segments.store');
    Route::put('/crm/segments/{segment}', [SegmentController::class, 'update'])->name('crm.segments.update');
    Route::delete('/crm/segments/{segment}', [SegmentController::class, 'destroy'])->name('crm.segments.destroy');
    Route::post('/crm/segments/{segment}/sync-meta', [SegmentController::class, 'syncMeta'])->name('crm.segments.sync-meta');
    Route::put('/crm/deals/{deal}/splits', [DealSplitController::class, 'update'])->name('crm.deals.splits.update');

    Route::get('/automation', [WorkflowController::class, 'index'])->name('automation');
    Route::get('/crm/workflows', [WorkflowController::class, 'index'])->name('crm.workflows.index');
    Route::post('/crm/workflows', [WorkflowController::class, 'store'])->name('crm.workflows.store');
    Route::put('/crm/workflows/{workflow}', [WorkflowController::class, 'update'])->name('crm.workflows.update');
    Route::post('/crm/workflows/templates', [WorkflowController::class, 'storeTemplate'])->name('crm.workflows.templates.store');
    Route::post('/crm/workflows/{workflow}/toggle', [WorkflowController::class, 'toggle'])->name('crm.workflows.toggle');
    Route::delete('/crm/workflows/{workflow}', [WorkflowController::class, 'destroy'])->name('crm.workflows.destroy');
    Route::get('/crm/quotes', [QuoteController::class, 'index'])->name('crm.quotes.index');
    Route::post('/crm/deals/{deal}/quotes', [QuoteController::class, 'store'])->name('crm.quotes.store');
    Route::put('/crm/quotes/{quote}', [QuoteController::class, 'update'])->name('crm.quotes.update');
    Route::get('/crm/quotes/{quote}', [QuoteController::class, 'show'])->name('crm.quotes.show');
    Route::get('/crm/quotes/{quote}/preview', [QuoteController::class, 'preview'])->name('crm.quotes.preview');
    Route::post('/crm/quotes/{quote}/send', [QuoteController::class, 'send'])->name('crm.quotes.send');
    Route::post('/crm/quotes/{quote}/revoke', [QuoteController::class, 'revoke'])->name('crm.quotes.revoke');

    Route::get('/crm/companies', [CompanyController::class, 'index'])->name('crm.companies.index');
    Route::post('/crm/companies', [CompanyController::class, 'store'])->name('crm.companies.store');
    Route::get('/crm/companies/{company}', [CompanyController::class, 'show'])->name('crm.companies.show');
    Route::put('/crm/companies/{company}', [CompanyController::class, 'update'])->name('crm.companies.update');
    Route::put('/crm/companies/{company}/attributes', [CompanyController::class, 'updateAttributes'])->name('crm.companies.attributes');
    Route::post('/crm/companies/{company}/ask', [AskEvoController::class, 'company'])->name('crm.companies.ask');
    Route::post('/crm/companies/{company}/enrich', [EnrichmentController::class, 'company'])->name('crm.companies.enrich');

    Route::get('/crm/contacts', [ContactController::class, 'index'])->name('crm.contacts.index');
    Route::get('/crm/contacts/export', [ContactController::class, 'export'])->name('crm.contacts.export');
    Route::get('/crm/contacts/import', [ContactImportController::class, 'create'])->name('crm.contacts.import');
    Route::post('/crm/contacts/import', [ContactImportController::class, 'store'])->name('crm.contacts.import.store');
    Route::get('/crm/contacts/import/{batch}', [ContactImportController::class, 'show'])->name('crm.contacts.import.show');
    Route::put('/crm/contacts/import/{batch}', [ContactImportController::class, 'update'])->name('crm.contacts.import.update');
    Route::post('/crm/contacts/import/{batch}/commit', [ContactImportController::class, 'commit'])->name('crm.contacts.import.commit');
    Route::get('/crm/contacts/duplicates', [ContactMergeController::class, 'index'])->name('crm.contacts.merge.index');
    Route::get('/crm/contacts/merge/{survivor}/{absorbed}', [ContactMergeController::class, 'show'])->name('crm.contacts.merge.show');
    Route::post('/crm/contacts/merge', [ContactMergeController::class, 'store'])->name('crm.contacts.merge.store');
    Route::post('/crm/contacts/bulk', [BulkActionController::class, 'contacts'])->name('crm.contacts.bulk');
    Route::post('/crm/contacts', [ContactController::class, 'store'])->name('crm.contacts.store');
    Route::get('/crm/contacts/{contact}', [ContactController::class, 'show'])->name('crm.contacts.show');
    Route::put('/crm/contacts/{contact}', [ContactController::class, 'update'])->name('crm.contacts.update');
    Route::put('/crm/contacts/{contact}/attributes', [ContactController::class, 'updateAttributes'])->name('crm.contacts.attributes');
    Route::post('/crm/contacts/{contact}/ask', [AskEvoController::class, 'contact'])->name('crm.contacts.ask');
    Route::post('/crm/contacts/{contact}/draft-email', [AskEvoController::class, 'draftContact'])->name('crm.contacts.draft-email');
    Route::post('/crm/contacts/{contact}/enrich', [EnrichmentController::class, 'contact'])->name('crm.contacts.enrich');

    Route::get('/crm/leads', [LeadController::class, 'index'])->name('crm.leads.index');
    Route::post('/crm/leads', [LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/leads/captures', [LeadCaptureController::class, 'index'])->name('crm.leads.captures');
    Route::post('/crm/leads/captures/csv', [LeadCaptureController::class, 'csv'])->name('crm.leads.captures.csv');
    Route::post('/crm/leads/captures/url', [LeadCaptureController::class, 'url'])->name('crm.leads.captures.url');
    Route::post('/crm/leads/captures/maps', [LeadCaptureController::class, 'maps'])->name('crm.leads.captures.maps');
    Route::post('/crm/leads/captures/{capture}/accept', [LeadCaptureController::class, 'accept'])->name('crm.leads.captures.accept');
    Route::post('/crm/leads/captures/{capture}/reject', [LeadCaptureController::class, 'reject'])->name('crm.leads.captures.reject');
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show'])->name('crm.leads.show');
    Route::put('/crm/leads/{lead}', [LeadController::class, 'update'])->name('crm.leads.update');
    Route::post('/crm/leads/{lead}/qualify', [LeadController::class, 'qualify'])->name('crm.leads.qualify');
    Route::post('/crm/leads/{lead}/ask', [AskEvoController::class, 'lead'])->name('crm.leads.ask');
    Route::post('/crm/leads/{lead}/enrich', [EnrichmentController::class, 'lead'])->name('crm.leads.enrich');
    Route::post('/crm/enrichment-runs/{run}/apply', [EnrichmentController::class, 'apply'])->name('crm.enrichment.apply');
    Route::post('/crm/enrichment-runs/{run}/dismiss', [EnrichmentController::class, 'dismiss'])->name('crm.enrichment.dismiss');

    Route::get('/crm/deals/export', [DealController::class, 'export'])->name('crm.deals.export');
    Route::get('/crm/deals/import', [DealImportController::class, 'create'])->name('crm.deals.import');
    Route::post('/crm/deals/import', [DealImportController::class, 'store'])->name('crm.deals.import.store');
    Route::get('/crm/deals/import/{batch}', [DealImportController::class, 'show'])->name('crm.deals.import.show');
    Route::put('/crm/deals/import/{batch}', [DealImportController::class, 'update'])->name('crm.deals.import.update');
    Route::post('/crm/deals/import/{batch}/commit', [DealImportController::class, 'commit'])->name('crm.deals.import.commit');
    Route::post('/crm/deals/bulk', [BulkActionController::class, 'deals'])->name('crm.deals.bulk');
    Route::get('/crm/deals', [DealController::class, 'index'])->name('crm.deals.index');
    Route::get('/crm/deals/board', [DealController::class, 'board'])->name('crm.deals.board');
    Route::put('/crm/deals/board/options', [DealController::class, 'updateBoardOptions'])->name('crm.deals.board.options');
    Route::post('/crm/deals', [DealController::class, 'store'])->name('crm.deals.store');
    Route::get('/crm/deals/{deal}', [DealController::class, 'show'])->name('crm.deals.show');
    Route::put('/crm/deals/{deal}', [DealController::class, 'update'])->name('crm.deals.update');
    Route::put('/crm/deals/{deal}/attributes', [DealController::class, 'updateAttributes'])->name('crm.deals.attributes');
    Route::post('/crm/deals/{deal}/move', [DealController::class, 'move'])->name('crm.deals.move');
    Route::post('/crm/deals/{deal}/stage-approvals/{approval}/approve', [DealController::class, 'approveStage'])->name('crm.deals.stage-approvals.approve');
    Route::post('/crm/deals/{deal}/stage-approvals/{approval}/reject', [DealController::class, 'rejectStage'])->name('crm.deals.stage-approvals.reject');
    Route::post('/crm/deals/{deal}/line-items', [DealLineItemController::class, 'store'])->name('crm.deals.line-items.store');
    Route::put('/crm/deals/{deal}/line-items/{lineItem}', [DealLineItemController::class, 'update'])->name('crm.deals.line-items.update');
    Route::delete('/crm/deals/{deal}/line-items/{lineItem}', [DealLineItemController::class, 'destroy'])->name('crm.deals.line-items.destroy');
    Route::post('/crm/deals/{deal}/ask', [AskEvoController::class, 'deal'])->name('crm.deals.ask');
    Route::post('/crm/deals/{deal}/suggestions/{suggestion}/apply', [LeadOsController::class, 'applySuggestion'])->name('crm.deals.suggestions.apply');
    Route::post('/crm/deals/{deal}/suggestions/{suggestion}/dismiss', [LeadOsController::class, 'dismissSuggestion'])->name('crm.deals.suggestions.dismiss');
    Route::post('/crm/deals/{deal}/draft-email', [AskEvoController::class, 'draftDeal'])->name('crm.deals.draft-email');

    Route::get('/crm/tickets', [TicketController::class, 'index'])->name('crm.tickets.index');
    Route::get('/crm/tickets/board', [TicketController::class, 'board'])->name('crm.tickets.board');
    Route::post('/crm/tickets', [TicketController::class, 'store'])->name('crm.tickets.store');
    Route::post('/crm/tickets/{ticket}/move', [TicketController::class, 'move'])->name('crm.tickets.move');
    Route::post('/crm/tickets/{ticket}/ask', [AskEvoController::class, 'ticket'])->name('crm.tickets.ask');
    Route::post('/crm/tickets/{ticket}/thread', [TicketController::class, 'attachThread'])->name('crm.tickets.thread');
    Route::get('/crm/tickets/{ticket}', [TicketController::class, 'show'])->name('crm.tickets.show');
    Route::put('/crm/tickets/{ticket}', [TicketController::class, 'update'])->name('crm.tickets.update');

    Route::get('/ads', [AdsCenterController::class, 'index'])->name('ads.index');
    Route::get('/ads/attribution', [AdsCenterController::class, 'attribution'])->name('ads.attribution');
    Route::get('/ads/audiences', [AdsCenterController::class, 'audiences'])->name('ads.audiences');
    Route::get('/ads/campaigns', [AdsCenterController::class, 'campaigns'])->name('ads.campaigns.index');
    Route::get('/ads/ad-sets', [AdsCenterController::class, 'adSets'])->name('ads.ad-sets.index');
    Route::get('/ads/ads', [AdsCenterController::class, 'adsIndex'])->name('ads.ads.index');
    Route::get('/ads/campaigns/{campaign}', [AdsCenterController::class, 'show'])->name('ads.campaigns.show');
    Route::post('/ads/sync', [AdsCenterController::class, 'sync'])->name('ads.sync');

    Route::get('/outbound', [OutboundController::class, 'index'])->name('outbound.index');
    Route::get('/outbound/lists', [ListsController::class, 'index'])->name('outbound.lists.index');

    Route::get('/outbound/mailboxes', [MailboxController::class, 'index'])->name('outbound.mailboxes.index');
    Route::post('/outbound/mailboxes', [MailboxController::class, 'store'])->name('outbound.mailboxes.store');
    Route::post('/outbound/mailboxes/sync', [MailboxController::class, 'sync'])->name('outbound.mailboxes.sync');
    Route::put('/outbound/mailboxes/{mailbox}', [MailboxController::class, 'update'])->name('outbound.mailboxes.update');
    Route::post('/outbound/mailboxes/{mailbox}/toggle', [MailboxController::class, 'toggle'])->name('outbound.mailboxes.toggle');
    Route::post('/outbound/mailboxes/{mailbox}/default', [MailboxController::class, 'setDefault'])->name('outbound.mailboxes.default');
    Route::post('/outbound/mailboxes/{mailbox}/test', [MailboxController::class, 'sendTest'])->name('outbound.mailboxes.test');
    Route::delete('/outbound/mailboxes/{mailbox}', [MailboxController::class, 'destroy'])->name('outbound.mailboxes.destroy');

    Route::get('/outbound/warmup', [WarmupController::class, 'index'])->name('outbound.warmup.index');
    Route::post('/outbound/warmup/{mailbox}/toggle', [WarmupController::class, 'toggle'])->name('outbound.warmup.toggle');
    Route::put('/outbound/warmup/{mailbox}', [WarmupController::class, 'update'])->name('outbound.warmup.update');
    Route::post('/outbound/warmup/{mailbox}/include', [WarmupController::class, 'include'])->name('outbound.warmup.include');

    Route::get('/outbound/domains', [DomainController::class, 'index'])->name('outbound.domains.index');
    Route::post('/outbound/domains', [DomainController::class, 'store'])->name('outbound.domains.store');
    Route::put('/outbound/domains/{domain}', [DomainController::class, 'update'])->name('outbound.domains.update');
    Route::post('/outbound/domains/{domain}/verify', [DomainController::class, 'toggleVerified'])->name('outbound.domains.verify');
    Route::delete('/outbound/domains/{domain}', [DomainController::class, 'destroy'])->name('outbound.domains.destroy');

    Route::get('/outbound/campaigns', [CampaignController::class, 'index'])->name('outbound.campaigns.index');
    Route::post('/outbound/campaigns', [CampaignController::class, 'store'])->name('outbound.campaigns.store');
    Route::get('/outbound/campaigns/{campaign}', [CampaignController::class, 'show'])->name('outbound.campaigns.show');
    Route::post('/outbound/campaigns/{campaign}/send-now', [CampaignController::class, 'sendNow'])->name('outbound.campaigns.send-now');
    Route::post('/outbound/campaigns/{campaign}/schedule', [CampaignController::class, 'schedule'])->name('outbound.campaigns.schedule');
    Route::post('/outbound/campaigns/{campaign}/cancel', [CampaignController::class, 'cancel'])->name('outbound.campaigns.cancel');
    Route::delete('/outbound/campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('outbound.campaigns.destroy');

    Route::get('/outbound/sequences', [SequenceController::class, 'index'])->name('outbound.sequences.index');
    Route::post('/outbound/sequences', [SequenceController::class, 'store'])->name('outbound.sequences.store');
    Route::get('/outbound/sequences/{sequence}', [SequenceController::class, 'show'])->name('outbound.sequences.show');
    Route::put('/outbound/sequences/{sequence}', [SequenceController::class, 'update'])->name('outbound.sequences.update');
    Route::post('/outbound/sequences/{sequence}/toggle', [SequenceController::class, 'toggle'])->name('outbound.sequences.toggle');
    Route::post('/outbound/sequences/{sequence}/steps', [SequenceController::class, 'addStep'])->name('outbound.sequences.steps.store');
    Route::post('/outbound/sequences/{sequence}/steps/reorder', [SequenceController::class, 'reorderSteps'])->name('outbound.sequences.steps.reorder');
    Route::put('/outbound/sequences/{sequence}/steps/{step}', [SequenceController::class, 'updateStep'])->name('outbound.sequences.steps.update');
    Route::delete('/outbound/sequences/{sequence}/steps/{step}', [SequenceController::class, 'removeStep'])->name('outbound.sequences.steps.destroy');
    Route::post('/outbound/sequences/{sequence}/enroll', [SequenceController::class, 'enroll'])->name('outbound.sequences.enroll');

    Route::post('/outbound/enrollments/{enrollment}/pause', [EnrollmentController::class, 'pause'])->name('outbound.enrollments.pause');
    Route::post('/outbound/enrollments/{enrollment}/resume', [EnrollmentController::class, 'resume'])->name('outbound.enrollments.resume');
    Route::post('/outbound/enrollments/{enrollment}/cancel', [EnrollmentController::class, 'cancel'])->name('outbound.enrollments.cancel');

    Route::get('/outbound/outbox', [OutboxController::class, 'index'])->name('outbound.outbox.index');
    Route::get('/outbound/replies', [ReplyController::class, 'index'])->name('outbound.replies.index');
    Route::redirect('/outbound/reports', '/reports/outbound');

    Route::get('/outbound/suppressions', [SuppressionController::class, 'index'])->name('outbound.suppressions.index');
    Route::post('/outbound/suppressions', [SuppressionController::class, 'store'])->name('outbound.suppressions.store');
    Route::delete('/outbound/suppressions/{suppression}', [SuppressionController::class, 'destroy'])->name('outbound.suppressions.destroy');

    Route::get('/outbound/quiet-hours', [QuietHoursController::class, 'edit'])->name('outbound.quiet-hours.edit');
    Route::post('/outbound/quiet-hours', [QuietHoursController::class, 'update'])->name('outbound.quiet-hours.update');

    Route::get('/outbound/templates', [TemplateController::class, 'index'])->name('outbound.templates.index');
    Route::post('/outbound/templates', [TemplateController::class, 'store'])->name('outbound.templates.store');
    Route::get('/outbound/templates/{template}', [TemplateController::class, 'show'])->name('outbound.templates.show');
    Route::put('/outbound/templates/{template}', [TemplateController::class, 'update'])->name('outbound.templates.update');
    Route::delete('/outbound/templates/{template}', [TemplateController::class, 'destroy'])->name('outbound.templates.destroy');
    Route::post('/outbound/templates/send', [TemplateController::class, 'send'])->name('outbound.templates.send');

    Route::get('/settings/apps', [AppsController::class, 'index'])->name('settings.apps');
    Route::get('/settings/setup', [OAuthSetupController::class, 'start'])->name('settings.setup.start');
    Route::get('/settings/setup/{provider}', [OAuthSetupController::class, 'show'])->name('settings.setup.show');
    Route::post('/settings/setup/meta/page', [OAuthSetupController::class, 'updateMetaPage'])->name('settings.setup.meta.page');
    Route::get('/settings/apps/meta', [AppsController::class, 'meta'])->name('settings.apps.meta');

    Route::get('/settings/connectors', [ConnectorController::class, 'index'])->name('settings.connectors');
    Route::post('/settings/connectors', [ConnectorController::class, 'store'])->name('settings.connectors.store');
    Route::get('/settings/connectors/google/{provider}', [ConnectorController::class, 'reconnectGoogle'])->name('settings.connectors.google');
    Route::post('/settings/connectors/{provider}/sync', [ConnectorController::class, 'startSync'])->name('settings.connectors.sync.start');
    Route::post('/settings/connectors/{provider}/pause', [ConnectorController::class, 'pauseSync'])->name('settings.connectors.sync.pause');

    Route::get('/settings/evolution', [EvolutionSettingsController::class, 'edit'])->name('settings.evolution');
    Route::post('/settings/evolution/sync', [EvolutionSettingsController::class, 'sync'])->name('settings.evolution.sync');
    Route::get('/settings/whatsapp', [WhatsAppController::class, 'show'])->name('settings.whatsapp');
    Route::post('/settings/whatsapp/connect', [WhatsAppController::class, 'connect'])->name('settings.whatsapp.connect');
    Route::get('/settings/whatsapp/status', [WhatsAppController::class, 'status'])->name('settings.whatsapp.status');
    Route::get('/settings/whatsapp-business', [WhatsAppController::class, 'showBusiness'])->name('settings.whatsapp-business');
    Route::post('/settings/whatsapp-business/connect', [WhatsAppController::class, 'connectBusiness'])->name('settings.whatsapp-business.connect');
    Route::get('/settings/meta', [MetaSettingsController::class, 'edit'])->name('settings.meta');
    Route::get('/settings/channels', [ChannelSettingsController::class, 'edit'])->name('settings.channels');
    Route::post('/settings/channels', [ChannelSettingsController::class, 'update'])->name('settings.channels.update');
    Route::get('/settings/attributes', [CustomAttributeController::class, 'edit'])->name('settings.attributes');
    Route::post('/settings/attributes', [CustomAttributeController::class, 'store'])->name('settings.attributes.store');
    Route::put('/settings/attributes/{definition}', [CustomAttributeController::class, 'update'])->name('settings.attributes.update');
    Route::delete('/settings/attributes/{definition}', [CustomAttributeController::class, 'destroy'])->name('settings.attributes.destroy');
    Route::get('/settings/pipelines', [PipelineController::class, 'index'])->name('settings.pipelines');
    Route::get('/settings/permissions', [PermissionsController::class, 'index'])->name('settings.permissions');
    Route::put('/settings/permissions/{user}', [PermissionsController::class, 'update'])->name('settings.permissions.update');
    Route::middleware('can-manage-settings')->group(function () {
        Route::delete('/settings/apps/meta', [AppsController::class, 'destroyMeta'])->name('settings.apps.meta.destroy');
        Route::delete('/settings/whatsapp', [WhatsAppController::class, 'destroy'])->name('settings.whatsapp.destroy');
        Route::delete('/settings/whatsapp-business', [WhatsAppController::class, 'destroyBusiness'])->name('settings.whatsapp-business.destroy');
        Route::put('/settings/meta/ad-account', [MetaSettingsController::class, 'updateAdAccount'])->name('settings.meta.ad-account');
        Route::put('/settings/meta/mappings', [MetaSettingsController::class, 'updateMappings'])->name('settings.meta.mappings');
        Route::put('/settings/meta/conversions', [MetaSettingsController::class, 'updateConversions'])->name('settings.meta.conversions');
        Route::post('/settings/meta/sync', [MetaSettingsController::class, 'sync'])->name('settings.meta.sync');
        Route::post('/settings/meta/webhook-url', [MetaSettingsController::class, 'revealWebhook'])->name('settings.meta.webhook-url');
        Route::get('/settings/record-layouts', [RecordLayoutSettingsController::class, 'index'])->name('settings.record-layouts');
        Route::post('/settings/pipelines', [PipelineController::class, 'store'])->name('settings.pipelines.store');
        Route::patch('/settings/pipelines/{pipeline}', [PipelineController::class, 'update'])->name('settings.pipelines.update');
        Route::delete('/settings/pipelines/{pipeline}', [PipelineController::class, 'destroy'])->name('settings.pipelines.destroy');
        Route::post('/settings/pipelines/{pipeline}/stages', [PipelineController::class, 'storeStage'])->name('settings.pipelines.stages.store');
        Route::patch('/settings/pipelines/{pipeline}/stages/{stage}', [PipelineController::class, 'updateStage'])->name('settings.pipelines.stages.update');
        Route::delete('/settings/pipelines/{pipeline}/stages/{stage}', [PipelineController::class, 'destroyStage'])->name('settings.pipelines.stages.destroy');
        Route::post('/settings/pipelines/{pipeline}/stages/reorder', [PipelineController::class, 'reorderStages'])->name('settings.pipelines.stages.reorder');
    });
});

require __DIR__.'/settings.php';
