<?php

use App\Models\User;

it('sends /shell to the dashboard instead of a second shell', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/shell')
        ->assertRedirect('/dashboard');
});

it('promotes the approved shell without prototype records', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));

    expect($layout)->toContain('EvoShell')
        ->and($layout)->not->toContain('<AppSidebar />')
        ->and($layout)->not->toContain('<AppSidebar>')
        ->and($shell)->toContain('evo-rail-slot')
        ->and($shell)->toContain('evo-workspace')
        ->and($shell)->toContain('<Sidebar')
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('visibleSections')
        ->and($rail)->toContain('/crm/command/search')
        ->and($rail)->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain("t('Search EvoCRM…')")
        ->and($rail)->toContain('⌘K')
        ->and($rail)->toContain('account menu')
        ->and($rail)->not->toContain('Emma Green')
        ->and($rail)->not->toContain('Closer')
        ->and($rail)->not->toContain('Sonatrach')
        ->and($rail)->not->toContain('Evotechly')
        ->and($rail)->not->toContain('lucide-react');
});
