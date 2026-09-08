<?php

use App\Models\OutboundTemplate;
use App\Models\Sequence;
use App\Models\SequenceStep;
use App\Models\User;

it('renders the HubSpot vertical sequence editor contract', function () {
    $editor = file_get_contents(resource_path('js/components/outbound/sequence-step-editor.tsx'));
    $show = file_get_contents(resource_path('js/pages/outbound/sequences/show.tsx'));
    $index = file_get_contents(resource_path('js/pages/outbound/sequences/index.tsx'));

    expect($editor)->toContain('sequence-step-editor')
        ->and($editor)->toContain('Automated email')
        ->and($editor)->toContain('WhatsApp template')
        ->and($editor)->toContain('Call task')
        ->and($editor)->toContain('Meeting')
        ->and($editor)->toContain('Subject B (A/B)')
        ->and($editor)->not->toContain('LinkedIn')
        ->and($show)->toContain('SequenceStepEditor')
        ->and($show)->toContain('Create workflow')
        ->and($show)->toContain('/outbound/warmup')
        ->and($show)->toContain('/outbound/quiet-hours')
        ->and($index)->toContain('From scratch')
        ->and($index)->toContain('From template');
});

it('creates a sequence from a template and stores an A/B subject on a step', function () {
    $user = User::factory()->create();
    OutboundTemplate::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic intro',
        'subject' => 'Clinic A',
        'body' => 'Hello from clinic',
    ]);

    $this->actingAs($user)
        ->post('/outbound/sequences', [
            'name' => 'Nurture',
            'channel' => 'email',
            'origin' => 'template',
        ])
        ->assertRedirect();

    $sequence = Sequence::query()->where('name', 'Nurture')->first();
    expect($sequence)->not->toBeNull()
        ->and($sequence->steps()->first()->subject)->toBe('Clinic A');

    $step = $sequence->steps()->first();

    $this->actingAs($user)
        ->put("/outbound/sequences/{$sequence->id}/steps/{$step->id}", [
            'delay_hours' => 0,
            'channel' => 'email',
            'step_type' => 'email',
            'subject' => 'Clinic A',
            'subject_b' => 'Clinic B',
            'body' => 'Hello from clinic',
        ])
        ->assertRedirect();

    expect($step->fresh()->subject_b)->toBe('Clinic B');
});

it('adds a WhatsApp Cloud template step instead of LinkedIn', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/steps", [
            'delay_hours' => 24,
            'step_type' => 'whatsapp_cloud',
            'channel' => 'whatsapp_cloud',
            'wa_template_name' => 'follow_up',
            'wa_template_language' => 'fr',
        ])
        ->assertRedirect();

    $step = SequenceStep::query()->where('sequence_id', $sequence->id)->latest('id')->first();

    expect($step->step_type)->toBe('whatsapp_cloud')
        ->and($step->wa_template_name)->toBe('follow_up');
});
