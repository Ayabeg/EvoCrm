<?php

use App\Enums\WorkspaceRole;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\ImportBatch;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Http\UploadedFile;

function dealImportCsv(string $contents): UploadedFile
{
    return UploadedFile::fake()->createWithContent('deals.csv', $contents);
}

function seedDealImportWorkspace(User $user): void
{
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);
}

function hubspotDealsCsv(): string
{
    return <<<'CSV'
Record ID,Deal Name,Amount,Deal Stage,Close Date,Associated Contact Email,Company Name
501,Website rebuild,1500.00,Proposal,2026-09-01,amine@example.test,Evotechly
CSV;
}

it('blocks members without import permission from deal import', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($member)->get('/crm/deals/import')->assertForbidden();
    $this->actingAs($member)
        ->post('/crm/deals/import', ['file' => dealImportCsv(hubspotDealsCsv())])
        ->assertForbidden();
});

it('imports deals with contact, company, stage, amount, and close date', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedDealImportWorkspace($owner);
    $company = Company::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'name' => 'Evotechly',
    ]);
    Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'company_id' => $company->id,
        'first_name' => 'Amine',
        'email' => 'amine@example.test',
    ]);

    $this->actingAs($owner)
        ->post('/crm/deals/import', ['file' => dealImportCsv(hubspotDealsCsv())])
        ->assertRedirect();

    $batch = ImportBatch::query()->first();

    $this->actingAs($owner)
        ->get("/crm/deals/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/import')
            ->where('batch.preview.created', 1)
            ->where('batch.preview.errors', 0)
            ->where('batch.mapping.Deal Name', 'title'));

    $this->actingAs($owner)->post("/crm/deals/import/{$batch->id}/commit")->assertRedirect();

    $deal = Deal::query()->where('workspace_id', $owner->workspace_id)->first();

    expect($deal)->not->toBeNull()
        ->and($deal->title)->toBe('Website rebuild')
        ->and($deal->external_id)->toBe('501')
        ->and($deal->amount_cents)->toBe(150000)
        ->and($deal->currency)->toBe('DZD')
        ->and($deal->close_date?->toDateString())->toBe('2026-09-01')
        ->and($deal->stage?->slug)->toBe('proposal')
        ->and($deal->contact?->email)->toBe('amine@example.test')
        ->and($deal->company?->name)->toBe('Evotechly')
        ->and($batch->fresh()->created_count)->toBe(1);
});

it('reimports the same deal source without creating duplicates', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedDealImportWorkspace($owner);
    $contact = Contact::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'email' => 'amine@example.test',
    ]);
    $pipeline = $owner->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Website rebuild',
        'amount_cents' => 10000,
        'currency' => 'DZD',
        'external_id' => '501',
    ]);

    $this->actingAs($owner)->post('/crm/deals/import', [
        'file' => dealImportCsv(hubspotDealsCsv()),
    ]);
    $batch = ImportBatch::query()->latest('id')->first();

    $this->actingAs($owner)
        ->get("/crm/deals/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('batch.preview.updated', 1));

    $this->actingAs($owner)->post("/crm/deals/import/{$batch->id}/commit");

    expect(Deal::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(1)
        ->and(Deal::query()->where('external_id', '501')->value('amount_cents'))->toBe(150000);
});

it('previews unresolved contact and stage associations as row errors', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedDealImportWorkspace($owner);

    $csv = <<<'CSV'
Deal Name,Amount,Deal Stage,Associated Contact Email
Orphan deal,500,Unknown Stage,missing@example.test
CSV;

    $this->actingAs($owner)->post('/crm/deals/import', [
        'file' => dealImportCsv($csv),
    ]);

    $batch = ImportBatch::query()->first();

    $this->actingAs($owner)
        ->get("/crm/deals/import/{$batch->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('batch.preview.errors', 1)
            ->where('batch.preview.created', 0));

    $this->actingAs($owner)->post("/crm/deals/import/{$batch->id}/commit");

    expect(Deal::query()->where('workspace_id', $owner->workspace_id)->count())->toBe(0)
        ->and($batch->fresh()->error_count)->toBe(1);
});

it('keeps deal import batches isolated to the owning workspace', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    seedDealImportWorkspace($owner);

    $this->actingAs($owner)->post('/crm/deals/import', [
        'file' => dealImportCsv(hubspotDealsCsv()),
    ]);

    $batch = ImportBatch::query()->first();

    $this->actingAs($other)->get("/crm/deals/import/{$batch->id}")->assertNotFound();
    $this->actingAs($other)->post("/crm/deals/import/{$batch->id}/commit")->assertNotFound();
});
