<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\CommandSearch;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

function p16Workspace(): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Acme',
        'owner_id' => $user->id,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amine',
        'last_name' => 'Benali',
        'email' => 'amine@acme.test',
        'phone' => '0550123456',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Enterprise Upgrade',
        'amount_cents' => 99_000_000,
        'currency' => 'DZD',
    ]);
    $quote = Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 99_000_000,
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'title' => 'Acme inbound lead',
        'status' => 'new',
    ]);
    $activity = Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Call Amine about Acme',
        'body' => 'SECRET-ACTIVITY-BODY',
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'due_at' => now()->subDay(),
        'done' => false,
    ]);

    return compact('user', 'company', 'contact', 'deal', 'quote', 'lead', 'activity');
}

it('extends the one existing command surface without a second palette', function () {
    $palette = File::get(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $compat = File::get(resource_path('js/components/crm/command-palette.tsx'));
    $aurora = File::get(resource_path('js/components/aurora/command-palette.tsx'));
    $header = File::get(resource_path('js/components/app-sidebar-header.tsx'));
    $lib = File::get(resource_path('js/lib/command-os.ts'));
    $search = File::get(app_path('Services/Crm/CommandSearch.php'));
    $share = File::get(app_path('Http/Middleware/HandleInertiaRequests.php'));
    $js = File::get(base_path('tests/js/p16-command-os.ts'));
    $drawer = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $shell = File::get(resource_path('js/components/shell/evo-shell.tsx'));
    $rail = File::get(resource_path('js/components/shell/evo-rail.tsx'));

    expect(class_exists('App\\Http\\Controllers\\Crm\\CommandPaletteV2Controller'))->toBeFalse()
        ->and($compat)->toContain("from '@/evo/patterns/command-palette'")
        ->and($compat)->not->toContain("from '@/components/aurora/command-palette'")
        ->and($palette)->toContain("from 'cmdk'")
        ->and($palette)->toContain('useQuickRecord')
        ->and($palette)->toContain('openRecord')
        ->and($palette)->toContain('kind !== \'search\'')
        ->and($palette)->not->toContain('CommandPaletteV2')
        ->and($palette)->not->toContain('GlobalCommandPalette')
        ->and($palette)->not->toContain('UniversalSearch')
        ->and($palette)->not->toContain('EvoCommandNew')
        ->and($palette)->not->toContain('CommandRecordDrawer')
        ->and($palette)->not->toContain('label.startsWith')
        ->and($palette)->not->toContain('Date.now')
        ->and($palette)->not->toContain('evoSearchIndex')
        ->and($palette)->not->toContain('from \'lucide-react\'')
        ->and($aurora)->toContain('isComposing')
        ->and($palette)->toContain('isComposing')
        ->and($palette)->toContain('data-command="os"')
        ->and($palette)->toContain('560px')
        ->and($palette)->toContain('overflow-x-hidden')
        ->and($header)->toContain("t('Ask Evo')")
        ->and($header)->toContain('openAskEvo()')
        ->and($header)->not->toContain('from \'@/components/crm/command-palette\'')
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($rail)->not->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain('/crm/command/search')
        ->and($rail)->toContain('buildCommandCatalog')
        ->and($lib)->toContain('kind:')
        ->and($lib)->toContain("href: '/dashboard'")
        ->and($lib)->not->toContain("href: '/home'")
        ->and($lib)->toContain('commandActivityQueueHref')
        ->and($lib)->toContain('parseActivityQueueSearch')
        ->and($lib)->not->toContain('Date.now')
        ->and($search)->toContain('Gate::forUser')
        ->and($search)->not->toContain('amount_cents')
        ->and($search)->not->toContain("'body'")
        ->and($search)->not->toContain("'phone'")
        ->and($search)->not->toContain('phone_e164')
        ->and($share)->toContain("'evoSearchIndex' => []")
        ->and($js)->toContain('a→am→ami is stale once acme is current')
        ->and($js)->toContain('after needle changes, visible hits are empty until hitsForQuery matches')
        ->and($palette)->toContain('setRemoteHits([])')
        ->and($palette)->toContain("setHitsForQuery('')")
        ->and($drawer)->toContain('onEscapeKeyDown')
        ->and($drawer)->toContain('handleQuickRecordEscapeKeyDown')
        ->and($drawer)->not->toContain('CommandPaletteV2');

    expect(Route::getRoutes()->getByName('crm.command.search')?->uri())->toBe('crm/command/search');
});

it('searches Amine Acme Enterprise Upgrade lead quote and activity without leaking secrets', function () {
    ['user' => $user, 'contact' => $contact, 'company' => $company, 'deal' => $deal, 'quote' => $quote, 'lead' => $lead, 'activity' => $activity] = p16Workspace();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evoSearchIndex', [])
            ->missing('evoSearchIndex.0.hint'));

    $amine = $this->actingAs($user)
        ->getJson('/crm/command/search?q=Amine')
        ->assertOk()
        ->json('hits');

    expect(collect($amine)->pluck('label'))->toContain('Amine Benali')
        ->and(json_encode($amine))->not->toContain('amine@acme.test')
        ->and(json_encode($amine))->not->toContain('0550123456')
        ->and(json_encode($amine))->not->toContain('99000000')
        ->and(json_encode($amine))->not->toContain('SECRET-ACTIVITY-BODY')
        ->and(collect($amine)->firstWhere('id', $contact->id)['recordRef'])->toMatchArray([
            'type' => 'contact',
            'id' => $contact->id,
        ]);

    $emailMatch = $this->actingAs($user)
        ->getJson('/crm/command/search?q=amine@acme.test')
        ->assertOk()
        ->json('hits');

    expect(collect($emailMatch)->pluck('id'))->toContain($contact->id)
        ->and(json_encode($emailMatch))->not->toContain('amine@acme.test');

    $acme = $this->actingAs($user)->getJson('/crm/command/search?q=Acme')->assertOk()->json('hits');
    expect(collect($acme)->pluck('id'))->toContain($company->id)
        ->and(collect($acme)->pluck('label'))->toContain('Acme inbound lead');

    $dealHits = $this->actingAs($user)->getJson('/crm/command/search?q=Enterprise%20Upgrade')->assertOk()->json('hits');
    expect(collect($dealHits)->firstWhere('id', $deal->id))->toMatchArray([
        'type' => 'deal',
        'id' => $deal->id,
        'label' => 'Enterprise Upgrade',
        'href' => '/crm/deals/'.$deal->id,
    ])
        ->and(json_encode($dealHits))->not->toContain('99000000')
        ->and(collect($dealHits)->pluck('id'))->toContain($quote->id);

    $leadHits = $this->actingAs($user)->getJson('/crm/command/search?q=inbound%20lead')->assertOk()->json('hits');
    expect(collect($leadHits)->pluck('id'))->toContain($lead->id);

    $activityHits = $this->actingAs($user)->getJson('/crm/command/search?q=Call%20Amine')->assertOk()->json('hits');
    $activityHit = collect($activityHits)->first(
        fn (array $hit): bool => ($hit['type'] ?? null) === 'activity' && (int) $hit['id'] === (int) $activity->id,
    );
    expect($activityHit['href'])->toBe('/crm/deals/'.$deal->id)
        ->and(json_encode($activityHits))->not->toContain('SECRET-ACTIVITY-BODY');

    expect($this->actingAs($user)->getJson('/crm/command/search?q=')->json('hits'))->toBe([]);
});

