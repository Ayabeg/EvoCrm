<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function settingsIaSource(): string
{
    return file_get_contents(resource_path('js/lib/settings/ia.ts'));
}

function settingsLayoutSource(): string
{
    return file_get_contents(resource_path('js/layouts/settings/layout.tsx'));
}

function settingsOwner(): User
{
    return User::factory()->create(['role' => WorkspaceRole::Owner]);
}

function settingsMember(): User
{
    return User::factory()->create(['role' => WorkspaceRole::Member]);
}

it('keeps one settings shell and the P21 destination catalog', function () {
    $ia = settingsIaSource();
    $layout = settingsLayoutSource();
    $app = file_get_contents(resource_path('js/app.tsx'));
    $commandOs = file_get_contents(resource_path('js/lib/command-os.ts'));

    expect($app)->toContain("import SettingsLayout from '@/layouts/settings/layout'")
        ->and($app)->toContain("case name.startsWith('settings/'):")
        ->and($app)->toContain('return [AppLayout, SettingsLayout]')
        ->and($app)->not->toContain('SettingsV2')
        ->and($layout)->toContain("from '@/lib/settings/ia'")
        ->and($layout)->toContain('data-settings="search"')
        ->and($layout)->toContain('data-settings="mobile-select"')
        ->and($layout)->toContain('aria-current')
        ->and($layout)->toContain('router.visit')
        ->and($layout)->toContain('<Link')
        ->and($layout)->not->toContain('SettingsV2')
        ->and($layout)->not->toContain('createBrowserRouter')
        ->and($ia)->toContain("'Personal'")
        ->and($ia)->toContain("'Communication'")
        ->and($ia)->toContain("'Developer'")
        ->and($ia)->toContain("title: 'Members'")
        ->and($ia)->toContain("title: 'Properties'")
        ->and($ia)->toContain("title: 'Qualification'")
        ->and($ia)->toContain("title: 'General'")
        ->and($ia)->toContain("title: 'Setup'")
        ->and($ia)->toContain('filterSettingsDestinations')
        ->and($ia)->toContain('visibleSettingsDestinations')
        ->and($ia)->toContain('isSettingsNavActive')
        ->and($ia)->not->toContain('/settings/billing')
        ->and($ia)->not->toContain('/settings/workflows')
        ->and($ia)->not->toContain('/settings/teams')
        ->and($ia)->not->toContain('/settings/email')
        ->and($ia)->not->toContain('/settings/api')
        ->and($ia)->not->toContain('/settings/webhooks')
        ->and($commandOs)->toContain("href: '/settings'")
        ->and($commandOs)->not->toContain('filterSettingsDestinations');
});

it('indexes only authorized destinations in local settings search', function () {
    $ia = settingsIaSource();

    expect($ia)->toContain('capabilities.includes(destination.permission)')
        ->and($ia)->toContain('destination.adminOnly')
        ->and($ia)->toContain('destination.ownerOnly')
        ->and($ia)->toContain('requiresSmsFeature')
        ->and($ia)->toContain('query.trim().toLowerCase()')
        ->and($ia)->toContain('destination.keywords')
        ->and($ia)->not->toContain('evoSearchIndex');
});

it('activates nav on exact or child paths without colliding WhatsApp leaves', function () {
    $ia = settingsIaSource();

    expect($ia)->toContain('currentPath.startsWith(`${href}/`)')
        ->and($ia)->toContain('SETTINGS_PROFILE_HREF')
        ->and($ia)->toContain("href: '/settings/evolution'")
        ->and($ia)->toContain("href: '/settings/whatsapp'")
        ->and($ia)->toContain("href: '/settings/whatsapp-business'");
});

