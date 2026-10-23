<?php

use App\Jobs\EnrichRecordJob;
use App\Models\AiInsight;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\User;
use App\Services\Enrichment\EmailVerificationProvider;
use App\Services\Enrichment\EnrichmentPersister;
use App\Services\Enrichment\EnrichmentService;
use App\Services\Enrichment\TransientEnrichmentException;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

function atlasHtml(bool $withEmail = true): string
{
    $email = $withEmail
        ? 'Ecrivez <a href="mailto:hello@clinique-atlas.dz">hello@clinique-atlas.dz</a>'
        : 'Aucun email publié.';

    return <<<HTML
        <html>
            <head>
                <title>Clinique Atlas</title>
                <meta name="description" content="Clinique à Alger">
            </head>
            <body>{$email} Tel +213 21 00 00 00</body>
        </html>
    HTML;
}

function fakeEnrichmentHttp(bool $withEmail = true): void
{
    Http::preventStrayRequests();
    Http::fake([
        'https://clinique-atlas.dz' => Http::response(atlasHtml($withEmail), 200),
        'https://clinique-atlas.dz/*' => Http::response(atlasHtml($withEmail), 200),
        'https://places.googleapis.com/v1/places:searchText' => Http::response([
            'places' => [[
                'id' => 'ChIJ-atlas',
                'displayName' => ['text' => 'Clinique Atlas'],
                'formattedAddress' => 'Hydra, Alger, Algeria',
                'location' => ['latitude' => 36.75, 'longitude' => 3.06],
                'internationalPhoneNumber' => '+213 21 00 00 00',
                'websiteUri' => 'https://clinique-atlas.dz',
                'googleMapsUri' => 'https://maps.google.com/?cid=123',
            ]],
        ], 200),
    ]);
}

it('persists website and places runs with confidence and auto-applies empty high-confidence fields', function () {
    config(['services.google.places_key' => 'test-places-key']);
    fakeEnrichmentHttp();

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'domain' => 'clinique-atlas.dz',
        'city' => 'Alger',
        'wilaya' => 'Alger',
        'phone' => null,
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id);

    $runs = EnrichmentRun::query()
        ->where('target_type', EnrichmentRun::TARGET_COMPANY)
        ->where('target_id', $company->id)
        ->get();

    expect($runs->isNotEmpty())->toBeTrue()
        ->and($runs->firstWhere('field', 'website_title')?->value)->toBe('Clinique Atlas')
        ->and($runs->firstWhere('field', 'website_title')?->confidence)->toBeGreaterThanOrEqual(0.85)
        ->and($runs->firstWhere('field', 'website_title')?->source)->toBe(EnrichmentRun::SOURCE_WEBSITE)
        ->and($runs->firstWhere('field', 'website_title')?->verification_status)->toBe(EnrichmentRun::VERIFICATION_EVIDENCE_SUPPORTED)
        ->and($runs->firstWhere('field', 'website_title')?->evidence_url)->toBe('https://clinique-atlas.dz')
        ->and($runs->firstWhere('field', 'website_title')?->retrieved_at)->not->toBeNull()
        ->and($runs->firstWhere('field', 'email')?->value)->toBe('hello@clinique-atlas.dz')
        ->and($runs->firstWhere('field', 'place_id')?->value)->toBe('ChIJ-atlas')
        ->and($runs->firstWhere('field', 'place_id')?->source)->toBe(EnrichmentRun::SOURCE_GOOGLE_PLACES)
        ->and($runs->firstWhere('field', 'place_id')?->evidence_url)->toBe('https://maps.google.com/?cid=123')
        ->and($runs->firstWhere('field', 'address')?->value)->toContain('Alger')
        ->and($runs->firstWhere('field', 'currency_hint')?->value)->toBe('DZD')
        ->and(json_decode((string) $runs->firstWhere('field', 'crm_detection')?->value, true)['status'] ?? null)->toBe('not_detected')
        ->and($company->fresh()->phone)->toBe('+21321000000');

    $brief = AiInsight::query()
        ->where('subject_type', 'company')
        ->where('subject_id', $company->id)
        ->where('question', 'Research brief')
        ->first();

    expect($brief)->not->toBeNull()
        ->and($brief->source)->toBe('fields')
        ->and($brief->answer)->toContain('Clinique Atlas')
        ->and($brief->answer)->not->toContain('@invented');

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id);

    expect(AiInsight::query()
        ->where('subject_type', 'company')
        ->where('subject_id', $company->id)
        ->where('question', 'Research brief')
        ->count())->toBe(1);

    Http::assertSent(fn ($request) => $request->url() === 'https://places.googleapis.com/v1/places:searchText'
        && $request->hasHeader('X-Goog-Api-Key', 'test-places-key')
        && str_contains((string) $request->header('X-Goog-FieldMask')[0], 'places.googleMapsUri')
        && str_contains((string) $request->body(), 'Clinique Atlas'));
});

