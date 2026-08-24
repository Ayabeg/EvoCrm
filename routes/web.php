<?php

use App\Http\Controllers\Ads\AdsCenterController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\MetaController;
use App\Http\Controllers\Crm\ActivityController;
use App\Http\Controllers\Crm\AskEvoController;
use App\Http\Controllers\Crm\CompanyController;
use App\Http\Controllers\Crm\ContactController;
use App\Http\Controllers\Crm\ConversationHistoryController;
use App\Http\Controllers\Crm\DashboardController;
use App\Http\Controllers\Crm\DealController;
use App\Http\Controllers\Crm\DealLineItemController;
use App\Http\Controllers\Crm\LeadBoardController;
use App\Http\Controllers\Crm\LeadController;
use App\Http\Controllers\Crm\QuoteController;
use App\Http\Controllers\Crm\ReportController;
use App\Http\Controllers\Crm\SavedFilterController;
use App\Http\Controllers\Crm\SegmentController;
use App\Http\Controllers\Crm\WorkflowController;
use App\Http\Controllers\Desk\DeskConnectorController;
use App\Http\Controllers\Desk\InboxController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Outbound\CampaignController;
use App\Http\Controllers\Outbound\DomainController;
use App\Http\Controllers\Outbound\EnrollmentController;
use App\Http\Controllers\Outbound\MailboxController;
use App\Http\Controllers\Outbound\OutboundController;
use App\Http\Controllers\Outbound\OutboundReportController;
use App\Http\Controllers\Outbound\OutboxController;
use App\Http\Controllers\Outbound\QuietHoursController;
use App\Http\Controllers\Outbound\ReplyController;
use App\Http\Controllers\Outbound\SequenceController;
use App\Http\Controllers\Outbound\SuppressionController;
use App\Http\Controllers\Outbound\TemplateController;
use App\Http\Controllers\Outbound\WarmupController;
use App\Http\Controllers\Public\TrackingController;
use App\Http\Controllers\Public\UnsubscribeController;
use App\Http\Controllers\Settings\AppsController;
use App\Http\Controllers\Settings\ChannelSettingsController;
use App\Http\Controllers\Settings\ConnectorController;
use App\Http\Controllers\Settings\CustomAttributeController;
use App\Http\Controllers\Settings\EvolutionSettingsController;
use App\Http\Controllers\Settings\MetaSettingsController;
use App\Http\Controllers\Webhooks\EvolutionWebhookController;
use App\Http\Controllers\Webhooks\MetaLeadWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
});

// Shared Google callback: guests sign in; authenticated users complete a
// Gmail / Calendar reconnect on the same OAuth client. Extra scopes are
// never requested from the login button.
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');

Route::get('/unsubscribe', UnsubscribeController::class)->name('unsubscribe');
Route::get('/outbound/t/{token}.gif', [TrackingController::class, 'open'])->name('outbound.track.open');
Route::get('/outbound/c/{token}', [TrackingController::class, 'click'])->name('outbound.track.click');

