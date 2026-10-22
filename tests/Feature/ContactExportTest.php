<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;

it('exports contacts as csv on GET and honors the My view', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Export Co']);

    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'ExportMine',
        'last_name' => 'Row',
        'email' => 'export.mine@evotechly.dz',
    ]);
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $other->id,
        'first_name' => 'ExportTheirs',
        'email' => 'export.theirs@evotechly.dz',
    ]);

    $response = $this->actingAs($user)->get('/crm/contacts/export?view=my');

    $response
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $csv = $response->streamedContent();

    expect($csv)
        ->toContain('first_name')
        ->toContain('ExportMine')
        ->toContain('Export Co')
        ->not->toContain('ExportTheirs');
});

it('neutralizes spreadsheet formulas in exported contact values', function () {
    $user = User::factory()->create();

    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => '=HYPERLINK("https://example.test","open")',
        'phone' => '+213550000000',
    ]);

    $csv = $this->actingAs($user)
        ->get('/crm/contacts/export')
        ->assertOk()
        ->streamedContent();

    expect($csv)
        ->toContain("\"'=HYPERLINK(\"\"https://example.test\"\",\"\"open\"\")\"")
        ->toContain("'+213550000000");
});
