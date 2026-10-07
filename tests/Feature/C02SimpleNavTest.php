<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use App\Support\SimpleMode;

function c02SimpleOwner(): User
{
    $workspace = app(WorkspaceProvisioner::class)->provision('C02 Simple Clinic');

    return User::factory()->create([
        'workspace_id' => $workspace->id,
        'role' => WorkspaceRole::Owner,
        'preferences' => ['locale' => 'fr'],
    ]);
}

it('locks C-02 Simple Mode nav to Accueil Contacts Deals Inbox Devis plus Paramètres at the bottom', function () {
    expect(SimpleMode::SIMPLE_NAV)->toBe([
        ['id' => 'home', 'label' => 'Home', 'href' => '/dashboard'],
        ['id' => 'contacts', 'label' => 'Contacts', 'href' => '/crm/contacts'],
        ['id' => 'deals', 'label' => 'Deals', 'href' => '/crm/deals'],
        ['id' => 'inbox', 'label' => 'Inbox', 'href' => '/inbox'],
        ['id' => 'quotes', 'label' => 'Quotes', 'href' => '/crm/quotes'],
    ]);

    $fr = json_decode((string) file_get_contents(lang_path('fr.json')), true);
    $en = json_decode((string) file_get_contents(lang_path('en.json')), true);
    $ar = json_decode((string) file_get_contents(lang_path('ar.json')), true);

    expect($fr['nav.home'])->toBe('Accueil')
        ->and($fr['nav.crm.contacts'])->toBe('Contacts')
        ->and($fr['Deals'])->toBe('Affaires')
        ->and($fr['Inbox'])->toBe('Boîte de réception')
        ->and($fr['Quotes'])->toBe('Devis')
        ->and($fr['nav.settings.title'])->toBe('Paramètres')
        ->and($en['nav.home'])->toBe('Home')
        ->and($en['nav.crm.contacts'])->toBe('Contacts')
        ->and($ar['nav.home'])->toBe('الرئيسية')
        ->and($ar['nav.settings.title'])->toBe('الإعدادات');

    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $palette = file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $commandOs = file_get_contents(resource_path('js/lib/command-os.ts'));

    expect($nav)->toContain('export function visibleSimpleItems')
        ->and($nav)->toContain("id: 'companies'")
        ->and($nav)->toContain("id: 'leads'")
        ->and($nav)->toContain("id: 'activities'")
        ->and($nav)->toContain("id: 'reports'")
        ->and($rail)->toContain('visibleSimpleItems')
        ->and($rail)->toContain('simpleMode')
        ->and($rail)->toContain('href="/settings"')
        ->and($rail)->toContain("t('Company')")
        ->and($rail)->toContain("t('Lead')")
        ->and($commandOs)->toContain('simpleMode')
        ->and($commandOs)->toContain('allowedHrefs')
        ->and($palette)->toContain('simpleMode');
});

it('shares the C-02 French labels on the compact nav and keeps Settings off the list', function () {
    $user = c02SimpleOwner();

    $this->actingAs($user)
        ->withUnencryptedCookie('locale', 'fr')
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->where('simpleMode', true)->has('nav', 5);

            $nav = collect($page->toArray()['props']['nav'] ?? [])
                ->map(fn (array $item): array => [
                    'id' => $item['id'] ?? null,
                    'href' => $item['href'] ?? null,
                    'label' => $item['label'] ?? null,
                ])
                ->all();

            expect(collect($nav)->pluck('id')->all())->toBe([
                'home',
                'contacts',
                'deals',
                'inbox',
                'quotes',
            ])
                ->and(collect($nav)->pluck('label')->all())->toBe([
                    'Accueil',
                    'Contacts',
                    'Affaires',
                    'Boîte de réception',
                    'Devis',
                ])
                ->and(collect($nav)->pluck('id'))->not->toContain('settings');
        });
});

it('keeps Companies Leads Activities and Reports reachable in Simple Mode', function () {
    $user = c02SimpleOwner();

    $this->actingAs($user)->get('/crm/companies')->assertOk();
    $this->actingAs($user)->get('/crm/leads')->assertOk();
    $this->actingAs($user)->get('/crm/activities')->assertOk();
    $this->actingAs($user)->get('/reports')->assertOk();
});

it('keeps Full Mode hierarchical membership for Companies Leads and Activities', function () {
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));

    expect($nav)->toContain("id: 'companies'")
        ->and($nav)->toContain("href: '/crm/companies'")
        ->and($nav)->toContain("id: 'leads'")
        ->and($nav)->toContain("href: '/crm/leads'")
        ->and($nav)->toContain("id: 'activities'")
        ->and($nav)->toContain("href: '/crm/activities'")
        ->and(SimpleMode::FULL_NAV)->toContain(['id' => 'companies', 'label' => 'Companies', 'href' => '/crm/companies'])
        ->and(SimpleMode::FULL_NAV)->toContain(['id' => 'leads', 'label' => 'Leads', 'href' => '/crm/leads'])
        ->and(SimpleMode::FULL_NAV)->toContain(['id' => 'activities', 'label' => 'Activities', 'href' => '/crm/activities']);
});