it('redirects /settings onto profile and keeps bookmarked settings URLs', function () {
    $owner = settingsOwner();

    $this->actingAs($owner)
        ->get('/settings')
        ->assertRedirect('/settings/profile');

    $pages = [
        '/settings/profile' => 'settings/profile',
        '/settings/appearance' => 'settings/appearance',
        '/settings/meetings' => 'settings/meetings',
        '/settings/workspace' => 'settings/workspace',
        '/settings/people' => 'settings/people',
        '/settings/attributes' => 'settings/attributes',
        '/settings/pipelines' => 'settings/pipelines',
        '/settings/qualify' => 'settings/qualify',
        '/settings/quotas' => 'settings/quotas',
        '/settings/record-layouts' => 'settings/record-layouts',
        '/settings/playbooks' => 'settings/playbooks',
        '/settings/apps' => 'settings/apps/index',
        '/settings/connectors' => 'settings/connectors',
        '/settings/evolution' => 'settings/evolution',
        '/settings/whatsapp' => 'settings/whatsapp',
        '/settings/whatsapp-business' => 'settings/whatsapp-business',
        '/settings/meta' => 'settings/meta',
        '/settings/channels' => 'settings/channels',
        '/settings/sms' => 'settings/sms',
        '/settings/permissions' => 'settings/permissions',
        '/settings/audit' => 'settings/audit',
        '/settings/system-health' => 'settings/system-health',
    ];

    foreach ($pages as $url => $component) {
        $this->actingAs($owner)
            ->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component($component));
    }

    $this->actingAs($owner)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get('/settings/security')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('settings/security'));
});

it('forbids members from manager settings URLs while keeping personal destinations', function () {
    $member = settingsMember();

    $this->actingAs($member)
        ->get('/settings/profile')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('settings/profile'));

    $this->actingAs($member)
        ->get('/settings/appearance')
        ->assertOk();

    $this->actingAs($member)
        ->get('/settings/meetings')
        ->assertOk();

    foreach ([
        '/settings/workspace',
        '/settings/people',
        '/settings/qualify',
        '/settings/quotas',
        '/settings/record-layouts',
        '/settings/playbooks',
        '/settings/sms',
        '/settings/permissions',
        '/settings/audit',
        '/settings/system-health',
    ] as $url) {
        $this->actingAs($member)->get($url)->assertForbidden();
    }
});

it('hides manager destinations from member nav while owners still see them', function () {
    $ia = settingsIaSource();

    expect($ia)->toContain('ownerOnly: true')
        ->and($ia)->toContain("href: '/settings/workspace'")
        ->and($ia)->toContain('adminOnly: true')
        ->and($ia)->toContain("href: '/settings/people'")
        ->and($ia)->toContain("href: '/settings/permissions'")
        ->and($ia)->toContain("permission: 'settings.integrations'")
        ->and($ia)->toContain("permission: 'settings.attributes'")
        ->and($ia)->toContain("permission: 'settings.pipelines'");

    $owner = settingsOwner();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)->get('/settings/people')->assertOk();
    $this->actingAs($member)->get('/settings/people')->assertForbidden();
});

it('preserves existing settings mutations and danger confirmation', function () {
    $profile = file_get_contents(resource_path('js/pages/settings/profile.tsx'));
    $security = file_get_contents(resource_path('js/pages/settings/security.tsx'));
    $workspace = file_get_contents(resource_path('js/pages/settings/workspace.tsx'));
    $people = file_get_contents(resource_path('js/pages/settings/people.tsx'));
    $deleteUser = file_get_contents(resource_path('js/components/delete-user.tsx'));

    expect($profile)->toContain('ProfileController.update.form()')
        ->and($profile)->toContain('DeleteUser')
        ->and($profile)->toContain('SettingsSaveBar')
        ->and($security)->toContain('SecurityController.update.form()')
        ->and($security)->toContain('ManageTwoFactor')
        ->and($workspace)->toContain('action="/settings/workspace"')
        ->and($workspace)->toContain('name="simple_mode"')
        ->and($people)->toContain('CreateDrawer')
        ->and($people)->toContain('data-test="invite-person-button"')
        ->and($deleteUser)->toContain('confirm');
});

it('does not invent billing, teams, or workflow settings pages', function () {
    expect(file_exists(resource_path('js/pages/settings/billing.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/pages/settings/teams.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/pages/settings/workflows.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/pages/settings/api.tsx')))->toBeFalse()
        ->and(file_exists(resource_path('js/pages/settings/webhooks.tsx')))->toBeFalse();
});
