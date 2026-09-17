<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\QuoteDocument;
use Illuminate\Support\Facades\File;

function p18Quote(User $user, array $overrides = []): Quote
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => $overrides['first_name'] ?? 'Amel',
        'email' => $overrides['email'] ?? 'amel@clinic.dz',
        'owner_id' => $user->id,
    ]);
    unset($overrides['first_name'], $overrides['email']);

    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => $overrides['deal_title'] ?? 'Clinic landing page',
        'amount_cents' => 500_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
    ]);
    unset($overrides['deal_title'], $overrides['owner_id']);

    $quote = Quote::query()->create(array_merge([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 0,
        'notes' => 'Two landing pages',
        'expires_at' => now()->addDays(14),
    ], $overrides));

    return $quote->fresh(['deal.owner', 'deal.contact', 'items']);
}

it('locks the quote show page as a split document/properties builder without a V2', function () {
    $show = File::get(resource_path('js/pages/crm/quotes/show.tsx'));
    $builder = File::get(resource_path('js/pages/crm/quotes/quote-split-builder.tsx'));
    $lib = File::get(resource_path('js/lib/quote-builder.ts'));
    $index = File::get(resource_path('js/pages/crm/quotes/index.tsx'));
    $public = File::get(resource_path('js/pages/public/quote.tsx'));
    $controller = File::get(app_path('Http/Controllers/Crm/QuoteController.php'));
    $routes = File::get(base_path('routes/web.php'));

    expect(class_exists('App\\Http\\Controllers\\QuoteBuilderV2Controller'))->toBeFalse()
        ->and($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('data-crm="quotes-record"')
        ->and($show)->toContain('QuoteSplitBuilder')
        ->and($show)->toContain('Preview PDF')
        ->and($show)->toContain('quotePreviewHref')
        ->and($show)->not->toContain('RecordShell')
        ->and($show)->not->toContain('leftLabel="About"')
        ->and($show)->not->toContain('centerLabel="Lines"')
        ->and($show)->not->toContain('rightLabel="Related"')
        ->and($show)->not->toContain('QuoteBuilderV2')
        ->and($show)->not->toContain('HubSpot')
        ->and($show)->not->toContain('PandaDoc')
        ->and($show)->not->toContain('Breeze')
        ->and($show)->not->toContain('#00A4BD')
        ->and($show)->not->toContain('#0176D3');

    expect($builder)->toContain('data-quote="split-builder"')
        ->and($builder)->toContain('data-quote="document"')
        ->and($builder)->toContain('data-quote="properties"')
        ->and($builder)->toContain('data-quote="delivery"')
        ->and($builder)->toContain('WorkspacePanelSwitcher')
        ->and($builder)->toContain("label: 'Document'")
        ->and($builder)->toContain("label: 'Properties'")
        ->and($builder)->toContain('quoteSendAction(quote.id)')
        ->and($builder)->toContain('quoteRevokeAction(quote.id)')
        ->and($builder)->toContain('quoteUpdateAction(quote.id)')
        ->and($builder)->toContain('quote.can.update')
        ->and($builder)->toContain('canUpdate: quote.can.update')
        ->and($builder)->not->toContain('quoteCanEdit(quote.immutable)')
        ->and($builder)->toContain('name="to"')
        ->and($builder)->toContain('items[${index}][name]')
        ->and($builder)->toContain('items[${index}][unit_dzd]')
        ->and($builder)->toContain('No line items')
        ->and($builder)->not->toContain('n8n')
        ->and($builder)->not->toContain('RecordShell')
        ->and($builder)->not->toContain('HubSpot')
        ->and($builder)->not->toContain('#00A4BD');

    expect($lib)->toContain('return `/crm/quotes/${id}/preview`')
        ->and($lib)->toContain('return `/crm/quotes/${id}/send`')
        ->and($lib)->toContain('return `/crm/quotes/${id}/revoke`')
        ->and($lib)->toContain('return `/crm/quotes/${id}`')
        ->and($lib)->toContain('Africa/Algiers')
        ->and($lib)->toContain('canUpdate')
        ->and($lib)->toContain('input.canUpdate')
        ->and($lib)->toContain('!input.immutable');

    expect($index)->toContain('CreateDrawer')
        ->and($index)->toContain('items[0][unit_dzd]')
        ->and($index)->toContain('can.create')
        ->and($index)->toContain('canCreate={can.create}')
        ->and($index)->not->toContain('QuoteBuilder')
        ->and($index)->not->toContain('QuoteSplitBuilder')
        ->and($public)->toContain('Accept quote')
        ->and($controller)->toContain("Inertia::render('crm/quotes/show'")
        ->and($controller)->toContain('function send')
        ->and($controller)->toContain('function revoke')
        ->and($controller)->toContain('function update')
        ->and($controller)->toContain('abort_if($quote->isImmutable(), 422')
        ->and($controller)->toContain("\$user->can('update', \$quote)")
        ->and($controller)->toContain("\$user->can('create', Quote::class)")
        ->and($routes)->toContain("Route::put('/crm/quotes/{quote}'")
        ->and($routes)->toContain("Route::post('/crm/quotes/{quote}/send'")
        ->and($routes)->toContain("Route::post('/crm/quotes/{quote}/revoke'")
        ->and($routes)->toContain("Route::get('/crm/quotes/{quote}/preview'");
});

it('keeps quote show inertia payload and lets drafts save through the existing update route', function () {
    $user = User::factory()->create();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'email' => 'buyer@clinic.dz',
        ])->id,
        'pipeline_id' => $user->workspace->defaultPipeline()->id,
        'stage_id' => $user->workspace->defaultPipeline()->stageBySlug('proposal')->id,
        'title' => 'Quoted clinic deal',
        'amount_cents' => 1_800_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'notes' => 'Valid 14 days',
            'items' => [
                ['name' => 'EvoSales workspace', 'quantity' => 1, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->sole();

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->where('can.create', true));

    $this->actingAs($user)
        ->get("/crm/quotes/{$quote->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/show')
            ->where('quote.id', $quote->id)
            ->where('quote.status', 'draft')
            ->where('quote.immutable', false)
            ->where('quote.can.update', true)
            ->where('quote.deal.title', 'Quoted clinic deal')
            ->has('quote.items', 1)
            ->has('quote.owner')
        );

    $this->actingAs($user)
        ->put("/crm/quotes/{$quote->id}", [
            'notes' => 'Valid 21 days',
            'items' => [
                ['name' => 'EvoSales workspace', 'quantity' => 2, 'unit_dzd' => 180000],
            ],
        ])
        ->assertRedirect();

    expect($quote->fresh()->notes)->toBe('Valid 21 days')
        ->and($quote->fresh()->total_cents)->toBe(36_000_000)
        ->and($quote->fresh()->items)->toHaveCount(1);
});

