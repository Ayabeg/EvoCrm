<?php

it('ports the Astryx settings-dialog shell onto the existing settings catalog', function () {
    $layout = file_get_contents(resource_path('js/evo/patterns/settings/settings-layout.tsx'));
    $css = file_get_contents(resource_path('css/settings-dialog.css'));
    $appCss = file_get_contents(resource_path('css/app.css'));
    $icons = file_get_contents(resource_path('js/lib/settings/icons.ts'));

    expect($layout)->toContain('data-settings="dialog"')
        ->and($layout)->toContain('data-settings="workspace"')
        ->and($layout)->toContain('data-settings="nav"')
        ->and($layout)->toContain('data-settings="pane"')
        ->and($layout)->toContain('data-settings="search"')
        ->and($layout)->toContain('pl-10')
        ->and($layout)->toContain('left-3')
        ->and($layout)->not->toContain('pl-7')
        ->and($layout)->toContain('data-settings="mobile-select"')
        ->and($layout)->toContain('data-settings="mobile-tabs"')
        ->and($layout)->not->toContain('@astryxdesign')
        ->and($layout)->toContain("from '@radix-ui/react-dialog'")
        ->and($layout)->toContain("from '@/lib/settings/ia'")
        ->and($layout)->toContain('visibleSettingsDestinations')
        ->and($layout)->toContain('filterSettingsDestinations')
        ->and($layout)->toContain('SETTINGS_CLOSE_HREF')
        ->and($layout)->toContain("'/dashboard'")
        ->and($layout)->toContain('aria-labelledby')
        ->and($layout)->toContain('sm:w-[min(1120px,calc(100vw-2rem))]')
        ->and($layout)->toContain('inset-0')
        ->and($layout)->toContain('AppLogoIcon')
        ->and($layout)->toContain("t('EvoCrm')")
        ->and($layout)->not->toContain('Alex Johnson')
        ->and($layout)->not->toContain('billing@example.com')
        ->and($layout)->not->toContain('/settings/billing')
        ->and($layout)->not->toContain('heroicons')
        ->and($layout)->not->toContain('lucide-react');

    expect($css)->toContain('#eaeaea')
        ->and($css)->toContain('#d9500f')
        ->and($css)->toContain('#000000')
        ->and($css)->toContain('padding-inline-start: 2.5rem')
        ->and($css)->toContain('[data-settings=\'danger\']')
        ->and($css)->toContain('var(--color-danger)');

    $deleteUser = file_get_contents(resource_path('js/components/delete-user.tsx'));
    expect($deleteUser)->toContain('data-settings="danger"')
        ->and($deleteUser)->toContain('data-test="delete-user-button"');

    expect($appCss)->toContain("settings-dialog.css");

    expect($icons)->toContain("'/settings/profile'")
        ->and($icons)->toContain("'/settings/workspace'")
        ->and($icons)->toContain("'/settings/evolution'")
        ->and($icons)->not->toContain('/settings/billing');
});
