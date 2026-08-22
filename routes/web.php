<?php

use App\Http\Controllers\Ads\AdsCenterController;
use App\Http\Controllers\Crm\CompanyController;
use App\Http\Controllers\Crm\ContactController;
use App\Http\Controllers\Crm\DealController;
use App\Http\Controllers\Crm\LeadController;
use App\Http\Controllers\Desk\InboxController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Outbound\MailboxController;
use App\Http\Controllers\Outbound\SequenceController;
use App\Http\Controllers\Outbound\TemplateController;
use App\Http\Controllers\Public\UnsubscribeController;
use App\Http\Controllers\Settings\ChannelSettingsController;
use App\Http\Controllers\Settings\EvolutionSettingsController;
use App\Http\Controllers\Settings\MetaSettingsController;
use App\Http\Controllers\Webhooks\EvolutionWebhookController;
use App\Http\Controllers\Webhooks\MetaLeadWebhookController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/unsubscribe', UnsubscribeController::class)->name('unsubscribe');

Route::get('/webhooks/evolution', [EvolutionWebhookController::class, 'verify'])->name('webhooks.evolution.verify');
Route::post('/webhooks/evolution', [EvolutionWebhookController::class, 'handle'])->name('webhooks.evolution');
Route::post('/webhooks/meta/leads', [MetaLeadWebhookController::class, 'handle'])->name('webhooks.meta.leads');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', HomeController::class)->name('dashboard');

    Route::get('/desk', [InboxController::class, 'index'])->name('desk.index');
    Route::post('/desk/threads/{thread}/reply', [InboxController::class, 'reply'])->name('desk.reply');

    Route::get('/crm/companies', [CompanyController::class, 'index'])->name('crm.companies.index');
    Route::post('/crm/companies', [CompanyController::class, 'store'])->name('crm.companies.store');
    Route::get('/crm/companies/{company}', [CompanyController::class, 'show'])->name('crm.companies.show');

    Route::get('/crm/contacts', [ContactController::class, 'index'])->name('crm.contacts.index');
    Route::post('/crm/contacts', [ContactController::class, 'store'])->name('crm.contacts.store');
    Route::get('/crm/contacts/{contact}', [ContactController::class, 'show'])->name('crm.contacts.show');

    Route::get('/crm/leads', [LeadController::class, 'index'])->name('crm.leads.index');
    Route::post('/crm/leads', [LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/leads/{lead}', [LeadController::class, 'show'])->name('crm.leads.show');
    Route::post('/crm/leads/{lead}/qualify', [LeadController::class, 'qualify'])->name('crm.leads.qualify');

    Route::get('/crm/deals', [DealController::class, 'index'])->name('crm.deals.index');
    Route::post('/crm/deals', [DealController::class, 'store'])->name('crm.deals.store');
    Route::get('/crm/deals/{deal}', [DealController::class, 'show'])->name('crm.deals.show');
    Route::post('/crm/deals/{deal}/move', [DealController::class, 'move'])->name('crm.deals.move');

    Route::get('/ads', [AdsCenterController::class, 'index'])->name('ads.index');

    Route::get('/outbound/mailboxes', [MailboxController::class, 'index'])->name('outbound.mailboxes.index');
    Route::post('/outbound/mailboxes', [MailboxController::class, 'store'])->name('outbound.mailboxes.store');

    Route::get('/outbound/sequences', [SequenceController::class, 'index'])->name('outbound.sequences.index');
    Route::post('/outbound/sequences', [SequenceController::class, 'store'])->name('outbound.sequences.store');
    Route::get('/outbound/sequences/{sequence}', [SequenceController::class, 'show'])->name('outbound.sequences.show');

    Route::get('/outbound/templates', [TemplateController::class, 'index'])->name('outbound.templates.index');
    Route::post('/outbound/templates/send', [TemplateController::class, 'send'])->name('outbound.templates.send');

    Route::get('/settings/evolution', [EvolutionSettingsController::class, 'edit'])->name('settings.evolution');
    Route::post('/settings/evolution/sync', [EvolutionSettingsController::class, 'sync'])->name('settings.evolution.sync');
    Route::get('/settings/meta', [MetaSettingsController::class, 'edit'])->name('settings.meta');
    Route::get('/settings/channels', [ChannelSettingsController::class, 'edit'])->name('settings.channels');
});

require __DIR__.'/settings.php';
