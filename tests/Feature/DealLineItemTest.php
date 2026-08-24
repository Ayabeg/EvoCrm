<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealLineItem;
use App\Models\Product;
use App\Models\Quote;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\DealLineTotals;
use App\Services\Identity\WorkspaceProvisioner;

function commerceDealFor(User $user, int $amountCents = 9_000_000): Deal
{
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic catalog deal',
        'amount_cents' => $amountCents,
        'currency' => 'DZD',
    ]);
}

it('provisions an Evotechly-flavored DZD catalog on each workspace', function () {
    $user = User::factory()->create();

    $skus = Product::query()->forWorkspace($user->workspace)->orderBy('sku')->pluck('sku');

    expect($skus->all())->toBe([
        'EVO-DESK-SEAT',
        'EVO-ONBOARD',
        'EVO-OUTBOUND',
        'EVO-SALES-WS',
        'EVO-WA-CLOUD',
    ])
        ->and(Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-SALES-WS')->value('unit_cents'))
        ->toBe(18_000_000)
        ->and(Product::query()->forWorkspace($user->workspace)->where('currency', 'DZD')->count())->toBe(5);
});

it('adds and removes deal line items and rolls up amount in DZD', function () {
    $user = User::factory()->create();
    $deal = commerceDealFor($user, 9_000_000);
    $workspace = Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-SALES-WS')->first();
    $onboard = Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-ONBOARD')->first();

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/line-items", [
            'product_id' => $workspace->id,
            'quantity' => 1,
        ])
        ->assertRedirect();

    $deal->refresh();
    expect($deal->lineItems)->toHaveCount(1)
        ->and($deal->amount_cents)->toBe(18_000_000)
        ->and($deal->currency)->toBe('DZD')
        ->and($deal->lineItems->first()->name)->toBe('EvoSales workspace')
        ->and($deal->lineItems->first()->sku)->toBe('EVO-SALES-WS');

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/line-items", [
            'product_id' => $onboard->id,
            'quantity' => 2,
        ])
        ->assertRedirect();

    $deal->refresh();
    expect($deal->lineItems)->toHaveCount(2)
        ->and($deal->amount_cents)->toBe(26_000_000);

    $first = $deal->lineItems->first();

    $this->actingAs($user)
        ->delete("/crm/deals/{$deal->id}/line-items/{$first->id}")
        ->assertRedirect();

    $deal->refresh();
    expect($deal->lineItems)->toHaveCount(1)
        ->and($deal->amount_cents)->toBe(8_000_000);
});

it('keeps a manual deal amount when there are no line items', function () {
    $user = User::factory()->create();
    $deal = commerceDealFor($user, 12_000_000);

    expect($deal->lineItems()->count())->toBe(0);

    $this->actingAs($user)
        ->put("/crm/deals/{$deal->id}", [
            'title' => $deal->title,
            'amount_dzd' => 150000,
        ])
        ->assertRedirect();

    expect($deal->fresh()->amount_cents)->toBe(15_000_000)
        ->and(app(DealLineTotals::class)->rollup($deal->fresh())->amount_cents)->toBe(15_000_000);
});

it('does not let a manual amount overwrite a rollup while items exist', function () {
    $user = User::factory()->create();
    $deal = commerceDealFor($user, 1_000_000);
    $product = Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-DESK-SEAT')->first();

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/line-items", [
            'product_id' => $product->id,
            'quantity' => 1,
        ])
        ->assertRedirect();

    expect($deal->fresh()->amount_cents)->toBe(4_500_000);

    $this->actingAs($user)
        ->put("/crm/deals/{$deal->id}", [
            'title' => $deal->title,
            'amount_dzd' => 99,
        ])
        ->assertRedirect();

    expect($deal->fresh()->amount_cents)->toBe(4_500_000);
});

it('shows catalog products and line items on the deal record page', function () {
    $user = User::factory()->create();
    $deal = commerceDealFor($user, 3_000_000);
    $product = Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-WA-CLOUD')->first();

    app(DealLineTotals::class)->add($deal, ['quantity' => 1], $product);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->has('catchUp.inbound')
            ->has('catchUp.outbound')
            ->has('products', 5)
            ->where('products.0.currency', 'DZD')
            ->has('selected.line_items', 1)
            ->where('selected.line_items.0.sku', 'EVO-WA-CLOUD')
            ->where('selected.amount_cents', 2_500_000)
            ->has('associations.line_items', 1)
        );
});

it('rejects a product from another workspace', function () {
    $user = User::factory()->create();
    $other = Workspace::factory()->create();
    app(WorkspaceProvisioner::class)->seedCatalog($other);
    $foreign = Product::query()->forWorkspace($other)->where('sku', 'EVO-SALES-WS')->first();
    $deal = commerceDealFor($user);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/line-items", [
            'product_id' => $foreign->id,
            'quantity' => 1,
        ])
        ->assertNotFound();

    expect(DealLineItem::query()->where('deal_id', $deal->id)->count())->toBe(0)
        ->and($deal->fresh()->amount_cents)->toBe(9_000_000);
});

it('lets a quote item pick from the same product catalog', function () {
    $user = User::factory()->create();
    $deal = commerceDealFor($user);
    $product = Product::query()->forWorkspace($user->workspace)->where('sku', 'EVO-OUTBOUND')->first();

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'status' => 'draft',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->first();

    expect($quote->total_cents)->toBe(12_000_000)
        ->and($quote->items)->toHaveCount(1)
        ->and($quote->items->first()->product_id)->toBe($product->id)
        ->and($quote->items->first()->name)->toBe('Outbound sequences pack');
});
