<?php

use App\Enums\WorkspaceRole;
use App\Jobs\EnrichRecordJob;
use App\Jobs\ProcessImportBatch;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\EnrichmentRun;
use App\Models\ImportBatch;
use App\Models\User;
use App\Services\Crm\ContactCsvImporter;
use App\Services\Crm\DealCsvImporter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;

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

it('redacts terminal import worker diagnostics', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $batch = ImportBatch::query()->create([
        'workspace_id' => $owner->workspace_id,
        'user_id' => $owner->id,
        'type' => ImportBatch::TYPE_CONTACTS,
        'status' => ImportBatch::STATUS_PROCESSING,
        'filename' => 'contacts.csv',
        'source_hash' => hash('sha256', 'contacts.csv'),
        'headers' => [],
        'total_rows' => 1,
    ]);

    (new ProcessImportBatch($batch->id))->failed(
        new RuntimeException('Import failed for owner@clinic.dz at https://provider.example.test using Authorization: Bearer secret-value'),
    );

    expect($batch->fresh()->status)->toBe(ImportBatch::STATUS_FAILED)
        ->and($batch->fresh()->error_summary)->not->toContain('owner@clinic.dz')
        ->and($batch->fresh()->error_summary)->not->toContain('https://provider.example.test')
        ->and($batch->fresh()->error_summary)->not->toContain('Bearer secret-value');
});

it('continues large contact imports through bounded queue chunks', function () {
    Bus::fake();
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $rows = collect(range(1, 101))
        ->map(fn (int $number): string => "contact{$number}@example.test,Contact {$number}")
        ->prepend('Email,First Name')
        ->implode("\n");

    $batch = app(ContactCsvImporter::class)->createBatch(
        $owner->workspace,
        $owner,
        contactImportCsv($rows),
    );

    (new ProcessImportBatch($batch->id))->handle(
        app(ContactCsvImporter::class),
        app(DealCsvImporter::class),
    );

    expect($batch->fresh()->status)->toBe(ImportBatch::STATUS_PROCESSING)
        ->and($batch->fresh()->processed_rows)->toBe(100)
        ->and($batch->fresh()->rows()->where('status', 'pending')->count())->toBe(1);

    Bus::assertDispatched(ProcessImportBatch::class, fn (ProcessImportBatch $job): bool => $job->batchId === $batch->id);
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

it('imports incomplete business rows and queues enrichment for missing contact data', function () {
    Queue::fake();
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $csv = <<<'CSV'
First Name,Company Name,City
Lina,Atlas Dental,Oran
CSV;

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);

    $batch = ImportBatch::query()->first();

    $this->actingAs($owner)
        ->get("/crm/contacts/import/{$batch->id}")
        ->assertInertia(fn ($page) => $page
            ->where('batch.preview.created', 1)
            ->where('batch.preview.errors', 0));

    app(ContactCsvImporter::class)->process($batch);

    $contact = Contact::query()
        ->where('workspace_id', $owner->workspace_id)
        ->where('first_name', 'Lina')
        ->first();

    expect($contact)->not->toBeNull()
        ->and($contact->company?->name)->toBe('Atlas Dental')
        ->and($contact->email)->toBeNull();

    Queue::assertPushed(EnrichRecordJob::class, fn (EnrichRecordJob $job): bool => $job->workspaceId === $owner->workspace_id
        && $job->targetType === EnrichmentRun::TARGET_CONTACT
        && $job->targetId === $contact->id);
});

it('reimports the same incomplete business row without creating a duplicate', function () {
    Queue::fake();
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $csv = "First Name,Company Name,City\nLina,Atlas Dental,Oran\n";

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);
    $first = ImportBatch::query()->latest('id')->first();
    app(ContactCsvImporter::class)->process($first);

    $this->actingAs($owner)->post('/crm/contacts/import', [
        'file' => contactImportCsv($csv),
    ]);
    $second = ImportBatch::query()->latest('id')->first();

    expect($second->rows()->first()->preview_action)->toBe('skip');

    app(ContactCsvImporter::class)->process($second);

    expect(Contact::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(1)
        ->and($second->fresh()->created_count)->toBe(0)
        ->and($second->fresh()->skipped_count)->toBe(1);
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