it('bounds queued enrichment and prevents duplicate record overlap', function () {
    $job = new EnrichRecordJob(17, EnrichmentRun::TARGET_COMPANY, 42);
    $middleware = $job->middleware();

    expect($job->uniqueId())->toBe('17:company:42')
        ->and($middleware[0])->toBeInstanceOf(RateLimited::class)
        ->and($middleware[0]->releaseAfter)->toBe(60)
        ->and($middleware[1])->toBeInstanceOf(WithoutOverlapping::class)
        ->and($middleware[1]->key)->toBe('17:company:42')
        ->and($middleware[1]->releaseAfter)->toBe(30)
        ->and($middleware[1]->expiresAfter)->toBe(90);
});

it('does not invent an email when the public page has none', function () {
    config(['services.google.places_key' => null]);
    fakeEnrichmentHttp(withEmail: false);

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'domain' => 'clinique-atlas.dz',
        'phone' => null,
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id);

    expect(EnrichmentRun::query()->where('field', 'email')->count())->toBe(0)
        ->and($company->fresh()->email ?? null)->toBeNull();
});

it('records transient provider failures and rethrows them for queue backoff', function () {
    Http::preventStrayRequests();
    Http::fake([
        'https://clinic-atlas.dz' => Http::response('temporary outage', 503),
        'https://clinic-atlas.dz/*' => Http::response('temporary outage', 503),
    ]);

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'domain' => 'clinic-atlas.dz',
    ]);

    expect(fn () => app(EnrichmentService::class)->enrich(
        $user->workspace,
        EnrichmentRun::TARGET_COMPANY,
        (int) $company->id,
    ))->toThrow(TransientEnrichmentException::class);

    expect(EnrichmentRun::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('source', EnrichmentRun::SOURCE_WEBSITE)
        ->where('status', EnrichmentRun::STATUS_FAILED)
        ->value('error'))->toContain('HTTP 503');
});

it('keeps partial provider results when one enrichment provider is transiently unavailable', function () {
    config(['services.google.places_key' => 'test-places-key']);
    Http::preventStrayRequests();
    Http::fake([
        'https://clinic-atlas.dz' => Http::response('temporary outage', 503),
        'https://clinic-atlas.dz/*' => Http::response('temporary outage', 503),
        'https://places.googleapis.com/v1/places:searchText' => Http::response([
            'places' => [[
                'id' => 'ChIJ-partial',
                'displayName' => ['text' => 'Clinique Atlas'],
                'formattedAddress' => 'Hydra, Alger, Algeria',
                'googleMapsUri' => 'https://maps.google.com/?cid=partial',
            ]],
        ], 200),
    ]);

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'domain' => 'clinic-atlas.dz',
        'wilaya' => 'Alger',
    ]);

    expect(fn () => app(EnrichmentService::class)->enrich(
        $user->workspace,
        EnrichmentRun::TARGET_COMPANY,
        (int) $company->id,
    ))->toThrow(TransientEnrichmentException::class);

    expect(EnrichmentRun::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('source', EnrichmentRun::SOURCE_WEBSITE)
        ->where('status', EnrichmentRun::STATUS_FAILED)
        ->exists())->toBeTrue()
        ->and(EnrichmentRun::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('source', EnrichmentRun::SOURCE_GOOGLE_PLACES)
            ->where('field', 'place_id')
            ->value('value'))->toBe('ChIJ-partial');

    Http::assertSent(fn ($request): bool => $request->url() === 'https://places.googleapis.com/v1/places:searchText');
});

