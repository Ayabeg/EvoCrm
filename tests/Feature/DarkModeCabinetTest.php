<?php

it('keeps the light cabinet lock and only paints the dark cabinet', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $shell = file_get_contents(resource_path('css/evo-shell.css'));

    expect($app)->toContain('--color-bg: #f7f7f5')
        ->and($app)->toContain('--color-accent: #e8530e')
        ->and($app)->toContain('--color-focus-ring: var(--color-accent)')
        ->and($app)->not->toContain('#ec6025')
        ->and($app)->not->toContain('#eaeaea')
        ->and($app)->not->toContain('#d9500f');

    expect($app)->toContain('--color-bg: #121212')
        ->and($app)->toContain('--color-surface: #1c1c1c')
        ->and($app)->toContain('--color-subtle: #262626')
        ->and($app)->toContain('--color-text: #e8e8e8')
        ->and($app)->toContain('--color-text-secondary: #b3b3b3')
        ->and($app)->toContain('--color-text-muted: #8a8a8a')
        ->and($app)->toContain('--color-selection: #0F4C5C')
        ->and($app)->toContain('--color-focus-ring: #5EB0C0')
        ->and($app)->toContain('--color-accent: var(--evo-accent)')
        ->and($app)->toContain('dark-cabinet-contrast');

    expect($shell)->toContain('--evo-accent: #EC6025')
        ->and($shell)->toContain('--evo-teal: #0F4C5C')
        ->and($shell)->toContain('--evo-focus: #5EB0C0');
});

it('documents why the teal focus ring is lighter than the selection fill', function () {
    $app = file_get_contents(resource_path('css/app.css'));

    expect($app)->toContain('#0F4C5C on #121212 is 1.97:1')
        ->and($app)->toContain('#5EB0C0 on #121212 is 7.54:1')
        ->and($app)->toContain('#E8E8E8 on #0F4C5C is 7.76:1');
});

it('ships a no-flash appearance script on the Blade root and design-lab', function () {
    $root = file_get_contents(resource_path('views/app.blade.php'));
    $lab = file_get_contents(resource_path('views/design-lab.blade.php'));

    expect($root)->toContain('localStorage.getItem(\'appearance\')')
        ->and($root)->toContain('prefers-color-scheme: dark')
        ->and($root)->toContain('classList.toggle(\'dark\'')
        ->and($root)->toContain('html.dark')
        ->and($root)->toContain('#121212');

    expect($lab)->toContain('localStorage.getItem(\'appearance\')')
        ->and($lab)->toContain('classList.toggle(\'dark\'')
        ->and($lab)->toContain('#121212');
});

it('lets the login split and settings dialog follow the dark cabinet', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $settings = file_get_contents(resource_path('css/settings-dialog.css'));
    $lab = file_get_contents(resource_path('design-lab/design-lab.css'));

    expect($app)->toContain('.dark .auth-screen')
        ->and($app)->toContain('color-scheme: dark')
        ->and($app)->toContain('.dark .login-split-card');

    expect($settings)->toContain('.dark [data-settings=\'dialog\']')
        ->and($settings)->toContain('--settings-canvas: #1c1c1c')
        ->and($settings)->toContain('--settings-shadow: none');

    expect($lab)->toContain('.dark')
        ->and($lab)->toContain('--evo-canvas: #121212')
        ->and($lab)->toContain('var(--evo-surface)')
        ->and($lab)->toContain('.dark .bg-white');

    $v02 = file_get_contents(resource_path('css/approved-v02.css'));

    expect($v02)->toContain('.dark .app-topbar')
        ->and($v02)->toContain('.dark [data-crm=\'deals-workspace\']')
        ->and($v02)->toContain('background: #0F4C5C')
        ->and($v02)->toContain('background: #1c1c1c');
});
