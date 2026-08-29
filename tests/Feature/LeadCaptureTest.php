<?php

use App\Models\AdLead;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\LeadCapture;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ads\LeadFormIngestor;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

function captureCsv(string $contents, string $name = 'leads.csv'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, $contents);
}

it('dedupes a capture onto an existing lead by phone', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
        'phone' => '0550123456',
        'email' => 'amine@clinic.dz',
    ]);
    $lead = Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Clinic intake',
        'source' => 'manual',
        'status' => 'working',
    ]);

    $this->actingAs($user)
        ->post('/crm/leads/captures/csv', [
            'file' => captureCsv("name,phone,email,company,wilaya\nAmine Benali,0550123456,other@clinic.dz,Atlas Clinic,Alger\n"),
        ])
        ->assertRedirect();

    $capture = LeadCapture::query()->first();
    expect($capture)->not->toBeNull()
        ->and($capture->source)->toBe(LeadCapture::SOURCE_CSV)
        ->and($capture->status)->toBe(LeadCapture::STATUS_NEW)
        ->and($capture->phone)->toBe('+213550123456')
        ->and($capture->email)->toBe('other@clinic.dz');

    $this->actingAs($user)
        ->post("/crm/leads/captures/{$capture->id}/accept")
        ->assertRedirect();

    $capture->refresh();
    $lead->refresh();
    $contact->refresh();

    expect($capture->status)->toBe(LeadCapture::STATUS_MERGED)
        ->and($capture->matched_lead_id)->toBe($lead->id)
        ->and(Lead::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1)
        ->and($lead->contact_id)->toBe($contact->id)
        ->and($contact->phone_e164)->toBe('+213550123456')
        ->and($contact->company?->name)->toBe('Atlas Clinic')
        ->and($contact->wilaya)->toBe('Alger');
});

it('dedupes a capture onto an existing lead by email', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Sara',
        'email' => 'sara@atlas.dz',
        'phone' => '0550987654',
    ]);
    $lead = Lead::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Sara inbound',
        'source' => 'manual',
        'status' => 'new',
    ]);

    $this->actingAs($user)
        ->post('/crm/leads/captures/csv', [
            'file' => captureCsv("Nom,E-mail,Telephone,Societe,Wilaya\nSara Mansouri,Sara@Atlas.dz,0660111222,Atlas Labs,Oran\n"),
        ])
        ->assertRedirect();

    $capture = LeadCapture::query()->first();
    expect($capture->email)->toBe('sara@atlas.dz')
        ->and($capture->phone)->toBe('+213660111222');

    $this->actingAs($user)
        ->from('/crm/leads/captures')
        ->post("/crm/leads/captures/{$capture->id}/accept")
        ->assertRedirect();

    expect(Lead::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1)
        ->and($capture->fresh()->matched_lead_id)->toBe($lead->id)
        ->and($contact->fresh()->phone_e164)->toBe('+213660111222');
});

it('creates one lead for a new identity and never a duplicate on the same phone', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/leads/captures/csv', [
            'file' => captureCsv("name,phone,email,company,wilaya\nKarim Hadji,0770123000,karim@hadji.dz,Hadji SARL,Constantine\n"),
        ])
        ->assertRedirect();

    $this->artisan('leads:capture-drain')->assertSuccessful();

    $first = LeadCapture::query()->first();
    $lead = Lead::query()->where('workspace_id', $user->workspace_id)->first();

    expect($first->status)->toBe(LeadCapture::STATUS_MERGED)
        ->and($lead)->not->toBeNull()
        ->and($lead->source)->toBe('csv')
        ->and($lead->contact->phone_e164)->toBe('+213770123000')
        ->and($lead->contact->email)->toBe('karim@hadji.dz');

    $this->actingAs($user)
        ->post('/crm/leads/captures/csv', [
            'file' => captureCsv("name,phone,email\nKarim Hadji,0770123000,karim@hadji.dz\n"),
        ])
        ->assertRedirect();

    $this->artisan('leads:capture-drain')->assertSuccessful();

    expect(Lead::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1)
        ->and(LeadCapture::query()->where('status', LeadCapture::STATUS_MERGED)->count())->toBe(2)
        ->and(LeadCapture::query()->pluck('matched_lead_id')->unique()->all())->toBe([$lead->id]);
});