it('does not overwrite a human-set field silently', function () {
    config(['services.google.places_key' => null]);
    fakeEnrichmentHttp();

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'owner@clinique-atlas.dz',
        'phone' => '0550123456',
        'meta' => ['website' => 'https://clinique-atlas.dz'],
        'wilaya' => 'Alger',
        'city' => 'Alger',
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);

    $emailRun = EnrichmentRun::query()
        ->where('target_type', EnrichmentRun::TARGET_CONTACT)
        ->where('target_id', $contact->id)
        ->where('field', 'email')
        ->first();

    expect($contact->fresh()->email)->toBe('owner@clinique-atlas.dz')
        ->and($emailRun)->not->toBeNull()
        ->and($emailRun->value)->toBe('hello@clinique-atlas.dz')
        ->and($emailRun->status)->toBe(EnrichmentRun::STATUS_PROPOSED);
});

it('records email verification provenance on the shared contact and avoids auto-applying unsafe states', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => null,
    ]);

    $run = app(EnrichmentPersister::class)->persistProposal(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        $contact,
        EnrichmentRun::SOURCE_WEBSITE,
        'email',
        'invalid@clinic-atlas.dz',
        0.98,
        ['url' => 'https://clinic-atlas.dz/contact'],
        EnrichmentRun::VERIFICATION_INVALID,
    );

    expect($run->status)->toBe(EnrichmentRun::STATUS_PROPOSED)
        ->and($contact->fresh()->email)->toBeNull()
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))
        ->toBe(EnrichmentRun::VERIFICATION_INVALID)
        ->and(data_get($contact->fresh()->meta, 'email_verification.run_id'))
        ->toBe($run->id);
});

it('runs the configured email verifier and caches the current-address result', function () {
    $provider = new class implements EmailVerificationProvider
    {
        public int $calls = 0;

        public function name(): string
        {
            return 'fake-verifier';
        }

        public function verify(string $email): array
        {
            $this->calls++;

            return [
                'status' => EnrichmentRun::VERIFICATION_VERIFIED,
                'confidence' => 0.99,
                'raw' => ['provider_id' => 'fake-1'],
            ];
        }
    };
    app()->instance(EmailVerificationProvider::class, $provider);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'owner@clinic-atlas.dz',
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);
    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);

    $run = EnrichmentRun::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('source', EnrichmentRun::SOURCE_EMAIL_VERIFICATION)
        ->where('target_id', $contact->id)
        ->sole();

    expect($provider->calls)->toBe(1)
        ->and($run->verification_status)->toBe(EnrichmentRun::VERIFICATION_VERIFIED)
        ->and(data_get($run->raw, 'provider_id'))->toBe('fake-1')
        ->and(data_get($contact->fresh()->meta, 'email_verification.email'))->toBe('owner@clinic-atlas.dz')
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))->toBe(EnrichmentRun::VERIFICATION_VERIFIED);
});

it('records disabled email verification as unsupported and keeps outbound eligibility fail-closed', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'owner@clinic-atlas.dz',
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);

    $run = EnrichmentRun::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('source', EnrichmentRun::SOURCE_EMAIL_VERIFICATION)
        ->where('target_id', $contact->id)
        ->sole();

    expect($run->verification_status)->toBe(EnrichmentRun::VERIFICATION_UNSUPPORTED)
        ->and($run->error)->toContain('No email verification provider')
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))->toBe(EnrichmentRun::VERIFICATION_UNSUPPORTED);
});

it('does not cache temporary verifier failures over the retry window', function () {
    $provider = new class implements EmailVerificationProvider
    {
        public int $calls = 0;

        public function name(): string
        {
            return 'flaky-verifier';
        }

        public function verify(string $email): array
        {
            $this->calls++;

            if ($this->calls === 1) {
                throw new TransientEnrichmentException('Provider timeout.');
            }

            return [
                'status' => EnrichmentRun::VERIFICATION_VERIFIED,
                'confidence' => 0.99,
                'raw' => [],
            ];
        }
    };
    app()->instance(EmailVerificationProvider::class, $provider);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'owner@clinic-atlas.dz',
    ]);

    expect(fn () => app(EnrichmentService::class)->enrich(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        (int) $contact->id,
    ))->toThrow(TransientEnrichmentException::class);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);

    expect($provider->calls)->toBe(2)
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))->toBe(EnrichmentRun::VERIFICATION_VERIFIED);
});

