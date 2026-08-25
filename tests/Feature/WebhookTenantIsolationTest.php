<?php

use App\Models\AdLead;
use App\Models\Contact;
use App\Models\Workspace;
use App\Services\Webhooks\WebhookEndpointManager;

it('routes Evolution webhooks to exactly the workspace named by the endpoint key', function () {
    $first = Workspace::factory()->create();
    $second = Workspace::factory()->create();
    $manager = app(WebhookEndpointManager::class);
    $firstEndpoint = $manager->forWorkspace($first, 'evolution');
    $secondEndpoint = $manager->forWorkspace($second, 'evolution');

    $this->postJson("/webhooks/evolution/{$firstEndpoint->key}", [
        'event' => 'MESSAGES_UPSERT',
        'data' => [
            'phone' => '0555111222',
            'pushName' => 'First workspace',
            'body' => 'First',
        ],
    ])->assertOk();

    $this->postJson("/webhooks/evolution/{$secondEndpoint->key}", [
        'event' => 'MESSAGES_UPSERT',
        'data' => [
            'phone' => '0666222333',
            'pushName' => 'Second workspace',
            'body' => 'Second',
        ],
    ])->assertOk();

    expect(Contact::query()->where('workspace_id', $first->id)->pluck('first_name')->all())
        ->toContain('First workspace')
        ->not->toContain('Second workspace')
        ->and(Contact::query()->where('workspace_id', $second->id)->pluck('first_name')->all())
        ->toContain('Second workspace')
        ->not->toContain('First workspace');
});

it('routes Meta lead ingestion to exactly the workspace named by the endpoint key', function () {
    $first = Workspace::factory()->create();
    $second = Workspace::factory()->create();
    $manager = app(WebhookEndpointManager::class);
    $firstEndpoint = $manager->forWorkspace($first, 'meta_leads');
    $secondEndpoint = $manager->forWorkspace($second, 'meta_leads');

    $this->postJson("/webhooks/meta/leads/{$firstEndpoint->key}", [
        'leadgen_id' => 'lead-first',
        'fields' => ['email' => 'first@example.test', 'full_name' => 'First Lead'],
    ])->assertOk();

    $this->postJson("/webhooks/meta/leads/{$secondEndpoint->key}", [
        'leadgen_id' => 'lead-second',
        'fields' => ['email' => 'second@example.test', 'full_name' => 'Second Lead'],
    ])->assertOk();

    expect(AdLead::query()->where('workspace_id', $first->id)->pluck('external_id')->all())
        ->toBe(['lead-first'])
        ->and(AdLead::query()->where('workspace_id', $second->id)->pluck('external_id')->all())
        ->toBe(['lead-second']);
});

it('fails closed for legacy unknown and mismatched webhook identities', function () {
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'evolution');

    $this->postJson('/webhooks/evolution', [])->assertNotFound();
    $this->postJson('/webhooks/meta/leads', [])->assertNotFound();
    $this->postJson('/webhooks/evolution/unknown', [])->assertNotFound();
    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", [])->assertNotFound();

    expect(Contact::query()->count())->toBe(0)
        ->and(AdLead::query()->count())->toBe(0);
});
