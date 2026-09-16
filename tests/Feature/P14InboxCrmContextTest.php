<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\Thread;
use App\Models\User;
use App\Services\Crm\DealAttentionEvaluator;
use App\Services\Desk\InboxCrmContextComposer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

function p14Now(): Carbon
{
    return Carbon::parse('2026-09-16 12:00:00', DealAttentionEvaluator::TIMEZONE);
}

function p14Channel(User $user): Channel
{
    return Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Business', 'status' => 'connected'],
    );
}

function p14Contact(User $user, array $overrides = []): Contact
{
    return Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'first_name' => $overrides['first_name'] ?? 'Amel',
        'last_name' => $overrides['last_name'] ?? 'Hadj',
        'email' => $overrides['email'] ?? 'amel@clinic.dz',
        'phone' => $overrides['phone'] ?? '0550123456',
        'company_id' => $overrides['company_id'] ?? null,
    ]);
}

function p14Thread(User $user, ?Contact $contact = null, array $overrides = []): Thread
{
    return Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact?->id,
        'channel_id' => $overrides['channel_id'] ?? p14Channel($user)->id,
        'status' => $overrides['status'] ?? 'open',
        'subject' => $overrides['subject'] ?? 'Clinic quote',
        'unread_count' => 0,
        'last_message_at' => now(),
    ]);
}

function p14Deal(User $user, Contact $contact, string $stageSlug, array $overrides = []): Deal
{
    $pipeline = $user->workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $overrides['company_id'] ?? $contact->company_id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'P14 '.$stageSlug,
        'amount_cents' => $overrides['amount_cents'] ?? 1_500_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'next_activity_at' => $overrides['next_activity_at'] ?? null,
    ]);
}

function p14Activity(User $user, array $overrides = []): Activity
{
    return Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $overrides['contact_id'] ?? null,
        'deal_id' => $overrides['deal_id'] ?? null,
        'company_id' => $overrides['company_id'] ?? null,
        'type' => $overrides['type'] ?? 'task',
        'subject' => $overrides['subject'] ?? 'Follow up',
        'body' => $overrides['body'] ?? 'SECRET_BODY_MUST_NOT_LEAK',
        'due_at' => $overrides['due_at'] ?? null,
        'done' => $overrides['done'] ?? false,
        'completed_at' => $overrides['completed_at'] ?? null,
        'owner_id' => $overrides['owner_id'] ?? $user->id,
    ]);
}

beforeEach(function () {
    Carbon::setTestNow(p14Now());
});

afterEach(function () {
    Carbon::setTestNow();
});

it('locks one InboxCrmContext composition without a QRD fork or fake primary', function () {
    $composer = File::get(app_path('Services/Desk/InboxCrmContextComposer.php'));
    $controller = File::get(app_path('Http/Controllers/Desk/InboxController.php'));
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $chrome = File::get(resource_path('js/components/crm/inbox-chrome.tsx'));
    $context = File::get(resource_path('js/components/crm/inbox-crm-context.tsx'));
    $lib = File::get(resource_path('js/lib/inbox-crm-context.ts'));
    $js = File::get(base_path('tests/js/p14-inbox-crm-context.ts'));

    expect($composer)->toContain('class InboxCrmContextComposer')
        ->and($composer)->toContain('DealAttentionEvaluator')
        ->and($composer)->toContain('authoritativePrimaryDealId')
        ->and($composer)->toContain('ticket?->deal_id')
        ->and($composer)->not->toContain('InboxContactContext')
        ->and($composer)->not->toContain('ConversationDealSidebar')
        ->and($composer)->not->toContain('Customer360V2')
        ->and($composer)->not->toContain('->latest()')
        ->and($composer)->not->toContain('orderByDesc(\'amount_cents\')');

    expect($controller)->toContain('InboxCrmContextComposer')
        ->and($controller)->toContain("'crmContext'")
        ->and($controller)->toContain("'crmContextError'")
        ->and($controller)->not->toContain('InboxV2');

    expect($inbox)->toContain('InboxContactSidebar')
        ->and($inbox)->toContain('crmContext')
        ->and($inbox)->toContain('shouldRenderInboxCrmContext')
        ->and($inbox)->toContain('contextPending')
        ->and($inbox)->not->toContain('QuickRecordDrawer')
        ->and($inbox)->not->toContain('DealAttentionEvaluator')
        ->and($inbox)->not->toContain('DealPipelineBoard')
        ->and($inbox)->not->toContain('InboxContactContext');

    expect($chrome)->toContain('data-inbox="context-host"')
        ->and($chrome)->toContain('InboxCrmContext')
        ->and($chrome)->toContain('No owner')
        ->and($chrome)->not->toContain('QuickRecordDrawer');

    expect($context)->toContain('openRecord')
        ->and($context)->toContain('Contact owner')
        ->and($context)->toContain('Deal owner')
        ->and($context)->toContain('No CRM contact linked')
        ->and($context)->toContain('formatMoneyCents')
        ->and($context)->toContain('attention.primary')
        ->and($context)->not->toContain('overdue_activity')
        ->and($context)->not->toContain('Resolve warning')
        ->and($context)->not->toContain('Mark healthy')
        ->and($context)->not->toContain('health score');

    expect($lib)->toContain('pickPrimaryDealFromList')
        ->and($lib)->toContain('delayedContextIsStale')
        ->and($js)->toContain('rapid A→B→C drops delayed A context')
        ->and($js)->toContain('list never invents a primary deal');
});