Route::get('/webhooks/evolution', [EvolutionWebhookController::class, 'verify'])->name('webhooks.evolution.verify');
Route::post('/webhooks/evolution', [EvolutionWebhookController::class, 'handle'])->name('webhooks.evolution');
Route::post('/webhooks/meta/leads', [MetaLeadWebhookController::class, 'handle'])->name('webhooks.meta.leads');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', HomeController::class)->name('dashboard');

    // Meta workspace OAuth (Facebook Login). 404 unless META_* env is set.
    Route::get('/auth/meta', [MetaController::class, 'redirect'])->name('auth.meta');
    Route::get('/auth/meta/callback', [MetaController::class, 'callback'])->name('auth.meta.callback');

    Route::get('/leads', [LeadBoardController::class, 'index'])->name('leads.index');

    Route::get('/inbox', [InboxController::class, 'inbox'])->name('desk.inbox');
    Route::get('/desk', [InboxController::class, 'index'])->name('desk.index');
    Route::post('/desk/threads/{thread}/reply', [InboxController::class, 'reply'])->name('desk.reply');
    Route::post('/desk/connectors', [DeskConnectorController::class, 'store'])->name('desk.connectors.store');
    Route::get('/conversations', [ConversationHistoryController::class, 'index'])->name('crm.conversations');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/crm/reports', [ReportController::class, 'index'])->name('crm.reports');
    Route::post('/reports/dashboards', [DashboardController::class, 'store'])->name('reports.dashboards.store');
    Route::put('/reports/dashboards/{dashboard}', [DashboardController::class, 'update'])->name('reports.dashboards.update');
    Route::delete('/reports/dashboards/{dashboard}', [DashboardController::class, 'destroy'])->name('reports.dashboards.destroy');
    Route::post('/reports/dashboards/{dashboard}/widgets', [DashboardController::class, 'addWidget'])->name('reports.dashboards.widgets.store');
    Route::delete('/reports/dashboards/{dashboard}/widgets', [DashboardController::class, 'removeWidget'])->name('reports.dashboards.widgets.destroy');
    Route::post('/crm/activities', [ActivityController::class, 'store'])->name('crm.activities.store');
    Route::post('/crm/activities/{activity}/complete', [ActivityController::class, 'complete'])->name('crm.activities.complete');
    Route::post('/crm/filters', [SavedFilterController::class, 'store'])->name('crm.filters.store');
    Route::get('/crm/segments', [SegmentController::class, 'index'])->name('crm.segments.index');
    Route::post('/crm/segments', [SegmentController::class, 'store'])->name('crm.segments.store');
    Route::put('/crm/segments/{segment}', [SegmentController::class, 'update'])->name('crm.segments.update');
    Route::delete('/crm/segments/{segment}', [SegmentController::class, 'destroy'])->name('crm.segments.destroy');

    Route::get('/automation', [WorkflowController::class, 'index'])->name('automation');
    Route::get('/crm/workflows', [WorkflowController::class, 'index'])->name('crm.workflows.index');
    Route::post('/crm/workflows', [WorkflowController::class, 'store'])->name('crm.workflows.store');
    Route::post('/crm/workflows/templates', [WorkflowController::class, 'storeTemplate'])->name('crm.workflows.templates.store');
    Route::post('/crm/workflows/{workflow}/toggle', [WorkflowController::class, 'toggle'])->name('crm.workflows.toggle');
    Route::delete('/crm/workflows/{workflow}', [WorkflowController::class, 'destroy'])->name('crm.workflows.destroy');
    Route::post('/crm/deals/{deal}/quotes', [QuoteController::class, 'store'])->name('crm.quotes.store');
    Route::put('/crm/quotes/{quote}', [QuoteController::class, 'update'])->name('crm.quotes.update');

    Route::get('/crm/companies', [CompanyController::class, 'index'])->name('crm.companies.index');
    Route::post('/crm/companies', [CompanyController::class, 'store'])->name('crm.companies.store');
    Route::get('/crm/companies/{company}', [CompanyController::class, 'show'])->name('crm.companies.show');
    Route::put('/crm/companies/{company}', [CompanyController::class, 'update'])->name('crm.companies.update');
    Route::put('/crm/companies/{company}/attributes', [CompanyController::class, 'updateAttributes'])->name('crm.companies.attributes');

    Route::get('/crm/contacts', [ContactController::class, 'index'])->name('crm.contacts.index');
    Route::get('/crm/contacts/export', [ContactController::class, 'export'])->name('crm.contacts.export');
    Route::post('/crm/contacts', [ContactController::class, 'store'])->name('crm.contacts.store');
    Route::get('/crm/contacts/{contact}', [ContactController::class, 'show'])->name('crm.contacts.show');
    Route::put('/crm/contacts/{contact}', [ContactController::class, 'update'])->name('crm.contacts.update');
    Route::put('/crm/contacts/{contact}/attributes', [ContactController::class, 'updateAttributes'])->name('crm.contacts.attributes');
    Route::post('/crm/contacts/{contact}/ask', [AskEvoController::class, 'contact'])->name('crm.contacts.ask');

    Route::get('/crm/leads', [LeadController::class, 'index'])->name('crm.leads.index');
    Route::post('/crm/leads', [LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show'])->name('crm.leads.show');
    Route::put('/crm/leads/{lead}', [LeadController::class, 'update'])->name('crm.leads.update');
    Route::post('/crm/leads/{lead}/qualify', [LeadController::class, 'qualify'])->name('crm.leads.qualify');

    Route::get('/crm/deals', [DealController::class, 'index'])->name('crm.deals.index');
    Route::get('/crm/deals/board', [DealController::class, 'board'])->name('crm.deals.board');
    Route::post('/crm/deals', [DealController::class, 'store'])->name('crm.deals.store');
    Route::get('/crm/deals/{deal}', [DealController::class, 'show'])->name('crm.deals.show');
    Route::put('/crm/deals/{deal}', [DealController::class, 'update'])->name('crm.deals.update');
    Route::put('/crm/deals/{deal}/attributes', [DealController::class, 'updateAttributes'])->name('crm.deals.attributes');
    Route::post('/crm/deals/{deal}/move', [DealController::class, 'move'])->name('crm.deals.move');
    Route::post('/crm/deals/{deal}/line-items', [DealLineItemController::class, 'store'])->name('crm.deals.line-items.store');
    Route::delete('/crm/deals/{deal}/line-items/{lineItem}', [DealLineItemController::class, 'destroy'])->name('crm.deals.line-items.destroy');
    Route::post('/crm/deals/{deal}/ask', [AskEvoController::class, 'deal'])->name('crm.deals.ask');

    Route::get('/ads', [AdsCenterController::class, 'index'])->name('ads.index');
    Route::get('/ads/campaigns/{campaign}', [AdsCenterController::class, 'show'])->name('ads.campaigns.show');
    Route::post('/ads/sync', [AdsCenterController::class, 'sync'])->name('ads.sync');

    Route::get('/outbound', [OutboundController::class, 'index'])->name('outbound.index');

    Route::get('/outbound/mailboxes', [MailboxController::class, 'index'])->name('outbound.mailboxes.index');
    Route::post('/outbound/mailboxes', [MailboxController::class, 'store'])->name('outbound.mailboxes.store');
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
    Route::put('/outbound/sequences/{sequence}/steps/{step}', [SequenceController::class, 'updateStep'])->name('outbound.sequences.steps.update');
    Route::delete('/outbound/sequences/{sequence}/steps/{step}', [SequenceController::class, 'removeStep'])->name('outbound.sequences.steps.destroy');
    Route::post('/outbound/sequences/{sequence}/enroll', [SequenceController::class, 'enroll'])->name('outbound.sequences.enroll');

    Route::post('/outbound/enrollments/{enrollment}/pause', [EnrollmentController::class, 'pause'])->name('outbound.enrollments.pause');
    Route::post('/outbound/enrollments/{enrollment}/resume', [EnrollmentController::class, 'resume'])->name('outbound.enrollments.resume');
    Route::post('/outbound/enrollments/{enrollment}/cancel', [EnrollmentController::class, 'cancel'])->name('outbound.enrollments.cancel');

    Route::get('/outbound/outbox', [OutboxController::class, 'index'])->name('outbound.outbox.index');
    Route::get('/outbound/replies', [ReplyController::class, 'index'])->name('outbound.replies.index');
    Route::get('/outbound/reports', [OutboundReportController::class, 'index'])->name('outbound.reports.index');

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
    Route::get('/settings/apps/meta', [AppsController::class, 'meta'])->name('settings.apps.meta');
    Route::delete('/settings/apps/meta', [AppsController::class, 'destroyMeta'])->name('settings.apps.meta.destroy');

    Route::get('/settings/connectors', [ConnectorController::class, 'index'])->name('settings.connectors');
    Route::post('/settings/connectors', [ConnectorController::class, 'store'])->name('settings.connectors.store');
    Route::get('/settings/connectors/google/{provider}', [ConnectorController::class, 'reconnectGoogle'])->name('settings.connectors.google');

    Route::get('/settings/evolution', [EvolutionSettingsController::class, 'edit'])->name('settings.evolution');
    Route::post('/settings/evolution/sync', [EvolutionSettingsController::class, 'sync'])->name('settings.evolution.sync');
    Route::get('/settings/meta', [MetaSettingsController::class, 'edit'])->name('settings.meta');
    Route::get('/settings/channels', [ChannelSettingsController::class, 'edit'])->name('settings.channels');
    Route::post('/settings/channels', [ChannelSettingsController::class, 'update'])->name('settings.channels.update');
    Route::get('/settings/attributes', [CustomAttributeController::class, 'edit'])->name('settings.attributes');
    Route::post('/settings/attributes', [CustomAttributeController::class, 'store'])->name('settings.attributes.store');
    Route::put('/settings/attributes/{definition}', [CustomAttributeController::class, 'update'])->name('settings.attributes.update');
    Route::delete('/settings/attributes/{definition}', [CustomAttributeController::class, 'destroy'])->name('settings.attributes.destroy');
    Route::get('/settings/pipelines', [\App\Http\Controllers\Settings\PipelineController::class, 'index'])->name('settings.pipelines');
    Route::middleware('can-manage-settings')->group(function () {
        Route::post('/settings/pipelines', [\App\Http\Controllers\Settings\PipelineController::class, 'store'])->name('settings.pipelines.store');
        Route::patch('/settings/pipelines/{pipeline}', [\App\Http\Controllers\Settings\PipelineController::class, 'update'])->name('settings.pipelines.update');
        Route::delete('/settings/pipelines/{pipeline}', [\App\Http\Controllers\Settings\PipelineController::class, 'destroy'])->name('settings.pipelines.destroy');
    });
});

require __DIR__.'/settings.php';
