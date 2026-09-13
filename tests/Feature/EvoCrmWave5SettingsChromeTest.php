<?php

use App\Models\User;

it('rebuilds the settings shell as a Salesforce-density workspace on P02 tokens', function () {
    $layout = file_get_contents(resource_path('js/layouts/settings/layout.tsx'));
    $chrome = file_get_contents(resource_path('js/components/settings/chrome.tsx'));

    expect($layout)->toContain('data-settings="workspace"')
        ->and($layout)->toContain('data-settings="nav"')
        ->and($layout)->toContain('data-settings="pane"')
        ->and($layout)->toContain("title: 'You'")
        ->and($layout)->toContain("title: 'Workspace'")
        ->and($layout)->toContain("title: 'Integrations'")
        ->and($layout)->toContain("title: 'CRM'")
        ->and($layout)->toContain("title: 'Admin'")
        ->and($layout)->toContain("title: 'Profile'")
        ->and($layout)->toContain("title: 'People'")
        ->and($layout)->toContain("href: '/settings/workspace'")
        ->and($layout)->toContain("href: '/settings/apps'")
        ->and($layout)->toContain("href: '/settings/channels'")
        ->and($layout)->toContain('bg-canvas')
        ->and($layout)->toContain('border-brand')
        ->and($layout)->not->toContain('lucide-react')
        ->and($layout)->not->toContain('#0176D3')
        ->and($layout)->not->toContain('#00A4BD')
        ->and($layout)->not->toContain('Salesforce');

    expect($chrome)->toContain('data-settings="card"')
        ->and($chrome)->toContain('data-settings="save"')
        ->and($chrome)->toContain('data-settings="empty"')
        ->and($chrome)->toContain('bg-white')
        ->and($chrome)->toContain('bg-brand')
        ->and($chrome)->toContain('Required information')
        ->and($chrome)->toContain('Cancel')
        ->and($chrome)->not->toContain('#0176D3');
});

it('wraps profile, workspace, and appearance forms in white cards with accent Save', function () {
    $profile = file_get_contents(resource_path('js/pages/settings/profile.tsx'));
    $workspace = file_get_contents(resource_path('js/pages/settings/workspace.tsx'));
    $appearance = file_get_contents(resource_path('js/pages/settings/appearance.tsx'));
    $meetings = file_get_contents(resource_path('js/pages/settings/meetings.tsx'));

    foreach ([$profile, $workspace, $appearance, $meetings] as $src) {
        expect($src)->toContain('SettingsCard')
            ->and($src)->toContain('SettingsPageHeader')
            ->and($src)->not->toContain('#0176D3')
            ->and($src)->not->toContain('#00A4BD');
    }

    expect($profile)->toContain('saveTestId="update-profile-button"')
        ->and($profile)->toContain('SettingsSaveBar')
        ->and($profile)->toContain('ProfileController.update.form()');

    expect($workspace)->toContain('name="simple_mode"')
        ->and($workspace)->toContain('action="/settings/workspace"')
        ->and($workspace)->toContain('SettingsSaveBar');

    expect($meetings)->toContain('action="/settings/meetings"')
        ->and($meetings)->toContain('SettingsSaveBar');
});

it('gives integrations intentional disconnected empty states', function () {
    $apps = file_get_contents(resource_path('js/pages/settings/apps/index.tsx'));
    $connectors = file_get_contents(resource_path('js/pages/settings/connectors.tsx'));
    $evolution = file_get_contents(resource_path('js/pages/settings/evolution.tsx'));
    $sms = file_get_contents(resource_path('js/pages/settings/sms.tsx'));
    $channels = file_get_contents(resource_path('js/pages/settings/channels.tsx'));
    $meta = file_get_contents(resource_path('js/pages/settings/meta.tsx'));

    expect($apps)->toContain('SettingsEmptyState')
        ->and($apps)->toContain('Nothing connected yet')
        ->and($apps)->toContain('data-settings="disconnected"')
        ->and($apps)->toContain("from '@phosphor-icons/react'")
        ->and($apps)->not->toContain('lucide-react');

    expect($connectors)->toContain('SettingsEmptyState')
        ->and($connectors)->toContain('Google is not configured')
        ->and($connectors)->toContain('action="/settings/connectors"')
        ->and($connectors)->toContain("from '@phosphor-icons/react'");

    expect($evolution)->toContain('WhatsApp is disconnected')
        ->and($sms)->toContain('SMS gateway is disconnected')
        ->and($channels)->toContain('No channels yet')
        ->and($channels)->toContain('action="/settings/channels"')
        ->and($meta)->toContain('Meta is disconnected');
});

it('keeps People and attribute create drawers on the existing Inertia actions', function () {
    $people = file_get_contents(resource_path('js/pages/settings/people.tsx'));
    $attributes = file_get_contents(resource_path('js/pages/settings/attributes.tsx'));

    expect($people)->toContain('CreateDrawer')
        ->and($people)->toContain('data-test="invite-person-button"')
        ->and($people)->toContain('border-hairline')
        ->and($people)->toContain('SettingsPageHeader')
        ->and($people)->not->toContain('--aurora-');

    expect($attributes)->toContain('CreateDrawer')
        ->and($attributes)->toContain('border-hairline')
        ->and($attributes)->toContain('SettingsPageHeader')
        ->and($attributes)->not->toContain('--aurora-');
});

it('serves live settings pages with the existing Inertia endpoints', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/profile'));

    $this->actingAs($user)
        ->get('/settings/appearance')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/appearance'));

    $this->actingAs($user)
        ->get('/settings/meetings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/meetings'));
});
