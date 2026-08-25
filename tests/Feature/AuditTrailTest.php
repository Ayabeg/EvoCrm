<?php

use App\Enums\WorkspaceRole;
use App\Models\AuditEvent;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;

it('records a login event for the workspace', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    $event = AuditEvent::query()->where('action', 'login')->sole();

    expect($event->workspace_id)->toBe($user->workspace_id)
        ->and($event->actor_id)->toBe($user->id)
        ->and($event->summary)->toContain($user->email);
});

it('records merge quote send quote accept import and permission events', function () {
    Mail::fake();
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    Mailbox::factory()->create(['workspace_id' => $owner->workspace_id]);

    $survivor = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Amine',
        'email' => 'keep@example.test',
    ]);
    $absorbed = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Old',
        'email' => 'drop@example.test',
    ]);

    $this->actingAs($owner)
        ->post('/crm/contacts/merge', [
            'survivor_id' => $survivor->id,
            'absorbed_id' => $absorbed->id,
            'values' => [
                'first_name' => 'Amine',
                'email' => 'keep@example.test',
            ],
        ])
        ->assertRedirect();

    expect(AuditEvent::query()->where('action', 'contact.merged')->count())->toBe(1);

    $this->actingAs($owner)
        ->put("/settings/permissions/{$member->id}", [
            'permissions' => ['crm.edit'],
        ])
        ->assertRedirect();

    expect(AuditEvent::query()->where('action', 'permissions.updated')->count())->toBe(1);

    $pipeline = $owner->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => $survivor->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Quoted clinic',
        'amount_cents' => 100000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($owner)
        ->post("/crm/deals/{$deal->id}/quotes", [
            'notes' => 'Valid 14 days',
            'items' => [
                ['name' => 'Workspace', 'quantity' => 1, 'unit_dzd' => 1000],
            ],
        ])
        ->assertRedirect();

    $quote = Quote::query()->where('deal_id', $deal->id)->sole();

    $this->actingAs($owner)
        ->post("/crm/quotes/{$quote->id}/send", [
            'to' => 'buyer@clinic.dz',
        ])
        ->assertRedirect();

    expect(AuditEvent::query()->where('action', 'quote.sent')->count())->toBe(1);

    $this->post("/q/{$quote->fresh()->public_token}/accept")->assertRedirect();

    expect(AuditEvent::query()->where('action', 'quote.accepted')->count())->toBe(1);

    $csv = UploadedFile::fake()->createWithContent('contacts.csv', "First Name,Email\nSara,sara@example.test\n");
    $this->actingAs($owner)->post('/crm/contacts/import', ['file' => $csv])->assertRedirect();
    $batch = \App\Models\ImportBatch::query()->where('workspace_id', $owner->workspace_id)->latest('id')->first();
    expect($batch)->not->toBeNull();
    $this->actingAs($owner)->get("/crm/contacts/import/{$batch->id}")->assertOk();
    $this->actingAs($owner)->post("/crm/contacts/import/{$batch->id}/commit")->assertRedirect();

    expect(AuditEvent::query()->where('action', 'import.completed')->count())->toBe(1);
});

it('shows the workspace audit trail and hides it from members and other workspaces', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);

    AuditEvent::query()->create([
        'workspace_id' => $owner->workspace_id,
        'actor_id' => $owner->id,
        'action' => 'login',
        'summary' => 'Owner signed in',
        'payload' => [],
    ]);
    AuditEvent::query()->create([
        'workspace_id' => $other->workspace_id,
        'actor_id' => $other->id,
        'action' => 'login',
        'summary' => 'Other signed in',
        'payload' => [],
    ]);

    $this->actingAs($owner)
        ->get('/settings/audit')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/audit')
            ->has('events', 1)
            ->where('events.0.summary', 'Owner signed in'));

    $this->actingAs($member)->get('/settings/audit')->assertForbidden();
    $this->actingAs($other)
        ->get('/settings/audit')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('events', 1)->where('events.0.summary', 'Other signed in'));
});
