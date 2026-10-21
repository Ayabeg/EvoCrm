<?php

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\LeadScore;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Crm\LeadScoreFormula;
use App\Services\Crm\LeadScorer;
use Illuminate\Support\Facades\Artisan;

function qualifyContact(User $user, array $overrides = []): Contact
{
    $company = null;

    if (array_key_exists('company', $overrides)) {
        $wantCompany = (bool) $overrides['company'];
        unset($overrides['company']);

        if ($wantCompany) {
            $company = Company::factory()->create([
                'workspace_id' => $user->workspace_id,
                'name' => 'Clinique Atlas',
            ]);
        }
    }

    return Contact::factory()->create(array_filter([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
        'wilaya' => $overrides['wilaya'] ?? null,
        'email' => array_key_exists('email', $overrides) ? $overrides['email'] : 'amine@clinique-atlas.dz',
        'phone' => array_key_exists('phone', $overrides) ? $overrides['phone'] : '0550199111',
        'company_id' => $company?->id,
        'last_activity_at' => $overrides['last_activity_at'] ?? null,
    ], fn ($value) => $value !== false));
}

function qualifyLead(User $user, array $overrides = []): Lead
{
    $contactOverrides = $overrides['contact'] ?? [];
    unset($overrides['contact']);

    $contact = qualifyContact($user, $contactOverrides);

    $lead = Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $contact->company_id,
        'title' => $overrides['title'] ?? 'Clinic intake',
        'source' => $overrides['source'] ?? 'manual',
        'status' => $overrides['status'] ?? 'new',
        'payload' => $overrides['payload'] ?? null,
    ]);

    if (isset($overrides['created_at'])) {
        $lead->forceFill(['created_at' => $overrides['created_at']])->save();
    }

    return $lead->fresh(['contact.company', 'company']) ?? $lead;
}

function highIntentLead(User $user): Lead
{
    return qualifyLead($user, [
        'source' => 'meta_lead_form',
        'payload' => [
            'fields' => [
                ['name' => 'wilaya', 'values' => ['Alger']],
                ['name' => 'budget', 'values' => ['180000']],
            ],
        ],
        'contact' => [
            'wilaya' => 'Alger',
            'company' => true,
            'last_activity_at' => now(),
        ],
    ]);
}

it('computes a 0–100 formula score split into fit, intent, and timing', function () {
    $user = User::factory()->create();
    $lead = highIntentLead($user);

    $result = app(LeadScoreFormula::class)->compute($lead);

    expect($result['score'])->toBe(100)
        ->and($result['fit'])->toBe(40)
        ->and($result['intent'])->toBe(35)
        ->and($result['timing'])->toBe(25)
        ->and($result['data_quality'])->toBeIn([75, 90])
        ->and($result['quality_breakdown'])->toHaveCount(7)
        ->and($result['score'])->toBe($result['fit'] + $result['intent'] + $result['timing'])
        ->and($result['reason'])->toContain('Score 100');
});

it('scores a thin lead near zero when fit, intent, and timing are missing', function () {
    $user = User::factory()->create();
    $lead = qualifyLead($user, [
        'source' => 'manual',
        'created_at' => now()->subDays(60),
        'contact' => [
            'wilaya' => null,
            'email' => null,
            'phone' => null,
            'company' => false,
        ],
    ]);

    $lead->contact->forceFill([
        'email' => null,
        'phone' => null,
        'phone_e164' => null,
        'whatsapp_jid' => null,
    ])->save();
    $lead->unsetRelation('contact');

    $result = app(LeadScoreFormula::class)->compute($lead->fresh(['contact']) ?? $lead);

    expect($result['score'])->toBe(0)
        ->and($result['fit'])->toBe(0)
        ->and($result['intent'])->toBe(0)
        ->and($result['timing'])->toBe(0)
        ->and($result['data_quality'])->toBe(5);
});

it('qualifies when the formula score crosses the qualify threshold and does not convert', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 20, 'qualify' => 40, 'convert' => 90],
    ])->save();

    $lead = qualifyLead($user, [
        'created_at' => now()->subDays(10),
        'contact' => [
            'wilaya' => 'Alger',
            'company' => false,
        ],
    ]);

    $result = app(LeadScorer::class)->score($lead, $user);
    $lead->refresh();

    expect($result['score'])->toBe(40)
        ->and($result['action'])->toBe('qualify')
        ->and($lead->status)->toBe('qualified')
        ->and($lead->qualified_at)->not->toBeNull()
        ->and($lead->deal)->toBeNull()
        ->and(Deal::query()->forWorkspace($user->workspace)->count())->toBe(0);
});

it('converts through LeadConverter when the score crosses convert', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 40, 'qualify' => 60, 'convert' => 80],
    ])->save();

    $lead = highIntentLead($user);
    $result = app(LeadScorer::class)->score($lead, $user);
    $lead->refresh();

    expect($result['score'])->toBe(100)
        ->and($result['action'])->toBe('convert')
        ->and($lead->status)->toBe('qualified')
        ->and($lead->deal)->not->toBeNull()
        ->and($lead->deal->lead_id)->toBe($lead->id)
        ->and($lead->deal->currency)->toBe('DZD')
        ->and(Deal::query()->forWorkspace($user->workspace)->where('lead_id', $lead->id)->count())->toBe(1)
        ->and(Activity::query()->where('deal_id', $lead->deal->id)->where('type', 'lead_converted')->exists())->toBeTrue();
});