it('does not let a sent quote be edited after the builder chrome change', function () {
    $user = User::factory()->create();
    $quote = p18Quote($user, [
        'status' => 'sent',
        'sent_at' => now(),
        'public_token' => 'p18-sent',
        'token_expires_at' => now()->addDay(),
    ]);
    app(QuoteDocument::class)->freeze($quote);

    $this->actingAs($user)
        ->get("/crm/quotes/{$quote->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/show')
            ->where('quote.id', $quote->id)
            ->where('quote.status', 'sent')
            ->where('quote.immutable', true)
        );

    $this->actingAs($user)
        ->put("/crm/quotes/{$quote->id}", [
            'notes' => 'changed after send',
        ])
        ->assertStatus(422);
});

it('hides quote authoring capabilities for a workspace member without crm.edit', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $quote = p18Quote($owner, [
        'status' => 'draft',
        'notes' => 'Member must not see save',
    ]);

    expect($member->can('update', $quote))->toBeFalse()
        ->and($member->can('create', Quote::class))->toBeFalse()
        ->and($owner->can('update', $quote))->toBeTrue();

    $this->actingAs($member)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->where('can.create', false));

    $this->actingAs($member)
        ->get("/crm/quotes/{$quote->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/show')
            ->where('quote.id', $quote->id)
            ->where('quote.immutable', false)
            ->where('quote.can.update', false));

    $this->actingAs($member)
        ->put("/crm/quotes/{$quote->id}", [
            'notes' => 'should 403',
        ])
        ->assertForbidden();

    $this->actingAs($member)
        ->post("/crm/deals/{$quote->deal_id}/quotes", [
            'items' => [
                ['name' => 'Should not create', 'quantity' => 1, 'unit_dzd' => 100],
            ],
        ])
        ->assertForbidden();

    expect($quote->fresh()->notes)->toBe('Member must not see save');
});