it('keeps search permission-safe across workspaces and view-only members', function () {
    ['user' => $user, 'contact' => $contact] = p16Workspace();
    $stranger = User::factory()->create();
    Contact::factory()->create([
        'workspace_id' => $stranger->workspace_id,
        'first_name' => 'Restricted',
        'last_name' => 'Guest',
        'email' => 'restricted@other.test',
    ]);
    $member = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($user)
        ->getJson('/crm/command/search?q=Restricted')
        ->assertOk()
        ->assertJsonMissing(['label' => 'Restricted Guest'])
        ->assertJsonMissing(['restricted@other.test']);

    $this->actingAs($stranger)
        ->getJson('/crm/command/search?q=Amine')
        ->assertOk()
        ->assertJsonMissing(['id' => $contact->id])
        ->assertJsonMissing(['amine@acme.test']);

    $this->actingAs($member)
        ->getJson('/crm/command/search?q=Amine')
        ->assertOk()
        ->assertJsonFragment(['label' => 'Amine Benali'])
        ->assertJsonMissing(['amine@acme.test']);

    $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page
        ->where('auth.capabilities', fn ($caps) => ! collect($caps)->contains('crm.edit')));

    auth()->logout();
    $guest = $this->getJson('/crm/command/search?q=Amine');
    expect(in_array($guest->status(), [401, 403, 302], true))->toBeTrue();
});

it('does not rank or return deals by amount and bounds the payload', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $cheap = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Alpha retain',
        'amount_cents' => 50_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Alpha enterprise',
        'amount_cents' => 88_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $hits = $this->actingAs($user)->getJson('/crm/command/search?q=88000000')->assertOk()->json('hits');
    expect(collect($hits)->pluck('type'))->not->toContain('deal');

    foreach (range(1, 12) as $index) {
        Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'first_name' => 'Bound',
            'last_name' => 'Person '.$index,
        ]);
    }

    $bounded = $this->actingAs($user)->getJson('/crm/command/search?q=Bound')->assertOk()->json('hits');
    expect(collect($bounded)->where('type', 'contact')->count())->toBeLessThanOrEqual(CommandSearch::PER_TYPE)
        ->and(count($bounded))->toBeLessThanOrEqual(CommandSearch::MAX_TOTAL)
        ->and(collect($bounded)->pluck('id'))->not->toContain($cheap->id);
});

it('locks P15 act URLs and existing create entry points in the command catalog', function () {
    $lib = File::get(resource_path('js/lib/command-os.ts'));

    expect($lib)->toContain("href: '/crm/contacts?create=1'")
        ->and($lib)->toContain("href: '/crm/companies?create=1'")
        ->and($lib)->toContain("href: '/crm/deals?create=1'")
        ->and($lib)->toContain("href: '/crm/quotes?create=1'")
        ->and($lib)->toContain("action: 'create-activity'")
        ->and($lib)->toContain('`p15-${group}`')
        ->and($lib)->toContain('id: `act-${group}`')
        ->and($lib)->toContain("action: 'ask-evo-seam'")
        ->and($lib)->not->toContain('/crm/activities/{')
        ->and($lib)->not->toContain('/complete');
});