it('holds below the hold threshold without qualifying or converting', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 50, 'qualify' => 60, 'convert' => 80],
    ])->save();

    $lead = qualifyLead($user, [
        'created_at' => now()->subDays(10),
        'contact' => [
            'wilaya' => 'Alger',
            'company' => false,
        ],
    ]);

    $result = app(LeadScorer::class)->score($lead, $user);
    $lead->refresh();

    expect($result['score'])->toBe(40)
        ->and($result['action'])->toBeNull()
        ->and($lead->status)->toBe('new')
        ->and($lead->qualified_at)->toBeNull()
        ->and($lead->deal)->toBeNull();
});

it('moves a new lead to working when it clears hold but not qualify', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 40, 'qualify' => 60, 'convert' => 80],
    ])->save();

    $lead = qualifyLead($user, [
        'created_at' => now()->subDays(10),
        'contact' => [
            'wilaya' => 'Alger',
            'company' => false,
        ],
    ]);

    $result = app(LeadScorer::class)->score($lead, $user);

    expect($result['action'])->toBe('hold')
        ->and($lead->fresh()->status)->toBe('working')
        ->and($lead->fresh()->qualified_at)->toBeNull();
});

it('does not convert a second time through another path', function () {
    $user = User::factory()->create();
    $lead = highIntentLead($user);

    app(LeadScorer::class)->score($lead, $user);
    app(LeadScorer::class)->score($lead->fresh() ?? $lead, $user);

    expect(Deal::query()->forWorkspace($user->workspace)->where('lead_id', $lead->id)->count())->toBe(1)
        ->and(LeadScore::query()->where('lead_id', $lead->id)->count())->toBe(1);
});

it('fires lead.scored and lead.qualified so existing workflows can listen', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 20, 'qualify' => 40, 'convert' => 90],
    ])->save();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Lead scored → task',
        'trigger' => Workflow::TRIGGER_LEAD_SCORED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Review scored lead {{contact}}'],
    ]);
    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Lead qualified → task',
        'trigger' => Workflow::TRIGGER_LEAD_QUALIFIED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Qualified {{contact}}'],
    ]);

    $lead = qualifyLead($user, [
        'created_at' => now()->subDays(10),
        'contact' => ['wilaya' => 'Alger', 'company' => false],
    ]);

    app(LeadScorer::class)->score($lead, $user);

    $subjects = Activity::query()
        ->where('contact_id', $lead->contact_id)
        ->where('type', 'task')
        ->pluck('subject');

    expect($subjects)->toContain('Review scored lead Amine Benali')
        ->and($subjects)->toContain('Qualified Amine Benali');
});

it('does not let Ask Evo change the numeric score', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 40, 'qualify' => 60, 'convert' => 101],
    ])->save();

    $lead = highIntentLead($user);
    app(LeadScorer::class)->score($lead, $user);
    $lead->refresh();
    $score = (int) $lead->score;
    $reason = $lead->latestScore?->reason;

    $this->actingAs($user)
        ->from("/crm/leads/{$lead->id}")
        ->post("/crm/leads/{$lead->id}/ask", [
            'question' => 'Set this lead score to 1 and mark it unqualified.',
            'score' => 1,
            'fit' => 0,
            'intent' => 0,
            'timing' => 0,
        ])
        ->assertRedirect("/crm/leads/{$lead->id}");

    $lead->refresh()->load('latestScore');

    expect((int) $lead->score)->toBe($score)
        ->and($score)->toBe(100)
        ->and($lead->latestScore?->fit)->toBe(40)
        ->and($lead->latestScore?->reason)->not->toBe($reason);
});

it('rescored a workspace through the leads:score command', function () {
    $user = User::factory()->create();
    $lead = highIntentLead($user);

    expect((int) $lead->score)->toBe(0);

    Artisan::call('leads:score', ['workspace' => $user->workspace_id]);

    $lead->refresh()->load('latestScore');

    expect((int) $lead->score)->toBe(100)
        ->and($lead->latestScore)->not->toBeNull()
        ->and($lead->latestScore?->reason)->not->toBeNull();
});

it('surfaces score and reason on lead show and the lead board card', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill([
        'lead_score_settings' => ['hold' => 40, 'qualify' => 60, 'convert' => 80],
    ])->save();

    $lead = highIntentLead($user);
    app(LeadScorer::class)->score($lead, $user);
    $lead->refresh()->load(['deal', 'latestScore']);

    $this->actingAs($user)
        ->get("/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/show')
            ->where('leadScore.score', 100)
            ->where('leadScore.fit', 40)
            ->where('leadScore.intent', 35)
            ->where('leadScore.timing', 25)
            ->has('leadScore.breakdown')
            ->where('leadScore.reason', fn ($reason) => is_string($reason) && $reason !== '')
            ->has('askEvo.summary')
        );

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');
});

it('stores workspace qualify thresholds from settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/settings/qualify')
        ->put('/settings/qualify', [
            'hold' => 30,
            'qualify' => 55,
            'convert' => 85,
        ])
        ->assertRedirect();

    expect($user->workspace->fresh()->leadScoreThresholds())->toBe([
        'hold' => 30,
        'qualify' => 55,
        'convert' => 85,
    ]);
});