it('composes contact company deal attention and activity on the selected thread only', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Hydra',
    ]);
    $contact = p14Contact($user, ['company_id' => $company->id]);
    $thread = p14Thread($user, $contact);
    $deal = p14Deal($user, $contact, 'proposal', [
        'title' => 'Clinic expansion',
        'amount_cents' => 2_500_000,
        'company_id' => $company->id,
    ]);
    p14Activity($user, [
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'type' => 'call',
        'subject' => 'Site visit logged',
        'done' => true,
        'completed_at' => p14Now()->copy()->subHour(),
    ]);
    p14Activity($user, [
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'type' => 'task',
        'subject' => 'Send proposal',
        'due_at' => p14Now()->copy()->subDay(),
    ]);
    p14Activity($user, [
        'contact_id' => $contact->id,
        'type' => 'note',
        'subject' => 'Prefers morning calls',
        'body' => 'SECRET_BODY_MUST_NOT_LEAK',
    ]);
    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'internal',
        'type' => 'note',
        'body' => 'Private thread note is not a CRM note',
        'status' => 'logged',
        'provider' => 'desk',
    ]);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('selected.id', $thread->id)
            ->where('crmContext.thread_id', $thread->id)
            ->where('crmContext.empty', null)
            ->where('crmContext.contact.name', 'Amel Hadj')
            ->where('crmContext.contact.email', 'amel@clinic.dz')
            ->where('crmContext.company.name', 'Clinique Hydra')
            ->where('crmContext.contact.owner.label', 'Contact owner')
            ->where('crmContext.primary_deal_id', null)
            ->has('crmContext.deals', 1)
            ->where('crmContext.deals.0.title', 'Clinic expansion')
            ->where('crmContext.deals.0.amount_cents', 2_500_000)
            ->where('crmContext.deals.0.currency', 'DZD')
            ->where('crmContext.deals.0.stage.slug', 'proposal')
            ->where('crmContext.deals.0.owner.label', 'Deal owner')
            ->where('crmContext.deals.0.attention.primary.type', 'overdue_activity')
            ->where('crmContext.attention', null)
            ->where('crmContext.last_activity.subject', 'Prefers morning calls')
            ->where('crmContext.tasks.0.subject', 'Send proposal')
            ->where('crmContext.notes.0.subject', 'Prefers morning calls')
            ->missing('crmContext.notes.0.body')
            ->where('crmContextError', null)
        );

    $payload = $this->actingAs($user)->get('/inbox?thread='.$thread->id)->original;
    $encoded = json_encode($payload);
    expect($encoded)->not->toContain('SECRET_BODY_MUST_NOT_LEAK')
        ->and($encoded)->not->toContain('Private thread note is not a CRM note');
});

it('uses ticket deal as the only authoritative primary and lists other deals without inventing one', function () {
    $user = User::factory()->create();
    $contact = p14Contact($user);
    $thread = p14Thread($user, $contact);
    $older = p14Deal($user, $contact, 'qualified', [
        'title' => 'Small retain',
        'amount_cents' => 9_000_000,
    ]);
    $linked = p14Deal($user, $contact, 'demo', [
        'title' => 'Linked demo',
        'amount_cents' => 100_000,
    ]);
    $won = p14Deal($user, $contact, 'won', ['title' => 'Old win']);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crmContext.primary_deal_id', null)
            ->has('crmContext.deals', 3)
            ->where('crmContext.deals.0.is_open', true)
            ->where('crmContext.deals.2.is_won', true)
            ->where('crmContext.attention', null)
        );

    Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'thread_id' => $thread->id,
        'deal_id' => $linked->id,
        'subject' => 'Inbox ticket',
        'status' => Ticket::STATUS_NEW,
    ]);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crmContext.primary_deal_id', $linked->id)
            ->where('crmContext.deals.0.id', $older->id)
            ->where('crmContext.attention.primary.type', 'no_next_action')
        );

    expect($older->id)->toBeLessThan($linked->id)
        ->and($won->exists)->toBeTrue();
});

it('shows a truthful empty when the conversation has no viewable CRM contact', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $foreign = p14Contact($other, ['first_name' => 'Hidden']);
    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $foreign->id,
        'channel_id' => p14Channel($user)->id,
        'status' => 'open',
        'subject' => 'Unlinked desk thread',
        'unread_count' => 0,
        'last_message_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('selected.id', $thread->id)
            ->where('crmContext.thread_id', $thread->id)
            ->where('crmContext.empty', 'restricted')
            ->where('crmContext.contact', null)
            ->where('crmContext.deals', [])
        );
});