it('writes a lead_capture from the existing Meta form ingest and then dedupes', function () {
    $workspace = Workspace::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'first_name' => 'Nour',
        'email' => 'nour@meta.dz',
        'phone' => '0550444333',
    ]);
    $existing = Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'title' => 'Existing Meta lead',
        'source' => 'manual',
        'status' => 'new',
    ]);

    $adLead = app(LeadFormIngestor::class)->ingest($workspace, [
        'leadgen_id' => 'lead-nour-1',
        'form_id' => 'form-9',
        'title' => 'Clinic form',
        'fields' => [
            ['name' => 'full_name', 'values' => ['Nour Bensaid']],
            ['name' => 'email', 'values' => ['nour@meta.dz']],
            ['name' => 'phone_number', 'values' => ['0550444333']],
            ['name' => 'company', 'values' => ['Nour Clinic']],
        ],
    ]);

    $capture = LeadCapture::query()->where('workspace_id', $workspace->id)->first();

    expect($adLead)->toBeInstanceOf(AdLead::class)
        ->and($adLead->lead_id)->toBe($existing->id)
        ->and($adLead->contact_id)->toBe($contact->id)
        ->and($capture)->not->toBeNull()
        ->and($capture->source)->toBe(LeadCapture::SOURCE_META_FORM)
        ->and($capture->status)->toBe(LeadCapture::STATUS_MERGED)
        ->and($capture->matched_lead_id)->toBe($existing->id)
        ->and($capture->email)->toBe('nour@meta.dz')
        ->and($capture->phone)->toBe('+213550444333')
        ->and(Lead::query()->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('writes a capture from the Meta webhook without forking a second AdLead path', function () {
    $workspace = Workspace::factory()->create();
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace($workspace, 'meta_leads');

    $this->postJson("/webhooks/meta/leads/{$endpoint->key}", [
        'leadgen_id' => 'lead-webhook-1',
        'fields' => [
            'full_name' => 'Yacine Meziane',
            'email' => 'yacine@example.test',
            'phone' => '0550111000',
        ],
    ])->assertOk();

    expect(AdLead::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(Lead::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(LeadCapture::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(LeadCapture::query()->first()->status)->toBe(LeadCapture::STATUS_MERGED)
        ->and(LeadCapture::query()->first()->matched_lead_id)->toBe(Lead::query()->first()->id);
});

it('rejects a pending capture without creating a lead', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/leads/captures/csv', [
            'file' => captureCsv("name,phone,email\nSpam Row,0550999000,spam@example.test\n"),
        ])
        ->assertRedirect();

    $capture = LeadCapture::query()->first();

    $this->actingAs($user)
        ->from('/crm/leads/captures')
        ->post("/crm/leads/captures/{$capture->id}/reject")
        ->assertRedirect();

    $capture->refresh();

    expect($capture->status)->toBe(LeadCapture::STATUS_REJECTED)
        ->and($capture->matched_lead_id)->toBeNull()
        ->and(Lead::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0)
        ->and(Contact::query()->where('email', 'spam@example.test')->count())->toBe(0);
});

it('ingests a public url without inventing an email', function () {
    Http::fake([
        'https://clinic.example.test/contact' => Http::response(
            '<html><head><title>Clinique El Aurassi</title><meta property="og:site_name" content="El Aurassi"></head><body><p>Call 0550 22 33 44</p></body></html>',
            200,
        ),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/leads/captures/url', [
            'url' => 'https://clinic.example.test/contact',
        ])
        ->assertRedirect();

    $capture = LeadCapture::query()->first();

    expect($capture)->not->toBeNull()
        ->and($capture->source)->toBe(LeadCapture::SOURCE_URL)
        ->and($capture->status)->toBe(LeadCapture::STATUS_NEW)
        ->and($capture->email)->toBeNull()
        ->and($capture->phone)->toBe('+213550223344')
        ->and($capture->name)->toBe('Clinique El Aurassi')
        ->and($capture->company)->toBe('El Aurassi');
});

it('stores an operator maps search and the results they chose', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/leads/captures/maps', [
            'query' => 'clinique dentaire',
            'wilaya' => 'Alger',
            'results' => [
                [
                    'name' => 'Clinique Souidani',
                    'phone' => '023456789',
                    'email' => 'contact@souidani.dz',
                    'company' => 'Clinique Souidani',
                ],
            ],
        ])
        ->assertRedirect();

    $capture = LeadCapture::query()->first();

    expect($capture)->not->toBeNull()
        ->and($capture->source)->toBe(LeadCapture::SOURCE_MAPS_SEARCH)
        ->and($capture->wilaya)->toBe('Alger')
        ->and($capture->name)->toBe('Clinique Souidani')
        ->and($capture->email)->toBe('contact@souidani.dz')
        ->and($capture->raw_payload['query'])->toBe('clinique dentaire')
        ->and($capture->raw_payload['wilaya'])->toBe('Alger');
});

it('renders the capture inbox under leads with source and status filters', function () {
    $user = User::factory()->create();
    LeadCapture::query()->create([
        'workspace_id' => $user->workspace_id,
        'source' => LeadCapture::SOURCE_CSV,
        'status' => LeadCapture::STATUS_NEW,
        'name' => 'Pending row',
        'phone' => '+213550000001',
        'email' => 'pending@example.test',
        'raw_payload' => ['row' => 1],
    ]);

    $this->actingAs($user)
        ->get('/crm/leads/captures?source=csv&status=new')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/captures')
            ->where('filters.source', 'csv')
            ->where('filters.status', 'new')
            ->has('captures', 1)
            ->where('captures.0.name', 'Pending row')
            ->where('captures.0.source', 'csv'));
});