it('keeps email verification tied to the current address and preserves stronger evidence', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'verified@clinic-atlas.dz',
        'meta' => [
            'email_verification' => [
                'email' => 'verified@clinic-atlas.dz',
                'status' => EnrichmentRun::VERIFICATION_VERIFIED,
                'source' => 'email_provider',
                'confidence' => 0.99,
            ],
        ],
    ]);

    app(EnrichmentPersister::class)->persistProposal(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        $contact,
        EnrichmentRun::SOURCE_WEBSITE,
        'email',
        'stale@clinic-atlas.dz',
        0.95,
        ['url' => 'https://clinic-atlas.dz/contact'],
        EnrichmentRun::VERIFICATION_INVALID,
    );

    app(EnrichmentPersister::class)->persistProposal(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        $contact,
        EnrichmentRun::SOURCE_GOOGLE_PLACES,
        'email',
        'verified@clinic-atlas.dz',
        0.4,
        [],
        EnrichmentRun::VERIFICATION_UNKNOWN,
    );

    app(EnrichmentPersister::class)->persistProposal(
        $user->workspace,
        EnrichmentRun::TARGET_CONTACT,
        $contact,
        'email_provider',
        'email',
        'verified@clinic-atlas.dz',
        0.99,
        [],
        EnrichmentRun::VERIFICATION_INVALID,
    );

    expect(data_get($contact->fresh()->meta, 'email_verification.email'))
        ->toBe('verified@clinic-atlas.dz')
        ->and(data_get($contact->fresh()->meta, 'email_verification.status'))
        ->toBe(EnrichmentRun::VERIFICATION_INVALID);
});

it('applies and dismisses proposed enrichment runs', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'owner@clinique-atlas.dz',
    ]);

    $apply = EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_CONTACT,
        'target_id' => $contact->id,
        'source' => EnrichmentRun::SOURCE_WEBSITE,
        'field' => 'email',
        'value' => 'hello@clinique-atlas.dz',
        'confidence' => 0.9,
        'status' => EnrichmentRun::STATUS_PROPOSED,
    ]);

    $dismiss = EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_CONTACT,
        'target_id' => $contact->id,
        'source' => EnrichmentRun::SOURCE_WEBSITE,
        'field' => 'phone',
        'value' => '+21321000000',
        'confidence' => 0.9,
        'status' => EnrichmentRun::STATUS_PROPOSED,
    ]);

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/enrichment-runs/{$apply->id}/apply")
        ->assertRedirect("/crm/contacts/{$contact->id}");

    $this->actingAs($user)
        ->from("/crm/contacts/{$contact->id}")
        ->post("/crm/enrichment-runs/{$dismiss->id}/dismiss")
        ->assertRedirect("/crm/contacts/{$contact->id}");

    expect($apply->fresh()->status)->toBe(EnrichmentRun::STATUS_APPLIED)
        ->and($apply->fresh()->decided_by)->toBe($user->id)
        ->and($contact->fresh()->email)->toBe('hello@clinique-atlas.dz')
        ->and($dismiss->fresh()->status)->toBe(EnrichmentRun::STATUS_DISMISSED)
        ->and($contact->fresh()->phone_e164)->not->toBe('+21321000000');
});

it('no-ops Google Places when the API key is missing and records the skip', function () {
    config(['services.google.places_key' => null]);
    fakeEnrichmentHttp();

    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'domain' => 'clinique-atlas.dz',
        'wilaya' => 'Alger',
    ]);

    app(EnrichmentService::class)->enrich($user->workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id);

    $skip = EnrichmentRun::query()
        ->where('source', EnrichmentRun::SOURCE_GOOGLE_PLACES)
        ->where('status', EnrichmentRun::STATUS_SKIPPED)
        ->first();

    expect($skip)->not->toBeNull()
        ->and($skip->error)->toBe('GOOGLE_PLACES_API_KEY missing')
        ->and($skip->verification_status)->toBe(EnrichmentRun::VERIFICATION_UNKNOWN)
        ->and(EnrichmentRun::query()->where('source', EnrichmentRun::SOURCE_GOOGLE_PLACES)->where('field', 'place_id')->whereNotNull('value')->count())->toBe(0)
        ->and(AiInsight::query()->where('question', 'Research brief')->count())->toBe(0);

    Http::assertNotSent(fn ($request) => str_contains($request->url(), 'places.googleapis.com'));
});

