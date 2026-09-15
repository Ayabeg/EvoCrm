<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\File;

/**
 * P10 — Quick Record Drawer integration.
 * Wires the frozen P09 drawer into the five DataWorkspace object lists.
 * Does not redesign P09. Does not integrate board / inbox / command.
 */
function p10Workspace(): array
{
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
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
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'title' => 'Clinic Atlas inbound',
        'status' => 'new',
    ]);

    return compact('user', 'company', 'contact', 'deal', 'quote', 'lead');
}

it('activates the reserved onRowPeek seam once instead of five object peek APIs', function () {
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $types = File::get(resource_path('js/ds/workspace/types.ts'));
    $table = File::get(resource_path('js/ds/workspace/DataTable.tsx'));
    $list = File::get(resource_path('js/components/crm/list-view-table.tsx'));
    $shell = File::get(resource_path('js/components/crm/crm-list-shell.tsx'));
    $contacts = File::get(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = File::get(resource_path('js/pages/crm/companies/index.tsx'));
    $leads = File::get(resource_path('js/pages/crm/leads/index.tsx'));
    $deals = File::get(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = File::get(resource_path('js/pages/crm/quotes/index.tsx'));

    expect($types)->toContain('onRowPeek?: (row: Row, context?: { opener?: HTMLElement | null }) => void')
        ->and($types)->toContain('must not replace rowHref')
        ->and($workspace)->toContain('onRowPeek is reserved for P09')
        ->and($workspace)->toContain('onRowPeek={props.onRowPeek}')
        ->and($workspace)->not->toContain('void props.onRowPeek')
        ->and($workspace)->not->toContain('onContactPeek')
        ->and($table)->toContain('onRowPeek={onRowPeek')
        ->and($list)->toContain('onRowPeek?: (row: { id: RowId }')
        ->and($shell)->toContain('onRowPeek={onRowPeek}')
        ->and($shell)->toContain('openRecord({ type: entity, id: row.id }')
        ->and($shell)->toContain('isRecordType(entity)')
        ->and($shell)->not->toContain('onContactPeek')
        ->and($shell)->not->toContain('onCompanyPeek')
        ->and($shell)->not->toContain('onLeadPeek')
        ->and($shell)->not->toContain('onDealPeek')
        ->and($shell)->not->toContain('onQuotePeek');

    foreach ([$contacts, $companies, $leads, $deals, $quotes] as $page) {
        expect($page)->not->toContain('QuickRecordDrawer')
            ->and($page)->not->toContain('onRowPeek')
            ->and($page)->not->toContain('openRecord(')
            ->and($page)->not->toContain('onContactPeek')
            ->and($page)->not->toContain('adaptContact')
            ->and($page)->not->toContain('/peek');
    }
});

it('keeps rowHref as full-record navigation and identity links as the escape hatch', function () {
    $contacts = File::get(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = File::get(resource_path('js/pages/crm/companies/index.tsx'));
    $leads = File::get(resource_path('js/pages/crm/leads/index.tsx'));
    $deals = File::get(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = File::get(resource_path('js/pages/crm/quotes/index.tsx'));
    $list = File::get(resource_path('js/components/crm/list-view-table.tsx'));
    $contactColumns = File::get(resource_path('js/pages/crm/contacts/contact-columns.tsx'));
    $companyColumns = File::get(resource_path('js/pages/crm/companies/company-columns.tsx'));
    $leadColumns = File::get(resource_path('js/pages/crm/leads/lead-columns.tsx'));
    $dealColumns = File::get(resource_path('js/pages/crm/deals/deal-columns.tsx'));
    $quoteColumns = File::get(resource_path('js/pages/crm/quotes/quote-columns.tsx'));

    expect($contacts)->toContain('rowHref={contactRowHref}')
        ->and($companies)->toContain('rowHref={companyRowHref}')
        ->and($leads)->toContain('rowHref={leadRowHref}')
        ->and($deals)->toContain('rowHref={dealRowHref}')
        ->and($quotes)->toContain('rowHref={quoteRowHref}');

    expect($contactColumns)->toContain("return `/crm/contacts/${row.id}`")
        ->and($companyColumns)->toContain("return `/crm/companies/${row.id}`")
        ->and($leadColumns)->toContain("return `/crm/leads/${row.id}`")
        ->and($dealColumns)->toContain("return `/crm/deals/${row.id}`")
        ->and($quoteColumns)->toContain("return `/crm/quotes/${row.id}`");

    expect($list)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($list)->toContain('router.visit(href)')
        ->and($list)->toContain("target.closest('a, input, button, label')")
        ->and($list)->toContain('window.open(href, \'_blank\', \'noopener,noreferrer\')')
        ->and($list)->toContain("event.key !== 'Enter'")
        ->and($list)->toContain('data-row-peek')
        ->and($list)->toContain('mailto:')
        ->and($list)->toContain('tel:')
        ->and($list)->toContain('<ContactNameCell')
        ->and($list)->toContain('<CompanyNameCell')
        ->and($list)->toContain('<LeadNameCell')
        ->and($list)->toContain('<DealNameCell')
        ->and($list)->toContain('<QuoteNameCell');
});

it('preserves each object list contract while wiring peek at CrmListShell', function () {
    $contacts = File::get(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = File::get(resource_path('js/pages/crm/companies/index.tsx'));
    $leads = File::get(resource_path('js/pages/crm/leads/index.tsx'));
    $deals = File::get(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = File::get(resource_path('js/pages/crm/quotes/index.tsx'));
    $board = File::get(resource_path('js/pages/crm/deals/board.tsx'));
    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $palette = File::get(resource_path('js/components/crm/command-palette.tsx'));
    $activities = File::get(resource_path('js/pages/crm/activities/index.tsx'));
    $tickets = File::get(resource_path('js/pages/crm/tickets/index.tsx'));
    $routes = File::get(base_path('routes/web.php'));

    expect($contacts)->toContain('selectable: canBulk')
        ->and($contacts)->toContain('CreateDrawer')
        ->and($contacts)->toContain('BulkActionBar')
        ->and($companies)->toContain('selectable: false')
        ->and($companies)->not->toContain('BulkActionBar')
        ->and($leads)->toContain('selectable: false')
        ->and($leads)->not->toContain('name="q"')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('PipelineSwitcher')
        ->and($deals)->toContain('selectable: canBulk')
        ->and($quotes)->toContain('selectable: false')
        ->and($quotes)->not->toContain('BulkActionBar')
        ->and($quotes)->toContain('Create a deal');

    expect($board)->not->toContain('onRowPeek')
        ->and($board)->not->toContain('QuickRecordDrawer')
        ->and($board)->not->toContain('openRecord')
        ->and($board)->toContain('PipelineKanban')
        ->and($inbox)->not->toContain('QuickRecordDrawer')
        ->and($inbox)->not->toContain('onRowPeek')
        ->and($palette)->not->toContain('QuickRecordDrawer')
        ->and($palette)->not->toContain('openRecord')
        ->and($activities)->not->toContain('QuickRecordDrawer')
        ->and($activities)->not->toContain('onRowPeek')
        ->and($tickets)->not->toContain('onRowPeek')
        ->and($tickets)->not->toContain('openRecord')
        ->and($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')");
});

it('does not write peek into the list URL and keeps peek classified unsafe', function () {
    $url = File::get(resource_path('js/ds/workspace/quick-record/url.ts'));
    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));
    $shell = File::get(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $context = File::get(resource_path('js/ds/workspace/quick-record/context.tsx'));
    $layout = File::get(resource_path('js/layouts/app-layout.tsx'));

    expect($url)->toContain("export const PEEK_QUERY_KEY = 'peek'")
        ->and($url)->toContain('P09 does not sync it on production lists')
        ->and($url)->toContain('P10 defers URL sync (decision B)')
        ->and($keys)->toContain("'peek'")
        ->and($shell)->not->toContain('writePeekSearch')
        ->and($shell)->not->toContain('peekTokenFromSearch')
        ->and($workspace)->not->toContain('writePeekSearch')
        ->and($workspace)->not->toContain('searchParams.set')
        ->and($context)->not->toContain('writePeekSearch')
        ->and($layout)->toContain('QuickRecordProvider')
        ->and($layout)->toContain('QuickRecordDrawer');
});

it('does not remount DataWorkspace on peek and does not mutate selection from the row handler', function () {
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $list = File::get(resource_path('js/components/crm/list-view-table.tsx'));
    $selection = File::get(resource_path('js/ds/workspace/selection.ts'));
    $drawer = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));

    expect($workspace)->not->toContain('key={props.onRowPeek')
        ->and($workspace)->not->toContain('key={selection')
        ->and($list)->not->toContain('toggleOne')
        ->and($list)->not->toContain('clearSelection')
        ->and($list)->toContain('activateListRow')
        ->and($list)->not->toContain('onToggle?.(row.id);\n        onRowPeek')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0')
        ->and($drawer)->toContain('onCloseAutoFocus')
        ->and($drawer)->toContain('state.opener?.focus()');
});

it('locks the P10 contract runner away from production pages', function () {
    $contract = File::get(resource_path('js/ds/workspace/quick-record-list-contract.ts'));
    $runner = File::get(base_path('tests/js/p10-quick-record-drawer-integration.ts'));
    $docs = File::get(base_path('docs/implementation/p10-quick-record-drawer-integration.md'));
    $appSources = collect(File::allFiles(resource_path('js')))
        ->reject(fn ($file): bool => str_contains($file->getPathname(), 'quick-record-list-contract'))
        ->filter(fn ($file): bool => in_array($file->getExtension(), ['ts', 'tsx'], true))
        ->map(fn ($file): string => File::get($file->getPathname()))
        ->implode("\n");

    expect($contract)->toContain('export function assertP10ListProofs')
        ->and($contract)->toContain('row background with peek opens drawer')
        ->and($contract)->toContain('nested interactive never peeks')
        ->and($contract)->toContain('cmd/ctrl click is new-tab on real href')
        ->and($contract)->toContain('listQueryHref does not write peek')
        ->and($contract)->not->toContain('assertP10ListProofs();')
        ->and($runner)->toContain('assertP10ListProofs')
        ->and($runner)->toContain('Test-only P10 list-integration proofs')
        ->and($docs)->toContain('P10 STATUS')
        ->and($appSources)->not->toContain('quick-record-list-contract');
});

it('serves the five production lists without inventing peek query params', function () {
    ['user' => $user, 'company' => $company, 'contact' => $contact, 'deal' => $deal, 'quote' => $quote, 'lead' => $lead] = p10Workspace();

    $this->actingAs($user)
        ->get('/crm/contacts?q=amel&view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts')
            ->where('activeFilters.q', 'amel')
            ->missing('peek'));

    $this->actingAs($user)
        ->get('/crm/companies?wilaya=Alger')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/companies/index'));

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/index'));

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));

    $this->actingAs($user)->get("/crm/contacts/{$contact->id}")->assertOk();
    $this->actingAs($user)->get("/crm/companies/{$company->id}")->assertOk();
    $this->actingAs($user)->get("/crm/leads/{$lead->id}")->assertOk();
    $this->actingAs($user)->get("/crm/deals/{$deal->id}")->assertOk();
    $this->actingAs($user)->get("/crm/quotes/{$quote->id}")->assertOk();
    $this->actingAs($user)
        ->getJson("/crm/records/contact/{$contact->id}/peek")
        ->assertOk()
        ->assertJsonPath('type', 'contact');
});