it('keeps contact-only conversations without inventing a company or deal', function () {
    $user = User::factory()->create();
    $contact = p14Contact($user, ['company_id' => null]);
    $thread = p14Thread($user, $contact);

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crmContext.company', null)
            ->where('crmContext.deals', [])
            ->where('crmContext.primary_deal_id', null)
            ->where('crmContext.empty', null)
        );
});

it('does not leak other-workspace deals or activity bodies and still serves the thread', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $contact = p14Contact($user);
    $thread = p14Thread($user, $contact);
    $visible = p14Deal($user, $contact, 'qualified', ['title' => 'Visible deal']);

    $foreignPipeline = $other->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $foreignPipeline->id,
        'stage_id' => $foreignPipeline->stageBySlug('proposal')->id,
        'title' => 'FOREIGN_DEAL',
        'amount_cents' => 99_000_000,
        'currency' => 'DZD',
    ]);

    p14Activity($other, [
        'contact_id' => $contact->id,
        'type' => 'note',
        'subject' => 'FOREIGN_NOTE',
        'body' => 'FOREIGN_BODY',
    ]);
    p14Activity($user, [
        'contact_id' => $contact->id,
        'deal_id' => $visible->id,
        'type' => 'note',
        'subject' => 'Safe note',
        'body' => 'SECRET_BODY_MUST_NOT_LEAK',
    ]);

    $response = $this->actingAs($user)->get('/inbox?thread='.$thread->id);
    $response->assertOk()->assertInertia(fn ($page) => $page
        ->where('selected.id', $thread->id)
        ->has('crmContext.deals', 1)
        ->where('crmContext.deals.0.title', 'Visible deal')
        ->where('crmContext.notes.0.subject', 'Safe note')
    );

    $encoded = json_encode($response->original);
    expect($encoded)->not->toContain('FOREIGN_DEAL')
        ->and($encoded)->not->toContain('FOREIGN_NOTE')
        ->and($encoded)->not->toContain('FOREIGN_BODY')
        ->and($encoded)->not->toContain('SECRET_BODY_MUST_NOT_LEAK');
});

it('does not N+1 activities across deals on the selected context', function () {
    $user = User::factory()->create();
    $contact = p14Contact($user);
    $thread = p14Thread($user, $contact);

    foreach (['Alpha', 'Beta', 'Gamma'] as $title) {
        $deal = p14Deal($user, $contact, 'qualified', ['title' => $title]);
        p14Activity($user, [
            'contact_id' => $contact->id,
            'deal_id' => $deal->id,
            'due_at' => p14Now()->copy()->subDay(),
            'subject' => $title.' task',
        ]);
    }

    DB::flushQueryLog();
    DB::enableQueryLog();

    $this->actingAs($user)->get('/inbox?thread='.$thread->id)->assertOk();

    $perDealActivity = collect(DB::getQueryLog())->filter(function (array $query): bool {
        $sql = strtolower($query['query']);
        $fromActivities = str_contains($sql, 'from "activities"') || str_contains($sql, 'from `activities`');
        $singleDeal = (bool) preg_match('/["`]?deal_id["`]?\s*=\s*\?/', $sql);
        $batched = str_contains($sql, ' in (');

        return $fromActivities && $singleDeal && ! $batched;
    });

    expect($perDealActivity->count())->toBe(0);
});

it('does not attach crmContext to the conversation list payload', function () {
    $user = User::factory()->create();
    $contact = p14Contact($user);
    p14Thread($user, $contact);
    p14Deal($user, $contact, 'new', ['title' => 'List must not hydrate']);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crmContext', null)
            ->has('threads', 1)
            ->missing('threads.0.deals')
        );
});

it('keeps P13 P12 P11 P09 and P10 inbox source locks', function () {
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $chrome = File::get(resource_path('js/components/crm/inbox-chrome.tsx'));
    $composer = File::get(app_path('Services/Desk/InboxCrmContextComposer.php'));

    expect($inbox)->toContain('data-inbox="native"')
        ->and($inbox)->toContain('data-inbox="embed"')
        ->and($inbox)->toContain('router.cancelAll')
        ->and($inbox)->toContain('conversation-pending')
        ->and($inbox)->not->toContain('dangerouslySetInnerHTML');

    expect($chrome)->toContain('Send as resolved')
        ->and($chrome)->toContain('data-inbox="context-host"');

    expect($composer)->toContain('evaluate(')
        ->and(File::get(app_path('Services/Crm/DealAttentionEvaluator.php')))->toContain('TYPE_OVERDUE_ACTIVITY');

    expect(File::get(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx')))->toContain('DealPipelineBoard');
    expect(File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx')))->toContain('QuickRecordDrawer');
    expect($inbox)->not->toContain("from '@/ds/workspace/QuickRecordDrawer'");
});

it('does not treat deal updated_at as last activity', function () {
    $user = User::factory()->create();
    $contact = p14Contact($user);
    $thread = p14Thread($user, $contact);
    $deal = p14Deal($user, $contact, 'qualified');
    $deal->forceFill(['updated_at' => p14Now()->copy()->addDay(), 'last_activity_at' => p14Now()->copy()->addDay()])->save();

    $this->actingAs($user)
        ->get('/inbox?thread='.$thread->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crmContext.last_activity', null)
        );
});
