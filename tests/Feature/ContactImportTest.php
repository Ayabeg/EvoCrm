<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Http\UploadedFile;

function contactImportCsv(string $contents, string $name = 'contacts.csv'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, $contents);
}

function hubspotContactsCsv(): string
{
    return <<<'CSV'
Record ID,First Name,Last Name,Email,Phone Number,Company Name,City
101,Amine,Benali,amine@example.test,0550123456,Evotechly,Algiers
102,Sara,Mansouri,sara@example.test,0550987654,Atlas Labs,Oran
CSV;
}

it('blocks members without import permission from the contact import surface', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($member)->get('/crm/contacts/import')->assertForbidden();
    $this->actingAs($member)
        ->post('/crm/contacts/import', [
            'file' => contactImportCsv(hubspotContactsCsv()),
        ])
        ->assertForbidden();

    expect(ImportBatch::query()->count())->toBe(0)
        ->and(Contact::query()->count())->toBe(0);
});

it('lets an owner preview a HubSpot contact export and commit mapped creates', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);

    $this->actingAs($owner)
        ->post('/crm/contacts/import', [
            'file' => contactImportCsv(hubspotContactsCsv()),
        ])
        ->assertRedirect();

    $batch = ImportBatch::query()->first();
    expect($batch)->not->toBeNull();

    $this->actingAs($owner)
        ->get("/crm/contacts/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/import')
            ->where('batch.preview.created', 2)
            ->where('batch.preview.updated', 0)
            ->where('batch.preview.skipped', 0)
            ->where('batch.preview.errors', 0)
            ->where('batch.mapping.Email', 'email')
            ->where('batch.mapping.Record ID', 'external_id'));

    $this->actingAs($owner)
        ->post("/crm/contacts/import/{$batch->id}/commit")
        ->assertRedirect();

    $amine = Contact::query()
        ->where('workspace_id', $owner->workspace_id)
        ->where('email', 'amine@example.test')
        ->first();

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(2)
        ->and($amine)->not->toBeNull()
        ->and($amine->first_name)->toBe('Amine')
        ->and($amine->external_id)->toBe('101')
        ->and($amine->phone_e164)->toBe('+213550123456')
        ->and($amine->city)->toBe('Algiers')
        ->and($amine->company?->name)->toBe('Evotechly')
        ->and($batch->fresh()->status)->toBe(ImportBatch::STATUS_COMPLETED)
        ->and($batch->fresh()->created_count)->toBe(2);
});

it('reimports the same contact source without creating duplicates', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Old',
        'last_name' => 'Name',
        'email' => 'amine@example.test',
        'phone' => '0550000000',
        'external_id' => '101',
    ]);

    $this->actingAs($owner)
        ->post('/crm/contacts/import', [
            'file' => contactImportCsv(hubspotContactsCsv()),
        ])
        ->assertRedirect();

    $batch = ImportBatch::query()->latest('id')->first();

    $this->actingAs($owner)
        ->get("/crm/contacts/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('batch.preview.created', 1)
            ->where('batch.preview.updated', 1)
            ->where('batch.preview.skipped', 0));

    $this->actingAs($owner)->post("/crm/contacts/import/{$batch->id}/commit")->assertRedirect();

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(2)
        ->and(Contact::query()->where('email', 'amine@example.test')->value('first_name'))->toBe('Amine');

    $this->actingAs($owner)
        ->post('/crm/contacts/import', [
            'file' => contactImportCsv(hubspotContactsCsv()),
        ])
        ->assertRedirect();

    $second = ImportBatch::query()->latest('id')->first();
    $this->actingAs($owner)->post("/crm/contacts/import/{$second->id}/commit")->assertRedirect();

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(2)
        ->and($second->fresh()->created_count)->toBe(0)
        ->and($second->fresh()->updated_count + $second->fresh()->skipped_count)->toBe(2);
});

it('matches contacts by external id before email or phone', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $existing = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'first_name' => 'Kept',
        'email' => 'other@example.test',
        'phone' => '0550111111',
        'external_id' => '101',
    ]);

    $csv = <<<'CSV'
Record ID,First Name,Email,Phone Number
101,Amine,amine@example.test,0550123456
CSV;

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);

    $batch = ImportBatch::query()->first();
    $this->actingAs($owner)->post("/crm/contacts/import/{$batch->id}/commit");

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(1)
        ->and($existing->fresh()->email)->toBe('amine@example.test')
        ->and($existing->fresh()->first_name)->toBe('Amine');
});

it('records a row error when a contact has no usable identity', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $csv = <<<'CSV'
First Name,Last Name,Email,Phone Number
No,Identity,,
CSV;

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);

    $batch = ImportBatch::query()->first();

    $this->actingAs($owner)
        ->get("/crm/contacts/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('batch.preview.errors', 1)
            ->where('batch.preview.created', 0));

    $this->actingAs($owner)->post("/crm/contacts/import/{$batch->id}/commit");

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(0)
        ->and($batch->fresh()->error_count)->toBe(1);
});

it('imports mapped custom attributes onto created contacts', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    CustomAttributeDefinition::query()->create([
        'workspace_id' => $owner->workspace_id,
        'entity' => 'contact',
        'key' => 'segment',
        'label' => 'Segment',
        'type' => 'text',
    ]);

    $csv = <<<'CSV'
Email,First Name,Segment
attr@example.test,Lina,Enterprise
CSV;

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);

    $batch = ImportBatch::query()->first();
    $this->actingAs($owner)
        ->put("/crm/contacts/import/{$batch->id}", [
            'mapping' => [
                'Email' => 'email',
                'First Name' => 'first_name',
                'Segment' => 'attr.segment',
            ],
        ])
        ->assertRedirect();

    $this->actingAs($owner)->post("/crm/contacts/import/{$batch->id}/commit");

    $contact = Contact::query()->where('email', 'attr@example.test')->first();
    $value = CustomAttributeValue::query()
        ->where('entity_type', 'contact')
        ->where('entity_id', $contact->id)
        ->value('value');

    expect($value)->toBe('Enterprise');
});

it('keeps import batches isolated to the owning workspace', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv(hubspotContactsCsv()),
    ]);

    $batch = ImportBatch::query()->first();

    $this->actingAs($other)->get("/crm/contacts/import/{$batch->id}")->assertNotFound();
    $this->actingAs($other)->post("/crm/contacts/import/{$batch->id}/commit")->assertNotFound();

    expect(Contact::query()->where('workspace_id', $other->workspace_id)->count())->toBe(0);
});

it('lets a member import after an owner grants the override', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => ['crm.import'],
    ]);

    $this->actingAs($member)
        ->post('/crm/contacts/import', [
            'file' => contactImportCsv("Email,First Name\nmember@example.test,Nabil\n"),
        ])
        ->assertRedirect();

    $batch = ImportBatch::query()->first();
    $this->actingAs($member)->post("/crm/contacts/import/{$batch->id}/commit")->assertRedirect();

    expect(Contact::query()
        ->where('workspace_id', $owner->workspace_id)
        ->where('email', 'member@example.test')
        ->exists())->toBeTrue();
});
