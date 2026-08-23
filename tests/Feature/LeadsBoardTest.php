<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

function boardDeal(User $user, string $stageSlug, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Board deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
        ...$overrides,
    ]);
}

it('lists deals grouped by pipeline stage on the kanban', function () {
    $user = User::factory()->create();

    $new = boardDeal($user, 'new', ['title' => 'Fresh intake']);
    $qualified = boardDeal($user, 'qualified', ['title' => 'Qualified lead']);

    $this->actingAs($user)
        ->get('/leads')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('leads/board')
                ->has('stages', 6)
                ->where('stages.0.slug', 'new')
                ->where('stages.5.slug', 'lost')
                ->has('deals', 2)
                ->where('deals.0.stage_id', $qualified->stage_id)
                ->where('deals.1.stage_id', $new->stage_id)
                ->where('counts.active', 2)
                ->where('filter', 'active')
        );
});

it('excludes won and lost deals from the active strip', function () {
    $user = User::factory()->create();

    boardDeal($user, 'new');
    boardDeal($user, 'won');
    boardDeal($user, 'lost');

    $this->actingAs($user)
        ->get('/leads')
        ->assertInertia(
            fn ($page) => $page
                ->has('deals', 1)
                ->where('counts.active', 1)
        );
});

it('filters the strip: tasks today, without tasks, overdue, new today', function () {
    $user = User::factory()->create();

    $dueToday = boardDeal($user, 'new', ['title' => 'Due today']);
    $noTask = boardDeal($user, 'qualified', ['title' => 'No task']);
    $overdue = boardDeal($user, 'demo', ['title' => 'Overdue deal']);
    $old = boardDeal($user, 'proposal', ['title' => 'Old deal']);
    $old->forceFill(['created_at' => now()->subDays(3)])->save();

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Call back',
        'due_at' => now()->addHours(2),
        'done' => false,
        'deal_id' => $dueToday->id,
        'contact_id' => $dueToday->contact_id,
    ]);

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Late follow-up',
        'due_at' => now()->subDay(),
        'done' => false,
        'deal_id' => $overdue->id,
        'contact_id' => $overdue->contact_id,
    ]);

    $this->actingAs($user);

    $this->get('/leads?filter=tasks_today')->assertInertia(
        fn ($page) => $page->has('deals', 1)->where('deals.0.id', $dueToday->id)
    );

    $this->get('/leads?filter=no_tasks')->assertInertia(
        fn ($page) => $page
            ->has('deals', 2)
            ->where('counts.no_tasks', 2)
    );

    $this->get('/leads?filter=overdue')->assertInertia(
        fn ($page) => $page->has('deals', 1)->where('deals.0.id', $overdue->id)
    );

    // $old was created three days ago — the other three are new today.
    $this->get('/leads?filter=new_today')->assertInertia(
        fn ($page) => $page
            ->has('deals', 3)
            ->where('counts.new_today', 3)
    );
});

it('searches across title, contact, and company', function () {
    $user = User::factory()->create();

    $match = boardDeal($user, 'new', ['title' => 'Clinique El Djazair intake']);
    boardDeal($user, 'new', ['title' => 'Oran lab demo']);

    $this->actingAs($user)
        ->get('/leads?q=djazair')
        ->assertInertia(
            fn ($page) => $page
                ->has('deals', 1)
                ->where('deals.0.id', $match->id)
                ->where('q', 'djazair')
        );
});

it('moves a card between stages over POST', function () {
    $user = User::factory()->create();
    $deal = boardDeal($user, 'new');
    $demo = $user->workspace->defaultPipeline()->stageBySlug('demo');

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $demo->id])
        ->assertRedirect();

    expect($deal->fresh()->stage_id)->toBe($demo->id);
});

it('quick-adds a card to the first column with just a contact name', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();

    $this->actingAs($user)
        ->post('/crm/deals', [
            'title' => 'Quick add lead',
            'contact_name' => 'Amine Benali',
        ])
        ->assertRedirect();

    $deal = Deal::query()->where('title', 'Quick add lead')->sole();

    expect($deal->stage_id)->toBe($pipeline->stageBySlug('new')->id)
        ->and($deal->contact->first_name)->toBe('Amine')
        ->and($deal->contact->last_name)->toBe('Benali');
});