it('queues EnrichRecordJob from the record Enrich action and from leads:enrich', function () {
    Queue::fake();

    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
    ]);

    $this->actingAs($user)->post("/crm/leads/{$lead->id}/enrich")->assertRedirect();
    $this->actingAs($user)->post("/crm/contacts/{$contact->id}/enrich")->assertRedirect();
    $this->actingAs($user)->post("/crm/companies/{$company->id}/enrich")->assertRedirect();

    $this->artisan('leads:enrich', [
        '--type' => 'all',
        '--workspace' => $user->workspace_id,
        '--limit' => 10,
    ])->assertSuccessful();

    // The unique job contract collapses duplicate requests for the same record.
    Queue::assertPushed(EnrichRecordJob::class, 3);
});

it('queues only stale records during scheduled enrichment maintenance', function () {
    Queue::fake();
    $user = User::factory()->create();
    $fresh = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $stale = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_COMPANY,
        'target_id' => $fresh->id,
        'status' => EnrichmentRun::STATUS_APPLIED,
        'created_at' => now()->subHours(2),
    ]);

    $this->artisan('leads:enrich', [
        '--type' => 'company',
        '--workspace' => $user->workspace_id,
        '--stale-hours' => 24,
        '--limit' => 10,
    ])->assertSuccessful();

    Queue::assertPushed(EnrichRecordJob::class, 1);
    Queue::assertPushed(EnrichRecordJob::class, fn (EnrichRecordJob $job): bool => $job->targetType === EnrichmentRun::TARGET_COMPANY && $job->targetId === $stale->id
    );
});

it('lets an operator retry a failed enrichment run in the same workspace', function () {
    Queue::fake();

    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $run = EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_COMPANY,
        'target_id' => $company->id,
        'source' => EnrichmentRun::SOURCE_WEBSITE,
        'field' => 'url',
        'status' => EnrichmentRun::STATUS_FAILED,
        'error' => 'Website returned HTTP 503.',
    ]);

    $this->actingAs($user)
        ->from("/crm/companies/{$company->id}")
        ->post("/crm/enrichment-runs/{$run->id}/retry")
        ->assertRedirect("/crm/companies/{$company->id}")
        ->assertSessionHas('status', 'Queued enrichment retry.');

    Queue::assertPushed(EnrichRecordJob::class, function (EnrichRecordJob $job) use ($user, $company): bool {
        return $job->workspaceId === $user->workspace_id
            && $job->targetType === EnrichmentRun::TARGET_COMPANY
            && $job->targetId === $company->id;
    });
});

it('exposes enrichment history on lead, contact, and company show pages', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Clinique Atlas']);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'first_name' => 'Karim',
        'last_name' => 'Benali',
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'title' => 'Clinic intake',
    ]);

    EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_LEAD,
        'target_id' => $lead->id,
        'source' => EnrichmentRun::SOURCE_WEBSITE,
        'field' => 'website_title',
        'value' => 'Clinique Atlas',
        'confidence' => 0.9,
        'status' => EnrichmentRun::STATUS_PROPOSED,
    ]);

    $this->actingAs($user)
        ->get("/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/show')
            ->has('enrichmentRuns', 1)
            ->where('enrichmentRuns.0.field', 'website_title')
            ->where('enrichmentRuns.0.source', 'website')
            ->where('enrichAction', "/crm/leads/{$lead->id}/enrich"));

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->has('enrichmentRuns')
            ->where('enrichAction', "/crm/contacts/{$contact->id}/enrich"));

    $this->actingAs($user)
        ->get("/crm/companies/{$company->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/show')
            ->has('enrichmentRuns')
            ->where('enrichAction', "/crm/companies/{$company->id}/enrich"));
});

it('keeps paid connector sources as unused enum slots', function () {
    expect(EnrichmentRun::RESERVED_SOURCES)->toContain(EnrichmentRun::SOURCE_APOLLO)
        ->and(EnrichmentRun::RESERVED_SOURCES)->toContain(EnrichmentRun::SOURCE_CLAY)
        ->and(EnrichmentRun::IMPLEMENTED_SOURCES)->not->toContain(EnrichmentRun::SOURCE_APOLLO);
});
