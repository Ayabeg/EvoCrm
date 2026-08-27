<?php

/**
 * Guards the Ads + Settings (People, attributes, workflows) Apple+Aurora
 * chrome pass: overlay drawers, Brand Book hairline, no raw --aurora-*
 * identity tokens, and no rewrite of app.css / the EvoDesk rail.
 */
it('moves People, attribute, and workflow create flows onto overlay drawers', function () {
    $people = file_get_contents(resource_path('js/pages/settings/people.tsx'));
    $attributes = file_get_contents(resource_path('js/pages/settings/attributes.tsx'));
    $workflows = file_get_contents(resource_path('js/pages/crm/workflows/index.tsx'));

    expect($people)->toContain('CreateDrawer')
        ->and($people)->toContain('data-test="invite-person-button"')
        ->and($people)->toContain('border-hairline')
        ->and($people)->not->toContain('--aurora-');

    expect($attributes)->toContain('CreateDrawer')
        ->and($attributes)->toContain('border-hairline')
        ->and($attributes)->not->toContain('--aurora-');

    expect($workflows)->toContain('CreateDrawer')
        ->and($workflows)->toContain('border-hairline')
        ->and($workflows)->not->toContain('--aurora-');
});

it('keeps Ads hub chrome on Brand Book hairline and mark links', function () {
    $files = [
        resource_path('js/pages/ads/index.tsx'),
        resource_path('js/pages/ads/attribution.tsx'),
        resource_path('js/pages/ads/audiences.tsx'),
        resource_path('js/pages/ads/campaigns/index.tsx'),
        resource_path('js/pages/ads/ad-sets/index.tsx'),
        resource_path('js/pages/ads/ads/index.tsx'),
        resource_path('js/pages/ads/show.tsx'),
    ];

    foreach ($files as $file) {
        $src = file_get_contents($file);

        expect($src)->not->toContain('--aurora-')
            ->and($src)->toMatch('/border-hairline|HairlinePanel|HairlineTable|KpiMeter/');
    }

    $index = file_get_contents(resource_path('js/pages/ads/index.tsx'));
    $panel = file_get_contents(resource_path('js/components/surface/hairline-panel.tsx'));

    expect($index)->toContain('text-brand')
        ->and($panel)->toContain('border-hairline');
});

it('does not rewrite app.css or the EvoDesk rail in this chrome pass', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($app)->toContain('--evosales-mark: #ec6025')
        ->and($sidebar)->toContain('SheetContent')
        ->and($rail)->toContain('AppSidebar');
});
