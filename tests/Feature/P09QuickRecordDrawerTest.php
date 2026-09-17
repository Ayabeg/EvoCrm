<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

/**
 * P09 — Quick Record Drawer foundation.
 * One shell, five adapters, one hydration path. Production rowHref stays full record.
 * Locks the P09 acceptance surface: architecture, refs, adapters, peek, history,
 * open/replace/close, capabilities, stale race, harness, and P04–P08 regression.
 */
function p09Workspace(): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
        'domain' => 'clinic.test',
        'owner_id' => $user->id,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'email' => 'amel@clinic.test',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic landing page',
        'amount_cents' => 500_000,
        'currency' => 'DZD',
    ]);
    $quote = Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 500_000,
        'expires_at' => now()->addDays(14),
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'title' => 'Clinic Atlas inbound',
        'status' => 'new',
    ]);
    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'note',
        'subject' => 'Called the clinic',
        'body' => 'Asked for a callback',
        'contact_id' => $contact->id,
        'owner_id' => $user->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Send proposal',
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'owner_id' => $user->id,
        'done' => false,
    ]);

    return compact('user', 'company', 'contact', 'deal', 'quote', 'lead');
}

it('builds one QuickRecordDrawer shell with typed adapters instead of five drawers', function () {
    $drawer = file_get_contents(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $context = file_get_contents(resource_path('js/ds/workspace/quick-record/context.tsx'));
    $adapters = file_get_contents(resource_path('js/ds/workspace/record-adapters/index.ts'));
    $layout = file_get_contents(resource_path('js/layouts/app-layout.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($drawer)->toContain('data-ds="quick-record-drawer"')
        ->and($drawer)->toContain('@/components/ui/drawer')
        ->and($drawer)->toContain('Open full')
        ->and($drawer)->toContain('lg:w-[480px]')
        ->and($drawer)->toContain('sm:w-[min(92vw,520px)]')
        ->and($drawer)->toContain('cubic-bezier(.2,.8,.2,1)')
        ->and($drawer)->toContain('motion-reduce:transition-none')
        ->and($drawer)->toContain('onCloseAutoFocus')
        ->and($drawer)->toContain('state.opener?.focus()')
        ->and($drawer)->toContain('overscroll-contain')
        ->and($drawer)->toContain('#FFFFFF')
        ->and($drawer)->toContain('#E3E3DF')
        ->and($drawer)->toContain('#161616')
        ->and($drawer)->not->toContain('ContactDrawer')
        ->and($drawer)->not->toContain('CompanyDrawer')
        ->and($drawer)->not->toContain('LeadDrawer')
        ->and($drawer)->not->toContain('DealDrawer')
        ->and($drawer)->not->toContain('QuoteDrawer')
        ->and($drawer)->not->toContain('bg-[#E8530E]');

    expect($context)->toContain('openRecord')
        ->and($context)->toContain('replace')
        ->and($context)->toContain('close')
        ->and($context)->toContain('openFull')
        ->and($context)->toContain('pin')
        ->and($context)->not->toContain('contactDrawerOpen')
        ->and($context)->not->toContain('companyDrawerOpen');

    expect($adapters)->toContain('adaptContact')
        ->and($adapters)->toContain('adaptCompany')
        ->and($adapters)->toContain('adaptLead')
        ->and($adapters)->toContain('adaptDeal')
        ->and($adapters)->toContain('adaptQuote');

    expect($layout)->toContain('QuickRecordProvider')
        ->and($layout)->toContain('QuickRecordDrawer');

    expect($workspace)->toContain('onRowPeek is reserved for P09');

    expect(file_exists(resource_path('js/components/crm/ContactDrawer.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/components/crm/CompanyDrawer.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/components/crm/LeadDrawer.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/components/crm/DealDrawer.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/components/crm/QuoteDrawer.tsx')))->toBeFalse();
});

it('locks RecordRef descriptors adapters history stale protection and the P10 invocation API', function () {
    $types = file_get_contents(resource_path('js/ds/workspace/quick-record/types.ts'));
    $ref = file_get_contents(resource_path('js/ds/workspace/quick-record/ref.ts'));
    $url = file_get_contents(resource_path('js/ds/workspace/quick-record/url.ts'));
    $keys = file_get_contents(resource_path('js/lib/list-query/keys.ts'));
    $stale = file_get_contents(resource_path('js/ds/workspace/quick-record/stale.ts'));
    $controller = file_get_contents(resource_path('js/ds/workspace/quick-record/controller.ts'));
    $link = file_get_contents(resource_path('js/ds/workspace/quick-record/RecordLink.tsx'));
    $contract = file_get_contents(resource_path('js/ds/workspace/quick-record-drawer-contract.ts'));
    $lead = file_get_contents(resource_path('js/ds/workspace/record-adapters/lead.ts'));
    $deal = file_get_contents(resource_path('js/ds/workspace/record-adapters/deal.ts'));
    $quote = file_get_contents(resource_path('js/ds/workspace/record-adapters/quote.ts'));
    $contact = file_get_contents(resource_path('js/ds/workspace/record-adapters/contact.ts'));
    $present = file_get_contents(resource_path('js/ds/workspace/record-adapters/present.ts'));

    expect($types)->toContain("'contact', 'company', 'lead', 'deal', 'quote'")
        ->and($types)->toContain('export type RecordRef')
        ->and($types)->toContain('export type RecordDescriptor')
        ->and($types)->toContain('fullRecordHref')
        ->and($types)->toContain('keyProperties')
        ->and($types)->toContain('capabilities');

    expect($ref)->toContain("company: '/crm/companies'")
        ->and($ref)->toContain("contact: '/crm/contacts'")
        ->and($ref)->toContain("lead: '/crm/leads'")
        ->and($ref)->toContain("deal: '/crm/deals'")
        ->and($ref)->toContain("quote: '/crm/quotes'");

    expect($url)->toContain("export const PEEK_QUERY_KEY = 'peek'")
        ->and($url)->toContain('P09 does not sync it on production lists')
        ->and($keys)->toContain("'peek'");

    expect($stale)->toContain('isStaleHydration')
        ->and($stale)->toContain('incomingRequestId !== activeRequestId');

    expect($controller)->toContain("type: 'open'")
        ->and($controller)->toContain("type: 'replace'")
        ->and($controller)->toContain("type: 'back'")
        ->and($controller)->toContain("type: 'close'")
        ->and($controller)->toContain('isStaleHydration');

    expect($link)->toContain("mode?: 'drawer' | 'full'")
        ->and($link)->toContain('openRecord(record')
        ->and($link)->toContain('They do not choose hydration');

    $runner = file_get_contents(base_path('tests/js/p09-quick-record-drawer-contract.ts'));

    expect($contract)->toContain('A then C cannot render A over C')
        ->and($contract)->toContain('open then replace then back is deterministic')
        ->and($contract)->toContain('lead adapter uses qualification not stage')
        ->and($contract)->toContain('quote adapter deal title + total + draft/sent/accepted + expires')
        ->and($contract)->toContain('quote total uses formatDzd DA display not literal DZD substring')
        ->and($contract)->toContain('formatDzd(500_000)')
        ->and($contract)->toContain('export function assertP09DrawerProofs')
        ->and($contract)->not->toContain("includes(\n            'DZD'")
        ->and($contract)->not->toContain('assertP09DrawerProofs();')
        ->and($contract)->not->toContain("for (const [label, ok] of Object.entries(P09_DRAWER_PROOFS)) {\n    assert(ok, label);");

    expect($runner)->toContain('assertP09DrawerProofs')
        ->and($runner)->toContain('Test-only P09 drawer proofs')
        ->and($runner)->not->toContain('pages/crm');

    expect($lead)->toContain('Qualification')
        ->and($lead)->not->toContain("id: 'stage'");
    expect($deal)->toContain("id: 'stage'")
        ->and($deal)->not->toContain('Qualification');
    expect($quote)->toContain('deal_title')
        ->and($quote)->toContain('total_cents')
        ->and($quote)->toContain('expires_at')
        ->and($quote)->not->toContain('expired');
    expect($contact)->toContain('fullRecordHref')
        ->and($present)->toContain("export const EMPTY_VALUE = '—'");
});

it('does not change production list rowHref board inbox or command surfaces', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $palette = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    foreach ([$contacts, $companies, $leads, $deals, $quotes] as $page) {
        expect($page)->not->toContain('QuickRecordDrawer')
            ->and($page)->not->toContain('onRowPeek')
            ->and($page)->not->toContain('openRecord(');
    }

    expect($contacts)->toContain('rowHref={contactRowHref}')
        ->and($companies)->toContain('rowHref={companyRowHref}')
        ->and($leads)->toContain('rowHref={leadRowHref}')
        ->and($deals)->toContain('rowHref={dealRowHref}')
        ->and($quotes)->toContain('rowHref={quoteRowHref}');

    expect($table)->toContain('router.visit(href)')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');

    expect($board)->not->toContain('QuickRecordDrawer')
        ->and($board)->toContain('DealPipelineBoard');
    expect($inbox)->not->toContain('QuickRecordDrawer');
    expect($palette)->not->toContain('QuickRecordDrawer')
        ->and($palette)->not->toContain('CommandRecordDrawer')
        ->and($palette)->toContain('openRecord');
});

it('registers one permission-aware peek endpoint and a local testing harness only', function () {
    $routes = file_get_contents(base_path('routes/web.php'));
    $peek = file_get_contents(app_path('Support/QuickRecordPeek.php'));
    $harnessPage = file_get_contents(resource_path('js/pages/crm/quick-record-drawer/harness.tsx'));
    $docs = file_get_contents(base_path('docs/implementation/p09-quick-record-drawer.md'));

    $pageSources = collect(File::allFiles(resource_path('js/pages')))
        ->filter(fn ($file): bool => $file->getExtension() === 'tsx')
        ->map(fn ($file): string => File::get($file->getPathname()))
        ->implode("\n");

    expect($routes)->toContain('/crm/records/{type}/{id}/peek')
        ->and($routes)->toContain("app()->environment(['local', 'testing'])")
        ->and($routes)->toContain('/crm/quick-record-drawer/harness')
        ->and($peek)->toContain('No parallel CRM API, no writes')
        ->and($peek)->toContain("Gate::forUser(\$user)->allows('view'")
        ->and($peek)->toContain('forWorkspace')
        ->and($harnessPage)->toContain('data-ds="quick-record-drawer-harness"')
        ->and($harnessPage)->toContain('openRecord({ type, id }')
        ->and($harnessPage)->not->toContain('quick-record-drawer-contract')
        ->and($pageSources)->not->toContain('quick-record-drawer-contract')
        ->and($docs)->toContain('P10 INTEGRATION CONTRACT');

    expect(Route::getRoutes()->getByName('crm.records.peek')?->uri())->toBe('crm/records/{type}/{id}/peek');
    expect(Route::getRoutes()->getByName('crm.quick-record-drawer.harness')?->uri())->toBe('crm/quick-record-drawer/harness');
});

it('hydrates five real record types with identity associations permissions and existing show hrefs', function () {
    ['user' => $user, 'company' => $company, 'contact' => $contact, 'deal' => $deal, 'quote' => $quote, 'lead' => $lead] = p09Workspace();

    $this->actingAs($user)
        ->getJson("/crm/records/contact/{$contact->id}/peek")
        ->assertOk()
        ->assertJsonPath('type', 'contact')
        ->assertJsonPath('id', $contact->id)
        ->assertJsonPath('record.display_name', 'Amel Hadj')
        ->assertJsonPath('record.company_name', 'Clinic Atlas')
        ->assertJsonPath('permissions.can_view', true)
        ->assertJsonPath('permissions.can_update', true)
        ->assertJsonPath('capabilities.activity', true)
        ->assertJsonPath('associations.0.type', 'company');

    $this->actingAs($user)
        ->getJson("/crm/records/company/{$company->id}/peek")
        ->assertOk()
        ->assertJsonPath('record.name', 'Clinic Atlas')
        ->assertJsonPath('capabilities.activity', true);

    $this->actingAs($user)
        ->getJson("/crm/records/lead/{$lead->id}/peek")
        ->assertOk()
        ->assertJsonPath('record.status', 'new')
        ->assertJsonPath('record.title', 'Clinic Atlas inbound')
        ->assertJsonPath('capabilities.activity', false)
        ->assertJsonMissingPath('record.stage');

    $this->actingAs($user)
        ->getJson("/crm/records/deal/{$deal->id}/peek")
        ->assertOk()
        ->assertJsonPath('record.title', 'Clinic landing page')
        ->assertJsonPath('record.amount_cents', 500_000)
        ->assertJsonPath('record.currency', 'DZD')
        ->assertJsonPath('capabilities.activity', true);

    $this->actingAs($user)
        ->getJson("/crm/records/quote/{$quote->id}/peek")
        ->assertOk()
        ->assertJsonPath('record.status', 'draft')
        ->assertJsonPath('record.total_cents', 500_000)
        ->assertJsonPath('record.deal_title', 'Clinic landing page')
        ->assertJsonPath('capabilities.activity', false)
        ->assertJsonPath('associations.0.type', 'deal');

    $this->actingAs($user)->get("/crm/contacts/{$contact->id}")->assertOk();
    $this->actingAs($user)->get("/crm/companies/{$company->id}")->assertOk();
    $this->actingAs($user)->get("/crm/leads/{$lead->id}")->assertOk();
    $this->actingAs($user)->get("/crm/deals/{$deal->id}")->assertOk();
    $this->actingAs($user)->get("/crm/quotes/{$quote->id}")->assertOk();
});

it('scopes peek to the workspace and follows real update permissions', function () {
    ['user' => $owner, 'contact' => $contact] = p09Workspace();
    $stranger = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($stranger)
        ->getJson("/crm/records/contact/{$contact->id}/peek")
        ->assertNotFound();

    $this->actingAs($member)
        ->getJson("/crm/records/contact/{$contact->id}/peek")
        ->assertOk()
        ->assertJsonPath('permissions.can_view', true)
        ->assertJsonPath('permissions.can_update', false);

    $this->actingAs($owner)
        ->getJson('/crm/records/contact/999999/peek')
        ->assertNotFound();

    $this->actingAs($owner)
        ->getJson('/crm/records/ticket/1/peek')
        ->assertNotFound();
});

it('serves the harness in testing without exposing a production debug page on lists', function () {
    ['user' => $user] = p09Workspace();

    $this->actingAs($user)
        ->get('/crm/quick-record-drawer/harness')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quick-record-drawer/harness')
            ->has('samples.contact')
            ->has('samples.company')
            ->has('samples.lead')
            ->has('samples.deal')
            ->has('samples.quote'));

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/contacts/index'));
});

it('does not import or execute test-only drawer contract assertions from the harness page', function () {
    $harness = File::get(resource_path('js/pages/crm/quick-record-drawer/harness.tsx'));
    $drawer = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $layout = File::get(resource_path('js/layouts/app-layout.tsx'));
    $appSources = collect(File::allFiles(resource_path('js')))
        ->reject(fn ($file): bool => str_contains($file->getPathname(), 'quick-record-drawer-contract'))
        ->filter(fn ($file): bool => in_array($file->getExtension(), ['ts', 'tsx'], true))
        ->map(fn ($file): string => File::get($file->getPathname()))
        ->implode("\n");

    expect($harness)->not->toContain('quick-record-drawer-contract')
        ->and($harness)->not->toContain('P09_DRAWER_PROOFS')
        ->and($harness)->not->toContain('assertP09DrawerProofs');
    expect($drawer)->not->toContain('quick-record-drawer-contract');
    expect($layout)->not->toContain('quick-record-drawer-contract');
    expect($appSources)->not->toContain('quick-record-drawer-contract');
});

it('preserves established DA quote amount formatting on the quote descriptor', function () {
    $quote = File::get(resource_path('js/ds/workspace/record-adapters/quote.ts'));
    $present = File::get(resource_path('js/ds/workspace/record-adapters/present.ts'));
    $money = File::get(resource_path('js/lib/money.ts'));
    $contract = File::get(resource_path('js/ds/workspace/quick-record-drawer-contract.ts'));

    expect($quote)->toContain('formatMoneyCents(record.total_cents, currency)')
        ->and($quote)->not->toContain(".includes('DZD')")
        ->and($quote)->not->toContain(' + \' DZD\'');
    expect($present)->toContain('export function formatMoneyCents')
        ->and($present)->toContain("if (currency === 'DZD')")
        ->and($present)->toContain('return formatDzd(amount)');
    expect($money)->toContain("Intl.NumberFormat('fr-DZ'")
        ->and($money)->toContain("currency: 'DZD'");
    expect($contract)->toContain('quote total uses formatDzd DA display not literal DZD substring')
        ->and($contract)->toContain('formatDzd(500_000)')
        ->and($contract)->toContain('total === formatted')
        ->and($contract)->not->toContain(".includes('DZD')")
        ->and($contract)->not->toContain('includes("DZD")');
});
