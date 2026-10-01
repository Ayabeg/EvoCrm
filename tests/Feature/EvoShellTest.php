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
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain("t('Search EvoCRM…')")
        ->and($rail)->toContain('⌘K')
        ->and($rail)->toContain('account menu')
        ->and($rail)->not->toContain('Emma Green')
        ->and($rail)->not->toContain('Closer')
        ->and($rail)->not->toContain('Sonatrach')
        ->and($rail)->not->toContain('Evotechly')
        ->and($rail)->not->toContain('lucide-react');
});

it('switches sidebar modes with the Evo tablist — Astryx SegmentedControl retired in PR2', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $switch = file_get_contents(resource_path('js/evo/shell/mode-switch.tsx'));
    $css = file_get_contents(resource_path('css/evo-shell.css'));
    $appCss = file_get_contents(resource_path('css/app.css'));
    $local = file_get_contents(resource_path('js/components/ui/segmented-control.tsx'));
    $agentsState = file_get_contents(resource_path('js/lib/desk/agents-workspace-state.ts'));

    expect($rail)->toContain("from '@/evo/shell/mode-switch'")
        ->and($rail)->toContain('ShellModeSwitch')
        ->and($rail)->not->toContain('@astryxdesign')
        ->and($switch)->toContain('role="tablist"')
        ->and($switch)->toContain('role="tab"')
        ->and($switch)->toContain("{ id: 'agents', label: 'Agents', icon: StarFour }")
        ->and($rail)->not->toContain('evo-mode-capsule')
        ->and($rail)->not->toContain('translate3d')
        ->and($rail)->not->toContain("from '@/components/ui/segmented-control'")
        ->and($css)->not->toContain('.evo-mode-capsule')
        ->and($appCss)->not->toContain('@astryxdesign')
        ->and($local)->toContain('Local Astryx SegmentedControl fallback')
        ->and($rail)->toContain('data-shell-mode="agents"')
        ->and($rail)->toContain('{agentsContent}')
        ->and($agentsState)->toContain('selectedChatByAgent');
});
