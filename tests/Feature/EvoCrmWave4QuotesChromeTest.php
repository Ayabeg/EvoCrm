<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\QuoteDocument;

function wave4Quote(User $user, array $overrides = []): Quote
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => $overrides['first_name'] ?? 'Amel',
        'owner_id' => $user->id,
    ]);
    unset($overrides['first_name']);

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
        'status' => 'sent',
        'currency' => 'DZD',
        'total_cents' => 500_000,
        'notes' => 'Two landing pages',
        'expires_at' => now()->addDays(14),
        'sent_at' => now(),
        'public_token' => $overrides['public_token'] ?? 'wave4-token',
        'token_expires_at' => now()->addDay(),
    ], $overrides));

    app(QuoteDocument::class)->freeze($quote);

    return $quote->fresh(['deal.owner', 'deal.contact', 'items']);
}

it('rebuilds the quotes list as HubSpot-dense Wave 1 chrome on the locked triad', function () {
    $index = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $table = file_get_contents(resource_path('js/evo/data/crm-list/table.tsx')).file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));
    $types = file_get_contents(resource_path('js/lib/list-view-config.ts'));

    expect($index)->toContain('data-crm="quotes-workspace"')
        ->and($index)->toContain('CrmListShell')
        ->and($index)->toContain('resultMode="shared-table"')
        ->and($index)->toContain('rows={quotes}')
        ->and($index)->toContain('rowHref={quoteRowHref}')
        ->and($index)->toContain('primaryLabel="Create quote"')
        ->and($index)->toContain('hasActiveListFilters')
        ->and($index)->toContain('onCreate=')
        ->and($index)->not->toContain('ListViewTable')
        ->and($index)->not->toContain('CrmEmptyState')
        ->and($index)->not->toContain('CrmListFooter')
        ->and($index)->not->toContain('CrmShell')
        ->and($index)->not->toContain('chrome="workspace"')
        ->and($index)->not->toContain('RoomShell')
        ->and($index)->not->toContain('HubSpot')
        ->and($index)->not->toContain('Breeze')
        ->and($index)->not->toContain('#00A4BD')
        ->and($index)->not->toContain('#0176D3');

    expect($table)->toContain('QuoteRow')
        ->and($table)->toContain('renderQuoteCell')
        ->and($table)->toContain("entity === 'quote'");

    expect($types)->toContain("'quote'");

    expect($config)->toContain("['id' => 'title', 'label' => 'Quote', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'amount', 'label' => 'Amount', 'defaultVisible' => true]")
        ->and($config)->toContain("'quote' =>");
});

it('rebuilds the quote record as a split document/properties builder', function () {
    $show = file_get_contents(resource_path('js/pages/crm/quotes/show.tsx'));
    $builder = file_get_contents(resource_path('js/pages/crm/quotes/quote-split-builder.tsx'));

    expect($show)->toContain('data-crm="quotes-record"')
        ->and($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('QuoteSplitBuilder')
        ->and($show)->toContain('Preview PDF')
        ->and($show)->not->toContain('RecordShell')
        ->and($show)->not->toContain('leftLabel="About"')
        ->and($show)->not->toContain('HubSpot')
        ->and($show)->not->toContain('Breeze')
        ->and($show)->not->toContain('Copilot')
        ->and($show)->not->toContain('#00A4BD')
        ->and($show)->not->toContain('#0176D3');

    expect($builder)->toContain('data-quote="split-builder"')
        ->and($builder)->toContain('data-quote="document"')
        ->and($builder)->toContain('data-quote="properties"')
        ->and($builder)->toContain('No line items')
        ->and($builder)->toContain('quoteSendAction')
        ->and($builder)->toContain('quoteRevokeAction')
        ->and($builder)->not->toContain('HubSpot')
        ->and($builder)->not->toContain('#00A4BD')
        ->and($builder)->not->toContain('#0176D3');
});

it('rebuilds the public accept page as a paper lockup without rewriting QuoteAcceptor', function () {
    $public = file_get_contents(resource_path('js/pages/public/quote.tsx'));
    $acceptor = file_get_contents(app_path('Services/Crm/QuoteAcceptor.php'));
    $controller = file_get_contents(app_path('Http/Controllers/Public/QuoteAcceptanceController.php'));

    expect($public)->toContain('data-crm="public-quote"')
        ->and($public)->toContain('Accept quote')
        ->and($public)->toContain('EvoCrm')
        ->and($public)->toContain('bg-canvas')
        ->and($public)->toContain('text-ink')
        ->and($public)->not->toContain('HubSpot')
        ->and($public)->not->toContain('Breeze')
        ->and($public)->not->toContain('#00A4BD');

    expect($acceptor)->toContain('lockForUpdate')
        ->and($acceptor)->toContain("'quote_accepted'")
        ->and($controller)->toContain('$acceptor->accept($this->resolve($token), $request->ip())');
});

it('serves the live quotes list and record with Wave 1 list props', function () {
    $user = User::factory()->create();
    $quote = wave4Quote($user, ['public_token' => 'wave4-list']);

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes', 1)
            ->where('quotes.0.id', $quote->id)
            ->where('quotes.0.title', 'Clinic landing page')
            ->where('quotes.0.status', 'sent')
            ->where('quotes.0.total_cents', 500_000)
            ->where('quotes.0.owner.name', $user->name)
            ->has('listView.columnDefs')
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'title'
            ))
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->where('quoteMetrics.total', 1)
            ->where('quoteMetrics.accepted', 0)
            ->where('quoteMetrics.paid_orders', 0)
            ->has('members')
            ->has('deals')
        );

    $this->actingAs($user)
        ->get("/crm/quotes/{$quote->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/show')
            ->where('quote.id', $quote->id)
            ->where('quote.status', 'sent')
            ->where('quote.deal.title', 'Clinic landing page')
            ->has('quote.items')
            ->has('quote.owner')
        );
});

it('filters the quotes list by status and deal owner', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $sent = wave4Quote($user, [
        'public_token' => 'wave4-sent',
        'status' => 'sent',
        'owner_id' => $user->id,
    ]);
    $draft = wave4Quote($user, [
        'public_token' => 'wave4-draft',
        'status' => 'draft',
        'sent_at' => null,
        'owner_id' => $other->id,
        'deal_title' => 'Draft fit-out',
    ]);

    $this->actingAs($user)
        ->get('/crm/quotes?status=sent')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('quotes', fn ($quotes) => collect($quotes)->pluck('id')->all() === [$sent->id])
            ->where('activeFilters.status', 'sent')
        );

    $this->actingAs($user)
        ->get('/crm/quotes?owner='.$other->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('quotes', fn ($quotes) => collect($quotes)->pluck('id')->all() === [$draft->id])
            ->where('activeFilters.owner', (string) $other->id)
        );
});

it('keeps public accept atomic after the Wave 4 chrome rebuild', function () {
    $owner = User::factory()->create();
    $quote = wave4Quote($owner, ['public_token' => 'wave4-accept']);

    $this->get('/q/wave4-accept')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/quote')
            ->where('quote.id', $quote->id)
            ->where('quote.status', 'sent')
            ->where('quote.deal.title', 'Clinic landing page')
            ->has('quote.workspace')
        );

    $this->post('/q/wave4-accept/accept')->assertRedirect();

    expect($quote->fresh()->status)->toBe('accepted')
        ->and($quote->fresh()->accepted_at)->not->toBeNull();
});
