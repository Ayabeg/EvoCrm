<?php

use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Ai\RecordInsight;
use Illuminate\Support\Facades\Http;

it('shows Ask Evo on a contact record from this contact fields', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Clinic',
        'email' => 'amine.clinic@example.com',
        'city' => 'Alger',
    ]);

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('askEvo.label', 'Ask Evo')
            ->where('askEvo.live', false)
            ->where('askEvo.source', 'fields')
            ->where('askEvo.summary', fn ($summary) => is_string($summary)
                && str_contains($summary, 'Amine Clinic')
                && str_contains($summary, 'amine.clinic@example.com')
                && ! str_contains($summary, 'Breeze')
                && ! str_contains($summary, 'HubSpot'))
        );
});

it('answers Ask Evo from this contact without a live model key', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Clinic',
        'email' => 'amine.clinic@example.com',
    ]);

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/contacts/{$contact->id}/ask", [
            'question' => 'What is the email on this record?',
        ])
        ->assertRedirect("/crm/contacts/{$contact->id}");

    $row = AiInsight::query()->where('subject_type', 'contact')->where('subject_id', $contact->id)->first();

    expect($row)->not->toBeNull()
        ->and($row->source)->toBe('fields')
        ->and($row->answer)->toContain('amine.clinic@example.com')
        ->and($row->answer)->not->toContain('Breeze');

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('askEvo.answer', $row->answer)
            ->where('askEvo.question', 'What is the email on this record?')
        );
});

it('scores deal health from stage probability, recency, and amount', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $pipeline = $workspace->defaultPipeline();
    $proposal = $pipeline->stageBySlug('proposal');

    $healthy = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $proposal->id,
        'title' => 'Clinic hub',
        'amount_cents' => 18_000_000,
        'currency' => 'DZD',
        'last_activity_at' => now()->subDays(2),
    ]);

    $cold = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Cold lead',
        'amount_cents' => 0,
        'currency' => 'DZD',
        'last_activity_at' => null,
    ]);

    $insight = app(RecordInsight::class);
    $healthyScore = $insight->dealHealth($healthy);
    $coldScore = $insight->dealHealth($cold);

    expect($healthyScore['score'])->toBe(86)
        ->and($healthyScore['band'])->toBe('healthy')
        ->and($healthyScore['label'])->toBe('Healthy')
        ->and($healthyScore['reason'])->toContain('Proposal at 75%')
        ->and($healthyScore['reason'])->toContain('last activity 2 days ago')
        ->and($healthyScore['reason'])->toContain('amount set')
        ->and($healthyScore['reason'])->not->toContain('Breeze')
        ->and($coldScore['score'])->toBe(6)
        ->and($coldScore['band'])->toBe('risk')
        ->and($coldScore['reason'])->toContain('amount missing')
        ->and($coldScore['score'])->toBeLessThan($healthyScore['score']);

    $this->actingAs($user)
        ->get("/crm/deals/{$healthy->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('dealHealth.score', 86)
            ->where('dealHealth.label', 'Healthy')
            ->where('askEvo.label', 'Ask Evo')
            ->where('askEvo.summary', fn ($summary) => is_string($summary)
                && str_contains($summary, 'Clinic hub')
                && ! str_contains($summary, 'Breeze'))
        );
});

it('uses the openai path when OPENAI_API_KEY is set', function () {
    config(['services.openai.key' => 'sk-test']);

    Http::fake([
        'api.openai.com/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Evo: Amine Clinic is the person on this record.']],
            ],
        ]),
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Clinic',
    ]);

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/contacts/{$contact->id}/ask", [
            'question' => 'Who is this?',
        ])
        ->assertRedirect();

    $row = AiInsight::query()->where('subject_id', $contact->id)->first();

    expect($row->source)->toBe('openai')
        ->and($row->answer)->toBe('Evo: Amine Clinic is the person on this record.')
        ->and($row->answer)->not->toContain('Breeze');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'api.openai.com'));
});

it('hides Ask Evo write from another workspace', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $stranger->workspace_id]);

    $this->actingAs($user)
        ->post("/crm/contacts/{$contact->id}/ask", ['question' => 'Email?'])
        ->assertNotFound();
});

it('requires a question for Ask Evo', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/contacts/{$contact->id}/ask", ['question' => ''])
        ->assertRedirect("/crm/contacts/{$contact->id}")
        ->assertSessionHasErrors('question');
});

it('answers a deal Ask Evo from stage and amount fields', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('demo')->id,
        'title' => 'Clinic hub',
        'amount_cents' => 9_500_000,
        'currency' => 'DZD',
    ]);

    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'deal_id' => $deal->id,
        'contact_id' => $contact->id,
        'type' => 'note',
        'subject' => 'Sent the quote',
        'body' => 'Waiting on finance',
    ]);

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post("/crm/deals/{$deal->id}/ask", [
            'question' => 'What is the amount and stage?',
        ])
        ->assertRedirect("/crm/deals/{$deal->id}");

    $row = AiInsight::query()->where('subject_type', 'deal')->where('subject_id', $deal->id)->first();

    expect($row)->not->toBeNull()
        ->and($row->source)->toBe('fields')
        ->and($row->answer)->toContain('Demo')
        ->and($row->answer)->toContain('DZD');
});
